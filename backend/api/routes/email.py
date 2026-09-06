from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse

from backend.schemas.email import EmailAnalysisResponse, ErrorResponse
from backend.services.email_parser import EmailParserService, EmailParseException

router = APIRouter(prefix="/api/emails", tags=["Email Analysis"])


@router.post(
    "/analyze",
    response_model=EmailAnalysisResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Malformed or invalid email file"},
        422: {"model": ErrorResponse, "description": "Unprocessable email entity"}
    },
    summary="Upload and analyze an .eml email file",
    description="Parses an uploaded .eml file and returns structured headers, plain-text body, HTML body, extracted URLs, and attachment metadata."
)
async def analyze_email(file: UploadFile = File(...)):
    """
    Accepts an .eml file upload and parses headers, body, URLs, and attachments into structured JSON.
    """
    filename = file.filename or "unknown.eml"

    # Optional file extension validation
    if not (filename.lower().endswith(".eml") or filename.lower().endswith(".msg") or file.content_type in ("message/rfc822", "application/octet-stream", "text/plain")):
        # We can still attempt parsing if user uploaded without extension or standard mime, but warn/reject if invalid
        pass

    try:
        content_bytes = await file.read()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file stream: {str(e)}"
        )

    try:
        analysis_result = EmailParserService.parse_eml_bytes(content_bytes, filename=filename)
        return analysis_result
    except EmailParseException as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": f"Malformed email file: {str(e)}", "error_code": "MALFORMED_EMAIL"}
        )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": f"An error occurred while parsing email: {str(e)}", "error_code": "PARSE_ERROR"}
        )
