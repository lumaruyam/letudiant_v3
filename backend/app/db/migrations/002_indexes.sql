PRAGMA foreign_keys = ON;

-- Events access patterns: timeline, per-student drilldown, and type filtering
CREATE INDEX IF NOT EXISTS idx_events_fair_student_time_type
  ON events (fair_id, student_id, event_time, event_type);

CREATE INDEX IF NOT EXISTS idx_events_fair_time_type
  ON events (fair_id, event_time, event_type);

CREATE INDEX IF NOT EXISTS idx_events_type_stand
  ON events (event_type, stand_id);

CREATE INDEX IF NOT EXISTS idx_events_type_conference
  ON events (event_type, conference_id);

-- Scoring and monetization dashboard retrieval
CREATE INDEX IF NOT EXISTS idx_lead_scores_fair_total
  ON lead_scores (fair_id, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_lead_scores_fair_intent
  ON lead_scores (fair_id, intent_score DESC);

CREATE INDEX IF NOT EXISTS idx_monetization_fair_value
  ON monetization (fair_id, monetisable_value_eur DESC);

CREATE INDEX IF NOT EXISTS idx_monetization_fair_tier
  ON monetization (fair_id, tier_eur);

-- Stand and conference popularity queries
CREATE INDEX IF NOT EXISTS idx_stands_fair_category
  ON stands (fair_id, stand_category);

CREATE INDEX IF NOT EXISTS idx_conferences_fair_topic
  ON conferences (fair_id, topic);

CREATE INDEX IF NOT EXISTS idx_events_fair_stand_type
  ON events (fair_id, stand_id, event_type);

CREATE INDEX IF NOT EXISTS idx_events_fair_conference_type
  ON events (fair_id, conference_id, event_type);

-- Feature and profile joins
CREATE INDEX IF NOT EXISTS idx_derived_features_fair_student
  ON derived_features (fair_id, student_id);

CREATE INDEX IF NOT EXISTS idx_student_profiles_fair_student
  ON student_profiles (fair_id, student_id);

CREATE INDEX IF NOT EXISTS idx_student_consents_fair_student
  ON student_consents (fair_id, student_id);

CREATE INDEX IF NOT EXISTS idx_kpi_daily_fair_date
  ON kpi_daily (fair_id, kpi_date);
