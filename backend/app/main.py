import sqlite3

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.db.sqlite import get_db_connection
from backend.app.routes import admin, events, kpis, leads, scoring


app = FastAPI(title="letudiant-qualification-model API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(leads.router)
app.include_router(kpis.router)
app.include_router(events.router)
app.include_router(scoring.router)
app.include_router(admin.router)


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
