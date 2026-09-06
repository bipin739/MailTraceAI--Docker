import pytest
import hashlib
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.email_parser import EmailParserService, EmailParseException
from backend.services.ioc_extractor import IOCExtractorService

client = TestClient(app)

# Sample EML raw content for testing
VALID_EML = (
    b"From: Alice Security <alice@company.com>\r\n"
    b"To: Bob Analyst <bob@company.com>\r\n"
    b"Cc: Charlie Manager <charlie@company.com>\r\n"
    b"Subject: Urgent: Verify Account Security\r\n"
    b"Date: Mon, 07 Sep 2026 10:00:00 +0000\r\n"
    b"Reply-To: security-verify@suspicious-domain.com\r\n"
    b"Return-Path: <bounce@suspicious-domain.com>\r\n"
    b"Message-ID: <123456789.abcdef@company.com>\r\n"
    b"Received: from mail.suspicious-domain.com (mail.suspicious-domain.com [203.0.113.25]) by mx.company.com; Mon, 07 Sep 2026 10:00:01 +0000\r\n"
    b"Received: from internal.relay.com ([10.0.0.1]) by mail.suspicious-domain.com; Mon, 07 Sep 2026 09:59:59 +0000\r\n"
    b"Authentication-Results: mx.company.com; dkim=fail header.i=@company.com; spf=softfail (google.com: domain of bounce@suspicious-domain.com does not designate 203.0.113.25 as permitted sender)\r\n"
    b"MIME-Version: 1.0\r\n"
    b"Content-Type: multipart/mixed; boundary=\"BOUNDARY\"\r\n"
    b"\r\n"
    b"--BOUNDARY\r\n"
    b"Content-Type: multipart/alternative; boundary=\"SUBBOUNDARY\"\r\n"
    b"\r\n"
    b"--SUBBOUNDARY\r\n"
    b"Content-Type: text/plain; charset=utf-8\r\n"
    b"\r\n"
    b"Hello Bob,\r\n"
    b"Please verify your account at http://phishing-portal.com/login immediately.\r\n"
    b"\r\n"
    b"--SUBBOUNDARY\r\n"
    b"Content-Type: text/html; charset=utf-8\r\n"
    b"\r\n"
    b"<html><body><p>Hello Bob,</p><p>Please <a href=\"https://secure-update-portal.net/auth\">click here</a> to log in.</p></body></html>\r\n"
    b"--SUBBOUNDARY--\r\n"
    b"\r\n"
    b"--BOUNDARY\r\n"
    b"Content-Type: application/pdf; name=\"invoice_details.pdf\"\r\n"
    b"Content-Disposition: attachment; filename=\"invoice_details.pdf\"\r\n"
    b"Content-Transfer-Encoding: base64\r\n"
    b"\r\n"
    b"JVBERi0xLjQKJSDigqwKMSAwIG9iago8PAo+PgplbmRvYmoK\r\n"
    b"--BOUNDARY--\r\n"
)


def test_parse_valid_eml_service():
    """Test EmailParserService with valid EML content."""
    res = EmailParserService.parse_eml_bytes(VALID_EML, filename="phish_test.eml")

    assert res.file_info.filename == "phish_test.eml"
    assert res.file_info.size_bytes == len(VALID_EML)
    assert res.email_sha256 == hashlib.sha256(VALID_EML).hexdigest()

    # Check Headers
    assert "Alice Security" in res.from_header
    assert "Bob Analyst" in res.to
    assert "Charlie Manager" in res.cc
    assert res.subject == "Urgent: Verify Account Security"
    assert res.reply_to == "security-verify@suspicious-domain.com"
    assert res.return_path == "<bounce@suspicious-domain.com>"
    assert res.message_id == "<123456789.abcdef@company.com>"

    # Check Indicators Group
    assert res.indicators is not None
    assert len(res.indicators.urls) >= 2
    assert len(res.indicators.ips) >= 2
    assert len(res.indicators.domains) >= 2
    assert len(res.indicators.email_addresses) >= 4
    assert len(res.indicators.attachments) == 1

    # Check Attachment Hashes
    att_ind = res.indicators.attachments[0]
    assert att_ind.filename == "invoice_details.pdf"
    assert att_ind.mime_type == "application/pdf"
    assert att_ind.sha256 is not None
    assert len(att_ind.sha256) == 64


def test_ip_scope_classification():
    """Test IP version and scope classification (public vs private vs loopback)."""
    v4_pub_ver, v4_pub_scope = IOCExtractorService.classify_ip_scope("8.8.8.8")
    assert v4_pub_ver == 4
    assert v4_pub_scope == "public"

    v4_priv_ver, v4_priv_scope = IOCExtractorService.classify_ip_scope("10.0.0.1")
    assert v4_priv_ver == 4
    assert v4_priv_scope == "private"

    loop_ver, loop_scope = IOCExtractorService.classify_ip_scope("127.0.0.1")
    assert loop_ver == 4
    assert loop_scope == "loopback"

    v6_pub_ver, v6_pub_scope = IOCExtractorService.classify_ip_scope("2001:db8::1")
    assert v6_pub_ver == 6


def test_parse_empty_eml_service():
    """Test EmailParserService raises EmailParseException for empty files."""
    with pytest.raises(EmailParseException) as exc_info:
        EmailParserService.parse_eml_bytes(b"", filename="empty.eml")
    assert "empty" in str(exc_info.value).lower()


def test_api_analyze_endpoint_success():
    """Test POST /api/emails/analyze API endpoint with valid file."""
    response = client.post(
        "/api/emails/analyze",
        files={"file": ("sample.eml", VALID_EML, "message/rfc822")}
    )

    assert response.status_code == 200
    data = response.json()

    assert data["email_sha256"] == hashlib.sha256(VALID_EML).hexdigest()
    assert "indicators" in data
    assert len(data["indicators"]["ips"]) >= 2
    assert len(data["indicators"]["domains"]) >= 2
    assert len(data["indicators"]["attachments"]) == 1
    assert data["indicators"]["attachments"][0]["sha256"] is not None


def test_api_analyze_endpoint_malformed_empty():
    """Test POST /api/emails/analyze API endpoint returns 400 for empty file."""
    response = client.post(
        "/api/emails/analyze",
        files={"file": ("empty.eml", b"", "message/rfc822")}
    )

    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert data.get("error_code") == "MALFORMED_EMAIL"
