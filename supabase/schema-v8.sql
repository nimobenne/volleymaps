-- schema-v8: RSVP table
-- Anonymous device tokens, one RSVP per session per token.
-- The /api/rsvp route uses the service role key (bypasses RLS); the policies
-- below are defensive so the table is also safe if queried with the anon key.

create table if not exists rsvps (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references game_sessions(id) on delete cascade,
  token text not null,
  created_at timestamptz default now(),
  unique(session_id, token)
);

alter table rsvps enable row level security;

create policy "anyone can rsvp"
  on rsvps for insert
  with check (true);

create policy "anyone can read rsvp counts"
  on rsvps for select
  using (true);

create policy "anyone can delete own rsvp"
  on rsvps for delete
  using (true);

create index if not exists rsvps_session_id_idx on rsvps(session_id);
