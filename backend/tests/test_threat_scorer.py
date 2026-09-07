import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.threat_scorer import ThreatScorerService
from backend.schemas.email import (
    EmailAnalysisResponse,
    AuthenticationAnalysis,
    ProtocolResult,
    SenderAlignment,
    AttachmentInfo
)
from backend.schemas.lookalike import LookalikeDetectionResult
from backend.schemas.url_analysis import URLAnalysisResult, URLFeatures
from backend.schemas.domain_intelligence import DomainIntelligence, DNSRecords, DomainRegistration
from backend.schemas.ip_intelligence import IPIntelligence


@pytest.fixture
def scorer():
    return ThreatScorerService()


def test_legitimate_email_low_score(scorer):
    """Legitimate email with passing authentication and normal features has score 0 or low."""
    analysis = EmailAnalysisResponse(
        subject="Meeting Agenda for Tuesday",
        from_header="colleague@example.com",
        to="user@example.com",
        plain_text_body="Hi team, here is the agenda for our weekly sync. See you tomorrow.",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="pass", details="sender IP authorized"),
            dkim=ProtocolResult(result="pass", details="signature verified"),
            dmarc=ProtocolResult(result="pass", details="dmarc=pass"),
            alignment=SenderAlignment(
                from_domain="example.com",
                reply_to_domain="example.com",
                return_path_domain="example.com",
                reply_to_mismatch=False,
                return_path_mismatch=False
            )
        ),
        urls=["https://example.com/agenda"],
        url_analysis=[
            URLAnalysisResult(
                url="https://example.com/agenda",
                domain="example.com",
                features=URLFeatures(
                    scheme="https",
                    hostname="example.com",
                    registered_domain="example.com",
                    subdomain="",
                    subdomain_count=0,
                    has_non_standard_port=False,
                    path="/agenda",
                    path_length=7,
                    query="",
                    query_length=0,
                    total_length=26,
                    is_ip_host=False,
                    is_punycode=False,
                    excessive_subdomains=False,
                    has_credentials=False,
                    suspicious_keywords=[],
                    has_percent_encoding=False,
                    percent_encoding_count=0,
                    unusual_char_density=False,
                    is_shortener=False,
                    display_link_mismatch=False
                ),
                observations=[],
                suspicion_score=0,
                suspicion_level="low",
                score_reasons=[]
            )
        ],
        domain_intelligence={
            "example.com": DomainIntelligence(
                domain="example.com",
                dns=DNSRecords(a=["93.184.216.34"], aaaa=[], mx=[], ns=[], txt=[]),
                registration=DomainRegistration(nameservers=[], status=[], registration_source="RDAP"),
                domain_age_days=3000,
                newly_registered_domain=False,
                is_resolvable=True
            )
        }
    )
    result = scorer.calculate_score(analysis)
    assert result.score == 0
    assert result.severity == "low"
    assert len(result.reasons) == 0
    assert len(result.positive_evidence) > 0


def test_single_spf_fail_remains_low(scorer):
    """Authentication failure alone (SPF fail = 8 pts) must not make email malicious."""
    analysis = EmailAnalysisResponse(
        subject="Newsletter",
        from_header="news@example.com",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="fail", details="sender IP not in SPF record"),
            dkim=ProtocolResult(result="pass"),
            dmarc=ProtocolResult(result="pass")
        )
    )
    result = scorer.calculate_score(analysis)
    assert result.score == 8
    assert result.severity == "low"
    assert len(result.reasons) == 1
    assert result.reasons[0].signal == "spf_fail"
    assert result.reasons[0].points == 8


def test_all_auth_fail_alone_remains_low(scorer):
    """
    Even when SPF (8), DKIM (8), and DMARC (12) fail together (8+8+12 = 28 pts),
    the email remains strictly within the 'low' threshold (<= 29), ensuring
    high scores require multiple independent signals.
    """
    analysis = EmailAnalysisResponse(
        subject="Quarterly update",
        from_header="sender@corp.org",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="fail"),
            dkim=ProtocolResult(result="fail"),
            dmarc=ProtocolResult(result="fail")
        )
    )
    result = scorer.calculate_score(analysis)
    assert result.score == 28
    assert result.severity == "low"
    assert len(result.reasons) == 3


def test_multiple_combined_signals_critical(scorer):
    """
    Combines independent forensic signals:
    - brand impersonation (+18)
    - html link mismatch (+15)
    - high risk url (+15)
    - credential request (+12)
    - dmarc fail (+12)
    - reply-to mismatch (+8)
    - newly registered domain (+10)
    Total = 90 -> Critical.
    """
    analysis = EmailAnalysisResponse(
        subject="URGENT: Immediate verification required for your account password",
        from_header="security@micros0ft-login.com",
        plain_text_body="Please verify your account and confirm your identity immediately.",
        authentication=AuthenticationAnalysis(
            dmarc=ProtocolResult(result="fail", details="dmarc=fail"),
            alignment=SenderAlignment(
                from_domain="micros0ft-login.com",
                reply_to_domain="attacker-drop.com",
                reply_to_mismatch=True
            )
        ),
        lookalike_domains=[
            LookalikeDetectionResult(
                domain="micros0ft-login.com",
                suspected_brand="microsoft.com",
                brand_name="Microsoft",
                similarity=0.91,
                techniques=["character_substitution", "brand_keyword"],
                confidence_label="Potential brand impersonation"
            )
        ],
        url_analysis=[
            URLAnalysisResult(
                url="http://evil.example/auth",
                domain="evil.example",
                features=URLFeatures(
                    scheme="http",
                    hostname="evil.example",
                    registered_domain="evil.example",
                    subdomain="",
                    subdomain_count=0,
                    has_non_standard_port=False,
                    path="/auth",
                    path_length=5,
                    query="",
                    query_length=0,
                    total_length=23,
                    is_ip_host=False,
                    is_punycode=False,
                    excessive_subdomains=False,
                    has_credentials=False,
                    suspicious_keywords=["auth"],
                    has_percent_encoding=False,
                    percent_encoding_count=0,
                    unusual_char_density=False,
                    is_shortener=False,
                    display_link_mismatch=True,
                    visible_text_domain="microsoft.com"
                ),
                observations=["HTML display link mismatch"],
                suspicion_score=65,
                suspicion_level="high",
                score_reasons=["HTML display link mismatch (+35)"]
            )
        ],
        domain_intelligence={
            "micros0ft-login.com": DomainIntelligence(
                domain="micros0ft-login.com",
                dns=DNSRecords(a=["192.0.2.1"], aaaa=[], mx=[], ns=[], txt=[]),
                registration=DomainRegistration(nameservers=[], status=[], registration_source="RDAP"),
                domain_age_days=12,
                newly_registered_domain=True,
                is_resolvable=True
            )
        }
    )
    result = scorer.calculate_score(analysis)
    assert result.score >= 80
    assert result.severity == "critical"
    signal_ids = [r.signal for r in result.reasons]
    assert "brand_impersonation" in signal_ids
    assert "html_link_mismatch" in signal_ids
    assert "url_high_risk" in signal_ids
    assert "credential_request" in signal_ids
    assert "dmarc_fail" in signal_ids
    assert "reply_to_mismatch" in signal_ids
    assert "newly_registered_domain" in signal_ids


def test_score_clamping(scorer):
    """Verifies score does not exceed 100 when signals total over 100 points."""
    # Construct an extreme scenario with all possible malicious indicators
    analysis = EmailAnalysisResponse(
        subject="URGENT: Bank account wire transfer payment invoice overdue with password verify your account",
        from_header="attacker@micros0ft-login.com",
        plain_text_body="Please reset your password and send wire transfer to bitcoin wallet.",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="fail"),
            dkim=ProtocolResult(result="fail"),
            dmarc=ProtocolResult(result="fail"),
            alignment=SenderAlignment(
                from_domain="micros0ft-login.com",
                reply_to_domain="evil.net",
                return_path_domain="evil.org",
                reply_to_mismatch=True,
                return_path_mismatch=True
            )
        ),
        lookalike_domains=[
            LookalikeDetectionResult(
                domain="micros0ft-login.com",
                suspected_brand="microsoft.com",
                brand_name="Microsoft",
                similarity=0.91,
                techniques=["character_substitution"],
                confidence_label="Potential brand impersonation"
            )
        ],
        url_analysis=[
            URLAnalysisResult(
                url="http://evil.example/auth",
                domain="evil.example",
                features=URLFeatures(
                    scheme="http",
                    hostname="evil.example",
                    registered_domain="evil.example",
                    subdomain="",
                    subdomain_count=0,
                    has_non_standard_port=False,
                    path="",
                    path_length=0,
                    query="",
                    query_length=0,
                    total_length=23,
                    is_ip_host=False,
                    is_punycode=False,
                    excessive_subdomains=False,
                    has_credentials=False,
                    suspicious_keywords=[],
                    has_percent_encoding=False,
                    percent_encoding_count=0,
                    unusual_char_density=False,
                    is_shortener=False,
                    display_link_mismatch=True
                ),
                observations=[],
                suspicion_score=75,
                suspicion_level="high",
                score_reasons=[]
            )
        ],
        domain_intelligence={
            "micros0ft-login.com": DomainIntelligence(
                domain="micros0ft-login.com",
                dns=DNSRecords(a=[], aaaa=[], mx=[], ns=[], txt=[]),
                registration=DomainRegistration(nameservers=[], status=[], registration_source="RDAP"),
                domain_age_days=5,
                newly_registered_domain=True,
                is_resolvable=True
            )
        },
        attachments=[
            AttachmentInfo(
                filename="malware.exe",
                mime_type="application/x-dosexec",
                size=1024,
                sha256="abc"
            )
        ],
        ip_intelligence={
            "203.0.113.10": IPIntelligence(
                ip="203.0.113.10",
                scope="public",
                is_proxy_vpn_tor=True
            )
        }
    )
    result = scorer.calculate_score(analysis)
    assert result.score == 100
    assert result.severity == "critical"


def test_config_changes():
    """Verifies that injecting custom weights or thresholds changes scoring behavior."""
    custom_config = {
        "weights": {
            "spf_fail": 50,
            "dmarc_fail": 50
        },
        "severity_thresholds": {
            "low": {"min": 0, "max": 10},
            "suspicious": {"min": 11, "max": 40},
            "high": {"min": 41, "max": 70},
            "critical": {"min": 71, "max": 100}
        }
    }
    custom_scorer = ThreatScorerService(config_dict=custom_config)
    analysis = EmailAnalysisResponse(
        subject="Test",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="fail")
        )
    )
    res = custom_scorer.calculate_score(analysis)
    assert res.score == 50
    assert res.severity == "high"


def test_missing_features_safe_handling(scorer):
    """Emails with None or empty fields do not cause exceptions."""
    analysis = EmailAnalysisResponse()
    res = scorer.calculate_score(analysis)
    assert res.score == 0
    assert res.severity == "low"
    assert isinstance(res.reasons, list)


def test_positive_evidence_generation(scorer):
    """Tests that passing checks and safe attachments appear in positive evidence."""
    analysis = EmailAnalysisResponse(
        subject="Safe Document",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="pass"),
            dkim=ProtocolResult(result="pass"),
            dmarc=ProtocolResult(result="pass")
        ),
        attachments=[
            AttachmentInfo(filename="report.pdf", mime_type="application/pdf", size=500, sha256="def")
        ],
        domain_intelligence={
            "trusted.org": DomainIntelligence(
                domain="trusted.org",
                dns=DNSRecords(a=[], aaaa=[], mx=[], ns=[], txt=[]),
                registration=DomainRegistration(nameservers=[], status=[], registration_source="RDAP"),
                domain_age_days=1500,
                newly_registered_domain=False,
                is_resolvable=True
            )
        }
    )
    res = scorer.calculate_score(analysis)
    pos_signals = [p.signal for p in res.positive_evidence]
    assert "spf_pass" in pos_signals
    assert "dkim_pass" in pos_signals
    assert "dmarc_pass" in pos_signals
    assert "safe_attachments" in pos_signals
    assert "established_domain" in pos_signals


def test_api_calculate_threat_score_endpoint():
    """Verifies FastAPI endpoint POST /api/emails/calculate-threat-score."""
    client = TestClient(app)
    analysis = EmailAnalysisResponse(
        subject="Urgent password reset",
        from_header="admin@micros0ft-support.com",
        plain_text_body="Immediate verification required for your account password",
        authentication=AuthenticationAnalysis(
            spf=ProtocolResult(result="fail"),
            dmarc=ProtocolResult(result="fail")
        )
    )
    resp = client.post("/api/emails/calculate-threat-score", json=analysis.model_dump())
    assert resp.status_code == 200
    data = resp.json()
    assert "score" in data
    assert "severity" in data
    assert "reasons" in data
    assert isinstance(data["reasons"], list)
    assert data["score"] > 0
