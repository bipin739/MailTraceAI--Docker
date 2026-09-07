import ipaddress
import json
import re
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Any, Tuple
from sqlalchemy.orm import Session

from backend.db.models import CaseModel, CaseEmailModel
from backend.schemas.correlation import (
    SharedIndicator,
    MatchedSignalDetail,
    RelatedCaseItem,
    CampaignCorrelationResponse,
    DirectCompareResponse
)


# -----------------------------------------------------------------------------
# Configurable Weights & Default Constants
# -----------------------------------------------------------------------------

DEFAULT_CORRELATION_WEIGHTS = {
    "same_attachment_hash": 0.35,
    "same_ip": 0.20,
    "same_domain": 0.20,
    "same_reply_to": 0.20,
    "same_sender": 0.15,
    "same_url_domain": 0.15,
    "same_nameserver": 0.10,
    "similar_brand": 0.10,
    "similar_subject": 0.10,
    "same_registrar": 0.08,
    "similar_asn": 0.08,
}

# False-Positive Control Lists
EMPTY_FILE_HASHES = {
    "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "d41d8cd98f00b204e9800998ecf8427e",
    "da39a3ee5e6b4b0d3255bfef95601890afd80709"
}

COMMON_WEBMAIL_DOMAINS = {
    "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk",
    "outlook.com", "hotmail.com", "live.com", "msn.com",
    "aol.com", "icloud.com", "me.com", "mac.com",
    "mail.com", "protonmail.com", "proton.me", "zoho.com",
    "yandex.com", "gmx.com", "fastmail.com"
}

COMMON_PUBLIC_RESOLVERS = {
    "8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1",
    "9.9.9.9", "149.112.112.112", "208.67.222.222", "208.67.220.220",
    "127.0.0.1", "0.0.0.0", "::1"
}

COMMON_CLOUD_PLATFORMS = {
    "google.com", "microsoft.com", "apple.com", "amazon.com",
    "amazonaws.com", "cloudflare.com", "akamai.com", "azure.com"
}

GENERIC_REGISTRARS = {
    "godaddy.com, llc", "namecheap inc", "namecheap, inc.",
    "tucows domains inc", "tucows domains inc.", "network solutions, llc",
    "markmonitor inc", "markmonitor inc.", "google llc", "cloudflare, inc."
}


# -----------------------------------------------------------------------------
# Data Containers
# -----------------------------------------------------------------------------

@dataclass
class CorrelationProfile:
    """Normalized forensic indicator profile for pairwise correlation."""
    subjects: Set[str] = field(default_factory=set)
    senders: Set[str] = field(default_factory=set)
    reply_tos: Set[str] = field(default_factory=set)
    attachment_hashes: Set[str] = field(default_factory=set)
    ips: Set[str] = field(default_factory=set)
    domains: Set[str] = field(default_factory=set)
    url_domains: Set[str] = field(default_factory=set)
    registrars: Set[str] = field(default_factory=set)
    nameservers: Set[str] = field(default_factory=set)
    asns: Set[str] = field(default_factory=set)
    brands: Set[str] = field(default_factory=set)


# -----------------------------------------------------------------------------
# Campaign Correlator Engine
# -----------------------------------------------------------------------------

class CampaignCorrelator:
    """
    Engine for identifying shared infrastructure, campaign patterns,
    and tactical indicators across forensic investigations.
    Strictly avoids human identity attribution.
    """

    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = dict(DEFAULT_CORRELATION_WEIGHTS)
        if weights:
            self.weights.update(weights)

    # -------------------------------------------------------------------------
    # Helper & Cleaning Methods
    # -------------------------------------------------------------------------

    @staticmethod
    def is_valid_indicator_ip(ip_str: str) -> bool:
        """Checks if an IP is valid, public, and not a common public resolver."""
        if not ip_str or not isinstance(ip_str, str):
            return False
        clean = ip_str.strip()
        if clean in COMMON_PUBLIC_RESOLVERS:
            return False
        try:
            addr = ipaddress.ip_address(clean)
            if addr.is_private or addr.is_loopback or addr.is_link_local or addr.is_multicast or addr.is_reserved:
                return False
            return True
        except ValueError:
            return False

    @staticmethod
    def is_valid_indicator_domain(domain_str: str, check_webmail: bool = True) -> bool:
        """Checks if a domain is valid and not a generic webmail/cloud platform."""
        if not domain_str or not isinstance(domain_str, str):
            return False
        clean = domain_str.strip().lower().rstrip('.')
        if not clean or '.' not in clean:
            return False
        if check_webmail and clean in COMMON_WEBMAIL_DOMAINS:
            return False
        if clean in COMMON_CLOUD_PLATFORMS:
            return False
        return True

    @staticmethod
    def clean_subject_text(subject: str) -> str:
        """Removes email prefixes, tags, and extraneous whitespace."""
        if not subject:
            return ""
        s = subject.strip()
        # Strip common prefixes (case-insensitive)
        prefix_pattern = r'^(?:re|fwd|fw|urgent|notice|warning|external|\[external\])\s*:\s*'
        while re.match(prefix_pattern, s, re.IGNORECASE):
            s = re.sub(prefix_pattern, '', s, flags=re.IGNORECASE).strip()
        # Remove bracketed tags like [Ticket #12345]
        s = re.sub(r'\[.*?\]', '', s).strip()
        # Normalize punctuation to spaces
        s = re.sub(r'[^\w\s]', ' ', s.lower())
        return " ".join(s.split())

    @classmethod
    def calculate_subject_similarity(cls, subjects_a: Set[str], subjects_b: Set[str]) -> Tuple[float, Optional[str]]:
        """
        Computes the highest Jaccard token overlap between sets of subject lines.
        Returns (similarity_score, matched_subject_example).
        """
        best_sim = 0.0
        best_match = None

        for sa in subjects_a:
            clean_a = cls.clean_subject_text(sa)
            tokens_a = set(clean_a.split())
            # Exclude very small token sets
            if len(tokens_a) < 2:
                continue

            for sb in subjects_b:
                clean_b = cls.clean_subject_text(sb)
                tokens_b = set(clean_b.split())
                if len(tokens_b) < 2:
                    continue

                intersection = tokens_a.intersection(tokens_b)
                union = tokens_a.union(tokens_b)
                if not union:
                    continue

                jaccard = len(intersection) / len(union)
                # Require at least 50% token overlap to count as similar
                if jaccard >= 0.5 and jaccard > best_sim:
                    best_sim = jaccard
                    best_match = f"'{sa}' ~ '{sb}'"

        return best_sim, best_match

    @staticmethod
    def get_relationship_label(score: float) -> str:
        """Returns evidence-based relationship label strictly adhering to non-attribution policy."""
        if score >= 0.75:
            return "Likely campaign relationship"
        elif score >= 0.45:
            return "Shared infrastructure observed"
        elif score >= 0.20:
            return "Potentially related activity"
        else:
            return "Inconclusive / No significant relationship"

    @staticmethod
    def generate_shared_evidence_summary(shared_indicators: List[SharedIndicator]) -> str:
        """Formats evidence summary: e.g. '2 IPs, 1 domain, 1 Reply-To address'."""
        if not shared_indicators:
            return "No shared technical indicators"

        counts: Dict[str, int] = {}
        for ind in shared_indicators:
            counts[ind.type] = counts.get(ind.type, 0) + 1

        parts: List[str] = []
        labels = {
            "attachment_hash": ("attachment hash", "attachment hashes"),
            "ip": ("IP", "IPs"),
            "domain": ("domain", "domains"),
            "reply_to": ("Reply-To address", "Reply-To addresses"),
            "sender": ("sender", "senders"),
            "url_domain": ("URL domain", "URL domains"),
            "nameserver": ("nameserver", "nameservers"),
            "brand": ("targeted brand", "targeted brands"),
            "subject": ("similar subject", "similar subjects"),
            "registrar": ("registrar", "registrars"),
            "asn": ("ASN", "ASNs"),
        }

        # Order by significance
        ordered_types = [
            "attachment_hash", "ip", "domain", "reply_to",
            "sender", "url_domain", "nameserver", "brand",
            "subject", "registrar", "asn"
        ]

        for t in ordered_types:
            if t in counts:
                c = counts[t]
                singular, plural = labels.get(t, (t, t + "s"))
                parts.append(f"{c} {singular if c == 1 else plural}")

        return ", ".join(parts) if parts else "Shared technical indicators observed"

    # -------------------------------------------------------------------------
    # Profile Extraction
    # -------------------------------------------------------------------------

    @classmethod
    def extract_profile_from_email_dict(cls, data: Dict[str, Any]) -> CorrelationProfile:
        """Extracts a normalized CorrelationProfile from raw or parsed EmailAnalysis dict."""
        profile = CorrelationProfile()

        # Subject
        sub = data.get("subject")
        if sub and isinstance(sub, str) and sub.strip():
            profile.subjects.add(sub.strip())

        # Sender
        sender = data.get("from") or data.get("sender")
        if sender and isinstance(sender, str) and "@" in sender:
            profile.senders.add(sender.strip().lower())

        # Reply-To
        reply_to = data.get("reply_to")
        if reply_to and isinstance(reply_to, str) and "@" in reply_to:
            profile.reply_tos.add(reply_to.strip().lower())

        # Attachments
        raw_attachments = data.get("attachments") or []
        for att in raw_attachments:
            if isinstance(att, dict):
                h = att.get("sha256")
                if h and isinstance(h, str) and h.strip().lower() not in EMPTY_FILE_HASHES:
                    profile.attachment_hashes.add(h.strip().lower())
            elif isinstance(att, str):
                # Check if it looks like a sha256
                clean_h = att.strip().lower()
                if len(clean_h) == 64 and clean_h not in EMPTY_FILE_HASHES:
                    profile.attachment_hashes.add(clean_h)

        # Extracted attachment_hashes list if provided explicitly
        if isinstance(data.get("attachment_hashes"), list):
            for h in data["attachment_hashes"]:
                if isinstance(h, str) and h.strip().lower() not in EMPTY_FILE_HASHES:
                    profile.attachment_hashes.add(h.strip().lower())

        # IPs
        # From relay analysis hops
        relay = data.get("relay_analysis") or {}
        hops = relay.get("transmission_order_hops") or relay.get("header_order_hops") or []
        for hop in hops:
            if isinstance(hop, dict):
                for ip_key in ("from_ip", "by_ip"):
                    ip_val = hop.get(ip_key)
                    if cls.is_valid_indicator_ip(ip_val):
                        profile.ips.add(ip_val.strip())

        # From ip_intelligence
        ip_intel = data.get("ip_intelligence") or {}
        if isinstance(ip_intel, dict):
            for ip_key, intel_obj in ip_intel.items():
                if cls.is_valid_indicator_ip(ip_key):
                    profile.ips.add(ip_key.strip())
                if isinstance(intel_obj, dict):
                    asn_val = intel_obj.get("asn")
                    if asn_val and isinstance(asn_val, str) and asn_val.strip():
                        profile.asns.add(asn_val.strip().upper())

        # From indicators.ips
        indicators = data.get("indicators") or {}
        if isinstance(indicators, dict):
            for ip_obj in indicators.get("ips") or []:
                val = ip_obj.get("value") if isinstance(ip_obj, dict) else ip_obj
                if cls.is_valid_indicator_ip(val):
                    profile.ips.add(val.strip())

        # Also generic ips list
        for ip_val in data.get("ips") or []:
            if cls.is_valid_indicator_ip(ip_val):
                profile.ips.add(ip_val.strip())

        # Domains
        # From sender / reply-to domain
        for email_addr in list(profile.senders) + list(profile.reply_tos):
            d = email_addr.split("@")[-1].strip().lower()
            if cls.is_valid_indicator_domain(d):
                profile.domains.add(d)

        # From domain_intelligence
        dom_intel = data.get("domain_intelligence") or {}
        if isinstance(dom_intel, dict):
            for dom_key, intel_obj in dom_intel.items():
                if cls.is_valid_indicator_domain(dom_key):
                    profile.domains.add(dom_key.strip().lower())
                if isinstance(intel_obj, dict):
                    # Nameservers
                    dns_info = intel_obj.get("dns") or {}
                    for ns in dns_info.get("ns") or []:
                        if isinstance(ns, str) and ns.strip():
                            profile.nameservers.add(ns.strip().lower().rstrip('.'))
                    # Registrar
                    reg_info = intel_obj.get("registration") or {}
                    reg = reg_info.get("registrar")
                    if reg and isinstance(reg, str) and reg.strip().lower() not in GENERIC_REGISTRARS:
                        profile.registrars.add(reg.strip().lower())

        # From indicators.domains
        if isinstance(indicators, dict):
            for d_obj in indicators.get("domains") or []:
                val = d_obj.get("value") if isinstance(d_obj, dict) else d_obj
                if cls.is_valid_indicator_domain(val):
                    profile.domains.add(val.strip().lower())

        # From generic domains list
        for dom_val in data.get("domains") or []:
            if cls.is_valid_indicator_domain(dom_val):
                profile.domains.add(dom_val.strip().lower())

        # URL domains
        raw_urls = data.get("urls") or []
        for u in raw_urls:
            u_str = u.get("url") if isinstance(u, dict) else str(u)
            # Extract host/domain
            m = re.search(r'https?://([^/:\s]+)', u_str, re.IGNORECASE)
            if m:
                u_dom = m.group(1).strip().lower()
                if cls.is_valid_indicator_domain(u_dom, check_webmail=False):
                    profile.url_domains.add(u_dom)

        # Brands
        # From lookalike_domains
        lookalikes = data.get("lookalike_domains") or []
        for lk in lookalikes:
            if isinstance(lk, dict):
                brand = lk.get("target_brand")
                if brand and isinstance(brand, str) and brand.strip():
                    profile.brands.add(brand.strip().lower())

        # If brands explicitly provided
        for b in data.get("brands") or []:
            if isinstance(b, str) and b.strip():
                profile.brands.add(b.strip().lower())

        return profile

    @classmethod
    def extract_profile_from_case(cls, case: CaseModel) -> CorrelationProfile:
        """Aggregates a composite CorrelationProfile across all emails linked to a Case."""
        composite = CorrelationProfile()

        # Add case title to subjects
        if case.title and case.title.strip():
            composite.subjects.add(case.title.strip())

        for ce in case.emails:
            if ce.subject and ce.subject.strip():
                composite.subjects.add(ce.subject.strip())
            if ce.sender and "@" in ce.sender:
                composite.senders.add(ce.sender.strip().lower())
                d = ce.sender.split("@")[-1].strip().lower()
                if cls.is_valid_indicator_domain(d):
                    composite.domains.add(d)
            if ce.email_sha256 and ce.email_sha256.strip().lower() not in EMPTY_FILE_HASHES:
                # Store email hash as well
                composite.attachment_hashes.add(ce.email_sha256.strip().lower())

            # Parse indicators_json
            if ce.indicators_json:
                try:
                    ind_dict = json.loads(ce.indicators_json)
                    sub_profile = cls.extract_profile_from_email_dict(ind_dict)
                    composite.subjects.update(sub_profile.subjects)
                    composite.senders.update(sub_profile.senders)
                    composite.reply_tos.update(sub_profile.reply_tos)
                    composite.attachment_hashes.update(sub_profile.attachment_hashes)
                    composite.ips.update(sub_profile.ips)
                    composite.domains.update(sub_profile.domains)
                    composite.url_domains.update(sub_profile.url_domains)
                    composite.registrars.update(sub_profile.registrars)
                    composite.nameservers.update(sub_profile.nameservers)
                    composite.asns.update(sub_profile.asns)
                    composite.brands.update(sub_profile.brands)
                except Exception:
                    pass

        return composite

    # -------------------------------------------------------------------------
    # Pairwise Comparison
    # -------------------------------------------------------------------------

    def compare_profiles(
        self,
        profile_a: CorrelationProfile,
        profile_b: CorrelationProfile
    ) -> Tuple[float, List[SharedIndicator], Dict[str, MatchedSignalDetail]]:
        """
        Compares two CorrelationProfiles and computes explainable weighted similarity score.
        Returns: (correlation_score, shared_indicators_list, matching_signals_dict).
        """
        shared_indicators: List[SharedIndicator] = []
        matching_signals: Dict[str, MatchedSignalDetail] = {}
        total_score = 0.0

        # Helper to process set intersection
        def evaluate_signal(signal_name: str, set_a: Set[str], set_b: Set[str], indicator_type: str, details_prefix: str):
            nonlocal total_score
            common = sorted(list(set_a.intersection(set_b)))
            if common:
                weight = self.weights.get(signal_name, 0.0)
                # Contribution can scale slightly with count, but capped at 1.0 * weight
                contribution = round(weight * min(1.0, 0.8 + 0.2 * len(common)), 4)
                total_score += contribution

                matching_signals[signal_name] = MatchedSignalDetail(
                    signal_name=signal_name,
                    weight=weight,
                    matched_values=common,
                    contribution=contribution
                )
                for val in common:
                    shared_indicators.append(
                        SharedIndicator(
                            type=indicator_type,
                            value=val,
                            details=f"{details_prefix}: {val}"
                        )
                    )

        # 1. Same attachment hash (very strong)
        evaluate_signal("same_attachment_hash", profile_a.attachment_hashes, profile_b.attachment_hashes, "attachment_hash", "Shared payload SHA-256")

        # 2. Same IP (strong)
        evaluate_signal("same_ip", profile_a.ips, profile_b.ips, "ip", "Shared hosting or relay IP")

        # 3. Same domain (strong)
        evaluate_signal("same_domain", profile_a.domains, profile_b.domains, "domain", "Shared infrastructure domain")

        # 4. Same Reply-To (strong)
        evaluate_signal("same_reply_to", profile_a.reply_tos, profile_b.reply_tos, "reply_to", "Shared operational Reply-To address")

        # 5. Same sender (moderate/strong)
        evaluate_signal("same_sender", profile_a.senders, profile_b.senders, "sender", "Identical sender address")

        # 6. Same URL domain (strong)
        evaluate_signal("same_url_domain", profile_a.url_domains, profile_b.url_domains, "url_domain", "Shared link destination domain")

        # 7. Same nameserver (moderate)
        evaluate_signal("same_nameserver", profile_a.nameservers, profile_b.nameservers, "nameserver", "Shared authoritative nameserver")

        # 8. Similar brand impersonation (moderate)
        evaluate_signal("similar_brand", profile_a.brands, profile_b.brands, "brand", "Targeted brand alignment")

        # 9. Similar infrastructure ASN (weak/moderate)
        evaluate_signal("similar_asn", profile_a.asns, profile_b.asns, "asn", "Colocated network ASN")

        # 10. Same registrar (weak/moderate)
        evaluate_signal("same_registrar", profile_a.registrars, profile_b.registrars, "registrar", "Shared domain registrar")

        # 11. Similar subject (weak/moderate)
        subject_sim, best_subject_match = self.calculate_subject_similarity(profile_a.subjects, profile_b.subjects)
        if subject_sim > 0.0:
            weight = self.weights.get("similar_subject", 0.10)
            contribution = round(weight * subject_sim, 4)
            total_score += contribution
            matching_signals["similar_subject"] = MatchedSignalDetail(
                signal_name="similar_subject",
                weight=weight,
                matched_values=[best_subject_match] if best_subject_match else [],
                contribution=contribution
            )
            shared_indicators.append(
                SharedIndicator(
                    type="subject",
                    value=best_subject_match or "Subject line pattern",
                    details=f"Subject similarity ratio: {int(subject_sim * 100)}%"
                )
            )

        # Clamping and rounding
        final_score = min(1.0, round(total_score, 2))
        return final_score, shared_indicators, matching_signals

    # -------------------------------------------------------------------------
    # Database Correlation Workflows
    # -------------------------------------------------------------------------

    def correlate_email_against_cases(
        self,
        db: Session,
        email_data: Dict[str, Any],
        min_score: float = 0.15,
        limit: int = 10
    ) -> CampaignCorrelationResponse:
        """
        Correlates an analyzed email payload against all existing cases in the database.
        """
        email_profile = self.extract_profile_from_email_dict(email_data)
        cases = db.query(CaseModel).all()

        related_cases: List[RelatedCaseItem] = []
        all_shared_indicators: List[SharedIndicator] = []
        seen_indicators: Set[Tuple[str, str]] = set()
        highest_score = 0.0

        for case in cases:
            case_profile = self.extract_profile_from_case(case)
            score, shared_inds, match_signals = self.compare_profiles(email_profile, case_profile)

            if score >= min_score:
                if score > highest_score:
                    highest_score = score

                summary_str = self.generate_shared_evidence_summary(shared_inds)
                rel_label = self.get_relationship_label(score)

                related_cases.append(
                    RelatedCaseItem(
                        case_id=case.id,
                        case_number=case.case_number,
                        title=case.title,
                        severity=case.severity,
                        status=case.status,
                        correlation_score=score,
                        relationship_label=rel_label,
                        shared_evidence_summary=summary_str,
                        shared_indicators=shared_inds,
                        matching_signals=match_signals
                    )
                )

                for ind in shared_inds:
                    key = (ind.type, ind.value)
                    if key not in seen_indicators:
                        seen_indicators.add(key)
                        all_shared_indicators.append(ind)

        # Sort by correlation_score descending
        related_cases.sort(key=lambda c: c.correlation_score, reverse=True)
        related_cases = related_cases[:limit]

        top_label = self.get_relationship_label(highest_score) if highest_score > 0 else "Inconclusive / No significant relationship"

        return CampaignCorrelationResponse(
            related_cases=related_cases,
            correlation_score=highest_score,
            relationship_label=top_label,
            shared_indicators=all_shared_indicators
        )

    def correlate_case_against_cases(
        self,
        db: Session,
        target_case_id: str,
        min_score: float = 0.15,
        limit: int = 10
    ) -> CampaignCorrelationResponse:
        """
        Correlates a specific case against all other investigations in the database.
        """
        target_case = db.query(CaseModel).filter(
            (CaseModel.id == target_case_id) | (CaseModel.case_number == target_case_id)
        ).first()

        if not target_case:
            return CampaignCorrelationResponse(
                related_cases=[],
                correlation_score=0.0,
                relationship_label="Inconclusive / No significant relationship",
                shared_indicators=[]
            )

        target_profile = self.extract_profile_from_case(target_case)
        other_cases = db.query(CaseModel).filter(CaseModel.id != target_case.id).all()

        related_cases: List[RelatedCaseItem] = []
        all_shared_indicators: List[SharedIndicator] = []
        seen_indicators: Set[Tuple[str, str]] = set()
        highest_score = 0.0

        for case in other_cases:
            case_profile = self.extract_profile_from_case(case)
            score, shared_inds, match_signals = self.compare_profiles(target_profile, case_profile)

            if score >= min_score:
                if score > highest_score:
                    highest_score = score

                summary_str = self.generate_shared_evidence_summary(shared_inds)
                rel_label = self.get_relationship_label(score)

                related_cases.append(
                    RelatedCaseItem(
                        case_id=case.id,
                        case_number=case.case_number,
                        title=case.title,
                        severity=case.severity,
                        status=case.status,
                        correlation_score=score,
                        relationship_label=rel_label,
                        shared_evidence_summary=summary_str,
                        shared_indicators=shared_inds,
                        matching_signals=match_signals
                    )
                )

                for ind in shared_inds:
                    key = (ind.type, ind.value)
                    if key not in seen_indicators:
                        seen_indicators.add(key)
                        all_shared_indicators.append(ind)

        related_cases.sort(key=lambda c: c.correlation_score, reverse=True)
        related_cases = related_cases[:limit]

        top_label = self.get_relationship_label(highest_score) if highest_score > 0 else "Inconclusive / No significant relationship"

        return CampaignCorrelationResponse(
            related_cases=related_cases,
            correlation_score=highest_score,
            relationship_label=top_label,
            shared_indicators=all_shared_indicators
        )

    def direct_compare(
        self,
        entity_a: Dict[str, Any],
        entity_b: Dict[str, Any]
    ) -> DirectCompareResponse:
        """
        Direct pairwise comparison between two email or indicator dictionaries.
        """
        profile_a = self.extract_profile_from_email_dict(entity_a)
        profile_b = self.extract_profile_from_email_dict(entity_b)

        score, shared_inds, match_signals = self.compare_profiles(profile_a, profile_b)
        summary_str = self.generate_shared_evidence_summary(shared_inds)
        rel_label = self.get_relationship_label(score)

        return DirectCompareResponse(
            correlation_score=score,
            relationship_label=rel_label,
            shared_evidence_summary=summary_str,
            shared_indicators=shared_inds,
            matching_signals=match_signals
        )
