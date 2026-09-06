import email
from email import policy
from email.header import decode_header
from typing import List, Dict, Any, Optional

from backend.schemas.email import (
    EmailAnalysisResponse,
    HeaderInfo,
    BodyInfo,
    AttachmentInfo,
    FileMeta,
    IndicatorsGroup
)
from backend.services.ioc_extractor import IOCExtractorService


class EmailParseException(Exception):
    """Raised when an email file is malformed, corrupted, or invalid."""
    pass


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

    @classmethod
    def parse_eml_bytes(cls, content_bytes: bytes, filename: str = "uploaded.eml") -> EmailAnalysisResponse:
        """
        Parses raw bytes of an .eml file into structured JSON data.

        Raises:
            EmailParseException: if the byte stream is empty or malformed.
        """
        if not content_bytes or len(content_bytes.strip()) == 0:
            raise EmailParseException("Uploaded email file is empty.")

        # 1. Calculate evidence SHA-256 hash strictly from original bytes
        email_sha256 = IOCExtractorService.calculate_sha256(content_bytes)
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

        headers_dict = {
            "from": from_header,
            "to": to_header,
            "cc": cc_header,
            "subject": subject,
            "date": date,
            "reply_to": reply_to,
            "return_path": return_path,
            "message_id": message_id,
            "received": received_headers,
            "authentication_results": auth_results_str
        }

        plain_text_parts: List[str] = []
        html_parts: List[str] = []
        attachments_raw: List[Dict[str, Any]] = []

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
                        payload = part.get_payload(decode=True) or b""
                    except Exception:
                        payload = b""

                    attachments_raw.append({
                        "filename": fname,
                        "mime_type": content_type or "application/octet-stream",
                        "bytes": payload
                    })
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

        # 2. Extract IOCs using IOCExtractorService
        url_indicators = IOCExtractorService.extract_urls(plain_text_str, html_str, headers_dict)
        email_indicators = IOCExtractorService.extract_email_addresses(headers_dict, plain_text_str, html_str)

        text_sources = [
            (raw_email_str, "raw_email_source"),
            (plain_text_str or "", "plain_text_body"),
            (html_str or "", "html_body"),
        ]
        for idx, r in enumerate(received_headers):
            text_sources.append((r, f"received_header_{idx+1}"))

        ip_indicators = IOCExtractorService.extract_ips(text_sources)
        domain_indicators = IOCExtractorService.extract_domains(url_indicators, email_indicators, text_sources)
        attachment_indicators = IOCExtractorService.extract_attachment_indicators(attachments_raw)

        indicators_group = IndicatorsGroup(
            ips=ip_indicators,
            domains=domain_indicators,
            urls=url_indicators,
            email_addresses=email_indicators,
            attachments=attachment_indicators
        )

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

        # Backwards compatible attachment info models
        attachments_info = [
            AttachmentInfo(
                filename=att.filename,
                mime_type=att.mime_type,
                size=att.size,
                sha256=att.sha256
            )
            for att in attachment_indicators
        ]

        return EmailAnalysisResponse(
            email_sha256=email_sha256,
            indicators=indicators_group,
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
            urls=[u.value for u in url_indicators],
            ips=[i.value for i in ip_indicators],
            domains=[d.value for d in domain_indicators],
            emails=[e.value for e in email_indicators],
            attachments=attachments_info,
            file_info=file_meta,
            headers=headers_obj,
            body=body_obj
        )
