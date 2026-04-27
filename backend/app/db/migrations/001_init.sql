PRAGMA foreign_keys = ON;

-- Core fair metadata
CREATE TABLE IF NOT EXISTS fairs (
  id INTEGER PRIMARY KEY,
  fair_code TEXT NOT NULL UNIQUE,
  fair_name TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  ends_on TEXT NOT NULL,
  location_city TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Immutable import snapshot from source CSV for traceability and integrity checks
CREATE TABLE IF NOT EXISTS source_students (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  row_id INTEGER NOT NULL,
  audience_type TEXT NOT NULL,
  grade TEXT NOT NULL,
  student_subgroup TEXT NOT NULL,
  visited_site INTEGER NOT NULL CHECK (visited_site IN (0, 1)),
  used_ori INTEGER NOT NULL CHECK (used_ori IN (0, 1)),
  took_test INTEGER NOT NULL CHECK (took_test IN (0, 1)),
  digital_experience TEXT NOT NULL CHECK (digital_experience IN ('yes', 'no')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, row_id),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE
);

-- Normalized student entity (base source + registration state)
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  source_row_id INTEGER NOT NULL,
  audience_type TEXT NOT NULL CHECK (audience_type = 'student'),
  grade TEXT NOT NULL CHECK (grade IN ('Terminale', 'Premiere', 'Post-bac', 'Other')),
  student_subgroup TEXT NOT NULL CHECK (student_subgroup IN ('school_group', 'non_school_group')),
  visited_site INTEGER NOT NULL CHECK (visited_site IN (0, 1)),
  used_ori INTEGER NOT NULL CHECK (used_ori IN (0, 1)),
  took_test INTEGER NOT NULL CHECK (took_test IN (0, 1)),
  digital_experience TEXT NOT NULL CHECK (digital_experience IN ('yes', 'no')),
  is_registered INTEGER NOT NULL DEFAULT 0 CHECK (is_registered IN (0, 1)),
  registration_channel TEXT NOT NULL DEFAULT 'none' CHECK (registration_channel IN ('none', 'standard', 'fast')),
  repeat_visitor INTEGER NOT NULL DEFAULT 0 CHECK (repeat_visitor IN (0, 1)),
  pseudonymized_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, source_row_id),
  UNIQUE (fair_id, pseudonymized_id),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (fair_id, source_row_id) REFERENCES source_students(fair_id, row_id) ON DELETE CASCADE
);

-- Enriched registration profile (contains GDPR-sensitive PII)
CREATE TABLE IF NOT EXISTS student_profiles (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  date_of_birth TEXT,
  age_years INTEGER,
  phone TEXT,
  postal_region TEXT,
  gender TEXT,
  current_study_level TEXT NOT NULL,
  bac_track_type TEXT,
  fields_of_interest_csv TEXT,
  fields_interest_count INTEGER NOT NULL DEFAULT 0 CHECK (fields_interest_count BETWEEN 0 AND 3),
  programme_of_interest TEXT,
  profile_rich INTEGER NOT NULL DEFAULT 0 CHECK (profile_rich IN (0, 1)),
  -- Optional pseudonymized email hash for analytics-safe joins
  pseudonymized_email_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, email),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS student_consents (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  consent_newsletter INTEGER NOT NULL CHECK (consent_newsletter IN (0, 1)),
  consent_partners INTEGER NOT NULL CHECK (consent_partners IN (0, 1)),
  consent_call INTEGER NOT NULL CHECK (consent_call IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Pre-fair digital signals (WAX + ORI + campaigns)
CREATE TABLE IF NOT EXISTS pre_fair_signals (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL UNIQUE,
  wax_engagement_score REAL NOT NULL CHECK (wax_engagement_score BETWEEN 0 AND 100),
  ori_test_score REAL CHECK (ori_test_score BETWEEN 0 AND 100),
  pre_fair_email_opens INTEGER NOT NULL DEFAULT 0 CHECK (pre_fair_email_opens >= 0),
  pre_fair_email_clicks INTEGER NOT NULL DEFAULT 0 CHECK (pre_fair_email_clicks >= 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS stands (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  stand_code TEXT NOT NULL,
  exhibitor_name TEXT NOT NULL,
  stand_category TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, stand_code),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS conferences (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  conference_code TEXT NOT NULL,
  conference_title TEXT NOT NULL,
  topic TEXT NOT NULL,
  speaker_name TEXT,
  scheduled_at TEXT,
  duration_min INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, conference_code),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE
);

-- Append-only raw event stream; payload_json carries extensible attributes
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  stand_id INTEGER,
  conference_id INTEGER,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'check_in',
      'fast_registration',
      'stand_tap',
      'brochure_request',
      'conference_scan',
      'exhibitor_scan',
      'quiz_response',
      'passport_progress',
      'exit_survey',
      'post_fair_email_open',
      'post_fair_email_click',
      'followup_cta_to_exhibitor',
      'site_page_view'
    )
  ),
  event_time TEXT NOT NULL,
  source_channel TEXT,
  payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (stand_id) REFERENCES stands(id) ON DELETE SET NULL,
  FOREIGN KEY (conference_id) REFERENCES conferences(id) ON DELETE SET NULL
);

-- Snapshot of model-ready features per student/fair
CREATE TABLE IF NOT EXISTS derived_features (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  snapshot_date TEXT NOT NULL DEFAULT (DATE('now')),
  checked_in INTEGER NOT NULL DEFAULT 0 CHECK (checked_in IN (0, 1)),
  repeat_visitor INTEGER NOT NULL DEFAULT 0 CHECK (repeat_visitor IN (0, 1)),
  fields_interest_count INTEGER NOT NULL DEFAULT 0 CHECK (fields_interest_count BETWEEN 0 AND 3),
  programme_interest_present INTEGER NOT NULL DEFAULT 0 CHECK (programme_interest_present IN (0, 1)),
  bac_track_present INTEGER NOT NULL DEFAULT 0 CHECK (bac_track_present IN (0, 1)),
  region_present INTEGER NOT NULL DEFAULT 0 CHECK (region_present IN (0, 1)),
  phone_present INTEGER NOT NULL DEFAULT 0 CHECK (phone_present IN (0, 1)),
  consent_partner INTEGER NOT NULL DEFAULT 0 CHECK (consent_partner IN (0, 1)),
  consent_call INTEGER NOT NULL DEFAULT 0 CHECK (consent_call IN (0, 1)),
  ori_completed INTEGER NOT NULL DEFAULT 0 CHECK (ori_completed IN (0, 1)),
  ori_score REAL,
  bookmarks_count INTEGER NOT NULL DEFAULT 0,
  exit_clarity_score REAL,
  stands_tapped_count INTEGER NOT NULL DEFAULT 0,
  unique_stand_categories INTEGER NOT NULL DEFAULT 0,
  conference_scans_count INTEGER NOT NULL DEFAULT 0,
  exhibitor_scans_count INTEGER NOT NULL DEFAULT 0,
  passport_completed INTEGER NOT NULL DEFAULT 0 CHECK (passport_completed IN (0, 1)),
  post_fair_email_clicks_count INTEGER NOT NULL DEFAULT 0,
  site_pageviews_7d INTEGER NOT NULL DEFAULT 0,
  followup_cta_to_exhibitor INTEGER NOT NULL DEFAULT 0 CHECK (followup_cta_to_exhibitor IN (0, 1)),
  profile_rich INTEGER NOT NULL DEFAULT 0 CHECK (profile_rich IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, student_id),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lead_scores (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  intent_score REAL NOT NULL,
  engagement_score REAL NOT NULL,
  monetisability_score REAL NOT NULL,
  richness_score REAL NOT NULL,
  total_score REAL NOT NULL,
  prequalified INTEGER NOT NULL CHECK (prequalified IN (0, 1)),
  scoring_version TEXT NOT NULL DEFAULT 'v1',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, student_id),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monetization (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  tier_eur REAL NOT NULL,
  resell_factor INTEGER NOT NULL CHECK (resell_factor IN (1, 2, 3)),
  monetisable_value_eur REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, student_id),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS kpi_daily (
  id INTEGER PRIMARY KEY,
  fair_id INTEGER NOT NULL,
  kpi_date TEXT NOT NULL,
  total_students INTEGER NOT NULL DEFAULT 0,
  checked_in_students INTEGER NOT NULL DEFAULT 0,
  stand_taps INTEGER NOT NULL DEFAULT 0,
  conference_scans INTEGER NOT NULL DEFAULT 0,
  exhibitor_scans INTEGER NOT NULL DEFAULT 0,
  post_fair_email_clicks INTEGER NOT NULL DEFAULT 0,
  partner_optin_rate REAL NOT NULL DEFAULT 0,
  call_optin_rate REAL NOT NULL DEFAULT 0,
  total_monetisable_value_eur REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (fair_id, kpi_date),
  FOREIGN KEY (fair_id) REFERENCES fairs(id) ON DELETE CASCADE
);
