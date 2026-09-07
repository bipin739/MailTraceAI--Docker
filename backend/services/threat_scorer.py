import os
import json
import re
from typing import Dict, Any, List, Optional
from pathlib import Path

from backend.schemas.threat_score import (
    ThreatScoreContribution,
    PositiveEvidence,
    ThreatScoreResult
)


class ThreatScorerService:
    """
    Deterministic Global Threat Scoring Engine (Section 10).
    Combines forensic signals into an explainable, transparent email risk score.
    Weights and thresholds are strictly configuration-driven.
    No opaque machine learning models or black-box weights.
    """

    DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "scoring_rules.json"

    def __init__(self, config_path: Optional[str | Path] = None, config_dict: Optional[Dict[str, Any]] = None):
        if config_dict:
            self.config = config_dict
        else:
            self.config_file = Path(config_path) if config_path else self.DEFAULT_CONFIG_PATH
            self.config = self._load_config()

        self.weights = self.config.get("weights", {})
        self.thresholds = self.config.get("severity_thresholds", {})
        self.suspicious_extensions = [ext.lower() for ext in self.config.get("suspicious_extensions", [])]
        self.credential_keywords = [kw.lower() for kw in self.config.get("credential_keywords", [])]
        self.financial_keywords = [kw.lower() for kw in self.config.get("financial_keywords", [])]
        self.ml_scoring = self.config.get("ml_scoring", {
            "enabled": True,
            "probability_threshold": 0.75,
            "max_points": 10,
            "low_risk_threshold": 0.15
        })

    def _load_config(self) -> Dict[str, Any]:
        """Safely loads scoring configuration JSON."""
        if hasattr(self, "config_file") and self.config_file.exists():
            try:
                with open(self.config_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        # Built-in fallback defaults
        return {
            "weights": {
                "spf_fail": 8,
                "spf_softfail": 4,
                "dkim_fail": 8,
                "dmarc_fail": 12,
                "reply_to_mismatch": 8,
                "return_path_mismatch": 6,
                "brand_impersonation": 18,
                "url_high_risk": 15,
                "url_suspicious": 8,
                "html_link_mismatch": 15,
                "newly_registered_domain": 10,
                "credential_request": 12,
                "financial_language": 10,
                "suspicious_attachment_extension": 15,
                "suspicious_ip_hosting_or_proxy": 8,
                "ml_phishing_signal": 10
            },
            "ml_scoring": {
                "enabled": true,
                "probability_threshold": 0.75,
                "max_points": 10,
                "low_risk_threshold": 0.15
            },
            "severity_thresholds": {
                "low": {"min": 0, "max": 29},
                "suspicious": {"min": 30, "max": 59},
                "high": {"min": 60, "max": 79},
                "critical": {"min": 80, "max": 100}
            },
            "suspicious_extensions": [
                ".exe", ".scr", ".bat", ".cmd", ".vbs", ".js", ".jse",
                ".wsf", ".iso", ".img", ".hta", ".cpl", ".ps1", ".jar",
                ".docm", ".xlsm", ".pptm"
            ],
            "credential_keywords": [
                "password", "login credentials", "verify your account", "verify password",
                "reset your password", "security alert", "account suspended", "sign-in attempt",
                "validate credentials", "confirm your identity", "immediate verification"
            ],
            "financial_keywords": [
                "wire transfer", "bank account", "invoice payment", "remittance",
                "urgent payment", "gift card", "routing number", "swift code",
                "overdue invoice", "cryptocurrency", "bitcoin wallet"
            ]
        }

    def calculate_score(self, email_analysis: Any) -> ThreatScoreResult:
        """
        Evaluates deterministic forensic signals from EmailAnalysisResponse,
        generating transparent score contributions, positive evidence, and overall severity.
        """
        reasons: List[ThreatScoreContribution] = []
        positive_evidence: List[PositiveEvidence] = []
        raw_score = 0

        # 1. Authentication Signals (SPF, DKIM, DMARC)
        auth = getattr(email_analysis, "authentication", None)
        if auth:
            # SPF
            spf = getattr(auth, "spf", None)
            spf_res = getattr(spf, "result", "").lower() if spf else ""
            if spf_res == "fail":
                pts = self.weights.get("spf_fail", 8)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="spf_fail",
                    label="SPF authentication failed",
                    points=pts,
                    evidence=getattr(spf, "details", None) or "Observed SPF header indicated fail"
                ))
            elif spf_res == "softfail":
                pts = self.weights.get("spf_softfail", 4)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="spf_softfail",
                    label="SPF policy softfail",
                    points=pts,
                    evidence=getattr(spf, "details", None) or "Observed SPF header indicated softfail"
                ))
            elif spf_res == "pass":
                positive_evidence.append(PositiveEvidence(
                    signal="spf_pass",
                    label="SPF authentication passed",
                    evidence=getattr(spf, "details", None) or "Originating mail server authorized by SPF"
                ))

            # DKIM
            dkim = getattr(auth, "dkim", None)
            dkim_res = getattr(dkim, "result", "").lower() if dkim else ""
            if dkim_res == "fail":
                pts = self.weights.get("dkim_fail", 8)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="dkim_fail",
                    label="DKIM cryptographic signature verification failed",
                    points=pts,
                    evidence=getattr(dkim, "details", None) or "Observed DKIM header indicated fail"
                ))
            elif dkim_res == "pass":
                positive_evidence.append(PositiveEvidence(
                    signal="dkim_pass",
                    label="DKIM signature verified",
                    evidence=getattr(dkim, "details", None) or "Cryptographic DKIM signature validated"
                ))

            # DMARC
            dmarc = getattr(auth, "dmarc", None)
            dmarc_res = getattr(dmarc, "result", "").lower() if dmarc else ""
            if dmarc_res == "fail":
                pts = self.weights.get("dmarc_fail", 12)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="dmarc_fail",
                    label="DMARC policy alignment failed",
                    points=pts,
                    evidence=getattr(dmarc, "details", None) or "Observed DMARC policy check failed"
                ))
            elif dmarc_res == "pass":
                positive_evidence.append(PositiveEvidence(
                    signal="dmarc_pass",
                    label="DMARC policy aligned and passed",
                    evidence=getattr(dmarc, "details", None) or "DMARC policy alignment succeeded"
                ))

            # Alignment Mismatches
            align = getattr(auth, "alignment", None)
            if align:
                if getattr(align, "reply_to_mismatch", False):
                    pts = self.weights.get("reply_to_mismatch", 8)
                    raw_score += pts
                    from_d = getattr(align, "from_domain", "sender domain")
                    reply_d = getattr(align, "reply_to_domain", "reply-to domain")
                    reasons.append(ThreatScoreContribution(
                        signal="reply_to_mismatch",
                        label="Reply-To header domain mismatch",
                        points=pts,
                        evidence=f"From domain '{from_d}' differs from Reply-To destination '{reply_d}'"
                    ))
                if getattr(align, "return_path_mismatch", False):
                    pts = self.weights.get("return_path_mismatch", 6)
                    raw_score += pts
                    from_d = getattr(align, "from_domain", "sender domain")
                    return_d = getattr(align, "return_path_domain", "return-path domain")
                    reasons.append(ThreatScoreContribution(
                        signal="return_path_mismatch",
                        label="Return-Path envelope sender mismatch",
                        points=pts,
                        evidence=f"From domain '{from_d}' differs from Return-Path '{return_d}'"
                    ))

        # 2. Lookalike Domain / Brand Impersonation Signals
        lookalikes = getattr(email_analysis, "lookalike_domains", []) or []
        seen_lookalike_brands = set()
        for lk in lookalikes:
            brand_key = getattr(lk, "suspected_brand", "") or getattr(lk, "domain", "")
            if brand_key not in seen_lookalike_brands:
                seen_lookalike_brands.add(brand_key)
                pts = self.weights.get("brand_impersonation", 18)
                raw_score += pts
                b_name = getattr(lk, "brand_name", "") or getattr(lk, "suspected_brand", "known brand")
                obs_dom = getattr(lk, "domain", "")
                reasons.append(ThreatScoreContribution(
                    signal="brand_impersonation",
                    label=f"Possible {b_name} lookalike domain",
                    points=pts,
                    evidence=f"{obs_dom} (similarity: {int(getattr(lk, 'similarity', 0.9) * 100)}%, techniques: {', '.join(getattr(lk, 'techniques', []))})"
                ))

        # 3. URL Signals (High Risk, Suspicious, HTML Link Mismatch)
        url_analyses = getattr(email_analysis, "url_analysis", []) or []
        has_high_url = False
        has_susp_url = False
        has_link_mismatch = False

        for u_res in url_analyses:
            feat = getattr(u_res, "features", None)
            score = getattr(u_res, "suspicion_score", 0)

            if not has_link_mismatch and feat and getattr(feat, "display_link_mismatch", False):
                has_link_mismatch = True
                pts = self.weights.get("html_link_mismatch", 15)
                raw_score += pts
                vis_dom = getattr(feat, "visible_text_domain", None) or getattr(feat, "visible_text", "trusted site")
                dest_dom = getattr(u_res, "domain", "")
                reasons.append(ThreatScoreContribution(
                    signal="html_link_mismatch",
                    label="HTML display link mismatch",
                    points=pts,
                    evidence=f"Visible anchor text claimed '{vis_dom}' but links to '{dest_dom}'"
                ))

            if not has_high_url and score >= 60:
                has_high_url = True
                pts = self.weights.get("url_high_risk", 15)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="url_high_risk",
                    label="High-risk URL structure detected",
                    points=pts,
                    evidence=f"{getattr(u_res, 'url', '')} (suspicion score {score}/100)"
                ))
            elif not has_high_url and not has_susp_url and score >= 25:
                has_susp_url = True
                pts = self.weights.get("url_suspicious", 8)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="url_suspicious",
                    label="Suspicious URL detected",
                    points=pts,
                    evidence=f"{getattr(u_res, 'url', '')} (suspicion score {score}/100)"
                ))

        if url_analyses and not has_high_url and not has_susp_url and not has_link_mismatch:
            positive_evidence.append(PositiveEvidence(
                signal="clean_urls",
                label="Extracted URLs exhibit normal structure",
                evidence=f"{len(url_analyses)} URL(s) inspected without anomalies"
            ))

        # 4. Domain Intelligence (Newly Registered Domains)
        domain_intel = getattr(email_analysis, "domain_intelligence", {}) or {}
        new_domains_flagged = set()
        established_domains = []

        for d_name, d_data in domain_intel.items():
            is_new = getattr(d_data, "newly_registered_domain", False)
            age = getattr(d_data, "domain_age_days", None)
            if (is_new or (age is not None and age < 30)) and d_name not in new_domains_flagged:
                new_domains_flagged.add(d_name)
                pts = self.weights.get("newly_registered_domain", 10)
                raw_score += pts
                age_str = f"{age} days old" if age is not None else "< 30 days old"
                reasons.append(ThreatScoreContribution(
                    signal="newly_registered_domain",
                    label="Newly registered domain",
                    points=pts,
                    evidence=f"Domain '{d_name}' was registered recently ({age_str})"
                ))
            elif age is not None and age > 365:
                established_domains.append(f"{d_name} ({age} days)")

        if established_domains and not new_domains_flagged:
            positive_evidence.append(PositiveEvidence(
                signal="established_domain",
                label="Domain registration is well-established",
                evidence=", ".join(established_domains[:2])
            ))

        # 5. Content Intent Signals (Credential Harvesting & Financial Language)
        subject = getattr(email_analysis, "subject", "") or ""
        plain_text = getattr(email_analysis, "plain_text_body", "") or ""
        html_body = getattr(email_analysis, "html_body", "") or ""
        combined_text = f"{subject} {plain_text} {html_body}".lower()

        # Credential Harvesting language
        matched_cred_kw = None
        for kw in self.credential_keywords:
            if re.search(rf'\b{re.escape(kw)}\b', combined_text):
                matched_cred_kw = kw
                break

        if matched_cred_kw:
            pts = self.weights.get("credential_request", 12)
            raw_score += pts
            reasons.append(ThreatScoreContribution(
                signal="credential_request",
                label="Credential harvesting or urgent security language",
                points=pts,
                evidence=f"Detected pattern: '{matched_cred_kw}'"
            ))

        # Financial / Wire language
        matched_fin_kw = None
        for kw in self.financial_keywords:
            if re.search(rf'\b{re.escape(kw)}\b', combined_text):
                matched_fin_kw = kw
                break

        if matched_fin_kw:
            pts = self.weights.get("financial_language", 10)
            raw_score += pts
            reasons.append(ThreatScoreContribution(
                signal="financial_language",
                label="Urgent financial or wire transfer language",
                points=pts,
                evidence=f"Detected pattern: '{matched_fin_kw}'"
            ))

        # 6. Attachment Signals
        attachments = getattr(email_analysis, "attachments", []) or []
        suspicious_att_found = False
        for att in attachments:
            fname = getattr(att, "filename", "").lower()
            for ext in self.suspicious_extensions:
                if fname.endswith(ext):
                    suspicious_att_found = True
                    pts = self.weights.get("suspicious_attachment_extension", 15)
                    raw_score += pts
                    reasons.append(ThreatScoreContribution(
                        signal="suspicious_attachment_extension",
                        label=f"Dangerous executable or script attachment ({ext})",
                        points=pts,
                        evidence=f"Attachment '{getattr(att, 'filename', '')}'"
                    ))
                    break

        if attachments and not suspicious_att_found:
            positive_evidence.append(PositiveEvidence(
                signal="safe_attachments",
                label="No executable or macro attachments detected",
                evidence=f"{len(attachments)} attachment(s) verified safe"
            ))

        # 7. IP Intelligence Signals (Proxy, Tor, VPN)
        ip_intel = getattr(email_analysis, "ip_intelligence", {}) or {}
        for ip_addr, ip_data in ip_intel.items():
            if getattr(ip_data, "is_proxy_vpn_tor", False):
                pts = self.weights.get("suspicious_ip_hosting_or_proxy", 8)
                raw_score += pts
                reasons.append(ThreatScoreContribution(
                    signal="suspicious_ip_hosting_or_proxy",
                    label="Anonymized transmission node (Proxy/VPN/Tor)",
                    points=pts,
                    evidence=f"Relay IP {ip_addr} flagged as proxy or VPN exit"
                ))
                break

        # 8. NLP Machine Learning Phishing Assessment (Section 11)
        # ML signal complements deterministic forensic scoring with a limited, bounded weight.
        # It does not replace deterministic forensic scoring or dictate the final verdict.
        if self.ml_scoring.get("enabled", True):
            ml_prob = getattr(email_analysis, "ml_phishing_probability", None)
            if ml_prob is None:
                ml_assessment = getattr(email_analysis, "ml_assessment", None)
                if ml_assessment:
                    ml_prob = getattr(ml_assessment, "probability", None)
                    if ml_prob is None and isinstance(ml_assessment, dict):
                        ml_prob = ml_assessment.get("probability")

            if ml_prob is not None:
                threshold = self.ml_scoring.get("probability_threshold", 0.75)
                low_threshold = self.ml_scoring.get("low_risk_threshold", 0.15)
                max_pts = self.weights.get("ml_phishing_signal", self.ml_scoring.get("max_points", 10))

                if ml_prob >= threshold:
                    pts = max_pts
                    raw_score += pts
                    reasons.append(ThreatScoreContribution(
                        signal="ml_phishing_signal",
                        label="NLP text classification flagged high phishing probability",
                        points=pts,
                        evidence=f"ML model estimated {int(ml_prob * 100)}% phishing probability based on language and phrasing patterns"
                    ))
                elif ml_prob <= low_threshold:
                    positive_evidence.append(PositiveEvidence(
                        signal="ml_low_risk_content",
                        label="NLP content assessment indicates benign language",
                        evidence=f"ML text classifier estimated low phishing risk ({int(ml_prob * 100)}%)"
                    ))

        # Score Clamping
        final_score = max(0, min(100, raw_score))

        # Determine Severity from Configurable Thresholds
        severity = self._determine_severity(final_score)

        # Generate Executive Summary
        if final_score == 0:
            summary = "No anomalous forensic indicators detected. Email exhibits normal baseline characteristics."
        elif reasons:
            top_reasons = [f"{r.label} (+{r.points})" for r in reasons[:3]]
            summary = f"Email risk assessed as {severity.capitalize()} ({final_score}/100) driven by {len(reasons)} forensic signal(s): {', '.join(top_reasons)}."
        else:
            summary = f"Email risk assessed as {severity.capitalize()} ({final_score}/100)."

        return ThreatScoreResult(
            score=final_score,
            severity=severity,
            reasons=reasons,
            positive_evidence=positive_evidence,
            summary=summary
        )

    def _determine_severity(self, score: int) -> str:
        """Determines severity label based on configured thresholds."""
        for level, bounds in self.thresholds.items():
            if bounds.get("min", 0) <= score <= bounds.get("max", 100):
                return level
        if score >= 80:
            return "critical"
        if score >= 60:
            return "high"
        if score >= 30:
            return "suspicious"
        return "low"
