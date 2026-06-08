-- supabase/schema-v7.sql
-- Run in Supabase SQL Editor after schema-v6.sql
-- Adds cost visibility fields to game_sessions. All nullable/defaulted — no existing rows break.

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS cost_type  text NOT NULL DEFAULT 'unknown'
    CONSTRAINT cost_type_check CHECK (cost_type IN ('free','paid','registration','unknown')),
  ADD COLUMN IF NOT EXISTS cost_cents integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cost_label text DEFAULT NULL;

COMMENT ON COLUMN game_sessions.cost_type   IS 'free | paid | registration | unknown';
COMMENT ON COLUMN game_sessions.cost_cents  IS 'Amount in cents CAD. Only set when cost_type=paid.';
COMMENT ON COLUMN game_sessions.cost_label  IS 'Optional override shown in UI instead of computed label.';
