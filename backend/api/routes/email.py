import asyncio
from typing import Optional
from fastapi import APIRouter, File, UploadFile, HTTPException, status
from fastapi.responses import JSONResponse

from backend.schemas.email import EmailAnalysisResponse, ErrorResponse, MLAssessmentResult, MLClassifyRequest
from backend.schemas.ip_intelligence import IPIntelligence
from backend.schemas.domain_intelligence import DomainIntelligence
from backend.schemas.lookalike import LookalikeDetectionResult
from backend.schemas.url_analysis import URLAnalysisResult, URLAnalysisRequest
from backend.schemas.threat_score import ThreatScoreResult
from backend.services.email_parser import EmailParserService, EmailParseException
from backend.services.ip_intelligence_service import global_ip_service
from backend.services.domain_intelligence_service import DomainIntelligenceService
from backend.services.lookalike_detector import LookalikeDetectorService
from backend.services.url_analyzer import URLAnalyzerService
from backend.services.threat_scorer import ThreatScorerService
from backend.app.ml.classifier import global_phishing_classifier

global_lookalike_detector = LookalikeDetectorService()
global_domain_service = DomainIntelligenceService(lookalike_detector=global_lookalike_detector)
global_url_analyzer = URLAnalyzerService(lookalike_detector=global_lookalike_detector)
global_threat_scorer = ThreatScorerService()

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


@router.get(
    "/detect-lookalike/{domain:path}",
    response_model=Optional[LookalikeDetectionResult],
    summary="Detect suspicious lookalike domain and brand impersonation",
    description="Evaluates domain against known brands using Levenshtein distance, character substitutions, affixes, and subdomain abuse."
)
async def detect_lookalike_domain(domain: str):
    """
    Detects potential brand impersonation and lookalike techniques for a given domain name.
    """
    clean_domain = domain.strip().lower().rstrip(".")
    return global_lookalike_detector.detect_lookalike(clean_domain)


@router.post(
    "/analyze-url",
    response_model=URLAnalysisResult,
    summary="Statically analyze a single URL for forensic features and suspicion indicators",
    description="Extracts URL features, identifies brand lookalikes, detects link mismatches, and computes a static suspicion score without visiting the URL."
)
async def analyze_url_endpoint(request: URLAnalysisRequest):
    """
    Statically analyzes a single URL without fetching or visiting the remote host.
    """
    return global_url_analyzer.analyze_url(
        request.url,
        visible_text=request.visible_text
    )


@router.post(
    "/calculate-threat-score",
    response_model=ThreatScoreResult,
    summary="Calculate global deterministic threat score from email analysis",
    description="Combines authentication, lookalikes, URLs, domain age, intent keywords, attachments, and bounded ML assessment into an explainable threat score."
)
async def calculate_threat_score_endpoint(analysis: EmailAnalysisResponse):
    """
    Calculates global threat score for a given EmailAnalysisResponse object.
    """
    return global_threat_scorer.calculate_score(analysis)


@router.post(
    "/ml-classify",
    response_model=MLAssessmentResult,
    summary="Classify email subject and body text using NLP ML model",
    description="Applies text normalization, TF-IDF vectorization, and Logistic Regression to evaluate phishing probability."
)
async def classify_email_text(request: MLClassifyRequest):
    """
    Direct prediction endpoint for NLP-based phishing classification on subject and body text.
    """
    res = global_phishing_classifier.predict(subject=request.subject, body=request.body)
    return res


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
        analysis_result.lookalike_domains = global_lookalike_detector.detect_lookalikes_batch(domain_list)

        # Section 11: NLP-Based Phishing Classification (Complements deterministic scoring)
        try:
            ml_pred = global_phishing_classifier.predict(
                subject=analysis_result.subject,
                body=analysis_result.plain_text_body
            )
            analysis_result.ml_assessment = MLAssessmentResult(**ml_pred)
            analysis_result.ml_phishing_probability = ml_pred.get("probability") if ml_pred.get("available") else None
        except Exception:
            # Failure mode: If ML model fails, continue forensic analysis. The entire email pipeline must not fail.
            analysis_result.ml_assessment = None
            analysis_result.ml_phishing_probability = None

        analysis_result.threat_score = global_threat_scorer.calculate_score(analysis_result)

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
