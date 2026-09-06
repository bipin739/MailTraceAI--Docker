import email
from email import policy
from email.header import decode_header
import re
from typing import List, Dict, Any, Optional, Tuple, Set
from html.parser import HTMLParser
from urllib.parse import urlparse

from backend.schemas.email import (
    EmailAnalysisResponse,
    HeaderInfo,
    BodyInfo,
    AttachmentInfo,
    FileMeta
)


class EmailParseException(Exception):
    """Raised when an email file is malformed, corrupted, or invalid."""
    pass


class HTMLLinkExtractor(HTMLParser):
    """Simple, safe HTML parser to extract URLs from href and src attributes without executing code."""

    def __init__(self):
        super().__init__()
        self.urls: List[str] = []

    def handle_starttag(self, tag: str, attrs: List[Tuple[str, Optional[str]]]):
        for attr, value in attrs:
            if attr.lower() in ('href', 'src', 'action', 'data-url') and value:
                clean_val = value.strip()
                if clean_val.startswith(('http://', 'https://', 'ftp://', 'ftps://')):
                    self.urls.append(clean_val)


class EmailParserService:
    """Service to parse RFC-822 / .eml files safely and extract structured email details."""

    @staticmethod
    def _decode_header_value(header_val: Optional[Any]) -> Optional[str]:
        """Safely decode email header strings including encoded-words (=?UTF-8?...?)."""
        if header_val is None:
            return None

        header_str = str(header_val)
        if not header_str:
            return None

        try:
            decoded_parts = decode_header(header_str)
            result = []
            for part, encoding in decoded_parts:
                if isinstance(part, bytes):
                    enc = encoding or 'utf-8'
                    try:
                        result.append(part.decode(enc, errors='replace'))
                    except (LookupError, UnicodeDecodeError):
                        result.append(part.decode('utf-8', errors='replace'))
                else:
                    result.append(str(part))
            return "".join(result).strip()
        except Exception:
            return header_str.strip()

    @staticmethod
    def _extract_urls(plain_text: Optional[str], html_body: Optional[str]) -> List[str]:
        """Extract unique URLs from both plain text and HTML body content."""
        extracted_urls: List[str] = []

        url_pattern = re.compile(
            r'https?://[^\s<>"\'\)\(\]\[\}\s,]+',
            re.IGNORECASE
        )

        def add_url(u: str):
            cleaned = u.rstrip('.,;:!?"\')]>')
            if cleaned and cleaned not in extracted_urls:
                extracted_urls.append(cleaned)

        if plain_text:
            for match in url_pattern.findall(plain_text):
                add_url(match)

        if html_body:
            try:
                parser = HTMLLinkExtractor()
                parser.feed(html_body)
                for u in parser.urls:
                    add_url(u)
            except Exception:
                pass

            for match in url_pattern.findall(html_body):
                add_url(match)

        return extracted_urls

    @staticmethod
    def _extract_ips(text: str) -> List[str]:
        """Extract valid IPv4 addresses from text."""
        ip_pattern = re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b')
        found_ips: List[str] = []
        for match in ip_pattern.findall(text):
            octets = match.split('.')
            if all(0 <= int(o) <= 255 for o in octets):
                if match not in found_ips:
                    found_ips.append(match)
        return found_ips

    @staticmethod
    def _extract_emails(text: str) -> List[str]:
        """Extract unique email addresses from text."""
        email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b')
        found_emails: List[str] = []
        for match in email_pattern.findall(text):
            clean_email = match.lower()
            if clean_email not in found_emails:
                found_emails.append(clean_email)
        return found_emails

    @staticmethod
    def _extract_domains(urls: List[str], emails: List[str], headers_text: str) -> List[str]:
        """Extract unique domain names from URLs, emails, and header texts."""
        domains: List[str] = []

        def add_domain(d: str):
            clean_d = d.lower().strip('.')
            # basic domain format check
            if clean_d and '.' in clean_d and not re.match(r'^\d+\.\d+\.\d+\.\d+$', clean_d):
                if clean_d not in domains:
                    domains.append(clean_d)

        for u in urls:
            try:
                parsed = urlparse(u)
                if parsed.netloc:
                    host = parsed.netloc.split(':')[0]
                    add_domain(host)
            except Exception:
                pass

        for e in emails:
            if '@' in e:
                domain_part = e.split('@')[-1]
                add_domain(domain_part)

        return domains

    @classmethod
    def parse_eml_bytes(cls, content_bytes: bytes, filename: str = "uploaded.eml") -> EmailAnalysisResponse:
        """
        Parses raw bytes of an .eml file into structured JSON data.

        Raises:
            EmailParseException: if the byte stream is empty or malformed.
        """
        if not content_bytes or len(content_bytes.strip()) == 0:
            raise EmailParseException("Uploaded email file is empty.")

        raw_email_str = content_bytes.decode("utf-8", errors="replace")

        try:
            msg = email.message_from_bytes(content_bytes, policy=policy.default)
        except Exception as e:
            raise EmailParseException(f"Failed to parse email structure: {str(e)}")

        if msg is None:
            raise EmailParseException("Unable to parse email file as RFC-822 message.")

        # Extract headers safely
        try:
            from_header = cls._decode_header_value(msg.get("From"))
            to_header = cls._decode_header_value(msg.get("To"))
            cc_header = cls._decode_header_value(msg.get("Cc"))
            subject = cls._decode_header_value(msg.get("Subject"))
            date = cls._decode_header_value(msg.get("Date"))
            reply_to = cls._decode_header_value(msg.get("Reply-To"))
            return_path = cls._decode_header_value(msg.get("Return-Path"))
            message_id = cls._decode_header_value(msg.get("Message-ID"))

            raw_received = msg.get_all("Received", [])
            received_headers = [
                cls._decode_header_value(r) for r in raw_received if r is not None
            ]
            received_headers = [r for r in received_headers if r]

            raw_auth_results = msg.get_all("Authentication-Results", [])
            auth_results_list = [
                cls._decode_header_value(a) for a in raw_auth_results if a is not None
            ]
            auth_results_str = "; ".join([a for a in auth_results_list if a]) or None

        except Exception as e:
            raise EmailParseException(f"Malformed headers in email: {str(e)}")

        plain_text_parts: List[str] = []
        html_parts: List[str] = []
        attachments: List[AttachmentInfo] = []

        # Iterate over parts
        try:
            if msg.is_multipart():
                parts = msg.walk()
            else:
                parts = [msg]

            attachment_counter = 1
            for part in parts:
                content_type = part.get_content_type()
                content_disposition = part.get_content_disposition()
                part_filename = part.get_filename()

                is_attachment = (
                    content_disposition == "attachment"
                    or (part_filename is not None and content_disposition != "inline")
                    or (content_type not in ("multipart/mixed", "multipart/alternative", "multipart/related", "text/plain", "text/html") and part_filename is not None)
                )

                if is_attachment:
                    fname = cls._decode_header_value(part_filename) or f"attachment_{attachment_counter}"
                    attachment_counter += 1

                    try:
                        payload = part.get_payload(decode=True)
                        size = len(payload) if payload else 0
                    except Exception:
                        size = 0

                    attachments.append(
                        AttachmentInfo(
                            filename=fname,
                            mime_type=content_type or "application/octet-stream",
                            size=size
                        )
                    )
                else:
                    if content_type == "text/plain":
                        try:
                            text_content = part.get_content()
                            if isinstance(text_content, str):
                                plain_text_parts.append(text_content)
                        except Exception:
                            payload = part.get_payload(decode=True)
                            if payload:
                                plain_text_parts.append(payload.decode("utf-8", errors="replace"))

                    elif content_type == "text/html":
                        try:
                            html_content = part.get_content()
                            if isinstance(html_content, str):
                                html_parts.append(html_content)
                        except Exception:
                            payload = part.get_payload(decode=True)
                            if payload:
                                html_parts.append(payload.decode("utf-8", errors="replace"))

        except Exception as e:
            raise EmailParseException(f"Error parsing email body/attachments: {str(e)}")

        plain_text_str = "\n".join(plain_text_parts) if plain_text_parts else None
        html_str = "\n".join(html_parts) if html_parts else None

        # Extract indicators
        full_search_text = f"{raw_email_str}\n{plain_text_str or ''}\n{html_str or ''}"
        urls = cls._extract_urls(plain_text_str, html_str)
        ips = cls._extract_ips(full_search_text)
        emails_list = cls._extract_emails(full_search_text)
        domains = cls._extract_domains(urls, emails_list, full_search_text)

        headers_obj = HeaderInfo(
            from_header=from_header,
            to=to_header,
            cc=cc_header,
            subject=subject,
            date=date,
            reply_to=reply_to,
            return_path=return_path,
            message_id=message_id,
            received=received_headers,
            authentication_results=auth_results_str
        )

        body_obj = BodyInfo(
            plain_text=plain_text_str,
            html=html_str
        )

        file_meta = FileMeta(
            filename=filename,
            size_bytes=len(content_bytes)
        )

        return EmailAnalysisResponse(
            subject=subject,
            from_header=from_header,
            to=to_header,
            cc=cc_header,
            date=date,
            reply_to=reply_to,
            return_path=return_path,
            message_id=message_id,
            received=received_headers,
            authentication_results=auth_results_str,
            plain_text_body=plain_text_str,
            html_body=html_str,
            raw_email=raw_email_str,
            urls=urls,
            ips=ips,
            domains=domains,
            emails=emails_list,
            attachments=attachments,
            file_info=file_meta,
            headers=headers_obj,
            body=body_obj
        )
