-- QUERY GUIDE: Extract Data from Journey Tracking Tables
-- Run these queries in your SQLite terminal or via API

-- ============================================================================
-- 1. DISCOVERY SOURCES - Where students found the fair
-- ============================================================================

-- All discovery sources with student names
SELECT 
  ds.id,
  sp.full_name,
  ds.source_channel,
  ds.source_detail,
  ds.registration_device,
  ds.registration_time_seconds,
  ds.created_at
FROM discovery_sources ds
LEFT JOIN student_profiles sp ON ds.student_id = sp.student_id
ORDER BY ds.created_at DESC;

-- Breakdown by channel
SELECT 
  source_channel,
  COUNT(*) as count,
  AVG(registration_time_seconds) as avg_registration_time_sec,
  COUNT(DISTINCT fair_id) as fairs_affected
FROM discovery_sources
GROUP BY source_channel
ORDER BY count DESC;

-- ============================================================================
-- 2. PRE-FAIR ENGAGEMENT - How students prepared
-- ============================================================================

-- Students who engaged before fair
SELECT 
  sp.full_name,
  pfe.app_opens_before_fair,
  pfe.bookmarks_count,
  pfe.conference_flags_count,
  pfe.parcoursup_status,
  pfe.confidence_level,
  pfe.pre_fair_email_opens,
  pfe.pre_fair_email_clicks,
  pfe.created_at
FROM pre_fair_engagement pfe
LEFT JOIN student_profiles sp ON pfe.student_id = sp.student_id
WHERE pfe.app_opens_before_fair > 0
ORDER BY pfe.app_opens_before_fair DESC;

-- Pre-visit questions submitted
SELECT 
  sp.full_name,
  pfe.intent_questions_submitted,
  pfe.parcoursup_status,
  pfe.confidence_level
FROM pre_fair_engagement pfe
LEFT JOIN student_profiles sp ON pfe.student_id = sp.student_id
WHERE pfe.intent_questions_submitted IS NOT NULL;

-- ============================================================================
-- 3. STAND VISITS - Detailed on-site engagement
-- ============================================================================

-- All stand visits with dwell time
SELECT 
  sp.full_name,
  st.stand_code,
  st.exhibitor_name,
  sv.visit_start,
  sv.visit_end,
  ROUND(sv.dwell_time_seconds / 60.0, 1) as dwell_minutes,
  sv.conversation_happened,
  sv.materials_photographed,
  sv.primary_vs_secondary,
  sv.interest_level
FROM stand_visits sv
LEFT JOIN student_profiles sp ON sv.student_id = sp.student_id
LEFT JOIN stands st ON sv.stand_id = st.id
ORDER BY sv.visit_start;

-- Top stands by total dwell time
SELECT 
  st.exhibitor_name,
  COUNT(*) as visits,
  ROUND(SUM(sv.dwell_time_seconds) / 60.0, 1) as total_dwell_minutes,
  ROUND(AVG(sv.dwell_time_seconds) / 60.0, 1) as avg_dwell_minutes,
  COUNT(CASE WHEN sv.conversation_happened = 1 THEN 1 END) as conversations_count
FROM stand_visits sv
LEFT JOIN stands st ON sv.stand_id = st.id
GROUP BY sv.stand_id
ORDER BY SUM(sv.dwell_time_seconds) DESC;

-- High-intent stands (conversations + materials photographed)
SELECT 
  st.exhibitor_name,
  COUNT(*) as high_intent_visits,
  SUM(CASE WHEN sv.conversation_happened = 1 THEN 1 ELSE 0 END) as with_conversation,
  SUM(CASE WHEN sv.materials_photographed = 1 THEN 1 ELSE 0 END) as materials_photographed
FROM stand_visits sv
LEFT JOIN stands st ON sv.stand_id = st.id
WHERE sv.conversation_happened = 1 OR sv.materials_photographed = 1
GROUP BY sv.stand_id
ORDER BY COUNT(*) DESC;

-- Students with longest conversations (10+ minutes)
SELECT 
  sp.full_name,
  st.exhibitor_name,
  ROUND(sv.conversation_duration_seconds / 60.0, 1) as conversation_minutes,
  sv.conversation_topics,
  sv.visit_start
FROM stand_visits sv
LEFT JOIN student_profiles sp ON sv.student_id = sp.student_id
LEFT JOIN stands st ON sv.stand_id = st.id
WHERE sv.conversation_duration_seconds >= 600
ORDER BY sv.conversation_duration_seconds DESC;

-- Comparative shopping (students visiting competing stands)
SELECT 
  sp.full_name,
  COUNT(DISTINCT sv.stand_id) as stands_visited,
  SUM(CASE WHEN sv.primary_vs_secondary = 'primary' THEN 1 ELSE 0 END) as primary_visits,
  SUM(CASE WHEN sv.primary_vs_secondary = 'secondary' THEN 1 ELSE 0 END) as secondary_visits,
  SUM(CASE WHEN sv.comparative_visit = 1 THEN 1 ELSE 0 END) as comparative_visits
FROM stand_visits sv
LEFT JOIN student_profiles sp ON sv.student_id = sp.student_id
WHERE sv.comparative_visit = 1
GROUP BY sv.student_id
ORDER BY COUNT(DISTINCT sv.stand_id) DESC;

-- ============================================================================
-- 4. CONFERENCE ATTENDANCE - Session engagement
-- ============================================================================

-- Conference attendance with early departure detection
SELECT 
  sp.full_name,
  conf.conference_title,
  ca.arrival_time,
  ca.departure_time,
  ROUND(ca.attended_duration_seconds / 60.0, 1) as attended_minutes,
  ROUND(ca.session_duration_seconds / 60.0, 1) as session_duration_minutes,
  ca.early_departure,
  ROUND(CAST(ca.attended_duration_seconds AS FLOAT) / ca.session_duration_seconds * 100, 1) as completion_percent
FROM conference_attendance ca
LEFT JOIN student_profiles sp ON ca.student_id = sp.student_id
LEFT JOIN conferences conf ON ca.conference_id = conf.id
ORDER BY ca.arrival_time;

-- Sessions with high early departure rate
SELECT 
  conf.conference_title,
  COUNT(*) as attendees,
  SUM(CASE WHEN ca.early_departure = 1 THEN 1 ELSE 0 END) as early_departures,
  ROUND(SUM(CASE WHEN ca.early_departure = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as early_departure_percent
FROM conference_attendance ca
LEFT JOIN conferences conf ON ca.conference_id = conf.id
GROUP BY ca.conference_id
HAVING COUNT(*) >= 2
ORDER BY early_departure_percent DESC;

-- ============================================================================
-- 5. PEER INTERACTIONS - Social signals
-- ============================================================================

-- Peer interactions (students meeting each other)
SELECT 
  sp_a.full_name as student_a,
  sp_b.full_name as student_b,
  pi.interaction_type,
  pi.shared_profile_signal,
  pi.interaction_time
FROM peer_interactions pi
LEFT JOIN student_profiles sp_a ON pi.student_a_id = sp_a.student_id
LEFT JOIN student_profiles sp_b ON pi.student_b_id = sp_b.student_id
ORDER BY pi.interaction_time DESC;

-- Students with most peer interactions
SELECT 
  sp.full_name,
  COUNT(*) as interactions,
  COUNT(DISTINCT student_b_id) as unique_peers
FROM peer_interactions
LEFT JOIN student_profiles sp ON student_a_id = sp.student_id
GROUP BY student_a_id
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 6. ENGAGEMENT STATE - Fatigue and engagement tracking
-- ============================================================================

-- Engagement state throughout the day
SELECT 
  sp.full_name,
  es.state_timestamp,
  es.state,
  es.app_activity_intensity,
  es.time_since_last_stand_visit,
  es.conversation_count_so_far
FROM engagement_state es
LEFT JOIN student_profiles sp ON es.student_id = sp.student_id
ORDER BY es.state_timestamp;

-- Students with fatigue episodes
SELECT 
  sp.full_name,
  COUNT(*) as fatigue_episodes,
  MIN(es.state_timestamp) as first_fatigue,
  MAX(es.state_timestamp) as last_fatigue
FROM engagement_state es
LEFT JOIN student_profiles sp ON es.student_id = sp.student_id
WHERE es.state = 'fatigue'
GROUP BY es.student_id
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 7. POST-FAIR APP REVIEW - Regret and re-engagement signals
-- ============================================================================

-- Post-fair app sessions with bookmark review
SELECT 
  sp.full_name,
  pfa.first_post_fair_session,
  pfa.bookmarks_reviewed,
  pfa.stands_not_visited_count,
  ROUND(pfa.time_in_app_seconds / 60.0, 1) as time_in_app_minutes,
  pfa.shares_initiated
FROM post_fair_app_review pfa
LEFT JOIN student_profiles sp ON pfa.student_id = sp.student_id
ORDER BY pfa.first_post_fair_session DESC;

-- Students with unmet intent (bookmarked but didn't visit)
SELECT 
  sp.full_name,
  pfa.stands_not_visited_count,
  pfe.bookmarks_count,
  ROUND(pfa.stands_not_visited_count * 100.0 / pfe.bookmarks_count, 1) as missed_percentage
FROM post_fair_app_review pfa
LEFT JOIN pre_fair_engagement pfe ON pfa.student_id = pfe.student_id
LEFT JOIN student_profiles sp ON pfa.student_id = sp.student_id
WHERE pfa.stands_not_visited_count > 0
ORDER BY missed_percentage DESC;

-- ============================================================================
-- 8. EXTERNAL ENGAGEMENT - Off-platform activity
-- ============================================================================

-- School website visits after fair
SELECT 
  sp.full_name,
  ee.event_type,
  ee.target_entity,
  ee.event_time,
  ee.metadata_json
FROM external_engagement ee
LEFT JOIN student_profiles sp ON ee.student_id = sp.student_id
WHERE ee.event_type = 'school_website_visit'
ORDER BY ee.event_time DESC;

-- Programme page views with engagement timeline
SELECT 
  sp.full_name,
  ee.target_entity,
  COUNT(*) as visits,
  MIN(ee.event_time) as first_visit,
  MAX(ee.event_time) as last_visit,
  GROUP_CONCAT(ee.event_time) as visit_times
FROM external_engagement ee
LEFT JOIN student_profiles sp ON ee.student_id = sp.student_id
WHERE ee.event_type IN ('programme_page_view', 'school_website_visit')
GROUP BY ee.student_id, ee.target_entity
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 9. DIRECT CONTACT SIGNALS - High-intent follow-ups
-- ============================================================================

-- Emails sent to exhibitors (strongest signal)
SELECT 
  sp.full_name,
  st.exhibitor_name,
  dcs.contact_type,
  dcs.contact_time,
  dcs.subject_implied
FROM direct_contact_signals dcs
LEFT JOIN student_profiles sp ON dcs.student_id = sp.student_id
LEFT JOIN stands st ON dcs.stand_id = st.id
WHERE dcs.contact_type = 'email_to_exhibitor'
ORDER BY dcs.contact_time DESC;

-- Exhibitors receiving direct contact
SELECT 
  st.exhibitor_name,
  COUNT(*) as direct_contacts,
  COUNT(DISTINCT dcs.student_id) as unique_students,
  GROUP_CONCAT(DISTINCT sp.full_name) as student_names
FROM direct_contact_signals dcs
LEFT JOIN student_profiles sp ON dcs.student_id = sp.student_id
LEFT JOIN stands st ON dcs.stand_id = st.id
GROUP BY dcs.stand_id
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 10. PARCOURSUP TRACKING - Decision influence
-- ============================================================================

-- Fair-influenced Parcoursup decisions
SELECT 
  sp.full_name,
  pt.parcoursup_programmes_before_fair,
  pt.parcoursup_programmes_after_fair,
  pt.programmes_added,
  pt.programmes_removed,
  pt.fair_influenced_decision,
  pt.confidence_change
FROM parcoursup_tracking pt
LEFT JOIN student_profiles sp ON pt.student_id = sp.student_id
WHERE pt.fair_influenced_decision = 1
ORDER BY pt.updated_at DESC;

-- Programme add/remove patterns
SELECT 
  sp.full_name,
  pt.programmes_added,
  pt.programmes_removed,
  (pt.parcoursup_programmes_after_fair - pt.parcoursup_programmes_before_fair) as net_change,
  pt.days_to_deadline
FROM parcoursup_tracking pt
LEFT JOIN student_profiles sp ON pt.student_id = sp.student_id
WHERE pt.programmes_added IS NOT NULL OR pt.programmes_removed IS NOT NULL
ORDER BY pt.updated_at DESC;

-- ============================================================================
-- 11. NETWORK SIGNALS - Family and peer influence
-- ============================================================================

-- Content shared to family/network
SELECT 
  sp.full_name,
  ns.network_member_type,
  ns.shared_content,
  ns.share_method,
  ns.shared_at
FROM network_signals ns
LEFT JOIN student_profiles sp ON ns.student_id = sp.student_id
ORDER BY ns.shared_at DESC;

-- Share patterns by network type
SELECT 
  network_member_type,
  share_method,
  COUNT(*) as count,
  COUNT(DISTINCT student_id) as students
FROM network_signals
GROUP BY network_member_type, share_method
ORDER BY COUNT(*) DESC;

-- ============================================================================
-- 12. CONTENT CONSUMPTION - Post-fair engagement
-- ============================================================================

-- Masterclass and content views
SELECT 
  sp.full_name,
  cc.content_type,
  cc.content_title,
  cc.first_view_time,
  cc.total_views,
  ROUND(cc.total_watch_seconds / 60.0, 1) as total_watch_minutes,
  ROUND(cc.completion_rate * 100, 1) as completion_percent
FROM content_consumption cc
LEFT JOIN student_profiles sp ON cc.student_id = sp.student_id
WHERE cc.content_type IN ('masterclass', 'webinar')
ORDER BY cc.first_view_time DESC;

-- Most-watched content
SELECT 
  cc.content_type,
  cc.content_title,
  COUNT(DISTINCT cc.student_id) as viewers,
  ROUND(AVG(cc.completion_rate) * 100, 1) as avg_completion_percent,
  ROUND(AVG(cc.total_watch_seconds) / 60.0, 1) as avg_watch_minutes
FROM content_consumption cc
GROUP BY cc.content_type, cc.content_id
ORDER BY COUNT(DISTINCT cc.student_id) DESC;

-- ============================================================================
-- 13. CHURN SIGNALS - Re-engagement risk
-- ============================================================================

-- Students at risk of churning
SELECT 
  sp.full_name,
  ch.last_engagement_date,
  ch.days_to_first_churn,
  ch.engagement_window_days,
  ch.reason_inferred,
  ch.re_engaged,
  ch.re_engagement_attempts
FROM churn_signals ch
LEFT JOIN student_profiles sp ON ch.student_id = sp.student_id
WHERE ch.re_engaged = 0
ORDER BY ch.last_engagement_date DESC;

-- Re-engagement success rate
SELECT 
  reason_inferred,
  COUNT(*) as churned_students,
  SUM(CASE WHEN re_engaged = 1 THEN 1 ELSE 0 END) as re_engaged_count,
  ROUND(SUM(CASE WHEN re_engaged = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1) as re_engagement_rate
FROM churn_signals
GROUP BY reason_inferred;

-- ============================================================================
-- 14. JOURNEY SCORES - Complete journey assessment
-- ============================================================================

-- All journey scores sorted by completeness
SELECT 
  sp.full_name,
  js.discovery_strength,
  js.prep_engagement_score,
  js.stand_depth_score,
  js.conversation_quality_score,
  js.post_fair_action_score,
  js.parcoursup_influence_score,
  js.churn_risk,
  js.family_influence_factor,
  js.journey_completeness_score
FROM journey_scores js
LEFT JOIN student_profiles sp ON js.student_id = sp.student_id
ORDER BY js.journey_completeness_score DESC;

-- Top-tier journeys (high-intent leads)
SELECT 
  sp.full_name,
  sp.email,
  js.journey_completeness_score,
  js.stand_depth_score,
  js.conversation_quality_score,
  js.post_fair_action_score,
  COUNT(DISTINCT dcs.id) as direct_contacts
FROM journey_scores js
LEFT JOIN student_profiles sp ON js.student_id = sp.student_id
LEFT JOIN direct_contact_signals dcs ON js.student_id = dcs.student_id
WHERE js.journey_completeness_score >= 0.8
GROUP BY js.student_id
ORDER BY js.journey_completeness_score DESC;

-- ============================================================================
-- BONUS: COMPLETE JOURNEY PROFILE (All-in-one view)
-- ============================================================================

-- Full journey for a specific student
SELECT 
  sp.full_name,
  sp.email,
  -- Discovery
  ds.source_channel,
  -- Pre-fair
  pfe.app_opens_before_fair,
  pfe.bookmarks_count,
  pfe.confidence_level,
  -- During fair
  COUNT(DISTINCT sv.stand_id) as stands_visited,
  SUM(sv.dwell_time_seconds) / 60.0 as total_dwell_minutes,
  SUM(CASE WHEN sv.conversation_happened = 1 THEN 1 ELSE 0 END) as conversations,
  -- Post-fair
  pfa.stands_not_visited_count,
  COUNT(DISTINCT cc.id) as content_pieces_viewed,
  -- Direct intent
  COUNT(DISTINCT dcs.id) as direct_contacts,
  -- Parcoursup
  COALESCE(pt.fair_influenced_decision, 0) as fair_influenced_decision,
  -- Overall score
  js.journey_completeness_score
FROM student_profiles sp
LEFT JOIN discovery_sources ds ON sp.student_id = ds.student_id
LEFT JOIN pre_fair_engagement pfe ON sp.student_id = pfe.student_id
LEFT JOIN stand_visits sv ON sp.student_id = sv.student_id
LEFT JOIN post_fair_app_review pfa ON sp.student_id = pfa.student_id
LEFT JOIN content_consumption cc ON sp.student_id = cc.student_id
LEFT JOIN direct_contact_signals dcs ON sp.student_id = dcs.student_id
LEFT JOIN parcoursup_tracking pt ON sp.student_id = pt.student_id
LEFT JOIN journey_scores js ON sp.student_id = js.student_id
GROUP BY sp.student_id
ORDER BY js.journey_completeness_score DESC;
