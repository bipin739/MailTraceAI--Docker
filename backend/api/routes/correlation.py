from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, Path
from sqlalchemy.orm import Session

from backend.db.session import get_db
from backend.services.campaign_correlator import CampaignCorrelator
from backend.schemas.correlation import (
    CampaignCorrelationResponse,
    DirectCompareRequest,
    DirectCompareResponse
)

router = APIRouter(tags=["Campaign Correlation"])
correlator = CampaignCorrelator()


@router.post(
    "/api/correlation/email",
    response_model=CampaignCorrelationResponse,
    summary="Correlate analyzed email against existing cases",
    description=(
        "Compares forensic indicators of an analyzed email against all investigation cases "
        "to identify shared infrastructure and potential campaign overlap."
    )
)
def correlate_email_endpoint(
    email_data: Dict[str, Any],
    min_score: float = Query(0.15, ge=0.0, le=1.0, description="Minimum correlation score threshold"),
    limit: int = Query(10, ge=1, le=50, description="Max related cases to return"),
    db: Session = Depends(get_db)
):
    return correlator.correlate_email_against_cases(
        db=db,
        email_data=email_data,
        min_score=min_score,
        limit=limit
    )


@router.get(
    "/api/cases/{case_id}/correlation",
    response_model=CampaignCorrelationResponse,
    summary="Correlate case against all other investigations",
    description=(
        "Identifies related cases exhibiting shared infrastructure (IPs, domains, attachments, "
        "reply-to, nameservers, ASNs) or behavioral similarities."
    )
)
def correlate_case_endpoint(
    case_id: str = Path(..., description="Case ID or Case Number"),
    min_score: float = Query(0.15, ge=0.0, le=1.0, description="Minimum correlation score threshold"),
    limit: int = Query(10, ge=1, le=50, description="Max related cases to return"),
    db: Session = Depends(get_db)
):
    return correlator.correlate_case_against_cases(
        db=db,
        target_case_id=case_id,
        min_score=min_score,
        limit=limit
    )


@router.post(
    "/api/correlation/compare",
    response_model=DirectCompareResponse,
    summary="Direct pairwise comparison between two entities",
    description="Calculates explainable correlation score and shared indicators between two arbitrary email/indicator profiles."
)
def direct_compare_endpoint(
    request: DirectCompareRequest
):
    return correlator.direct_compare(
        entity_a=request.entity_a,
        entity_b=request.entity_b
    )
