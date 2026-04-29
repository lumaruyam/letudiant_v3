import os
import sqlite3
import subprocess
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.db.sqlite import get_db_connection
from backend.app.routes import admin, events, kpis, leads, scoring


def _run_startup_seed() -> None:
    """Seed the database on startup when SEED_ON_STARTUP is enabled."""
    seed_on_startup = os.getenv("SEED_ON_STARTUP", "true").lower() in ("1", "true", "yes")
    if not seed_on_startup:
        return

    csv_path = Path(os.getenv("SEED_CSV_PATH", "data/students_base.csv"))
    if not csv_path.is_absolute():
        csv_path = (settings.project_root / csv_path).resolve()

    seed_value = os.getenv("SEED_SEED", "42")
    seed_reset = os.getenv("SEED_RESET", "true").lower() in ("1", "true", "yes")

    if not csv_path.exists():
        print(f"[startup] WARNING: CSV not found at {csv_path}, skipping seed.", flush=True)
        return

    if not settings.seed_script_path.exists():
        print(f"[startup] WARNING: Seed script not found at {settings.seed_script_path}, skipping seed.", flush=True)
        return

    command = [
        sys.executable,
        str(settings.seed_script_path),
        "--db", str(settings.db_path),
        "--csv", str(csv_path),
        "--seed", seed_value,
    ]
    if seed_reset:
        command.append("--reset")

    print(f"[startup] Seeding database: {' '.join(command)}", flush=True)
    result = subprocess.run(command, cwd=str(settings.project_root), capture_output=True, text=True, check=False)
    if result.returncode != 0:
        print(f"[startup] Seed failed (rc={result.returncode}):\n{result.stderr}", flush=True)
    else:
        print("[startup] Seed completed successfully.", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    _run_startup_seed()
    yield


app = FastAPI(title="letudiant-qualification-model API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All API routes live under /api so frontend and backend can share one origin
app.include_router(leads.router, prefix="/api")
app.include_router(kpis.router, prefix="/api")
app.include_router(events.router, prefix="/api")
app.include_router(scoring.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/health")
def health() -> dict:
    db_ok = False
    table_count = 0
    message = "ok"

    try:
        with get_db_connection() as conn:
            db_ok = True
            row = conn.execute(
                "SELECT COUNT(*) AS n FROM sqlite_master WHERE type IN ('table', 'view')"
            ).fetchone()
            table_count = int(row.get("n", 0)) if row else 0
    except sqlite3.Error as exc:
        message = f"database error: {exc}"

    return {
        "status": "ok" if db_ok else "degraded",
        "message": message,
        "db_ok": db_ok,
        "db_path": str(settings.db_path),
        "objects_count": table_count,
    }


# ── Serve built frontend in production ──────────────────────────────────────
# When frontend/dist exists (i.e. running from Docker / production), FastAPI
# serves the static assets and falls back to index.html for SPA routing.
_DIST_DIR = (settings.project_root / "frontend" / "dist").resolve()

if _DIST_DIR.is_dir():
    # Serve all static assets (JS, CSS, images, …)
    app.mount("/assets", StaticFiles(directory=str(_DIST_DIR / "assets")), name="assets")

    # SPA fallback: any unmatched GET returns index.html so client-side routing works.
    # Explicitly skip API and health paths so they return their own 404/error.
    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str) -> FileResponse:
        if full_path.startswith("api/") or full_path == "health":
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not found")
        index = _DIST_DIR / "index.html"
        return FileResponse(str(index))
