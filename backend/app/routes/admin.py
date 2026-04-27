import subprocess
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from backend.app.config import settings
from backend.app.schemas.kpis import DbStatsResponse
from backend.app.services import query_service


router = APIRouter(prefix="/admin", tags=["admin"])


class ResetAndSeedRequest(BaseModel):
    csv_path: str
    seed: int = 42
    reset: bool = True


class ResetAndSeedResponse(BaseModel):
    ok: bool
    message: str
    command: list[str] = Field(default_factory=list)
    stdout: str = ""
    stderr: str = ""


@router.post("/reset-and-seed", response_model=ResetAndSeedResponse)
def reset_and_seed(payload: ResetAndSeedRequest) -> dict:
    csv_path = Path(payload.csv_path).expanduser().resolve()
    if not csv_path.exists():
        raise HTTPException(
            status_code=400,
            detail=(
                f"CSV file not found at {csv_path}. "
                "Provide a valid path with the required columns."
            ),
        )

    if not settings.seed_script_path.exists():
        raise HTTPException(status_code=500, detail=f"Seed script not found at {settings.seed_script_path}")

    command = [
        sys.executable,
        str(settings.seed_script_path),
        "--db",
        str(settings.db_path),
        "--csv",
        str(csv_path),
        "--seed",
        str(payload.seed),
    ]
    if payload.reset:
        command.append("--reset")

    result = subprocess.run(
        command,
        cwd=str(settings.project_root),
        capture_output=True,
        text=True,
        check=False,
    )

    if result.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Seed command failed",
                "command": command,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
            },
        )

    return {
        "ok": True,
        "message": "Database reset and seed completed",
        "command": command,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


@router.get("/db-stats", response_model=DbStatsResponse)
def db_stats() -> dict:
    return query_service.get_db_stats()
