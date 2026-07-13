-- schema-v9: lock down rsvps RLS
-- The /api/rsvp route is the only writer/reader and uses the service role key,
-- which bypasses RLS. The open v8 policies let anyone with the public anon key
-- read, insert, and — worst — delete EVERY rsvp row. Remove them all; RLS stays
-- enabled with no anon policies, so the anon key gets zero access.

drop policy if exists "anyone can rsvp" on rsvps;
drop policy if exists "anyone can read rsvp counts" on rsvps;
drop policy if exists "anyone can delete own rsvp" on rsvps;

alter table rsvps enable row level security;
