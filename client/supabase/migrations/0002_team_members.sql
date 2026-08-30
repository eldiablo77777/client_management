-- Decouples "assigned to" from real Supabase Auth accounts.
--
-- clients.assigned_to previously referenced auth.users(id), which meant only
-- people with a login could be assigned a client. This introduces a
-- lightweight team_members table (just a name, no login required) and
-- repoints clients.assigned_to at it instead. Activity/follow-up authorship
-- (client_activities.user_id, follow_ups.user_id) is untouched — those still
-- track the real logged-in user who took the action.
--
-- Safe to run multiple times.

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

drop policy if exists "team_members_all_authenticated" on public.team_members;
create policy "team_members_all_authenticated"
  on public.team_members for all
  to authenticated
  using (true)
  with check (true);

-- Repoint clients.assigned_to at team_members instead of auth.users.
alter table public.clients drop constraint if exists clients_assigned_to_fkey;

-- Any existing assigned_to values pointed at auth.users ids, which will
-- never match a team_members id — clear them so the new FK can attach.
update public.clients
set assigned_to = null
where assigned_to is not null;

alter table public.clients
  add constraint clients_assigned_to_fkey
    foreign key (assigned_to) references public.team_members (id) on delete set null;

-- Seed the requested team members (idempotent).
insert into public.team_members (name)
select 'Artin Jashari'
where not exists (select 1 from public.team_members where name = 'Artin Jashari');

insert into public.team_members (name)
select 'Ledian Ibishi'
where not exists (select 1 from public.team_members where name = 'Ledian Ibishi');
