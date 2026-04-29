-- Extend schema to capture complete customer journey from Léa & Thomas personas

-- 1. DISCOVERY & REGISTRATION CONTEXT
CREATE TABLE IF NOT EXISTS discovery_sources (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  source_channel TEXT NOT NULL CHECK (source_channel IN ('instagram', 'facebook', 'school_referral', 'organic_search', 'email', 'word_of_mouth', 'other')),
  source_detail TEXT, -- e.g., "Instagram sponsored post", "School announcement"
  referrer_id INTEGER, -- if referred by another student
  registration_device TEXT CHECK (registration_device IN ('mobile', 'tablet', 'desktop')),
  registration_time_seconds INTEGER, -- how long registration took
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (referrer_id) REFERENCES students(id) ON DELETE SET NULL
);

-- 2. PRE-FAIR ENGAGEMENT & PREPARATION
CREATE TABLE IF NOT EXISTS pre_fair_engagement (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  app_opens_before_fair INTEGER NOT NULL DEFAULT 0,
  last_app_open_before_fair TEXT,
  bookmarks_count INTEGER NOT NULL DEFAULT 0,
  conference_flags_count INTEGER NOT NULL DEFAULT 0,
  pre_visit_guide_opened INTEGER NOT NULL DEFAULT 0 CHECK (pre_visit_guide_opened IN (0, 1)),
  intent_questions_submitted TEXT, -- JSON array of pre-visit questions
  parcoursup_status TEXT CHECK (parcoursup_status IN ('no_list', 'early_stage', 'mid_stage', 'final_stage')),
  confidence_level INTEGER CHECK (confidence_level BETWEEN 1 AND 5),
  pre_fair_email_opens INTEGER NOT NULL DEFAULT 0,
  pre_fair_email_clicks INTEGER NOT NULL DEFAULT 0,
  discovered_psychology_profile INTEGER NOT NULL DEFAULT 0 CHECK (discovered_psychology_profile IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 3. ON-SITE DETAILED VISIT TRACKING (replaces simple stand_tap)
CREATE TABLE IF NOT EXISTS stand_visits (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  stand_id INTEGER NOT NULL,
  visit_start TEXT NOT NULL,
  visit_end TEXT,
  dwell_time_seconds INTEGER,
  conversation_happened INTEGER NOT NULL DEFAULT 0 CHECK (conversation_happened IN (0, 1)),
  conversation_duration_seconds INTEGER,
  conversation_topics TEXT, -- JSON array: ["entry_requirements", "employment_data", "alumni_network"]
  materials_photographed INTEGER NOT NULL DEFAULT 0 CHECK (materials_photographed IN (0, 1)),
  brochure_taken INTEGER NOT NULL DEFAULT 0 CHECK (brochure_taken IN (0, 1)),
  qr_code_scanned INTEGER NOT NULL DEFAULT 0 CHECK (qr_code_scanned IN (0, 1)),
  interest_level INTEGER CHECK (interest_level BETWEEN 1 AND 5),
  comparative_visit INTEGER NOT NULL DEFAULT 0 CHECK (comparative_visit IN (0, 1)), -- visiting competing programmes
  primary_vs_secondary TEXT CHECK (primary_vs_secondary IN ('primary', 'secondary', 'exploratory')),
  engagement_score REAL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE CASCADE
);

-- 4. CONFERENCE & SESSION ENGAGEMENT
CREATE TABLE IF NOT EXISTS conference_attendance (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  conference_id INTEGER NOT NULL,
  arrival_time TEXT,
  departure_time TEXT,
  attended_duration_seconds INTEGER,
  session_duration_seconds INTEGER,
  early_departure INTEGER NOT NULL DEFAULT 0 CHECK (early_departure IN (0, 1)), -- signal of unmet need
  engagement_notes TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE CASCADE
);

-- 5. SOCIAL & PEER SIGNALS
CREATE TABLE IF NOT EXISTS peer_interactions (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_a_id INTEGER NOT NULL,
  student_b_id INTEGER,
  interaction_type TEXT CHECK (interaction_type IN ('peer_chat', 'group_conversation', 'shared_interest', 'referral')),
  interaction_time TEXT,
  shared_profile_signal TEXT, -- e.g., "both_reorientation", "both_uncertain"
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_a_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (student_b_id) REFERENCES students(id) ON DELETE SET NULL
);

-- 6. FATIGUE & ENGAGEMENT STATE TRACKING
CREATE TABLE IF NOT EXISTS engagement_state (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  state_timestamp TEXT NOT NULL,
  state TEXT CHECK (state IN ('high_energy', 'active', 'fatigue', 'recovery', 'browsing_secondary')),
  app_activity_intensity TEXT, -- "high", "medium", "low"
  time_since_last_stand_visit INTEGER, -- seconds
  conversation_count_so_far INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 7. POST-FAIR APP & PLATFORM BEHAVIOR
CREATE TABLE IF NOT EXISTS post_fair_app_review (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  first_post_fair_session TEXT,
  bookmarks_reviewed INTEGER NOT NULL DEFAULT 0,
  stands_not_visited_count INTEGER, -- signals regret/unmet intent
  time_in_app_seconds INTEGER,
  shares_initiated INTEGER NOT NULL DEFAULT 0, -- exports to WhatsApp, email, etc.
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 8. EXTERNAL ENGAGEMENT (requires pixel tracking)
CREATE TABLE IF NOT EXISTS external_engagement (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('school_website_visit', 'programme_page_view', 'time_on_page', 'form_started', 'form_submitted', 'direct_email_sent')),
  target_entity TEXT, -- school name or URL
  event_time TEXT NOT NULL,
  metadata_json TEXT, -- custom data per event type
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 9. CRM & DIRECT CONTACT SIGNALS (highest intent)
CREATE TABLE IF NOT EXISTS direct_contact_signals (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  stand_id INTEGER,
  contact_type TEXT CHECK (contact_type IN ('email_to_exhibitor', 'phone_call', 'whatsapp', 'form_submission')),
  contact_time TEXT NOT NULL,
  initiated_by TEXT CHECK (initiated_by IN ('student', 'exhibitor')),
  subject_implied TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE SET NULL
);

-- 10. PARCOURSUP DECISION TRACKING (requires external API)
CREATE TABLE IF NOT EXISTS parcoursup_tracking (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  parcoursup_programmes_before_fair INTEGER,
  parcoursup_programmes_after_fair INTEGER,
  programmes_changed INTEGER NOT NULL DEFAULT 0,
  programmes_added TEXT, -- JSON array
  programmes_removed TEXT, -- JSON array
  days_to_deadline INTEGER,
  fair_influenced_decision INTEGER NOT NULL DEFAULT 0 CHECK (fair_influenced_decision IN (0, 1)),
  confidence_change INTEGER CHECK (confidence_change BETWEEN -5 AND 5), -- change in confidence
  updated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 11. FAMILY/NETWORK INFLUENCE
CREATE TABLE IF NOT EXISTS network_signals (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  network_member_type TEXT CHECK (network_member_type IN ('parent', 'sibling', 'peer', 'teacher')),
  shared_content TEXT, -- what was shared (shortlist, masterclass link, programme page)
  share_method TEXT CHECK (share_method IN ('whatsapp', 'email', 'generated_export', 'link')),
  network_member_id INTEGER, -- if tracked
  shared_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 12. CONTENT CONSUMPTION POST-FAIR
CREATE TABLE IF NOT EXISTS content_consumption (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  content_type TEXT CHECK (content_type IN ('masterclass', 'webinar', 'programme_page', 'platform_article', 'email')),
  content_id TEXT,
  content_title TEXT,
  first_view_time TEXT,
  total_views INTEGER NOT NULL DEFAULT 1,
  total_watch_seconds INTEGER,
  completion_rate REAL, -- for videos: 0.0 to 1.0
  last_view_time TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 13. CHURN & RE-ENGAGEMENT
CREATE TABLE IF NOT EXISTS churn_signals (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  days_to_first_churn INTEGER, -- days until stopped engaging
  last_engagement_date TEXT,
  engagement_window_days INTEGER, -- time from fair to last action
  reason_inferred TEXT CHECK (reason_inferred IN ('no_personalization', 'generic_content', 'decision_made', 'outside_ecosystem', 'unknown')),
  re_engagement_attempts INTEGER NOT NULL DEFAULT 0, -- emails sent, nudges triggered
  re_engaged INTEGER NOT NULL DEFAULT 0 CHECK (re_engaged IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 14. COMPREHENSIVE JOURNEY SCORE (replaces simple lead_scores)
CREATE TABLE IF NOT EXISTS journey_scores (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  -- Discovery phase signals
  discovery_strength REAL DEFAULT 0.5,
  -- Pre-fair prep signals
  prep_engagement_score REAL DEFAULT 0.5,
  -- During-fair depth
  stand_depth_score REAL DEFAULT 0.5,
  conversation_quality_score REAL DEFAULT 0.5,
  -- Post-fair intent
  post_fair_action_score REAL DEFAULT 0.5,
  -- Decision stage
  parcoursup_influence_score REAL DEFAULT 0.5,
  -- Churn risk
  churn_risk REAL DEFAULT 0.5,
  -- Monetization potential
  family_influence_factor REAL DEFAULT 1.0,
  -- Composite journey score
  journey_completeness_score REAL NOT NULL,

  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, student_id),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
