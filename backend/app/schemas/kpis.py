from typing import Any, Dict, List

from pydantic import BaseModel, Field


class TierDistributionItem(BaseModel):
    tier_eur: float
    leads_count: int
    value_eur: float


class FairKpisResponse(BaseModel):
    fair_id: int
    total_leads: int = 0
    optin_partner_pct: float = 0.0
    optin_call_pct: float = 0.0
    avg_intent_score: float = 0.0
    avg_engagement_score: float = 0.0
    avg_monetisability_score: float = 0.0
    avg_total_score: float = 0.0
    tier_distribution: List[TierDistributionItem] = Field(default_factory=list)
    total_monetisable_value_eur: float = 0.0


class StandKpiItem(BaseModel):
    fair_id: int
    stand_id: int
    stand_code: str
    exhibitor_name: str
    stand_category: str
    stand_taps: int = 0
    brochure_requests: int = 0
    exhibitor_scans: int = 0
    high_intent_unique_students: int = 0


class ConferenceKpiItem(BaseModel):
    fair_id: int
    conference_id: int
    conference_code: str
    conference_title: str
    topic: str
    speaker_name: str = ""
    conference_scans: int = 0
    unique_attendees: int = 0


class DbStatsResponse(BaseModel):
    tables: Dict[str, int] = Field(default_factory=dict)
    total_tables: int = 0
    non_empty_tables: int = 0


class RecomputeResponse(BaseModel):
    ok: bool
    message: str
    duration_ms: float
    row_impacts: Dict[str, Any] = Field(default_factory=dict)
