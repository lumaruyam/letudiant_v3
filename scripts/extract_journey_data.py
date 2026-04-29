#!/usr/bin/env python3
"""
Extract journey tracking data from the database.
Usage: python3 extract_journey_data.py [query_name]
"""

import sqlite3
import json
import pandas as pd
from pathlib import Path

# Database path
DB_PATH = Path(__file__).parent.parent / "backend" / "app" / "db" / "local.db"


def get_connection():
    """Connect to SQLite database"""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def extract_stand_visits_detailed():
    """Extract all stand visits with dwell time"""
    query = """
    SELECT
      sp.full_name,
      st.stand_code,
      st.exhibitor_name,
      sv.visit_start,
      ROUND(sv.dwell_time_seconds / 60.0, 1) as dwell_minutes,
      sv.conversation_happened,
      sv.materials_photographed,
      sv.primary_vs_secondary
    FROM stand_visits sv
    LEFT JOIN student_profiles sp ON sv.student_id = sp.student_id
    LEFT JOIN stands st ON sv.stand_id = st.id
    ORDER BY sv.visit_start;
    """
    conn = get_connection()
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def extract_high_intent_leads():
    """Extract Léa & Thomas type leads (high intent signals)"""
    query = """
    SELECT
      sp.full_name,
      sp.email,
      COUNT(DISTINCT sv.stand_id) as stands_visited,
      ROUND(SUM(sv.dwell_time_seconds) / 60.0, 1) as total_dwell_minutes,
      SUM(CASE WHEN sv.conversation_happened = 1 THEN 1 ELSE 0 END) as conversations,
      SUM(CASE WHEN sv.materials_photographed = 1 THEN 1 ELSE 0 END) as materials_photos,
      COUNT(DISTINCT dcs.id) as direct_emails_sent,
      COALESCE(pt.fair_influenced_decision, 0) as parcoursup_influenced,
      COALESCE(js.journey_completeness_score, 0) as journey_score
    FROM student_profiles sp
    LEFT JOIN stand_visits sv ON sp.student_id = sv.student_id
    LEFT JOIN direct_contact_signals dcs ON sp.student_id = dcs.student_id
    LEFT JOIN parcoursup_tracking pt ON sp.student_id = pt.student_id
    LEFT JOIN journey_scores js ON sp.student_id = js.student_id
    WHERE sv.stand_id IS NOT NULL
    GROUP BY sp.student_id
    HAVING
      SUM(sv.dwell_time_seconds) > 600  -- 10+ minutes
      OR SUM(CASE WHEN sv.conversation_happened = 1 THEN 1 ELSE 0 END) >= 1
      OR COUNT(DISTINCT dcs.id) > 0
    ORDER BY journey_score DESC;
    """
    conn = get_connection()
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def extract_discovery_sources():
    """Breakdown of how students found the fair"""
    query = """
    SELECT
      source_channel,
      COUNT(*) as count,
      AVG(registration_time_seconds) as avg_reg_time_sec,
      GROUP_CONCAT(DISTINCT sp.full_name, ', ') as students
    FROM discovery_sources ds
    LEFT JOIN student_profiles sp ON ds.student_id = sp.student_id
    GROUP BY source_channel
    ORDER BY count DESC;
    """
    conn = get_connection()
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def extract_engagement_timeline(student_id):
    """Get complete engagement timeline for a student"""
    query = """
    SELECT
      'Pre-Fair App Opens' as phase,
      pfe.app_opens_before_fair as value,
      pfe.created_at as timestamp
    FROM pre_fair_engagement pfe
    WHERE pfe.student_id = ?

    UNION ALL

    SELECT
      'Stand Visit: ' || st.exhibitor_name,
      ROUND(sv.dwell_time_seconds / 60.0, 1),
      sv.visit_start
    FROM stand_visits sv
    LEFT JOIN stands st ON sv.stand_id = st.id
    WHERE sv.student_id = ?

    UNION ALL

    SELECT
      'Email to Exhibitor',
      1,
      dcs.contact_time
    FROM direct_contact_signals dcs
    WHERE dcs.student_id = ? AND dcs.contact_type = 'email_to_exhibitor'

    ORDER BY timestamp;
    """
    conn = get_connection()
    df = pd.read_sql_query(query, conn, params=[student_id, student_id, student_id])
    conn.close()
    return df


def extract_parcoursup_changes():
    """Show students who changed Parcoursup choices post-fair"""
    query = """
    SELECT
      sp.full_name,
      sp.email,
      pt.parcoursup_programmes_before_fair,
      pt.parcoursup_programmes_after_fair,
      (pt.parcoursup_programmes_after_fair - pt.parcoursup_programmes_before_fair) as net_change,
      pt.programmes_added,
      pt.programmes_removed,
      pt.confidence_change,
      pt.updated_at
    FROM parcoursup_tracking pt
    LEFT JOIN student_profiles sp ON pt.student_id = sp.student_id
    WHERE pt.programmes_added IS NOT NULL OR pt.programmes_removed IS NOT NULL
    ORDER BY pt.updated_at DESC;
    """
    conn = get_connection()
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def extract_churn_risk():
    """Identify students at risk of churning"""
    query = """
    SELECT
      sp.full_name,
      sp.email,
      ch.last_engagement_date,
      ch.days_to_first_churn,
      ch.reason_inferred,
      ch.re_engagement_attempts,
      ch.re_engaged
    FROM churn_signals ch
    LEFT JOIN student_profiles sp ON ch.student_id = sp.student_id
    ORDER BY ch.last_engagement_date DESC;
    """
    conn = get_connection()
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def export_to_formats(df, name):
    """Export dataframe to multiple formats"""
    csv_path = f"journey_data_{name}.csv"
    json_path = f"journey_data_{name}.json"

    df.to_csv(csv_path, index=False)
    df.to_json(json_path, orient='records', indent=2)

    print(f"✓ Exported to {csv_path}")
    print(f"✓ Exported to {json_path}")
    return csv_path, json_path


def main():
    print("=" * 70)
    print("JOURNEY DATA EXTRACTION")
    print("=" * 70)

    # 1. High-intent leads (like Léa)
    print("\n📊 HIGH-INTENT LEADS (Léa & Thomas profiles)...")
    df_high_intent = extract_high_intent_leads()
    print(df_high_intent.to_string())
    export_to_formats(df_high_intent, "high_intent_leads")

    # 2. Stand visits with dwell time
    print("\n\n📊 STAND VISITS WITH DWELL TIME...")
    df_stands = extract_stand_visits_detailed()
    print(df_stands.head(20).to_string())
    export_to_formats(df_stands, "stand_visits")

    # 3. Discovery sources
    print("\n\n📊 HOW STUDENTS FOUND THE FAIR...")
    df_discovery = extract_discovery_sources()
    print(df_discovery.to_string())
    export_to_formats(df_discovery, "discovery_sources")

    # 4. Parcoursup changes
    print("\n\n📊 PARCOURSUP DECISIONS INFLUENCED BY FAIR...")
    df_parco = extract_parcoursup_changes()
    print(df_parco.to_string())
    export_to_formats(df_parco, "parcoursup_changes")

    # 5. Churn risk
    print("\n\n📊 STUDENTS AT CHURN RISK...")
    df_churn = extract_churn_risk()
    print(df_churn.to_string())
    export_to_formats(df_churn, "churn_risk")

    print("\n" + "=" * 70)
    print("✓ All data exported to journey_data_*.csv and journey_data_*.json")
    print("=" * 70)


if __name__ == "__main__":
    main()
