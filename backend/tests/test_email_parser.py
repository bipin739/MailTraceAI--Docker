import pytest
import hashlib
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.email_parser import EmailParserService, EmailParseException
from backend.services.auth_analyzer import AuthAnalyzerService

client = TestClient(app)

# Sample EML raw content for testing
VALID_EML = (
    b"From: Alice Security <alice@company.com>\r\n"
    b"To: Bob Analyst <bob@company.com>\r\n"
    b"Cc: Charlie Manager <charlie@company.com>\r\n"
    b"Subject: Urgent: Verify Account Security\r\n"
    b"Date: Mon, 07 Sep 2026 10:00:00 +0000\r\n"
    b"Reply-To: security-verify@suspicious-domain.com\r\n"
    b"Return-Path: <bounce@another-domain.com>\r\n"
    b"Message-ID: <123456789.abcdef@company.com>\r\n"
    b"Received: from mail.suspicious-domain.com (mail.suspicious-domain.com [203.0.113.25]) by mx.company.com; Mon, 07 Sep 2026 10:00:01 +0000\r\n"
    b"Received: from internal.relay.com ([10.0.0.1]) by mail.suspicious-domain.com; Mon, 07 Sep 2026 09:59:59 +0000\r\n"
    b"Authentication-Results: mx.company.com; dkim=fail header.i=@company.com; spf=softfail (google.com: domain of bounce@suspicious-domain.com does not designate 203.0.113.25 as permitted sender); dmarc=fail (p=REJECT) header.from=company.com\r\n"
    b"MIME-Version: 1.0\r\n"
    b"Content-Type: multipart/mixed; boundary=\"BOUNDARY\"\r\n"
    b"\r\n"
    b"--BOUNDARY\r\n"
    b"Content-Type: text/plain; charset=utf-8\r\n"
    b"\r\n"
    b"Hello Bob,\r\n"
    b"Please verify your account at http://phishing-portal.com/login immediately.\r\n"
    b"--BOUNDARY--\r\n"
)


def test_parse_valid_eml_authentication():
    """Test parsing EML with authentication results and domain mismatches."""
    res = EmailParserService.parse_eml_bytes(VALID_EML, filename="auth_test.eml")

    assert res.authentication is not None
    assert res.authentication.spf.result == "softfail"
    assert res.authentication.dkim.result == "fail"
    assert res.authentication.dmarc.result == "fail"

    # Check Alignment Analysis
    align = res.authentication.alignment
    assert align.from_domain == "company.com"
    assert align.reply_to_domain == "suspicious-domain.com"
    assert align.return_path_domain == "another-domain.com"
    assert align.reply_to_mismatch is True
    assert align.return_path_mismatch is True


def test_auth_analyzer_pass_cases():
    """Test AuthAnalyzerService with SPF pass, DKIM pass, DMARC pass headers."""
    spf, dkim, dmarc, obs = AuthAnalyzerService.parse_authentication_headers([
        "mx.google.com; dkim=pass header.i=@company.com; spf=pass (google.com: domain of sender@company.com designates 192.0.2.1 as permitted sender); dmarc=pass (p=REJECT) header.from=company.com"
    ])

    assert spf.result == "pass"
    assert dkim.result == "pass"
    assert dmarc.result == "pass"

    align = AuthAnalyzerService.analyze_sender_alignment(
        from_header="John <john@company.com>",
        reply_to="john@company.com",
        return_path="bounce@company.com"
    )
    assert align.reply_to_mismatch is False
    assert align.return_path_mismatch is False


def test_auth_analyzer_missing_and_multiple_headers():
    """Test AuthAnalyzerService with missing headers and multiple headers."""
    spf, dkim, dmarc, obs = AuthAnalyzerService.parse_authentication_headers([])
    assert spf.result == "none"
    assert dkim.result == "none"
    assert dmarc.result == "none"

    # Received-SPF fallback
    spf_f, dkim_f, dmarc_f, obs_f = AuthAnalyzerService.parse_authentication_headers([], [
        "Received-SPF: pass (client-ip=203.0.113.1; envelope-from=bounce@example.com)"
    ])
    assert spf_f.result == "pass"


def test_api_analyze_endpoint_authentication():
    """Test POST /api/emails/analyze returns structured authentication data."""
    response = client.post(
        "/api/emails/analyze",
        files={"file": ("auth.eml", VALID_EML, "message/rfc822")}
    )

    assert response.status_code == 200
    data = response.json()

    assert "authentication" in data
    assert data["authentication"]["verification_type"] == "observed_header"
    assert "unverified" in data["authentication"]["verification_notice"].lower()
    assert data["authentication"]["spf"]["result"] == "softfail"
    assert data["authentication"]["alignment"]["reply_to_mismatch"] is True


def test_encoded_word_rfc2047_decoding():
    """Test EmailParserService decodes RFC-2047 Q-encoded subject headers into human-readable text."""
    eml = (
        b"From: Exclusive Offer <offer@example.com>\r\n"
        b"To: User <user@example.com>\r\n"
        b"Subject: =?UTF-8?Q?=E2=9C=85Select_your_Loan_Plan_|_Exclusive_Offer_is_Waiting!?=\r\n"
        b"Date: Mon, 07 Sep 2026 10:00:00 +0000\r\n"
        b"\r\n"
        b"Sample body text\r\n"
    )
    res = EmailParserService.parse_eml_bytes(eml, filename="encoded.eml")
    assert res.subject == "✅Select your Loan Plan | Exclusive Offer is Waiting!"

