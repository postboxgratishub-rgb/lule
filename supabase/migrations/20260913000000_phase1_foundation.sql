-- Phase 1: authentication, roles, schools, profiles, and challenge configuration.
-- This migration intentionally contains no learning-content or progress tables.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

do $$
begin
  create type public.app_role as enum ('student', 'admin');
exception
  when duplicate_object then null;
end
$$;

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  address text,
  city text,
  state text,
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint schools_name_not_blank check (char_length(btrim(name)) between 2 and 200),
  constraint schools_code_format check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,31}$'),
  constraint schools_code_key unique (code),
  constraint schools_contact_phone_length check (contact_phone is null or char_length(contact_phone) <= 32)
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  full_name text not null,
  email text,
  phone text,
  role public.app_role not null default 'student'::public.app_role,
  school_id uuid,
  class_name text,
  section text,
  roll_number text,
  date_of_birth date,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_auth_user_id_key unique (auth_user_id),
  constraint profiles_auth_user_id_fkey foreign key (auth_user_id)
    references auth.users (id) on delete cascade,
  constraint profiles_school_id_fkey foreign key (school_id)
    references public.schools (id) on update cascade on delete restrict,
  constraint profiles_full_name_not_blank check (char_length(btrim(full_name)) between 1 and 150),
  constraint profiles_email_length check (email is null or char_length(email) <= 320),
  constraint profiles_phone_length check (phone is null or char_length(phone) <= 32),
  constraint profiles_class_name_length check (class_name is null or char_length(class_name) <= 50),
  constraint profiles_section_length check (section is null or char_length(section) <= 50),
  constraint profiles_roll_number_length check (roll_number is null or char_length(roll_number) <= 50),
  constraint profiles_avatar_url_length check (avatar_url is null or char_length(avatar_url) <= 2048),
  constraint profiles_date_of_birth_not_future check (date_of_birth is null or date_of_birth <= current_date)
);

create unique index if not exists profiles_email_lower_key
  on public.profiles (lower(email))
  where email is not null;
create index if not exists profiles_school_id_idx on public.profiles (school_id);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_school_role_idx on public.profiles (school_id, role);
create index if not exists profiles_full_name_lower_idx on public.profiles (lower(full_name));

create table if not exists public.challenge_settings (
  id smallint primary key default 1,
  program_name text not null default '100-Day Learning Challenge',
  organization_name text not null default 'Learning Organization',
  challenge_start_date date,
  challenge_end_date date,
  timezone text not null default 'Asia/Kolkata',
  total_days smallint not null default 100,
  videos_per_day smallint not null default 10,
  video_completion_threshold numeric(5, 2) not null default 90.00,
  minimum_completion numeric(5, 2) not null default 100.00,
  certificate_rules jsonb not null default '{"required_days": 100}'::jsonb,
  streak_rules jsonb not null default '{"reset_on_missed_required_day": true}'::jsonb,
  notification_settings jsonb not null default '{"enabled": true, "daily_reminder": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_settings_singleton check (id = 1),
  constraint challenge_settings_program_name_not_blank check (char_length(btrim(program_name)) between 1 and 200),
  constraint challenge_settings_organization_name_not_blank check (char_length(btrim(organization_name)) between 1 and 200),
  constraint challenge_settings_dates_valid check (
    challenge_end_date is null
    or challenge_start_date is null
    or challenge_end_date >= challenge_start_date
  ),
  constraint challenge_settings_total_days_valid check (total_days between 1 and 365),
  constraint challenge_settings_videos_per_day_valid check (videos_per_day between 1 and 50),
  constraint challenge_settings_completion_threshold_valid check (video_completion_threshold > 0 and video_completion_threshold <= 100),
  constraint challenge_settings_minimum_completion_valid check (minimum_completion >= 0 and minimum_completion <= 100),
  constraint challenge_settings_certificate_rules_object check (jsonb_typeof(certificate_rules) = 'object'),
  constraint challenge_settings_streak_rules_object check (jsonb_typeof(streak_rules) = 'object'),
  constraint challenge_settings_notification_settings_object check (jsonb_typeof(notification_settings) = 'object')
);

insert into public.challenge_settings (id)
values (1)
on conflict (id) do nothing;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.normalize_school()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := btrim(new.name);
  new.code := upper(btrim(new.code));
  new.address := nullif(btrim(new.address), '');
  new.city := nullif(btrim(new.city), '');
  new.state := nullif(btrim(new.state), '');
  new.contact_name := nullif(btrim(new.contact_name), '');
  new.contact_phone := nullif(btrim(new.contact_phone), '');
  return new;
end;
$$;

create or replace function private.validate_challenge_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.program_name := btrim(new.program_name);
  new.organization_name := btrim(new.organization_name);
  new.timezone := btrim(new.timezone);

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = new.timezone
  ) then
    raise exception 'Unknown IANA timezone: %', new.timezone
      using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists schools_normalize on public.schools;
create trigger schools_normalize
before insert or update on public.schools
for each row execute function private.normalize_school();

drop trigger if exists schools_set_updated_at on public.schools;
create trigger schools_set_updated_at
before update on public.schools
for each row execute function private.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists challenge_settings_validate on public.challenge_settings;
create trigger challenge_settings_validate
before insert or update on public.challenge_settings
for each row execute function private.validate_challenge_settings();

drop trigger if exists challenge_settings_set_updated_at on public.challenge_settings;
create trigger challenge_settings_set_updated_at
before update on public.challenge_settings
for each row execute function private.set_updated_at();

-- SECURITY DEFINER prevents the profiles policy from recursively querying itself.
-- It has no arguments, so callers can only ask about their own JWT subject.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select coalesce(auth.role() = 'service_role', false)
    or coalesce(
      exists (
      select 1
      from public.profiles as p
      where p.auth_user_id = (select auth.uid())
        and p.role = 'admin'::public.app_role
      ),
      false
    );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select private.is_admin();
$$;

-- Client-originated updates may change basic personal details only. Enrollment,
-- identity, and authorization fields require an admin (or a trusted server role).
create or replace function private.protect_profile_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  new.full_name := btrim(new.full_name);
  new.phone := nullif(btrim(new.phone), '');
  new.class_name := nullif(btrim(new.class_name), '');
  new.section := nullif(btrim(new.section), '');
  new.roll_number := nullif(btrim(new.roll_number), '');
  new.avatar_url := nullif(btrim(new.avatar_url), '');

  -- auth.uid() is null for migrations/SQL maintenance. Service-role requests are
  -- trusted server operations. Every end-user request has a non-null auth.uid().
  -- A nested invocation is the trusted auth.users email-sync trigger below.
  -- Direct profile writes enter this trigger at depth 1.
  if pg_trigger_depth() = 1
    and auth.uid() is not null
    and coalesce(auth.role(), '') <> 'service_role'
  then
    if new.id is distinct from old.id
      or new.auth_user_id is distinct from old.auth_user_id
      or new.role is distinct from old.role
      or new.email is distinct from old.email
      or new.created_at is distinct from old.created_at
    then
      raise exception 'Identity and role fields cannot be changed from a client session'
        using errcode = '42501';
    end if;

    if not private.is_admin() and (
      new.school_id is distinct from old.school_id
      or new.class_name is distinct from old.class_name
      or new.section is distinct from old.section
      or new.roll_number is distinct from old.roll_number
      or new.date_of_birth is distinct from old.date_of_birth
    ) then
      raise exception 'Enrollment fields can only be changed by an administrator'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_fields on public.profiles;
create trigger profiles_protect_fields
before update on public.profiles
for each row execute function private.protect_profile_fields();

-- The signup contract accepts these raw_user_meta_data keys:
-- full_name, phone, school_id, class_name, section, roll_number,
-- date_of_birth, avatar_url. A metadata role is deliberately ignored.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  requested_school_id uuid;
  requested_date_of_birth date;
begin
  if nullif(btrim(metadata ->> 'school_id'), '') is not null then
    begin
      requested_school_id := (metadata ->> 'school_id')::uuid;
    exception
      when invalid_text_representation then
        raise exception 'school_id must be a valid UUID'
          using errcode = '22023';
    end;
  end if;

  if nullif(btrim(metadata ->> 'date_of_birth'), '') is not null then
    begin
      requested_date_of_birth := (metadata ->> 'date_of_birth')::date;
    exception
      when invalid_datetime_format or datetime_field_overflow then
        raise exception 'date_of_birth must be an ISO date (YYYY-MM-DD)'
          using errcode = '22007';
    end;
  end if;

  insert into public.profiles (
    id,
    auth_user_id,
    full_name,
    email,
    phone,
    role,
    school_id,
    class_name,
    section,
    roll_number,
    date_of_birth,
    avatar_url
  )
  values (
    new.id,
    new.id,
    coalesce(
      nullif(btrim(metadata ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Student'
    ),
    nullif(lower(btrim(new.email)), ''),
    nullif(btrim(metadata ->> 'phone'), ''),
    'student'::public.app_role,
    requested_school_id,
    nullif(btrim(metadata ->> 'class_name'), ''),
    nullif(btrim(metadata ->> 'section'), ''),
    nullif(btrim(metadata ->> 'roll_number'), ''),
    requested_date_of_birth,
    nullif(btrim(metadata ->> 'avatar_url'), '')
  )
  on conflict (auth_user_id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

create or replace function private.sync_auth_email()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles
    set email = nullif(lower(btrim(new.email)), '')
    where auth_user_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function private.sync_auth_email();

alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.challenge_settings enable row level security;

drop policy if exists schools_directory_read on public.schools;
create policy schools_directory_read
on public.schools
for select
to anon, authenticated
using (true);

drop policy if exists schools_admin_insert on public.schools;
create policy schools_admin_insert
on public.schools
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists schools_admin_update on public.schools;
create policy schools_admin_update
on public.schools
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists schools_admin_delete on public.schools;
create policy schools_admin_delete
on public.schools
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin
on public.profiles
for select
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (select private.is_admin())
);

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
on public.profiles
for update
to authenticated
using (
  auth_user_id = (select auth.uid())
  or (select private.is_admin())
)
with check (
  auth_user_id = (select auth.uid())
  or (select private.is_admin())
);

drop policy if exists challenge_settings_authenticated_read on public.challenge_settings;
create policy challenge_settings_authenticated_read
on public.challenge_settings
for select
to authenticated
using (true);

drop policy if exists challenge_settings_admin_update on public.challenge_settings;
create policy challenge_settings_admin_update
on public.challenge_settings
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

-- Phase 1 aggregate: intentionally limited to entities that exist in Phase 1.
create or replace function public.get_admin_overview()
returns table (
  total_students bigint,
  total_schools bigint,
  new_students_last_7_days bigint,
  students_by_school jsonb
)
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
begin
  if not private.is_admin() then
    raise exception 'Administrator access required'
      using errcode = '42501';
  end if;

  return query
  select
    (
      select count(*)
      from public.profiles as p
      where p.role = 'student'::public.app_role
    )::bigint,
    (select count(*) from public.schools)::bigint,
    (
      select count(*)
      from public.profiles as p
      where p.role = 'student'::public.app_role
        and p.created_at >= now() - interval '7 days'
    )::bigint,
    (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'school_id', school_counts.school_id,
            'school_name', school_counts.school_name,
            'student_count', school_counts.student_count
          )
          order by lower(school_counts.school_name), school_counts.school_id
        ),
        '[]'::jsonb
      )
      from (
        select
          s.id as school_id,
          s.name as school_name,
          count(p.id) filter (where p.role = 'student'::public.app_role)::bigint as student_count
        from public.schools as s
        left join public.profiles as p on p.school_id = s.id
        group by s.id, s.name
      ) as school_counts
    );
end;
$$;

revoke all on table public.schools from public, anon, authenticated;
revoke all on table public.profiles from public, anon, authenticated;
revoke all on table public.challenge_settings from public, anon, authenticated;

-- Pre-auth registration can discover a school without seeing contact details.
grant select (id, name, code, city, state) on table public.schools to anon;
grant select on table public.schools to authenticated;
grant insert, update, delete on table public.schools to authenticated;

grant select, update on table public.profiles to authenticated;
grant select, update on table public.challenge_settings to authenticated;

grant all on table public.schools, public.profiles, public.challenge_settings to service_role;
grant usage on type public.app_role to authenticated, service_role;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.normalize_school() from public, anon, authenticated;
revoke all on function private.validate_challenge_settings() from public, anon, authenticated;
revoke all on function private.protect_profile_fields() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.sync_auth_email() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon, authenticated;
revoke all on function public.get_admin_overview() from public, anon, authenticated;

grant usage on schema private to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.get_admin_overview() to authenticated, service_role;

comment on type public.app_role is 'Application authorization role. This is separate from the Supabase Auth JWT role.';
comment on table public.schools is 'Schools available for student enrollment. Anonymous clients receive only directory columns.';
comment on table public.profiles is 'Private application profiles linked one-to-one with auth.users.';
comment on table public.challenge_settings is 'Singleton, admin-managed program configuration used across all clients.';
comment on function public.is_admin() is 'Returns whether the current authenticated user has the application admin role.';
comment on function public.get_admin_overview() is 'Admin-only Phase 1 counts and school distribution.';
