from fastapi import APIRouter, HTTPException

from backend.app.schemas.kpis import RecomputeResponse
from backend.app.schemas.leads import LeadScoreResponse
from backend.app.services import query_service
from backend.app.services.recompute_service import run_recompute


router = APIRouter(tags=["scoring"])


@router.get("/leads/{student_id}/score", response_model=LeadScoreResponse)
def get_score(student_id: int) -> dict:
    data = query_service.get_lead_score(student_id)
    if not data:
        raise HTTPException(status_code=404, detail="Lead score not found")
    return data


@router.post("/model/recompute", response_model=RecomputeResponse)
def recompute_model() -> dict:
    result = run_recompute()
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result)
    return result
