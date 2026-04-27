from fastapi import APIRouter, Query
from typing import Optional

from backend.app.schemas.kpis import ConferenceKpiItem, FairKpisResponse, StandKpiItem
from backend.app.services import query_service


router = APIRouter(prefix="/kpis", tags=["kpis"])


@router.get("/fair/{fair_id}", response_model=FairKpisResponse)
def fair_kpis(fair_id: int) -> dict:
    return query_service.get_kpis_fair(fair_id)


@router.get("/stands", response_model=list[StandKpiItem])
def stands_kpis(
    fair_id: Optional[int] = Query(default=None),
    period: Optional[str] = Query(default="all"),
    sector: Optional[str] = Query(default=None),
    hall: Optional[str] = Query(default=None),
) -> list[dict]:
    return query_service.get_kpis_stands(fair_id=fair_id, period=period, sector=sector, hall=hall)


@router.get("/conferences", response_model=list[ConferenceKpiItem])
def conferences_kpis(
    fair_id: Optional[int] = Query(default=None),
    period: Optional[str] = Query(default="all"),
    sector: Optional[str] = Query(default=None),
    hall: Optional[str] = Query(default=None),
) -> list[dict]:
    return query_service.get_kpis_conferences(fair_id=fair_id, period=period, sector=sector, hall=hall)
