-- Adds the `landed` column used by the simplified client tracker.
--
-- Everything else the app needs (company_name, phone_number, contact_person,
-- interested, requirements, created_at, updated_at) already exists on
-- public.clients from earlier migrations, so this is the only schema change
-- required. Safe to run multiple times.

alter table public.clients
  add column if not exists landed boolean not null default false;

-- Backfill: clients previously marked "Won" under the old CRM pipeline are
-- landed clients. This only runs if that `status` column still exists.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'clients'
      and column_name = 'status'
  ) then
    update public.clients
    set landed = true
    where status = 'Won' and landed = false;
  end if;
end $$;
