-- supabase/schema-v11.sql
-- Run in Supabase SQL Editor after schema-v10.sql
--
-- Adds a season window to game_sessions. Both columns are nullable, so a
-- session with no season runs year-round and nothing existing breaks.
--
-- Why: seasons lived in `notes` as prose ("Spring 2026: May 4-Jun 28"), which
-- nothing could filter on, so sessions kept advertising themselves months after
-- they finished. On 2026-09-25 the U of T sessions were still listed as current
-- three months after their spring term ended.

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS season_start date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS season_end   date DEFAULT NULL;

COMMENT ON COLUMN game_sessions.season_start IS 'First date this session runs. NULL = runs year-round.';
COMMENT ON COLUMN game_sessions.season_end   IS 'Last date this session runs. NULL = runs year-round. Public reads hide sessions whose season_end is in the past.';

-- Public reads filter on season_end, so index it.
CREATE INDEX IF NOT EXISTS game_sessions_season_end_idx
  ON game_sessions (season_end)
  WHERE season_end IS NOT NULL;
