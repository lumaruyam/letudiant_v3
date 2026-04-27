PRAGMA foreign_keys = ON;

-- Test report format: each SELECT returns PASS/FAIL with details.

-- 1) Row counts are coherent across core tables
SELECT
  'row_counts_present' AS test_name,
  CASE
    WHEN (SELECT COUNT(*) FROM students) > 0
     AND (SELECT COUNT(*) FROM source_students) > 0
     AND (SELECT COUNT(*) FROM events) > 0
     AND (SELECT COUNT(*) FROM derived_features) = (SELECT COUNT(*) FROM students)
     AND (SELECT COUNT(*) FROM lead_scores) = (SELECT COUNT(*) FROM students)
     AND (SELECT COUNT(*) FROM monetization) = (SELECT COUNT(*) FROM students)
      THEN 'PASS'
    ELSE 'FAIL'
  END AS status,
  (
    'students=' || (SELECT COUNT(*) FROM students)
    || ', source_students=' || (SELECT COUNT(*) FROM source_students)
    || ', events=' || (SELECT COUNT(*) FROM events)
    || ', derived=' || (SELECT COUNT(*) FROM derived_features)
    || ', scores=' || (SELECT COUNT(*) FROM lead_scores)
    || ', monetization=' || (SELECT COUNT(*) FROM monetization)
  ) AS details;

-- 2) 20% fast registration conversion rule on school_group among eligible (visited_site=0)
WITH eligible AS (
  SELECT COUNT(*) AS n
  FROM students
  WHERE student_subgroup = 'school_group' AND visited_site = 0
),
converted AS (
  SELECT COUNT(*) AS n
  FROM students
  WHERE student_subgroup = 'school_group'
    AND visited_site = 0
    AND registration_channel = 'fast'
),
rate AS (
  SELECT
    e.n AS eligible_n,
    c.n AS converted_n,
    CASE WHEN e.n = 0 THEN 0.0 ELSE CAST(c.n AS REAL) / e.n END AS conversion_rate
  FROM eligible e
  CROSS JOIN converted c
)
SELECT
  'fast_registration_conversion_20pct' AS test_name,
  CASE WHEN conversion_rate BETWEEN 0.19 AND 0.21 THEN 'PASS' ELSE 'FAIL' END AS status,
  'eligible=' || eligible_n || ', converted=' || converted_n || ', rate=' || ROUND(conversion_rate, 4) AS details
FROM rate;

-- 3) Coverage targets within tolerance for registered profiles
WITH reg AS (
  SELECT COUNT(*) AS n
  FROM students
  WHERE is_registered = 1
),
coverage AS (
  SELECT
    r.n AS registered_n,
    AVG(CASE WHEN sp.full_name IS NOT NULL THEN 1.0 ELSE 0.0 END) AS full_name_cov,
    AVG(CASE WHEN sp.email IS NOT NULL THEN 1.0 ELSE 0.0 END) AS email_cov,
    AVG(CASE WHEN sp.current_study_level IS NOT NULL THEN 1.0 ELSE 0.0 END) AS study_cov,
    AVG(CASE WHEN sp.date_of_birth IS NOT NULL THEN 1.0 ELSE 0.0 END) AS dob_cov,
    AVG(CASE WHEN sp.phone IS NOT NULL THEN 1.0 ELSE 0.0 END) AS phone_cov,
    AVG(CASE WHEN sp.postal_region IS NOT NULL THEN 1.0 ELSE 0.0 END) AS region_cov,
    AVG(CASE WHEN sp.gender IS NOT NULL THEN 1.0 ELSE 0.0 END) AS gender_cov,
    AVG(CASE WHEN sp.bac_track_type IS NOT NULL THEN 1.0 ELSE 0.0 END) AS bac_cov,
    AVG(CASE WHEN sp.fields_interest_count > 0 THEN 1.0 ELSE 0.0 END) AS fields_cov,
    AVG(CASE WHEN sp.programme_of_interest IS NOT NULL THEN 1.0 ELSE 0.0 END) AS programme_cov,
    AVG(CASE WHEN sc.student_id IS NOT NULL THEN 1.0 ELSE 0.0 END) AS consent_cov,
    AVG(CASE WHEN pfs.pre_fair_email_opens > 0 OR pfs.pre_fair_email_clicks > 0 THEN 1.0 ELSE 0.0 END) AS prefair_active_cov
  FROM students s
  LEFT JOIN student_profiles sp ON sp.student_id = s.id
  LEFT JOIN student_consents sc ON sc.student_id = s.id
  LEFT JOIN pre_fair_signals pfs ON pfs.student_id = s.id
  CROSS JOIN reg r
  WHERE s.is_registered = 1
)
SELECT
  'coverage_targets_with_tolerance' AS test_name,
  CASE
    WHEN full_name_cov = 1.0
     AND email_cov = 1.0
     AND study_cov = 1.0
     AND consent_cov = 1.0
     AND dob_cov BETWEEN 0.90 AND 0.99
     AND phone_cov BETWEEN 0.62 AND 0.78
     AND region_cov BETWEEN 0.52 AND 0.68
     AND gender_cov BETWEEN 0.84 AND 0.95
     AND bac_cov BETWEEN 0.78 AND 0.92
     AND fields_cov BETWEEN 0.72 AND 0.88
     AND programme_cov BETWEEN 0.52 AND 0.68
     AND prefair_active_cov BETWEEN 0.12 AND 0.24
      THEN 'PASS'
    ELSE 'FAIL'
  END AS status,
  'registered=' || registered_n
    || ', dob=' || ROUND(dob_cov, 3)
    || ', phone=' || ROUND(phone_cov, 3)
    || ', region=' || ROUND(region_cov, 3)
    || ', gender=' || ROUND(gender_cov, 3)
    || ', bac=' || ROUND(bac_cov, 3)
    || ', fields=' || ROUND(fields_cov, 3)
    || ', programme=' || ROUND(programme_cov, 3)
    || ', prefair_active=' || ROUND(prefair_active_cov, 3)
  AS details
FROM coverage;

-- 4) used_ORI and took_test unchanged from source snapshot
SELECT
  'used_ori_took_test_unchanged' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  'mismatches=' || COUNT(*) AS details
FROM students s
JOIN source_students ss
  ON ss.fair_id = s.fair_id
 AND ss.row_id = s.source_row_id
WHERE s.used_ori <> ss.used_ori
   OR s.took_test <> ss.took_test;

-- 5) ORI score must only exist when used_ori = 1
SELECT
  'ori_score_condition' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  'violations=' || COUNT(*) AS details
FROM students s
JOIN pre_fair_signals pfs ON pfs.student_id = s.id
WHERE s.used_ori = 0
  AND pfs.ori_test_score IS NOT NULL;

-- 6) No tier_eur > 0 when consent_partner = 0
SELECT
  'tier_requires_partner_consent' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  'violations=' || COUNT(*) AS details
FROM monetization m
JOIN derived_features df
  ON df.fair_id = m.fair_id
 AND df.student_id = m.student_id
WHERE df.consent_partner = 0
  AND m.tier_eur > 0;

-- 7) Monetisable value arithmetic validity
SELECT
  'monetisable_value_formula' AS test_name,
  CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END AS status,
  'violations=' || COUNT(*) AS details
FROM monetization
WHERE ABS(monetisable_value_eur - (tier_eur * resell_factor)) > 0.0001;
