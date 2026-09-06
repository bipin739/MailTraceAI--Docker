from typing import List, Optional, Union
from pydantic import BaseModel, Field


class AttachmentInfo(BaseModel):
    filename: str = Field(..., description="Filename of the attachment")
    mime_type: str = Field(..., description="MIME content type of the attachment")
    size: int = Field(..., description="Attachment file size in bytes")


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
    authentication_results: List[str] = Field(default_factory=list, description="List of Authentication-Results header lines")

    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "from": "John Doe <john@example.com>",
                "to": "jane@example.com",
                "cc": None,
                "subject": "Urgent Security Notification",
                "date": "Mon, 07 Sep 2026 00:00:00 +0000",
                "reply_to": "attacker@phish.com",
                "return_path": "<bounce@phish.com>",
                "message_id": "<12345@domain.com>",
                "received": ["from mail.example.com (mail.example.com [192.0.2.1]) by mx.target.com"],
                "authentication_results": ["spf=pass (google.com: domain of john@example.com designates 192.0.2.1 as permitted sender)"]
            }
        }
    }


class FileMeta(BaseModel):
    filename: str = Field(..., description="Name of the uploaded .eml file")
    size_bytes: int = Field(..., description="Size of the uploaded file in bytes")


class EmailAnalysisResponse(BaseModel):
    file_info: FileMeta
    headers: HeaderInfo
    body: BodyInfo
    urls: List[str] = Field(default_factory=list, description="Extracted unique URLs from plain-text and HTML body")
    attachments: List[AttachmentInfo] = Field(default_factory=list, description="Extracted attachments metadata")


class ErrorResponse(BaseModel):
    detail: str = Field(..., description="Error message description")
    error_code: str = Field("MALFORMED_EMAIL", description="Error type code")
