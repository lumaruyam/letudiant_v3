PRAGMA foreign_keys = ON;

DROP VIEW IF EXISTS vw_lead_overview;
CREATE VIEW vw_lead_overview AS
SELECT
  s.fair_id,
  s.id AS student_id,
  s.source_row_id,
  sp.full_name,
  sp.email,
  sp.current_study_level,
  sp.programme_of_interest,
  ls.intent_score,
  ls.engagement_score,
  ls.monetisability_score,
  ls.richness_score,
  ls.total_score,
  ls.prequalified,
  m.tier_eur,
  m.resell_factor,
  m.monetisable_value_eur,
  df.fields_interest_count,
  df.stands_tapped_count,
  df.unique_stand_categories,
  df.exhibitor_scans_count,
  df.followup_cta_to_exhibitor,
  sc.consent_partners,
  sc.consent_call
FROM students s
LEFT JOIN student_profiles sp ON sp.student_id = s.id
LEFT JOIN student_consents sc ON sc.student_id = s.id
LEFT JOIN derived_features df ON df.student_id = s.id
LEFT JOIN lead_scores ls ON ls.student_id = s.id
LEFT JOIN monetization m ON m.student_id = s.id;

DROP VIEW IF EXISTS vw_stand_popularity;
CREATE VIEW vw_stand_popularity AS
SELECT
  st.fair_id,
  st.id AS stand_id,
  st.stand_code,
  st.exhibitor_name,
  st.stand_category,
  SUM(CASE WHEN e.event_type = 'stand_tap' THEN 1 ELSE 0 END) AS stand_taps,
  SUM(CASE WHEN e.event_type = 'brochure_request' THEN 1 ELSE 0 END) AS brochure_requests,
  SUM(CASE WHEN e.event_type = 'exhibitor_scan' THEN 1 ELSE 0 END) AS exhibitor_scans,
  COUNT(DISTINCT CASE WHEN ls.intent_score >= 70 THEN e.student_id END) AS high_intent_unique_students
FROM stands st
LEFT JOIN events e
  ON e.stand_id = st.id
LEFT JOIN lead_scores ls
  ON ls.student_id = e.student_id AND ls.fair_id = st.fair_id
GROUP BY st.fair_id, st.id, st.stand_code, st.exhibitor_name, st.stand_category;

DROP VIEW IF EXISTS vw_conference_popularity;
CREATE VIEW vw_conference_popularity AS
SELECT
  c.fair_id,
  c.id AS conference_id,
  c.conference_code,
  c.conference_title,
  c.topic,
  c.speaker_name,
  SUM(CASE WHEN e.event_type = 'conference_scan' THEN 1 ELSE 0 END) AS conference_scans,
  COUNT(DISTINCT CASE WHEN e.event_type = 'conference_scan' THEN e.student_id END) AS unique_attendees
FROM conferences c
LEFT JOIN events e
  ON e.conference_id = c.id
GROUP BY c.fair_id, c.id, c.conference_code, c.conference_title, c.topic, c.speaker_name;

DROP VIEW IF EXISTS vw_tier_distribution;
CREATE VIEW vw_tier_distribution AS
SELECT
  fair_id,
  tier_eur,
  COUNT(*) AS leads_count,
  SUM(monetisable_value_eur) AS total_value_eur
FROM monetization
GROUP BY fair_id, tier_eur;

DROP VIEW IF EXISTS vw_total_monetisable_value;
CREATE VIEW vw_total_monetisable_value AS
SELECT
  fair_id,
  SUM(monetisable_value_eur) AS total_monetisable_value_eur,
  AVG(monetisable_value_eur) AS avg_value_eur,
  COUNT(*) AS leads_count
FROM monetization
GROUP BY fair_id;

DROP VIEW IF EXISTS vw_optin_rates;
CREATE VIEW vw_optin_rates AS
SELECT
  s.fair_id,
  COUNT(*) AS total_students,
  ROUND(100.0 * AVG(CAST(sc.consent_newsletter AS REAL)), 2) AS newsletter_optin_pct,
  ROUND(100.0 * AVG(CAST(sc.consent_partners AS REAL)), 2) AS partner_optin_pct,
  ROUND(100.0 * AVG(CAST(sc.consent_call AS REAL)), 2) AS call_optin_pct
FROM students s
JOIN student_consents sc ON sc.student_id = s.id
GROUP BY s.fair_id;
