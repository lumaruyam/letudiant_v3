from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from backend.app.schemas.leads import LeadDetailResponse, LeadsListResponse
from backend.app.services import query_service


router = APIRouter(tags=["leads"])


@router.get("/leads", response_model=LeadsListResponse)
def list_leads(
    fair_id: Optional[int] = Query(default=None),
    q: Optional[str] = Query(default=None),
    grade: Optional[str] = Query(default=None),
    subgroup: Optional[str] = Query(default=None),
    min_score: Optional[float] = Query(default=None),
    max_score: Optional[float] = Query(default=None),
    tier: Optional[float] = Query(default=None),
    consent_partner: Optional[int] = Query(default=None, ge=0, le=1),
    limit: int = Query(default=50, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    sort_by: str = Query(default="total_score"),
    sort_order: str = Query(default="desc"),
) -> dict:
    return query_service.get_leads(
        fair_id=fair_id,
        q=q,
        grade=grade,
        subgroup=subgroup,
        min_score=min_score,
        max_score=max_score,
        tier=tier,
        consent_partner=consent_partner,
        limit=limit,
        offset=offset,
        sort_by=sort_by,
        sort_order=sort_order,
    )


@router.get("/leads/{student_id}", response_model=LeadDetailResponse)
def get_lead(student_id: int) -> dict:
    detail = query_service.get_lead_detail(student_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Lead not found")
    return detail
