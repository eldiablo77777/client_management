-- CRM upgrade migration
-- Safe to run multiple times: uses IF NOT EXISTS / DROP+CREATE POLICY so it
-- does not depend on knowing the current state of the database.
--
-- Data model decisions:
--   * Existing `clients.called` / `clients.interested` booleans are KEPT
--     (not dropped) and backfilled into a new `status` column so no
--     historical signal is lost. The app stops writing to called/interested
--     going forward but old data remains queryable.
--   * `requirements` is kept as-is and reused as the client's free-text
--     notes/requirements field (the app labels it "Notes" in the UI) rather
--     than adding a duplicate `notes` column.
--   * Per-entry notes with author + timestamp (spec section 8) and the
--     activity timeline (section 9) are both modeled as rows in
--     `client_activities`, using type = 'note' for notes. This avoids a
--     redundant notes table while still supporting add/edit/delete per note.
--   * Data is shared across the whole team (confirmed), so RLS policies
--     grant full access to any authenticated user rather than scoping by
--     row owner. `user_id` / `assigned_to` are still recorded for
--     attribution and the "Assigned to" filter, they just aren't used to
--     restrict row visibility.

-- ---------------------------------------------------------------------------
-- profiles: lightweight mirror of auth.users, needed because auth.users is
-- not queryable by the anon/authenticated client roles. Powers the
-- "Assigned team member" picker and the Settings > Profile page.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that already exist.
insert into public.profiles (id, email, full_name)
select u.id, u.email, u.raw_user_meta_data ->> 'full_name'
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- clients: extend with CRM pipeline fields
-- ---------------------------------------------------------------------------
alter table public.clients
  add column if not exists user_id uuid references auth.users (id),
  add column if not exists email text,
  add column if not exists website text,
  add column if not exists address text,
  add column if not exists status text,
  add column if not exists priority text not null default 'Medium',
  add column if not exists lead_source text,
  add column if not exists assigned_to uuid references auth.users (id),
  add column if not exists project_value numeric,
  add column if not exists expected_close_date date,
  add column if not exists follow_up_date date,
  add column if not exists follow_up_time time,
  add column if not exists archived boolean not null default false,
  add column if not exists last_contacted_at timestamptz;

do $$
begin
  alter table public.clients
    add constraint clients_status_check
      check (status in ('New', 'Contacted', 'Interested', 'Negotiating', 'Won', 'Lost'));
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.clients
    add constraint clients_priority_check
      check (priority in ('Low', 'Medium', 'High', 'Urgent'));
exception
  when duplicate_object then null;
end $$;

-- Backfill status from the legacy called/interested booleans.
update public.clients
set status = case
  when interested then 'Interested'
  when called then 'Contacted'
  else 'New'
end
where status is null;

alter table public.clients
  alter column status set default 'New',
  alter column status set not null;

create index if not exists clients_status_idx on public.clients (status);
create index if not exists clients_priority_idx on public.clients (priority);
create index if not exists clients_archived_idx on public.clients (archived);
create index if not exists clients_assigned_to_idx on public.clients (assigned_to);
create index if not exists clients_follow_up_date_idx on public.clients (follow_up_date);

alter table public.clients enable row level security;

drop policy if exists "clients_all_authenticated" on public.clients;
create policy "clients_all_authenticated"
  on public.clients for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- client_activities: timeline (calls, emails, meetings, notes, status
-- changes, follow-ups, creation events)
-- ---------------------------------------------------------------------------
create table if not exists public.client_activities (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid references auth.users (id),
  type text not null check (
    type in (
      'created', 'call', 'email', 'meeting', 'note', 'status_change',
      'follow_up', 'archived', 'restored'
    )
  ),
  description text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists client_activities_client_id_idx
  on public.client_activities (client_id, created_at desc);

alter table public.client_activities enable row level security;

drop policy if exists "client_activities_all_authenticated" on public.client_activities;
create policy "client_activities_all_authenticated"
  on public.client_activities for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- follow_ups: full follow-up queue (today / upcoming / overdue), separate
-- from clients.follow_up_date which always mirrors the next pending one
-- ---------------------------------------------------------------------------
create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  user_id uuid references auth.users (id),
  scheduled_at timestamptz not null,
  note text,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists follow_ups_client_id_idx on public.follow_ups (client_id);
create index if not exists follow_ups_scheduled_at_idx on public.follow_ups (scheduled_at);
create index if not exists follow_ups_completed_idx on public.follow_ups (completed);

alter table public.follow_ups enable row level security;

drop policy if exists "follow_ups_all_authenticated" on public.follow_ups;
create policy "follow_ups_all_authenticated"
  on public.follow_ups for all
  to authenticated
  using (true)
  with check (true);
