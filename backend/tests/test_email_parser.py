import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.email_parser import EmailParserService, EmailParseException

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
    b"Received: from mail.suspicious-domain.com (mail.suspicious-domain.com [198.51.100.25]) by mx.company.com; Mon, 07 Sep 2026 10:00:01 +0000\r\n"
    b"Received: from internal.relay.com ([10.0.0.1]) by mail.suspicious-domain.com; Mon, 07 Sep 2026 09:59:59 +0000\r\n"
    b"Authentication-Results: mx.company.com; dkim=fail header.i=@company.com; spf=softfail (google.com: domain of bounce@suspicious-domain.com does not designate 198.51.100.25 as permitted sender)\r\n"
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

    # Check Headers
    assert "Alice Security" in res.headers.from_header
    assert "Bob Analyst" in res.headers.to
    assert "Charlie Manager" in res.headers.cc
    assert res.headers.subject == "Urgent: Verify Account Security"
    assert res.headers.reply_to == "security-verify@suspicious-domain.com"
    assert res.headers.return_path == "<bounce@suspicious-domain.com>"
    assert res.headers.message_id == "<123456789.abcdef@company.com>"

    # Check Multi-value headers
    assert len(res.headers.received) == 2
    assert "198.51.100.25" in res.headers.received[0]
    assert len(res.headers.authentication_results) == 1
    assert "spf=softfail" in res.headers.authentication_results[0]

    # Check Bodies
    assert res.body.plain_text is not None
    assert "http://phishing-portal.com/login" in res.body.plain_text
    assert res.body.html is not None
    assert "https://secure-update-portal.net/auth" in res.body.html

    # Check extracted URLs
    assert "http://phishing-portal.com/login" in res.urls
    assert "https://secure-update-portal.net/auth" in res.urls

    # Check Attachments
    assert len(res.attachments) == 1
    assert res.attachments[0].filename == "invoice_details.pdf"
    assert res.attachments[0].mime_type == "application/pdf"
    assert res.attachments[0].size > 0


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

    assert data["file_info"]["filename"] == "sample.eml"
    assert data["headers"]["subject"] == "Urgent: Verify Account Security"
    assert data["headers"]["from"] == "Alice Security <alice@company.com>"
    assert len(data["headers"]["received"]) == 2
    assert len(data["urls"]) >= 2
    assert len(data["attachments"]) == 1
    assert data["attachments"][0]["filename"] == "invoice_details.pdf"


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


def test_parse_minimal_eml():
    """Test parsing an EML with only basic text content and minimal headers."""
    minimal_bytes = b"Subject: Simple Hello\r\nFrom: user@example.com\r\n\r\nHello World!"
    res = EmailParserService.parse_eml_bytes(minimal_bytes, filename="minimal.eml")

    assert res.headers.subject == "Simple Hello"
    assert res.headers.from_header == "user@example.com"
    assert res.headers.to is None
    assert res.headers.received == []
    assert res.body.plain_text.strip() == "Hello World!"
    assert res.attachments == []
    assert res.urls == []


def test_parse_multiple_attachments_and_urls():
    """Test parsing EML with multiple attachments and multiple URL formats."""
    multi_eml = (
        b"From: sender@test.org\r\n"
        b"To: target@test.org\r\n"
        b"Subject: Multiple Attachments Test\r\n"
        b"Content-Type: multipart/mixed; boundary=\"BOUNDARY\"\r\n"
        b"\r\n"
        b"--BOUNDARY\r\n"
        b"Content-Type: text/plain; charset=utf-8\r\n"
        b"\r\n"
        b"Check these out: http://link1.org and https://link2.com/path?a=1&b=2\r\n"
        b"--BOUNDARY\r\n"
        b"Content-Type: image/png; name=\"screenshot.png\"\r\n"
        b"Content-Disposition: attachment; filename=\"screenshot.png\"\r\n"
        b"\r\n"
        b"fake_image_bytes\r\n"
        b"--BOUNDARY\r\n"
        b"Content-Type: application/zip; name=\"archive.zip\"\r\n"
        b"Content-Disposition: attachment; filename=\"archive.zip\"\r\n"
        b"\r\n"
        b"fake_zip_bytes\r\n"
        b"--BOUNDARY--\r\n"
    )
    res = EmailParserService.parse_eml_bytes(multi_eml, filename="multi.eml")

    assert len(res.urls) == 2
    assert "http://link1.org" in res.urls
    assert "https://link2.com/path?a=1&b=2" in res.urls

    assert len(res.attachments) == 2
    filenames = [att.filename for att in res.attachments]
    assert "screenshot.png" in filenames
    assert "archive.zip" in filenames

