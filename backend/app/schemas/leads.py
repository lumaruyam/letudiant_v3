from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class LeadListItem(BaseModel):
    student_id: int
    full_name: str
    grade: str
    student_subgroup: str
    intent_score: float
    engagement_score: float
    monetisability_score: float
    total_score: float
    tier_eur: float
    resell_factor: int
    monetisable_value_eur: float
    consent_partner: int
    consent_call: int
    top_drivers: List[str] = Field(default_factory=list)


class LeadsListResponse(BaseModel):
    data: List[LeadListItem] = Field(default_factory=list)
    total: int = 0
    limit: int = 50
    offset: int = 0


class LeadDetailResponse(BaseModel):
    student_id: int
    fair_id: Optional[int] = None
    profile: Dict[str, Any] = Field(default_factory=dict)
    consents: Dict[str, Any] = Field(default_factory=dict)
    derived: Dict[str, Any] = Field(default_factory=dict)
    score: Dict[str, Any] = Field(default_factory=dict)
    monetization: Dict[str, Any] = Field(default_factory=dict)
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    timeline_summary: Dict[str, int] = Field(default_factory=dict)


class LeadScoreResponse(BaseModel):
    student_id: int
    fair_id: Optional[int] = None
    intent_score: float = 0.0
    engagement_score: float = 0.0
    monetisability_score: float = 0.0
    richness_score: float = 0.0
    total_score: float = 0.0
    prequalified: int = 0
    tier_eur: float = 0.0
    resell_factor: int = 1
    monetisable_value_eur: float = 0.0
