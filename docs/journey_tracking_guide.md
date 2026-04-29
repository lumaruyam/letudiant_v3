# Complete Customer Journey Data Capture — Implementation Guide

## Overview
This guide maps the Léa & Thomas personas to your database schema and outlines what needs to be implemented to capture their full journey.

---

## Phase 1: Direct Data Capture (Your App & Backend Control)

### ✅ BEFORE THE FAIR

| Persona Data | DB Table | Status | Action |
|---|---|---|---|
| Discovery source (Instagram, school) | `discovery_sources` | ❌ NEW | Add `source_channel` parameter to registration form |
| Registration device type | `discovery_sources` | ❌ NEW | Capture `User-Agent` on registration |
| Registration time | `discovery_sources` | ❌ NEW | Measure form completion duration |
| Pre-fair app opens | `pre_fair_engagement` | ❌ NEW | Track app session events |
| Bookmarks & flags | `pre_fair_engagement` | ✓ EXISTS | Already tracked in `derived_features.bookmarks_count` |
| Pre-visit guide opened | `pre_fair_engagement` | ❌ NEW | Add in-app guide view events |
| Pre-visit questions | `pre_fair_engagement` | ❌ NEW | Add form to collect pre-arrival questions |
| Parcoursup stage inference | `pre_fair_engagement` | ❌ NEW | Optional: Let user declare status |
| Pre-fair email engagement | Extend `events` table | ⚠️ PARTIAL | Currently tracked but not contextual |

### ✅ DURING THE FAIR

| Persona Data | DB Table | Status | Action |
|---|---|---|---|
| Arrival timestamp & entry | `stand_visits` | ⚠️ PARTIAL | Add entry gate scan or check-in event |
| Stand dwell time (12 min vs 8 min) | `stand_visits.dwell_time_seconds` | ❌ NEW | Capture visit start/end timestamps |
| Conversation happened | `stand_visits.conversation_happened` | ❌ NEW | Exhibitor marks checkbox or NFC badge triggers |
| Conversation duration | `stand_visits.conversation_duration_seconds` | ❌ NEW | Manual entry by exhibitor or badge duration |
| Conversation topics | `stand_visits.conversation_topics` | ❌ NEW | Quick-select buttons at exhibitor stand |
| Photos of materials | `stand_visits.materials_photographed` | ❌ NEW | Integrate with phone camera or manual flag |
| Brochure taken vs photo | `stand_visits.brochure_taken` | ✓ EXISTS | Extend payload_json in events |
| Comparative shopping | `stand_visits.comparative_visit` | ❌ NEW | Track multiple visits to competing stands |
| Conference early departure | `conference_attendance.early_departure` | ❌ NEW | Capture session exit time vs duration |
| Peer conversations | `peer_interactions` | ❌ NEW | NFC badge detection or manual form |
| Fatigue/engagement drop | `engagement_state` | ❌ NEW | Detect via activity patterns |
| Primary vs secondary browsing | `stand_visits.primary_vs_secondary` | ❌ NEW | Tag via exhibitor or implicit from dwell |

### ✅ AFTER THE FAIR (Day 1-7)

| Persona Data | DB Table | Status | Action |
|---|---|---|---|
| App review of bookmarks | `post_fair_app_review` | ❌ NEW | Track app session + bookmark interactions |
| Stands missed (regret signal) | `post_fair_app_review.stands_not_visited_count` | ❌ NEW | Compare bookmarks to actual visits |
| Post-visit app engagement | `content_consumption` | ❌ NEW | Track masterclass views, programme pages |
| Shares to family/peers | `network_signals` | ❌ NEW | Track programmatic exports or deep links |
| Post-fair email opens/clicks | Extend `events` table | ✓ EXISTS | Already tracked |
| Return to platform | `churn_signals` | ✓ PARTIAL | Track via `site_pageviews_7d` |

---

## Phase 2: External Data Integration (Requires Partnerships)

### ⚠️ SCHOOL WEBSITES & EXTERNAL RETARGETING

These require **pixel tracking** or **API partnerships**:

| Data Point | Source | Method | Priority |
|---|---|---|---|
| School website visits after fair | External schools | Pixel tag on school domains | HIGH |
| Specific pages viewed | External schools | Pixel parameters | MEDIUM |
| Time spent on programme page | External schools | Pixel tracking + analytics | MEDIUM |
| Form interactions | External schools | Pixel event tracking | HIGH |

**Implementation:** Insert tracking pixel in follow-up emails or generate unique short URLs that redirect to school sites with UTM parameters.

### ⚠️ PARCOURSUP API INTEGRATION

| Data Point | Source | Method | Priority |
|---|---|---|---|
| Programmes on student's list | Parcoursup API | OAuth + API call after fair | HIGH |
| List changes post-fair | Parcoursup API | Periodic sync or event webhook | HIGH |
| Deadline proximity | Parcoursup API | Calendar event sync | MEDIUM |
| Confidence assessment | Parcoursup API | (Not available — must infer) | LOW |

**Implementation:** Request Parcoursup API access; sync on Day 3 post-fair and before deadline.

### ⚠️ DIRECT EMAIL SIGNALS

| Data Point | Source | Method | Priority |
|---|---|---|---|
| Email sent to exhibitor | CRM/Email headers | Forwarding rule or email notification | HIGH |
| Email content analysis | CRM/Gmail API | Automated extraction of intent | MEDIUM |

**Implementation:** Add automations in Gmail or CRM to capture inbound emails matching student profiles.

---

## Phase 3: Implementation Roadmap

### Week 1: Foundation
- [ ] Apply migration `004_journey_tracking.sql` to existing database
- [ ] Add `stand_visits` table and deprecate simple `events.stand_tap`
- [ ] Implement on-site dwell time tracking (capture visit start/end)
- [ ] Add exhibitor UI for "conversation happened" checkbox

### Week 2: Pre & Post Fair
- [ ] Extend registration form to capture discovery source
- [ ] Create pre-visit question form
- [ ] Implement post-fair app review tracking
- [ ] Add masterclass/content consumption logging

### Week 3: Intent Signals
- [ ] Integrate Parcoursup API (OAuth flow)
- [ ] Set up pixel tracking for external school websites
- [ ] Create "family export" feature with tracking
- [ ] Implement churn detection

### Week 4: Scoring & Recommendations
- [ ] Rebuild `lead_scores` based on new journey data
- [ ] Create `journey_completeness_score` combining all phases
- [ ] Build re-engagement email triggers based on churn signals
- [ ] Generate exhibitor-facing "high-intent lead" recommendations

---

## Example: Capturing Léa's Full Journey

```sql
-- 1. Discovery (Before Fair)
INSERT INTO discovery_sources (fair_id, student_id, source_channel, registration_device)
VALUES (1, 101, 'instagram', 'mobile');

-- 2. Pre-Fair Prep
INSERT INTO pre_fair_engagement (fair_id, student_id, app_opens_before_fair, bookmarks_count, conference_flags_count)
VALUES (1, 101, 3, 2, 1);

-- 3. Stand Visit 1: HR Master's (12 min, conversation)
INSERT INTO stand_visits
  (fair_id, student_id, stand_id, visit_start, visit_end, dwell_time_seconds,
   conversation_happened, conversation_duration_seconds, conversation_topics, primary_vs_secondary)
VALUES (1, 101, 5, '2026-04-28 14:30:00', '2026-04-28 14:42:00', 720, 1, 720,
  '["entry_requirements","application_timeline"]', 'primary');

-- 4. Stand Visit 2: UX Research (8 min, materials photographed)
INSERT INTO stand_visits
  (fair_id, student_id, stand_id, visit_start, visit_end, dwell_time_seconds,
   materials_photographed, comparative_visit, primary_vs_secondary)
VALUES (1, 101, 8, '2026-04-28 14:50:00', '2026-04-28 14:58:00', 480, 1, 1, 'primary');

-- 5. Conference attendance (attended but left early)
INSERT INTO conference_attendance
  (fair_id, student_id, conference_id, arrival_time, departure_time,
   attended_duration_seconds, session_duration_seconds, early_departure)
VALUES (1, 101, 3, '2026-04-28 15:20:00', '2026-04-28 15:35:00', 900, 1800, 1);

-- 6. Post-fair email sent to exhibitor (CRM integration)
INSERT INTO direct_contact_signals
  (fair_id, student_id, stand_id, contact_type, contact_time, initiated_by)
VALUES (1, 101, 5, 'email_to_exhibitor', '2026-04-28 19:15:00', 'student');

-- 7. Post-fair Parcoursup change
INSERT INTO parcoursup_tracking
  (fair_id, student_id, parcoursup_programmes_before_fair, parcoursup_programmes_after_fair,
   fair_influenced_decision)
VALUES (1, 101, 5, 6, 1);

-- 8. High-intent scoring
UPDATE journey_scores
SET journey_completeness_score = 0.92,
    stand_depth_score = 0.95,
    post_fair_action_score = 0.98
WHERE student_id = 101 AND fair_id = 1;
```

---

## Query: Identify High-Intent Leads Like Léa

```sql
SELECT
  s.id,
  s.fair_id,
  COALESCE(sp.full_name, 'Unknown') as name,
  COUNT(DISTINCT sv.stand_id) as stands_visited,
  SUM(sv.dwell_time_seconds) / 60.0 as total_dwell_minutes,
  SUM(CASE WHEN sv.conversation_happened = 1 THEN 1 ELSE 0 END) as conversations_had,
  SUM(CASE WHEN sv.materials_photographed = 1 THEN 1 ELSE 0 END) as materials_photographed,
  COUNT(DISTINCT dcs.id) as direct_contacts_sent,
  COALESCE(pt.fair_influenced_decision, 0) as parcoursup_influenced,
  js.journey_completeness_score
FROM students s
LEFT JOIN student_profiles sp ON s.id = sp.student_id
LEFT JOIN stand_visits sv ON s.id = sv.student_id
LEFT JOIN direct_contact_signals dcs ON s.id = dcs.student_id
LEFT JOIN parcoursup_tracking pt ON s.id = pt.student_id
LEFT JOIN journey_scores js ON s.id = js.student_id
WHERE sv.stand_id IS NOT NULL
GROUP BY s.id
HAVING
  SUM(sv.dwell_time_seconds) > 600  -- 10+ minutes on-site engagement
  AND SUM(CASE WHEN sv.conversation_happened = 1 THEN 1 ELSE 0 END) >= 1  -- Had conversations
  AND COUNT(DISTINCT dcs.id) > 0  -- Sent follow-up email
ORDER BY js.journey_completeness_score DESC;
```

---

## Next Steps

1. **Review** this schema with your backend team
2. **Prioritize** which tables to implement first (Weeks 1-2 recommended)
3. **Coordinate** with exhibitors on data capture (dwell time, conversations)
4. **Secure** Parcoursup API partnership (weeks 3-4)
5. **Rebuild** scoring engine to weight complete journey data over just registration

This transforms you from tracking **transactions** → **relationships** → **journeys**.
