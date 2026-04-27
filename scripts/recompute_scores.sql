PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

DELETE FROM kpi_daily;
DELETE FROM monetization;
DELETE FROM lead_scores;
DELETE FROM derived_features;

INSERT INTO derived_features (
  fair_id,
  student_id,
  snapshot_date,
  checked_in,
  repeat_visitor,
  fields_interest_count,
  programme_interest_present,
  bac_track_present,
  region_present,
  phone_present,
  consent_partner,
  consent_call,
  ori_completed,
  ori_score,
  bookmarks_count,
  exit_clarity_score,
  stands_tapped_count,
  unique_stand_categories,
  conference_scans_count,
  exhibitor_scans_count,
  passport_completed,
  post_fair_email_clicks_count,
  site_pageviews_7d,
  followup_cta_to_exhibitor,
  profile_rich,
  created_at,
  updated_at
)
WITH event_rollup AS (
  SELECT
    e.fair_id,
    e.student_id,
    MAX(CASE WHEN e.event_type = 'check_in' THEN 1 ELSE 0 END) AS checked_in,
    SUM(CASE WHEN e.event_type = 'brochure_request' THEN 1 ELSE 0 END) AS bookmarks_count,
    AVG(CASE WHEN e.event_type = 'exit_survey' THEN CAST(json_extract(e.payload_json, '$.clarity_score') AS REAL) END) AS exit_clarity_score,
    SUM(CASE WHEN e.event_type = 'stand_tap' THEN 1 ELSE 0 END) AS stands_tapped_count,
    COUNT(DISTINCT CASE WHEN e.event_type = 'stand_tap' THEN st.stand_category END) AS unique_stand_categories,
    SUM(CASE WHEN e.event_type = 'conference_scan' THEN 1 ELSE 0 END) AS conference_scans_count,
    SUM(CASE WHEN e.event_type = 'exhibitor_scan' THEN 1 ELSE 0 END) AS exhibitor_scans_count,
    MAX(
      CASE
        WHEN e.event_type = 'passport_progress'
             AND (
               COALESCE(CAST(json_extract(e.payload_json, '$.completed') AS INTEGER), 0) = 1
               OR COALESCE(CAST(json_extract(e.payload_json, '$.progress') AS INTEGER), 0) >= 100
             )
          THEN 1
        ELSE 0
      END
    ) AS passport_completed,
    SUM(CASE WHEN e.event_type = 'post_fair_email_click' THEN 1 ELSE 0 END) AS post_fair_email_clicks_count,
    SUM(
      CASE
        WHEN e.event_type = 'site_page_view'
             AND (julianday(DATE(e.event_time)) - julianday(f.ends_on)) BETWEEN 0 AND 7
          THEN 1
        ELSE 0
      END
    ) AS site_pageviews_7d,
    MAX(CASE WHEN e.event_type = 'followup_cta_to_exhibitor' THEN 1 ELSE 0 END) AS followup_cta_to_exhibitor
  FROM events e
  JOIN fairs f ON f.id = e.fair_id
  LEFT JOIN stands st ON st.id = e.stand_id
  GROUP BY e.fair_id, e.student_id
)
SELECT
  s.fair_id,
  s.id AS student_id,
  DATE('now') AS snapshot_date,
  COALESCE(er.checked_in, 0) AS checked_in,
  COALESCE(s.repeat_visitor, 0) AS repeat_visitor,
  COALESCE(sp.fields_interest_count, 0) AS fields_interest_count,
  CASE WHEN sp.programme_of_interest IS NOT NULL AND TRIM(sp.programme_of_interest) <> '' THEN 1 ELSE 0 END AS programme_interest_present,
  CASE WHEN sp.bac_track_type IS NOT NULL AND TRIM(sp.bac_track_type) <> '' THEN 1 ELSE 0 END AS bac_track_present,
  CASE WHEN sp.postal_region IS NOT NULL AND TRIM(sp.postal_region) <> '' THEN 1 ELSE 0 END AS region_present,
  CASE WHEN sp.phone IS NOT NULL AND TRIM(sp.phone) <> '' THEN 1 ELSE 0 END AS phone_present,
  COALESCE(sc.consent_partners, 0) AS consent_partner,
  COALESCE(sc.consent_call, 0) AS consent_call,
  COALESCE(s.used_ori, 0) AS ori_completed,
  pfs.ori_test_score AS ori_score,
  COALESCE(er.bookmarks_count, 0) AS bookmarks_count,
  er.exit_clarity_score,
  COALESCE(er.stands_tapped_count, 0) AS stands_tapped_count,
  COALESCE(er.unique_stand_categories, 0) AS unique_stand_categories,
  COALESCE(er.conference_scans_count, 0) AS conference_scans_count,
  COALESCE(er.exhibitor_scans_count, 0) AS exhibitor_scans_count,
  COALESCE(er.passport_completed, 0) AS passport_completed,
  COALESCE(er.post_fair_email_clicks_count, 0) AS post_fair_email_clicks_count,
  COALESCE(er.site_pageviews_7d, 0) AS site_pageviews_7d,
  COALESCE(er.followup_cta_to_exhibitor, 0) AS followup_cta_to_exhibitor,
  COALESCE(sp.profile_rich, 0) AS profile_rich,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM students s
LEFT JOIN student_profiles sp ON sp.student_id = s.id
LEFT JOIN student_consents sc ON sc.student_id = s.id
LEFT JOIN pre_fair_signals pfs ON pfs.student_id = s.id
LEFT JOIN event_rollup er ON er.student_id = s.id AND er.fair_id = s.fair_id;

INSERT INTO lead_scores (
  fair_id,
  student_id,
  intent_score,
  engagement_score,
  monetisability_score,
  richness_score,
  total_score,
  prequalified,
  scoring_version,
  created_at,
  updated_at
)
WITH calc AS (
  SELECT
    df.fair_id,
    df.student_id,
    (
      20.0 * MIN(df.fields_interest_count, 3) / 3.0
      + 15.0 * df.programme_interest_present
      + 10.0 * df.repeat_visitor
      + 15.0 * MIN(df.bookmarks_count, 6) / 6.0
      + 20.0 * df.ori_completed * (CASE WHEN df.ori_score IS NOT NULL THEN df.ori_score / 100.0 ELSE 1.0 END)
      + 20.0 * (CASE WHEN df.exit_clarity_score IS NOT NULL THEN df.exit_clarity_score / 5.0 ELSE 0.0 END)
    ) AS intent_score,
    (
      10.0 * df.checked_in
      + 25.0 * MIN(df.stands_tapped_count, 8) / 8.0
      + 10.0 * MIN(df.unique_stand_categories, 4) / 4.0
      + 10.0 * MIN(df.conference_scans_count, 2) / 2.0
      + 20.0 * MIN(df.exhibitor_scans_count, 2) / 2.0
      + 10.0 * df.passport_completed
      + 10.0 * MIN(df.post_fair_email_clicks_count, 3) / 3.0
      + 5.0 * MIN(df.site_pageviews_7d, 6) / 6.0
    ) AS engagement_score,
    (
      45.0 * df.consent_partner
      + 15.0 * df.phone_present
      + 10.0 * df.consent_call
      + 10.0 * df.profile_rich
      + 10.0 * CASE WHEN df.exhibitor_scans_count > 0 THEN 1 ELSE 0 END
      + 10.0 * df.followup_cta_to_exhibitor
    ) AS monetisability_score,
    (
      25.0 * MIN(df.fields_interest_count, 3) / 3.0
      + 20.0 * df.programme_interest_present
      + 15.0 * df.bac_track_present
      + 15.0 * df.region_present
      + 25.0 * df.phone_present
    ) AS richness_score,
    CASE
      WHEN df.exhibitor_scans_count > 0 OR (df.consent_call = 1 AND df.followup_cta_to_exhibitor = 1) THEN 1
      ELSE 0
    END AS prequalified
  FROM derived_features df
)
SELECT
  c.fair_id,
  c.student_id,
  ROUND(c.intent_score, 4) AS intent_score,
  ROUND(c.engagement_score, 4) AS engagement_score,
  ROUND(c.monetisability_score, 4) AS monetisability_score,
  ROUND(c.richness_score, 4) AS richness_score,
  ROUND(0.40 * c.intent_score + 0.40 * c.engagement_score + 0.20 * c.monetisability_score, 4) AS total_score,
  c.prequalified,
  'v1',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM calc c;

INSERT INTO monetization (
  fair_id,
  student_id,
  tier_eur,
  resell_factor,
  monetisable_value_eur,
  created_at,
  updated_at
)
SELECT
  df.fair_id,
  df.student_id,
  CASE
    WHEN df.consent_partner = 0 THEN 0.0
    WHEN ls.prequalified = 1 THEN 23.0
    WHEN df.profile_rich = 1 THEN 22.5
    WHEN df.phone_present = 1 THEN 15.0
    ELSE 3.0
  END AS tier_eur,
  CASE
    WHEN df.unique_stand_categories <= 1 THEN 1
    WHEN df.unique_stand_categories = 2 THEN 2
    ELSE 3
  END AS resell_factor,
  (
    CASE
      WHEN df.consent_partner = 0 THEN 0.0
      WHEN ls.prequalified = 1 THEN 23.0
      WHEN df.profile_rich = 1 THEN 22.5
      WHEN df.phone_present = 1 THEN 15.0
      ELSE 3.0
    END
    * CASE
        WHEN df.unique_stand_categories <= 1 THEN 1
        WHEN df.unique_stand_categories = 2 THEN 2
        ELSE 3
      END
  ) AS monetisable_value_eur,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM derived_features df
JOIN lead_scores ls
  ON ls.fair_id = df.fair_id
 AND ls.student_id = df.student_id;

INSERT INTO kpi_daily (
  fair_id,
  kpi_date,
  total_students,
  checked_in_students,
  stand_taps,
  conference_scans,
  exhibitor_scans,
  post_fair_email_clicks,
  partner_optin_rate,
  call_optin_rate,
  total_monetisable_value_eur,
  created_at,
  updated_at
)
WITH day_events AS (
  SELECT
    e.fair_id,
    DATE(e.event_time) AS kpi_date,
    COUNT(DISTINCT CASE WHEN e.event_type = 'check_in' THEN e.student_id END) AS checked_in_students,
    SUM(CASE WHEN e.event_type = 'stand_tap' THEN 1 ELSE 0 END) AS stand_taps,
    SUM(CASE WHEN e.event_type = 'conference_scan' THEN 1 ELSE 0 END) AS conference_scans,
    SUM(CASE WHEN e.event_type = 'exhibitor_scan' THEN 1 ELSE 0 END) AS exhibitor_scans,
    SUM(CASE WHEN e.event_type = 'post_fair_email_click' THEN 1 ELSE 0 END) AS post_fair_email_clicks
  FROM events e
  GROUP BY e.fair_id, DATE(e.event_time)
),
optins AS (
  SELECT
    s.fair_id,
    AVG(CAST(sc.consent_partners AS REAL)) AS partner_optin_rate,
    AVG(CAST(sc.consent_call AS REAL)) AS call_optin_rate
  FROM students s
  LEFT JOIN student_consents sc ON sc.student_id = s.id
  GROUP BY s.fair_id
),
day_values AS (
  WITH active_students AS (
    SELECT DISTINCT
      e.fair_id,
      DATE(e.event_time) AS kpi_date,
      e.student_id
    FROM events e
  )
  SELECT
    a.fair_id,
    a.kpi_date,
    SUM(m.monetisable_value_eur) AS total_monetisable_value_eur
  FROM active_students a
  JOIN monetization m
    ON m.student_id = a.student_id
   AND m.fair_id = a.fair_id
  GROUP BY a.fair_id, a.kpi_date
)
SELECT
  de.fair_id,
  de.kpi_date,
  (SELECT COUNT(*) FROM students s WHERE s.fair_id = de.fair_id) AS total_students,
  de.checked_in_students,
  de.stand_taps,
  de.conference_scans,
  de.exhibitor_scans,
  de.post_fair_email_clicks,
  ROUND(COALESCE(o.partner_optin_rate, 0), 4) AS partner_optin_rate,
  ROUND(COALESCE(o.call_optin_rate, 0), 4) AS call_optin_rate,
  ROUND(COALESCE(dv.total_monetisable_value_eur, 0), 2) AS total_monetisable_value_eur,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM day_events de
LEFT JOIN optins o
  ON o.fair_id = de.fair_id
LEFT JOIN day_values dv
  ON dv.fair_id = de.fair_id
 AND dv.kpi_date = de.kpi_date;

COMMIT;
