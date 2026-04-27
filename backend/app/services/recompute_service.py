import sqlite3
import time
from typing import Any, Dict

from backend.app.config import settings
from backend.app.db.sqlite import get_db_connection


def run_recompute() -> Dict[str, Any]:
    started = time.perf_counter()

    if not settings.recompute_sql_path.exists():
        return {
            "ok": False,
            "message": f"Recompute SQL not found at {settings.recompute_sql_path}",
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            "row_impacts": {},
        }

    try:
        with get_db_connection() as conn:
            before_counts = _table_counts(
                conn,
                ["derived_features", "lead_scores", "monetization", "kpi_daily"],
            )
            sql_text = settings.recompute_sql_path.read_text(encoding="utf-8")
            conn.executescript(sql_text)
            conn.commit()
            after_counts = _table_counts(
                conn,
                ["derived_features", "lead_scores", "monetization", "kpi_daily"],
            )
    except sqlite3.OperationalError as exc:
        return {
            "ok": False,
            "message": f"Recompute failed: {exc}",
            "duration_ms": round((time.perf_counter() - started) * 1000, 2),
            "row_impacts": {},
        }

    impacts: Dict[str, int] = {}
    for key, after_value in after_counts.items():
        before_value = before_counts.get(key, 0)
        impacts[key] = after_value - before_value

    return {
        "ok": True,
        "message": "Recompute completed",
        "duration_ms": round((time.perf_counter() - started) * 1000, 2),
        "row_impacts": impacts,
    }


def _table_counts(conn: sqlite3.Connection, tables: list[str]) -> Dict[str, int]:
    output: Dict[str, int] = {}
    for table in tables:
        try:
            value = conn.execute(f"SELECT COUNT(*) AS n FROM {table}").fetchone()["n"]
            output[table] = int(value)
        except sqlite3.OperationalError:
            output[table] = 0
    return output
