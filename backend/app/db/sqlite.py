import sqlite3
from contextlib import contextmanager
from typing import Any, Dict, Generator, Iterable, List

from backend.app.config import settings


DictRow = Dict[str, Any]


def _dict_factory(cursor: sqlite3.Cursor, row: Iterable[Any]) -> DictRow:
    return {description[0]: row[idx] for idx, description in enumerate(cursor.description)}


@contextmanager
def get_db_connection() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(str(settings.db_path))
    conn.row_factory = _dict_factory
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
    finally:
        conn.close()


def fetch_all(cursor: sqlite3.Cursor) -> List[DictRow]:
    return [dict(row) for row in cursor.fetchall()]


def fetch_one(cursor: sqlite3.Cursor) -> DictRow:
    row = cursor.fetchone()
    return dict(row) if row else {}
