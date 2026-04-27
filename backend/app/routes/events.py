import json
import sqlite3

from fastapi import APIRouter, HTTPException, Query

from backend.app.schemas.events import EventBulkCreate, EventCreate, EventInsertResponse
from backend.app.services import query_service
from backend.app.services.recompute_service import run_recompute


router = APIRouter(tags=["events"])


@router.post("/events", response_model=EventInsertResponse)
def create_event(payload: EventCreate, recompute: bool = Query(default=False)) -> dict:
    try:
        inserted_id = query_service.insert_event(
            {
                "fair_id": payload.fair_id,
                "student_id": payload.student_id,
                "stand_id": payload.stand_id,
                "conference_id": payload.conference_id,
                "event_type": payload.event_type.value,
                "event_time": payload.event_time,
                "source_channel": payload.source_channel,
                "payload_json": json.dumps(payload.payload) if payload.payload is not None else None,
            }
        )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid event payload: {exc}") from exc
    except sqlite3.OperationalError as exc:
        raise HTTPException(status_code=500, detail=f"Events table unavailable: {exc}") from exc

    recompute_result = run_recompute() if recompute else None

    return {
        "ok": True,
        "inserted_ids": [inserted_id],
        "inserted_count": 1,
        "recompute": recompute_result,
        "message": "Event inserted",
    }


@router.post("/events/bulk", response_model=EventInsertResponse)
def create_events_bulk(payload: EventBulkCreate, recompute: bool = Query(default=False)) -> dict:
    inserted_ids = []
    try:
        for event in payload.events:
            inserted_id = query_service.insert_event(
                {
                    "fair_id": event.fair_id,
                    "student_id": event.student_id,
                    "stand_id": event.stand_id,
                    "conference_id": event.conference_id,
                    "event_type": event.event_type.value,
                    "event_time": event.event_time,
                    "source_channel": event.source_channel,
                    "payload_json": json.dumps(event.payload) if event.payload is not None else None,
                }
            )
            inserted_ids.append(inserted_id)
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=400, detail=f"Bulk insert failed: {exc}") from exc
    except sqlite3.OperationalError as exc:
        raise HTTPException(status_code=500, detail=f"Events table unavailable: {exc}") from exc

    recompute_result = run_recompute() if recompute else None

    return {
        "ok": True,
        "inserted_ids": inserted_ids,
        "inserted_count": len(inserted_ids),
        "recompute": recompute_result,
        "message": "Bulk events inserted",
    }
