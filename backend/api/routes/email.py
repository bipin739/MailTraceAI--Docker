import asyncio
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse

from backend.schemas.email import EmailAnalysisResponse, ErrorResponse
from backend.schemas.ip_intelligence import IPIntelligence
from backend.schemas.domain_intelligence import DomainIntelligence
from backend.services.email_parser import EmailParserService, EmailParseException
from backend.services.ip_intelligence_service import global_ip_service
from backend.services.domain_intelligence_service import DomainIntelligenceService

global_domain_service = DomainIntelligenceService()

router = APIRouter(prefix="/api/emails", tags=["Email Analysis"])


@router.get(
    "/lookup/{ip:path}",
    response_model=IPIntelligence,
    summary="Look up contextual IP intelligence for a given IP address",
    description="Returns geolocation, ASN, ISP, organization, and hosting/proxy indicators for a public IP, or private scope metadata."
)
async def lookup_ip_intelligence(ip: str):
    """
    Look up IP intelligence for a single IP address.
    """
    clean_ip = ip.strip()
    return await global_ip_service.get_ip_intelligence(clean_ip)


@router.get(
    "/lookup-domain/{domain:path}",
    response_model=DomainIntelligence,
    summary="Look up contextual DNS and registration intelligence for a domain",
    description="Returns A, AAAA, MX, NS, TXT DNS records, RDAP registration metadata, domain age, and new domain flags."
)
async def lookup_domain_intelligence(domain: str):
    """
    Look up domain intelligence for a single domain name.
    """
    clean_domain = domain.strip().lower().rstrip(".")
    return await global_domain_service.lookup_domain(clean_domain)


@router.post(
    "/analyze",
    response_model=EmailAnalysisResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Malformed or invalid email file"},
        422: {"model": ErrorResponse, "description": "Unprocessable email entity"}
    },
    summary="Upload and analyze an .eml email file",
    description="Parses an uploaded .eml file and returns structured headers, plain-text body, HTML body, extracted URLs, attachment metadata, authentication, relay path, and IP intelligence."
)
async def analyze_email(file: UploadFile = File(...)):
    """
    Accepts an .eml file upload and parses headers, body, URLs, attachments, authentication, relay hops, and IP intelligence into structured JSON.
    """
    filename = file.filename or "unknown.eml"

    # Optional file extension validation
    if not (filename.lower().endswith(".eml") or filename.lower().endswith(".msg") or file.content_type in ("message/rfc822", "application/octet-stream", "text/plain")):
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

        # Enrich IP intelligence asynchronously
        ip_list = list(set(analysis_result.ips))
        if analysis_result.relay_analysis and analysis_result.relay_analysis.earliest_observable_node and analysis_result.relay_analysis.earliest_observable_node.earliest_observable_node_ip if hasattr(analysis_result.relay_analysis.earliest_observable_node, 'earliest_observable_node_ip') else None:
            pass
        if analysis_result.relay_analysis and analysis_result.relay_analysis.earliest_observable_node and analysis_result.relay_analysis.earliest_observable_node.earliest_observable_ip:
            ip_list.append(analysis_result.relay_analysis.earliest_observable_node.earliest_observable_ip)

        # Enrich Domain intelligence asynchronously
        domain_list = list(set(analysis_result.domains))
        if analysis_result.authentication and analysis_result.authentication.alignment:
            align = analysis_result.authentication.alignment
            if align.from_domain:
                domain_list.append(align.from_domain)
            if align.reply_to_domain:
                domain_list.append(align.reply_to_domain)
            if align.return_path_domain:
                domain_list.append(align.return_path_domain)

        # Run IP and Domain enrichment concurrently
        ip_intel_dict, domain_intel_dict = await asyncio.gather(
            global_ip_service.get_batch_ip_intelligence(ip_list),
            global_domain_service.enrich_domains_batch(domain_list)
        )
        analysis_result.ip_intelligence = ip_intel_dict
        analysis_result.domain_intelligence = domain_intel_dict

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
