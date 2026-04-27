import os
from dataclasses import dataclass
from pathlib import Path
from typing import List

from dotenv import load_dotenv


load_dotenv()


@dataclass
class Settings:
    project_root: Path
    db_path: Path
    recompute_sql_path: Path
    seed_script_path: Path
    cors_allow_origins: List[str]


def _resolve_path(path_value: str, project_root: Path) -> Path:
    candidate = Path(path_value)
    if candidate.is_absolute():
        return candidate
    return (project_root / candidate).resolve()


def get_settings() -> Settings:
    project_root = Path(__file__).resolve().parents[2]

    db_default = "backend/app/db/local.db"
    db_path = _resolve_path(os.getenv("APP_DB_PATH", db_default), project_root)

    recompute_default = "scripts/recompute_scores.sql"
    recompute_sql_path = _resolve_path(os.getenv("APP_RECOMPUTE_SQL_PATH", recompute_default), project_root)

    seed_script_default = "scripts/seed_db.py"
    seed_script_path = _resolve_path(os.getenv("APP_SEED_SCRIPT_PATH", seed_script_default), project_root)

    cors_raw = os.getenv(
        "APP_CORS_ALLOW_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )
    cors_allow_origins = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]

    return Settings(
        project_root=project_root,
        db_path=db_path,
        recompute_sql_path=recompute_sql_path,
        seed_script_path=seed_script_path,
        cors_allow_origins=cors_allow_origins,
    )


settings = get_settings()
