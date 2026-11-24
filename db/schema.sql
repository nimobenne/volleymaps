BEGIN;

CREATE TABLE IF NOT EXISTS venues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('beach', 'grass', 'indoor')),
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Toronto',
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  slug text NOT NULL UNIQUE,
  approved boolean NOT NULL DEFAULT false,
  website text,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  title text NOT NULL,
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date date,
  start_time time NOT NULL,
  end_time time NOT NULL,
  recurring boolean NOT NULL DEFAULT true,
  skill_level text NOT NULL DEFAULT 'all'
    CHECK (skill_level IN ('all', 'beginner', 'intermediate', 'competitive')),
  notes text,
  contact_link text,
  featured boolean NOT NULL DEFAULT false,
  cost_type text NOT NULL DEFAULT 'unknown'
    CONSTRAINT cost_type_check CHECK (cost_type IN ('free', 'paid', 'registration', 'unknown')),
  cost_cents integer DEFAULT NULL,
  cost_label text DEFAULT NULL,
  season_start date DEFAULT NULL,
  season_end date DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  venue_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL DEFAULT 'Toronto',
  type text NOT NULL CHECK (type IN ('beach', 'grass', 'indoor')),
  website text,
  schedule text,
  contact_link text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, token)
);

CREATE INDEX IF NOT EXISTS venues_approved_name_idx ON venues (approved, name);
CREATE INDEX IF NOT EXISTS game_sessions_venue_id_idx ON game_sessions (venue_id);
CREATE INDEX IF NOT EXISTS game_sessions_start_time_idx ON game_sessions (start_time);
CREATE INDEX IF NOT EXISTS game_sessions_season_end_idx ON game_sessions (season_end) WHERE season_end IS NOT NULL;
CREATE INDEX IF NOT EXISTS submissions_created_at_idx ON submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS rsvps_session_id_idx ON rsvps (session_id);
CREATE INDEX IF NOT EXISTS rsvps_session_created_at_idx ON rsvps (session_id, created_at);

COMMIT;
