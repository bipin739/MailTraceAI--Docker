from typing import List, Optional, Union
from pydantic import BaseModel, Field


class IPIndicator(BaseModel):
    value: str = Field(..., description="IP address string")
    version: int = Field(4, description="IP version (4 or 6)")
    scope: str = Field("public", description="Scope: public, private, loopback, link_local, reserved, unknown")
    source: Optional[str] = Field("unknown", description="Extraction source location")


class DomainIndicator(BaseModel):
    value: str = Field(..., description="Normalized domain name")
    source: Optional[str] = Field("unknown", description="Extraction source location")


class URLIndicator(BaseModel):
    value: str = Field(..., description="Extracted URL string")
    source: Optional[str] = Field("unknown", description="Extraction source location")


class EmailAddressIndicator(BaseModel):
    value: str = Field(..., description="Normalized email address")
    source: Optional[str] = Field("unknown", description="Extraction source location")


class AttachmentIndicator(BaseModel):
    filename: Optional[str] = Field(None, description="Filename of the attachment")
    mime_type: Optional[str] = Field(None, description="MIME content type of the attachment")
    size: Optional[int] = Field(0, description="Attachment file size in bytes")
    sha256: str = Field(..., description="SHA-256 hash of attachment payload")
    md5: Optional[str] = Field(None, description="MD5 hash of attachment payload")
    sha1: Optional[str] = Field(None, description="SHA-1 hash of attachment payload")


class IndicatorsGroup(BaseModel):
    ips: List[IPIndicator] = Field(default_factory=list)
    domains: List[DomainIndicator] = Field(default_factory=list)
    urls: List[URLIndicator] = Field(default_factory=list)
    email_addresses: List[EmailAddressIndicator] = Field(default_factory=list)
    attachments: List[AttachmentIndicator] = Field(default_factory=list)


class AttachmentInfo(BaseModel):
    filename: Optional[str] = Field(None, description="Filename of the attachment")
    mime_type: Optional[str] = Field(None, description="MIME content type of the attachment")
    size: Optional[int] = Field(0, description="Attachment file size in bytes")
    sha256: Optional[str] = Field(None, description="SHA-256 hash of attachment payload")


class BodyInfo(BaseModel):
    plain_text: Optional[str] = Field(None, description="Extracted plain-text body")
    html: Optional[str] = Field(None, description="Extracted HTML body")


class HeaderInfo(BaseModel):
    from_header: Optional[str] = Field(None, alias="from", description="From header")
    to: Optional[Union[str, List[str]]] = Field(None, description="To header")
    cc: Optional[Union[str, List[str]]] = Field(None, description="Cc header")
    subject: Optional[str] = Field(None, description="Subject header")
    date: Optional[str] = Field(None, description="Date header")
    reply_to: Optional[str] = Field(None, description="Reply-To header")
    return_path: Optional[str] = Field(None, description="Return-Path header")
    message_id: Optional[str] = Field(None, description="Message-ID header")
    received: List[str] = Field(default_factory=list, description="List of Received header lines")
    authentication_results: Optional[str] = Field(None, description="Authentication-Results header")

    model_config = {
        "populate_by_name": True
    }


class FileMeta(BaseModel):
    filename: str = Field(..., description="Name of the uploaded .eml file")
    size_bytes: int = Field(..., description="Size of the uploaded file in bytes")


class EmailAnalysisResponse(BaseModel):
    email_sha256: Optional[str] = Field(None, description="SHA-256 hash of raw uploaded email bytes")
    indicators: IndicatorsGroup = Field(default_factory=IndicatorsGroup, description="Structured indicators group")

    # Top-level flat fields for direct accessibility / backwards compatibility
    subject: Optional[str] = Field(None, description="Email subject")
    from_header: Optional[str] = Field(None, alias="from", description="From header")
    to: Optional[Union[str, List[str]]] = Field(None, description="To header")
    cc: Optional[Union[str, List[str]]] = Field(None, description="Cc header")
    date: Optional[str] = Field(None, description="Date header")
    reply_to: Optional[str] = Field(None, description="Reply-To header")
    return_path: Optional[str] = Field(None, description="Return-Path header")
    message_id: Optional[str] = Field(None, description="Message-ID header")
    received: List[str] = Field(default_factory=list, description="List of Received headers in original order")
    authentication_results: Optional[str] = Field(None, description="Authentication-Results header string")

    plain_text_body: Optional[str] = Field(None, description="Plain text body content")
    html_body: Optional[str] = Field(None, description="HTML body content")
    raw_email: Optional[str] = Field(None, description="Full raw email source string")

    urls: List[str] = Field(default_factory=list, description="Extracted URLs")
    ips: List[str] = Field(default_factory=list, description="Extracted IP addresses")
    domains: List[str] = Field(default_factory=list, description="Extracted domain names")
    emails: List[str] = Field(default_factory=list, description="Extracted email addresses")
    attachments: List[AttachmentInfo] = Field(default_factory=list, description="Extracted attachments metadata")

    # Structured nested objects for backwards compatibility
    file_info: Optional[FileMeta] = None
    headers: Optional[HeaderInfo] = None
    body: Optional[BodyInfo] = None

    model_config = {
        "populate_by_name": True
    }


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error message description")
    error_code: str = Field("MALFORMED_EMAIL", description="Error type code")
