import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from backend.app.db.sqlite import get_db_connection


ALLOWED_SORT_FIELDS = {
    "student_id": "student_id",
    "total_score": "total_score",
    "intent_score": "intent_score",
    "engagement_score": "engagement_score",
    "monetisability_score": "monetisability_score",
    "tier_eur": "tier_eur",
    "monetisable_value_eur": "monetisable_value_eur",
}


def _safe_all(conn: sqlite3.Connection, query: str, params: Tuple[Any, ...] = ()) -> List[Dict[str, Any]]:
    try:
        return conn.execute(query, params).fetchall()
    except sqlite3.OperationalError:
        return []


def _safe_one(conn: sqlite3.Connection, query: str, params: Tuple[Any, ...] = ()) -> Dict[str, Any]:
    try:
        row = conn.execute(query, params).fetchone()
    except sqlite3.OperationalError:
        return {}
    return row or {}


def _table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "SELECT 1 AS ok FROM sqlite_master WHERE type='table' AND name = ?",
        (table_name,),
    ).fetchone()
    return bool(row)


def _view_exists(conn: sqlite3.Connection, view_name: str) -> bool:
    row = conn.execute(
        "SELECT 1 AS ok FROM sqlite_master WHERE type='view' AND name = ?",
        (view_name,),
    ).fetchone()
    return bool(row)


def _coalesce_lead_row(row: Dict[str, Any]) -> Dict[str, Any]:
    item = {
        "student_id": row.get("student_id"),
        "full_name": row.get("full_name") or "Unknown",
        "grade": row.get("grade") or "Unknown",
        "student_subgroup": row.get("student_subgroup") or "Unknown",
        "intent_score": float(row.get("intent_score") or 0),
        "engagement_score": float(row.get("engagement_score") or 0),
        "monetisability_score": float(row.get("monetisability_score") or 0),
        "total_score": float(row.get("total_score") or 0),
        "tier_eur": float(row.get("tier_eur") or 0),
        "resell_factor": int(row.get("resell_factor") or 1),
        "monetisable_value_eur": float(row.get("monetisable_value_eur") or 0),
        "consent_partner": int(row.get("consent_partners") or row.get("consent_partner") or 0),
        "consent_call": int(row.get("consent_call") or 0),
    }
    item["top_drivers"] = _top_drivers(item, row)
    return item


def _top_drivers(item: Dict[str, Any], row: Dict[str, Any]) -> List[str]:
    drivers: List[str] = []
    if int(row.get("exhibitor_scans_count") or 0) > 0:
        drivers.append("Exhibitor scans")
    if int(row.get("fields_interest_count") or 0) >= 2:
        drivers.append("Multiple interests")
    if int(item["consent_partner"]) == 1:
        drivers.append("Partner consent")
    if float(item["tier_eur"]) >= 22.5:
        drivers.append("High monetization tier")
    if float(item["engagement_score"]) >= 60:
        drivers.append("Strong on-site engagement")
    if not drivers:
        drivers = ["Profile completion", "Event interactions"]
    return drivers[:3]


def get_leads(
    fair_id: Optional[int] = None,
    q: Optional[str] = None,
    grade: Optional[str] = None,
    subgroup: Optional[str] = None,
    min_score: Optional[float] = None,
    max_score: Optional[float] = None,
    tier: Optional[float] = None,
    consent_partner: Optional[int] = None,
    limit: int = 50,
    offset: int = 0,
    sort_by: str = "total_score",
    sort_order: str = "desc",
) -> Dict[str, Any]:
    with get_db_connection() as conn:
        if not _table_exists(conn, "students"):
            return {"data": [], "total": 0, "limit": limit, "offset": offset}

        use_view = _view_exists(conn, "vw_lead_overview")

        if use_view:
            base_from = (
                " FROM vw_lead_overview v "
                " JOIN students s ON s.id = v.student_id "
            )
            select_clause = (
                "SELECT v.student_id, v.full_name, s.grade, s.student_subgroup, "
                "v.intent_score, v.engagement_score, v.monetisability_score, v.total_score, "
                "v.tier_eur, v.resell_factor, v.monetisable_value_eur, "
                "v.consent_partners, v.consent_call, v.fields_interest_count, v.exhibitor_scans_count"
            )
            name_expr = "COALESCE(v.full_name, '')"
            email_expr = "COALESCE(v.email, '')"
            score_expr = "COALESCE(v.total_score, 0)"
            tier_expr = "COALESCE(v.tier_eur, 0)"
            consent_partner_expr = "COALESCE(v.consent_partners, 0)"
        else:
            base_from = (
                " FROM students s "
                " LEFT JOIN student_profiles sp ON sp.student_id = s.id "
                " LEFT JOIN student_consents sc ON sc.student_id = s.id "
                " LEFT JOIN lead_scores ls ON ls.student_id = s.id "
                " LEFT JOIN monetization m ON m.student_id = s.id "
                " LEFT JOIN derived_features df ON df.student_id = s.id "
            )
            select_clause = (
                "SELECT s.id AS student_id, sp.full_name, s.grade, s.student_subgroup, "
                "ls.intent_score, ls.engagement_score, ls.monetisability_score, ls.total_score, "
                "m.tier_eur, m.resell_factor, m.monetisable_value_eur, "
                "sc.consent_partners, sc.consent_call, df.fields_interest_count, df.exhibitor_scans_count"
            )
            name_expr = "COALESCE(sp.full_name, '')"
            email_expr = "COALESCE(sp.email, '')"
            score_expr = "COALESCE(ls.total_score, 0)"
            tier_expr = "COALESCE(m.tier_eur, 0)"
            consent_partner_expr = "COALESCE(sc.consent_partners, 0)"

        where: List[str] = ["1=1"]
        params: List[Any] = []

        if fair_id is not None:
            where.append("s.fair_id = ?")
            params.append(fair_id)
        if q:
            where.append(f"({name_expr} LIKE ? OR {email_expr} LIKE ?)")
            needle = f"%{q.strip()}%"
            params.extend([needle, needle])
        if grade:
            where.append("s.grade = ?")
            params.append(grade)
        if subgroup:
            where.append("s.student_subgroup = ?")
            params.append(subgroup)
        if min_score is not None:
            where.append(f"{score_expr} >= ?")
            params.append(min_score)
        if max_score is not None:
            where.append(f"{score_expr} <= ?")
            params.append(max_score)
        if tier is not None:
            where.append(f"{tier_expr} = ?")
            params.append(tier)
        if consent_partner is not None:
            where.append(f"{consent_partner_expr} = ?")
            params.append(consent_partner)

        where_clause = " WHERE " + " AND ".join(where)

        count_sql = "SELECT COUNT(*) AS total " + base_from + where_clause
        total_row = _safe_one(conn, count_sql, tuple(params))
        total = int(total_row.get("total", 0)) if total_row else 0

        sort_sql = ALLOWED_SORT_FIELDS.get(sort_by, "total_score")
        order_sql = "ASC" if sort_order.lower() == "asc" else "DESC"

        query = (
            select_clause
            + base_from
            + where_clause
            + f" ORDER BY COALESCE({sort_sql}, 0) {order_sql}, student_id ASC "
            + " LIMIT ? OFFSET ?"
        )
        rows = _safe_all(conn, query, tuple(params + [limit, offset]))

        return {
            "data": [_coalesce_lead_row(row) for row in rows],
            "total": total,
            "limit": limit,
            "offset": offset,
        }


def get_lead_detail(student_id: int) -> Dict[str, Any]:
    with get_db_connection() as conn:
        if not _table_exists(conn, "students"):
            return {}

        row = _safe_one(
            conn,
            """
            SELECT
              s.id AS student_id,
              s.fair_id,
              s.grade,
              s.student_subgroup,
              s.registration_channel,
              s.is_registered,
              sp.full_name,
              sp.email,
              sp.phone,
              sp.postal_region,
              sp.current_study_level,
              sp.programme_of_interest,
              sp.fields_of_interest_csv,
              sc.consent_newsletter,
              sc.consent_partners,
              sc.consent_call,
              df.*,
              ls.intent_score,
              ls.engagement_score,
              ls.monetisability_score,
              ls.richness_score,
              ls.total_score,
              ls.prequalified,
              m.tier_eur,
              m.resell_factor,
              m.monetisable_value_eur
            FROM students s
            LEFT JOIN student_profiles sp ON sp.student_id = s.id
            LEFT JOIN student_consents sc ON sc.student_id = s.id
            LEFT JOIN derived_features df ON df.student_id = s.id
            LEFT JOIN lead_scores ls ON ls.student_id = s.id
            LEFT JOIN monetization m ON m.student_id = s.id
            WHERE s.id = ?
            """,
            (student_id,),
        )

        if not row:
            return {}

        timeline = _safe_all(
            conn,
            """
            SELECT id, fair_id, event_type, event_time, stand_id, conference_id, source_channel, payload_json
            FROM events
            WHERE student_id = ?
            ORDER BY event_time DESC, id DESC
            LIMIT 20
            """,
            (student_id,),
        )

        timeline_summary_rows = _safe_all(
            conn,
            """
            SELECT event_type, COUNT(*) AS count
            FROM events
            WHERE student_id = ?
            GROUP BY event_type
            ORDER BY count DESC, event_type ASC
            """,
            (student_id,),
        )

        timeline_summary = {item["event_type"]: int(item["count"]) for item in timeline_summary_rows}

        return {
            "student_id": row.get("student_id"),
            "fair_id": row.get("fair_id"),
            "profile": {
                "full_name": row.get("full_name"),
                "email": row.get("email"),
                "phone": row.get("phone"),
                "postal_region": row.get("postal_region"),
                "current_study_level": row.get("current_study_level"),
                "programme_of_interest": row.get("programme_of_interest"),
                "fields_of_interest_csv": row.get("fields_of_interest_csv"),
                "grade": row.get("grade"),
                "student_subgroup": row.get("student_subgroup"),
                "registration_channel": row.get("registration_channel"),
            },
            "consents": {
                "newsletter": int(row.get("consent_newsletter") or 0),
                "partners": int(row.get("consent_partners") or 0),
                "call": int(row.get("consent_call") or 0),
            },
            "derived": {
                "fields_interest_count": int(row.get("fields_interest_count") or 0),
                "stands_tapped_count": int(row.get("stands_tapped_count") or 0),
                "unique_stand_categories": int(row.get("unique_stand_categories") or 0),
                "conference_scans_count": int(row.get("conference_scans_count") or 0),
                "exhibitor_scans_count": int(row.get("exhibitor_scans_count") or 0),
                "followup_cta_to_exhibitor": int(row.get("followup_cta_to_exhibitor") or 0),
                "site_pageviews_7d": int(row.get("site_pageviews_7d") or 0),
            },
            "score": {
                "intent_score": float(row.get("intent_score") or 0),
                "engagement_score": float(row.get("engagement_score") or 0),
                "monetisability_score": float(row.get("monetisability_score") or 0),
                "richness_score": float(row.get("richness_score") or 0),
                "total_score": float(row.get("total_score") or 0),
                "prequalified": int(row.get("prequalified") or 0),
            },
            "monetization": {
                "tier_eur": float(row.get("tier_eur") or 0),
                "resell_factor": int(row.get("resell_factor") or 1),
                "monetisable_value_eur": float(row.get("monetisable_value_eur") or 0),
            },
            "timeline": timeline,
            "timeline_summary": timeline_summary,
        }


def get_lead_score(student_id: int) -> Dict[str, Any]:
    with get_db_connection() as conn:
        row = _safe_one(
            conn,
            """
            SELECT
              s.id AS student_id,
              s.fair_id,
              ls.intent_score,
              ls.engagement_score,
              ls.monetisability_score,
              ls.richness_score,
              ls.total_score,
              ls.prequalified,
              m.tier_eur,
              m.resell_factor,
              m.monetisable_value_eur
            FROM students s
            LEFT JOIN lead_scores ls ON ls.student_id = s.id
            LEFT JOIN monetization m ON m.student_id = s.id
            WHERE s.id = ?
            """,
            (student_id,),
        )

        if not row:
            return {}

        return {
            "student_id": row.get("student_id"),
            "fair_id": row.get("fair_id"),
            "intent_score": float(row.get("intent_score") or 0),
            "engagement_score": float(row.get("engagement_score") or 0),
            "monetisability_score": float(row.get("monetisability_score") or 0),
            "richness_score": float(row.get("richness_score") or 0),
            "total_score": float(row.get("total_score") or 0),
            "prequalified": int(row.get("prequalified") or 0),
            "tier_eur": float(row.get("tier_eur") or 0),
            "resell_factor": int(row.get("resell_factor") or 1),
            "monetisable_value_eur": float(row.get("monetisable_value_eur") or 0),
        }


def get_kpis_fair(fair_id: int) -> Dict[str, Any]:
    with get_db_connection() as conn:
        if not _table_exists(conn, "students"):
            return _empty_fair_kpis(fair_id)

        total_leads_row = _safe_one(conn, "SELECT COUNT(*) AS total FROM students WHERE fair_id = ?", (fair_id,))
        total_leads = int(total_leads_row.get("total", 0))

        opt_row = _safe_one(
            conn,
            """
            SELECT
              AVG(CAST(consent_partners AS REAL)) AS partner_rate,
              AVG(CAST(consent_call AS REAL)) AS call_rate
            FROM student_consents
            WHERE fair_id = ?
            """,
            (fair_id,),
        )

        tier_rows = _safe_all(
            conn,
            """
            SELECT tier_eur, COUNT(*) AS leads_count, SUM(monetisable_value_eur) AS value_eur
            FROM monetization
            WHERE fair_id = ?
            GROUP BY tier_eur
            ORDER BY tier_eur DESC
            """,
            (fair_id,),
        )

        total_value_row = _safe_one(
            conn,
            "SELECT SUM(monetisable_value_eur) AS total_value FROM monetization WHERE fair_id = ?",
            (fair_id,),
        )

        return {
            "fair_id": fair_id,
            "total_leads": total_leads,
            "optin_partner_pct": round(float(opt_row.get("partner_rate") or 0) * 100, 2),
            "optin_call_pct": round(float(opt_row.get("call_rate") or 0) * 100, 2),
            "tier_distribution": [
                {
                    "tier_eur": float(row.get("tier_eur") or 0),
                    "leads_count": int(row.get("leads_count") or 0),
                    "value_eur": float(row.get("value_eur") or 0),
                }
                for row in tier_rows
            ],
            "total_monetisable_value_eur": float(total_value_row.get("total_value") or 0),
        }


def _period_filter_sql(period: Optional[str]) -> Tuple[str, List[Any]]:
    if not period or period.lower() == "all":
        return "", []

    p = period.lower()
    if p == "during":
        return " AND DATE(e.event_time) BETWEEN f.starts_on AND f.ends_on ", []
    if p == "before":
        return " AND DATE(e.event_time) < f.starts_on ", []
    if p == "after":
        return " AND DATE(e.event_time) > f.ends_on ", []
    return "", []


def get_kpis_stands(
    fair_id: Optional[int] = None,
    period: Optional[str] = None,
    sector: Optional[str] = None,
    hall: Optional[str] = None,
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        if not _table_exists(conn, "stands"):
            return []

        period_sql, _ = _period_filter_sql(period)

        where = ["1=1"]
        join_params: List[Any] = []
        where_params: List[Any] = []
        if fair_id is not None:
            where.append("st.fair_id = ?")
            where_params.append(fair_id)
        if sector:
            where.append("st.stand_category = ?")
            where_params.append(sector)

        hall_condition = ""
        if hall:
            hall_condition = " AND e.payload_json LIKE ? "
            join_params.append(f'%"hall": "{hall}"%')

        query = (
            "SELECT "
            "st.fair_id, st.id AS stand_id, st.stand_code, st.exhibitor_name, st.stand_category, "
            "SUM(CASE WHEN e.event_type='stand_tap' THEN 1 ELSE 0 END) AS stand_taps, "
            "SUM(CASE WHEN e.event_type='brochure_request' THEN 1 ELSE 0 END) AS brochure_requests, "
            "SUM(CASE WHEN e.event_type='exhibitor_scan' THEN 1 ELSE 0 END) AS exhibitor_scans, "
            "COUNT(DISTINCT CASE WHEN COALESCE(ls.intent_score,0) >= 70 THEN e.student_id END) AS high_intent_unique_students "
            "FROM stands st "
            "LEFT JOIN fairs f ON f.id = st.fair_id "
            "LEFT JOIN events e ON e.stand_id = st.id"
            + period_sql
            + hall_condition
            + " LEFT JOIN lead_scores ls ON ls.student_id = e.student_id AND ls.fair_id = st.fair_id "
            + " WHERE "
            + " AND ".join(where)
            + " GROUP BY st.fair_id, st.id, st.stand_code, st.exhibitor_name, st.stand_category "
            + " ORDER BY ("
            + "SUM(CASE WHEN e.event_type='stand_tap' THEN 1 ELSE 0 END)"
            + " + SUM(CASE WHEN e.event_type='brochure_request' THEN 1 ELSE 0 END)"
            + " + SUM(CASE WHEN e.event_type='exhibitor_scan' THEN 1 ELSE 0 END)"
            + ") DESC, st.id ASC"
        )

        rows = _safe_all(conn, query, tuple(join_params + where_params))
        return rows


def get_kpis_conferences(
    fair_id: Optional[int] = None,
    period: Optional[str] = None,
    sector: Optional[str] = None,
    hall: Optional[str] = None,
) -> List[Dict[str, Any]]:
    with get_db_connection() as conn:
        if not _table_exists(conn, "conferences"):
            return []

        period_sql, _ = _period_filter_sql(period)

        where = ["1=1"]
        join_params: List[Any] = []
        where_params: List[Any] = []
        if fair_id is not None:
            where.append("c.fair_id = ?")
            where_params.append(fair_id)
        if sector:
            where.append("c.topic = ?")
            where_params.append(sector)

        hall_condition = ""
        if hall:
            hall_condition = " AND e.payload_json LIKE ? "
            join_params.append(f'%"hall": "{hall}"%')

        query = (
            "SELECT "
            "c.fair_id, c.id AS conference_id, c.conference_code, c.conference_title, c.topic, c.speaker_name, "
            "SUM(CASE WHEN e.event_type='conference_scan' THEN 1 ELSE 0 END) AS conference_scans, "
            "COUNT(DISTINCT CASE WHEN e.event_type='conference_scan' THEN e.student_id END) AS unique_attendees "
            "FROM conferences c "
            "LEFT JOIN fairs f ON f.id = c.fair_id "
            "LEFT JOIN events e ON e.conference_id = c.id"
            + period_sql
            + hall_condition
            + " WHERE "
            + " AND ".join(where)
            + " GROUP BY c.fair_id, c.id, c.conference_code, c.conference_title, c.topic, c.speaker_name "
            + " ORDER BY conference_scans DESC, unique_attendees DESC, c.id ASC"
        )

        rows = _safe_all(conn, query, tuple(join_params + where_params))
        return rows


def _empty_fair_kpis(fair_id: int) -> Dict[str, Any]:
    return {
        "fair_id": fair_id,
        "total_leads": 0,
        "optin_partner_pct": 0.0,
        "optin_call_pct": 0.0,
        "tier_distribution": [],
        "total_monetisable_value_eur": 0.0,
    }


def insert_event(payload: Dict[str, Any]) -> int:
    with get_db_connection() as conn:
        event_time = payload.get("event_time") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        cursor = conn.execute(
            """
            INSERT INTO events (
              fair_id, student_id, stand_id, conference_id, event_type,
              event_time, source_channel, payload_json
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.get("fair_id"),
                payload.get("student_id"),
                payload.get("stand_id"),
                payload.get("conference_id"),
                payload.get("event_type"),
                event_time,
                payload.get("source_channel"),
                payload.get("payload_json"),
            ),
        )
        conn.commit()
        return int(cursor.lastrowid)


def get_db_stats() -> Dict[str, Any]:
    tables = [
        "fairs",
        "students",
        "student_profiles",
        "student_consents",
        "pre_fair_signals",
        "stands",
        "conferences",
        "events",
        "derived_features",
        "lead_scores",
        "monetization",
        "kpi_daily",
    ]

    stats: Dict[str, int] = {}
    with get_db_connection() as conn:
        for table in tables:
            if not _table_exists(conn, table):
                stats[table] = 0
                continue
            row = _safe_one(conn, f"SELECT COUNT(*) AS n FROM {table}")
            stats[table] = int(row.get("n", 0))

    return {
        "tables": stats,
        "total_tables": len(tables),
        "non_empty_tables": len([name for name, value in stats.items() if value > 0]),
    }
