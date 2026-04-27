# SQL Example Query Pack

## 1 Top 10 stands by scans/downloads/high-intent

```sql
SELECT
  v.fair_id,
  v.stand_code,
  v.exhibitor_name,
  v.stand_category,
  v.stand_taps,
  v.brochure_requests,
  v.exhibitor_scans,
  v.high_intent_unique_students,
  (v.stand_taps + v.brochure_requests + v.exhibitor_scans) AS interaction_score
FROM vw_stand_popularity v
WHERE v.fair_id = ?
ORDER BY interaction_score DESC, v.high_intent_unique_students DESC
LIMIT 10;
```

## 2 Top conferences

```sql
SELECT
  fair_id,
  conference_code,
  conference_title,
  topic,
  speaker_name,
  conference_scans,
  unique_attendees
FROM vw_conference_popularity
WHERE fair_id = ?
ORDER BY conference_scans DESC, unique_attendees DESC
LIMIT 10;
```

## 3 Lead detail with score breakdown and drivers

```sql
SELECT
  v.fair_id,
  v.student_id,
  v.full_name,
  v.email,
  v.intent_score,
  v.engagement_score,
  v.monetisability_score,
  v.richness_score,
  v.total_score,
  v.prequalified,
  v.tier_eur,
  v.resell_factor,
  v.monetisable_value_eur,
  v.fields_interest_count,
  v.stands_tapped_count,
  v.unique_stand_categories,
  v.exhibitor_scans_count,
  v.followup_cta_to_exhibitor,
  v.consent_partners,
  v.consent_call,
  CASE WHEN v.programme_of_interest IS NOT NULL THEN 1 ELSE 0 END AS programme_interest_present
FROM vw_lead_overview v
WHERE v.fair_id = ?
  AND v.student_id = ?;
```

## 4 KPI summary for fair dashboard

```sql
SELECT
  kd.kpi_date,
  kd.total_students,
  kd.checked_in_students,
  kd.stand_taps,
  kd.conference_scans,
  kd.exhibitor_scans,
  kd.post_fair_email_clicks,
  ROUND(kd.partner_optin_rate * 100, 2) AS partner_optin_pct,
  ROUND(kd.call_optin_rate * 100, 2) AS call_optin_pct,
  kd.total_monetisable_value_eur
FROM kpi_daily kd
WHERE kd.fair_id = ?
ORDER BY kd.kpi_date;
```

## 5 Total monetisable value and by tier

```sql
SELECT fair_id, total_monetisable_value_eur, avg_value_eur, leads_count
FROM vw_total_monetisable_value
WHERE fair_id = ?;
```

```sql
SELECT fair_id, tier_eur, leads_count, total_value_eur
FROM vw_tier_distribution
WHERE fair_id = ?
ORDER BY tier_eur DESC;
```
