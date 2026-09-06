from typing import List, Optional, Union
from pydantic import BaseModel, Field


class AttachmentInfo(BaseModel):
    filename: Optional[str] = Field(None, description="Filename of the attachment")
    mime_type: Optional[str] = Field(None, description="MIME content type of the attachment")
    size: Optional[int] = Field(0, description="Attachment file size in bytes")


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
    # Top-level flat fields for direct accessibility
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
