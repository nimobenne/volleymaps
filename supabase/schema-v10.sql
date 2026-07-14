-- schema-v10: lock down newsletter_subscribers RLS
-- newsletter_subscribers has never been in a tracked migration (flagged open
-- since the 2026-07 audit — table predates the supabase/ migration folder).
-- The only writer (app/api/newsletter/route.ts) uses the service role key,
-- which bypasses RLS entirely, so this table needs zero anon policies.
-- Policy names are unknown since the table was never scripted, so this
-- drops whatever exists on it dynamically before locking RLS down, same
-- intent as schema-v9 did for rsvps.

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'newsletter_subscribers'
  loop
    execute format('drop policy if exists %I on newsletter_subscribers', pol.policyname);
  end loop;
end $$;

alter table newsletter_subscribers enable row level security;
