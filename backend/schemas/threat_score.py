from typing import List, Optional
from pydantic import BaseModel, Field


class ThreatScoreContribution(BaseModel):
    signal: str = Field(..., description="Machine identifier for the evaluated signal")
    label: str = Field(..., description="Human-readable title describing the signal")
    points: int = Field(..., description="Risk score points contributed by this signal")
    evidence: str = Field(..., description="Specific evidence string or snippet supporting this contribution")


class PositiveEvidence(BaseModel):
    signal: str = Field(..., description="Machine identifier for the positive or neutral signal")
    label: str = Field(..., description="Human-readable description of the verified security control")
    evidence: str = Field(..., description="Supporting evidence details")


class ThreatScoreResult(BaseModel):
    score: int = Field(..., description="Deterministic global threat score between 0 and 100")
    severity: str = Field(..., description="Severity classification: low, suspicious, high, or critical")
    reasons: List[ThreatScoreContribution] = Field(default_factory=list, description="Detailed list of all positive risk contributions")
    positive_evidence: List[PositiveEvidence] = Field(default_factory=list, description="Observed positive or mitigating forensic signals")
    summary: str = Field("", description="Executive forensic summary explaining the threat score")
