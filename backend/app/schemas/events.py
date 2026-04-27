from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class EventType(str, Enum):
    check_in = "check_in"
    fast_registration = "fast_registration"
    stand_tap = "stand_tap"
    brochure_request = "brochure_request"
    conference_scan = "conference_scan"
    exhibitor_scan = "exhibitor_scan"
    quiz_response = "quiz_response"
    passport_progress = "passport_progress"
    exit_survey = "exit_survey"
    post_fair_email_open = "post_fair_email_open"
    post_fair_email_click = "post_fair_email_click"
    followup_cta_to_exhibitor = "followup_cta_to_exhibitor"
    site_page_view = "site_page_view"


class EventCreate(BaseModel):
    fair_id: int
    student_id: int
    event_type: EventType
    event_time: Optional[str] = None
    stand_id: Optional[int] = None
    conference_id: Optional[int] = None
    source_channel: Optional[str] = None
    payload: Optional[Dict[str, Any]] = None


class EventBulkCreate(BaseModel):
    events: List[EventCreate] = Field(default_factory=list)


class EventInsertResponse(BaseModel):
    ok: bool
    inserted_ids: List[int] = Field(default_factory=list)
    inserted_count: int = 0
    recompute: Optional[Dict[str, Any]] = None
    message: str = ""
