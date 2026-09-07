from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class SharedIndicator(BaseModel):
    """Specific indicator observed in common between two or more forensic entities."""
    type: str = Field(..., description="Indicator type (ip, domain, reply_to, sender, attachment_hash, url_domain, nameserver, registrar, asn, brand, subject)")
    value: str = Field(..., description="The shared indicator value (e.g., 185.220.101.5 or evil-billing.com)")
    details: Optional[str] = Field(None, description="Context or explanation of the indicator")


class MatchedSignalDetail(BaseModel):
    """Detailed breakdown of a matching correlation signal and its contribution."""
    signal_name: str = Field(..., description="Name of the signal (e.g., same_ip, same_attachment_hash)")
    weight: float = Field(..., description="Base weight configured for this signal")
    matched_values: List[str] = Field(default_factory=list, description="Specific matched values for this signal")
    contribution: float = Field(..., description="Weighted contribution towards the overall correlation score")


class RelatedCaseItem(BaseModel):
    """A case identified as having shared infrastructure or behavioral overlap."""
    case_id: str = Field(..., description="Target case unique database identifier")
    case_number: str = Field(..., description="Readable case number (e.g., CASE-2026-000031)")
    title: str = Field(..., description="Title of the related case")
    severity: str = Field(..., description="Severity level of the related case")
    status: str = Field(..., description="Current status of the related case")
    correlation_score: float = Field(..., description="Explainable correlation score between 0.0 and 1.0")
    relationship_label: str = Field(..., description="Defensible relationship label (e.g., Likely campaign relationship)")
    shared_evidence_summary: str = Field(..., description="Concise human-readable evidence summary (e.g., '2 IPs, 1 domain, 1 Reply-To address')")
    shared_indicators: List[SharedIndicator] = Field(default_factory=list, description="List of all shared indicators")
    matching_signals: Dict[str, MatchedSignalDetail] = Field(default_factory=dict, description="Breakdown of matched signals and scoring weights")

    model_config = ConfigDict(from_attributes=True)


class CampaignCorrelationResponse(BaseModel):
    """Correlation analysis output comparing an email or case against existing investigations."""
    related_cases: List[RelatedCaseItem] = Field(default_factory=list, description="Cases exhibiting shared infrastructure or behavioral overlap")
    correlation_score: float = Field(0.0, description="Highest correlation score among related cases, or pairwise comparison score")
    relationship_label: str = Field("Inconclusive / No significant relationship", description="Highest relationship confidence label")
    shared_indicators: List[SharedIndicator] = Field(default_factory=list, description="Aggregated list of all shared indicators across related investigations")


class DirectCompareRequest(BaseModel):
    """Payload to compare two arbitrary email analyses or indicator collections."""
    entity_a: Dict[str, Any] = Field(..., description="First email analysis or indicator dictionary")
    entity_b: Dict[str, Any] = Field(..., description="Second email analysis or indicator dictionary")


class DirectCompareResponse(BaseModel):
    """Comparison result between two specific entities."""
    correlation_score: float = Field(..., description="Pairwise explainable similarity score (0.0 to 1.0)")
    relationship_label: str = Field(..., description="Non-attribution relationship label")
    shared_evidence_summary: str = Field(..., description="Formatted summary string")
    shared_indicators: List[SharedIndicator] = Field(default_factory=list, description="Shared indicators")
    matching_signals: Dict[str, MatchedSignalDetail] = Field(default_factory=dict, description="Breakdown of signal weights and matches")
