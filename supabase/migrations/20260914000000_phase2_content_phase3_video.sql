-- Phase 2 + Phase 3: challenge content and server-authoritative video progress.
--
-- Playback time can only be mutated through the SECURITY DEFINER RPCs near the
-- end of this migration. Student ids always come from auth.uid(); clients never
-- submit them. A private, shared token bucket prevents multiple devices or
-- sessions from accruing media time faster than the supported 2x playback rate.

do $$
begin
  create type public.video_source_type as enum (
    'external_url',
    'cloudflare_stream',
    'mux'
  );
exception
  when duplicate_object then null;
end
$$;

-- Phase 1 intentionally allowed a wider future range. Phase 2 implements the
-- product's concrete 100-day / 10-video capacity, so settings must not describe
-- content that this schema cannot represent.
alter table public.challenge_settings
  drop constraint if exists challenge_settings_total_days_valid;
alter table public.challenge_settings
  add constraint challenge_settings_total_days_valid
  check (total_days between 1 and 100);

alter table public.challenge_settings
  drop constraint if exists challenge_settings_videos_per_day_valid;
alter table public.challenge_settings
  add constraint challenge_settings_videos_per_day_valid
  check (videos_per_day between 1 and 10);

create table if not exists public.challenge_days (
  id uuid primary key default gen_random_uuid(),
  day_number smallint not null,
  title text not null,
  description text,
  release_date date,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint challenge_days_day_number_key unique (day_number),
  constraint challenge_days_day_number_valid check (day_number between 1 and 100),
  constraint challenge_days_title_not_blank check (char_length(btrim(title)) between 1 and 200),
  constraint challenge_days_description_length check (
    description is null or char_length(description) <= 10000
  )
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  challenge_day_id uuid not null,
  video_number smallint not null,
  title text not null,
  description text,
  duration_seconds integer not null,
  thumbnail_url text,
  video_source_type public.video_source_type not null default 'external_url',
  video_url text,
  playback_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_challenge_day_id_fkey foreign key (challenge_day_id)
    references public.challenge_days (id) on update cascade on delete cascade,
  constraint videos_challenge_day_video_number_key
    unique (challenge_day_id, video_number) deferrable initially immediate,
  constraint videos_video_number_valid check (video_number between 1 and 10),
  constraint videos_title_not_blank check (char_length(btrim(title)) between 1 and 250),
  constraint videos_description_length check (
    description is null or char_length(description) <= 10000
  ),
  constraint videos_duration_seconds_valid check (duration_seconds between 1 and 43200),
  constraint videos_thumbnail_url_length check (
    thumbnail_url is null or char_length(thumbnail_url) <= 4096
  ),
  constraint videos_thumbnail_url_scheme check (
    thumbnail_url is null or thumbnail_url ~ '^https?://'
  ),
  constraint videos_video_url_length check (
    video_url is null or char_length(video_url) <= 8192
  ),
  constraint videos_video_url_scheme check (
    video_url is null or video_url ~ '^https?://'
  ),
  constraint videos_playback_id_length check (
    playback_id is null or char_length(playback_id) <= 512
  ),
  constraint videos_source_locator_required check (
    (
      video_source_type = 'external_url'::public.video_source_type
      and video_url is not null
      and char_length(btrim(video_url)) > 0
    )
    or (
      video_source_type in (
        'cloudflare_stream'::public.video_source_type,
        'mux'::public.video_source_type
      )
      and playback_id is not null
      and char_length(btrim(playback_id)) > 0
    )
  )
);

create table if not exists public.video_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  video_id uuid not null,
  watched_seconds integer not null default 0,
  last_position_seconds integer not null default 0,
  completion_percentage numeric(5, 2) not null default 0,
  completed boolean not null default false,
  first_started_at timestamptz,
  last_watched_at timestamptz,
  completed_at timestamptz,
  total_sessions integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint video_progress_student_id_fkey foreign key (student_id)
    references public.profiles (id) on update cascade on delete cascade,
  constraint video_progress_video_id_fkey foreign key (video_id)
    references public.videos (id) on update cascade on delete restrict,
  constraint video_progress_student_video_key unique (student_id, video_id),
  constraint video_progress_watched_seconds_valid check (watched_seconds >= 0),
  constraint video_progress_last_position_valid check (last_position_seconds >= 0),
  constraint video_progress_percentage_valid check (
    completion_percentage between 0 and 100
  ),
  constraint video_progress_total_sessions_valid check (total_sessions >= 0),
  constraint video_progress_completed_at_valid check (
    (completed and completed_at is not null)
    or (not completed and completed_at is null)
  )
);

create table if not exists public.watch_sessions (
  id uuid primary key default gen_random_uuid(),
  client_session_id uuid not null,
  student_id uuid not null,
  video_id uuid not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  watched_seconds integer not null default 0,
  last_position_seconds integer not null default 0,
  device_type text not null default 'unknown',
  session_date date not null,
  last_sequence integer not null default 0,
  last_reported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint watch_sessions_student_id_fkey foreign key (student_id)
    references public.profiles (id) on update cascade on delete cascade,
  constraint watch_sessions_video_id_fkey foreign key (video_id)
    references public.videos (id) on update cascade on delete restrict,
  constraint watch_sessions_student_client_session_key unique (student_id, client_session_id),
  constraint watch_sessions_time_order_valid check (
    ended_at is null or ended_at >= started_at
  ),
  constraint watch_sessions_watched_seconds_valid check (watched_seconds >= 0),
  constraint watch_sessions_last_position_valid check (last_position_seconds >= 0),
  constraint watch_sessions_last_sequence_valid check (last_sequence >= 0),
  constraint watch_sessions_device_type_valid check (
    char_length(device_type) between 1 and 32
    and device_type ~ '^[a-z0-9][a-z0-9_-]*$'
  )
);

create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null,
  challenge_day_id uuid not null,
  videos_completed smallint not null default 0,
  videos_total smallint not null default 0,
  watch_time_seconds integer not null default 0,
  completion_percentage numeric(5, 2) not null default 0,
  completed boolean not null default false,
  started_at timestamptz,
  last_activity_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_progress_student_id_fkey foreign key (student_id)
    references public.profiles (id) on update cascade on delete cascade,
  constraint daily_progress_challenge_day_id_fkey foreign key (challenge_day_id)
    references public.challenge_days (id) on update cascade on delete cascade,
  constraint daily_progress_student_day_key unique (student_id, challenge_day_id),
  constraint daily_progress_videos_completed_valid check (videos_completed >= 0),
  constraint daily_progress_videos_total_valid check (videos_total between 0 and 10),
  constraint daily_progress_completed_not_over_total check (videos_completed <= videos_total),
  constraint daily_progress_watch_time_valid check (watch_time_seconds >= 0),
  constraint daily_progress_percentage_valid check (
    completion_percentage between 0 and 100
  ),
  constraint daily_progress_completed_at_valid check (
    (completed and completed_at is not null)
    or (not completed and completed_at is null)
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_admin_id_fkey foreign key (admin_id)
    references public.profiles (id) on update cascade on delete set null,
  constraint audit_logs_action_not_blank check (char_length(btrim(action)) between 1 and 100),
  constraint audit_logs_entity_type_not_blank check (
    char_length(btrim(entity_type)) between 1 and 100
  )
);

-- This server-only row is the shared playback token bucket for a student/video.
-- It is deliberately outside the API schemas so clients cannot inspect or alter
-- anti-abuse state. Credit accrues at no more than two media seconds per second.
create table if not exists private.video_progress_guards (
  student_id uuid not null,
  video_id uuid not null,
  watch_credit_seconds numeric(10, 3) not null default 0,
  credit_updated_at timestamptz not null default now(),
  primary key (student_id, video_id),
  constraint video_progress_guards_progress_fkey foreign key (student_id, video_id)
    references public.video_progress (student_id, video_id) on delete cascade,
  constraint video_progress_guards_credit_valid check (
    watch_credit_seconds between 0 and 43200
  )
);

-- A second bucket is tied to the concrete open session. The global bucket stops
-- concurrent-device inflation; this bucket prevents time accrued while no player
-- was open from being spent immediately after creating a fresh session.
create table if not exists private.watch_session_guards (
  student_id uuid not null,
  client_session_id uuid not null,
  watch_credit_seconds numeric(10, 3) not null default 0,
  credit_updated_at timestamptz not null default now(),
  primary key (student_id, client_session_id),
  constraint watch_session_guards_session_fkey foreign key (
    student_id,
    client_session_id
  ) references public.watch_sessions (student_id, client_session_id) on delete cascade,
  constraint watch_session_guards_credit_valid check (
    watch_credit_seconds between 0 and 43200
  )
);

create index if not exists challenge_days_release_published_idx
  on public.challenge_days (release_date, day_number)
  where is_published;
create index if not exists videos_challenge_day_published_idx
  on public.videos (challenge_day_id, video_number)
  where is_published;
create index if not exists video_progress_student_completed_idx
  on public.video_progress (student_id, completed, last_watched_at desc);
create index if not exists video_progress_video_id_idx
  on public.video_progress (video_id);
create index if not exists video_progress_last_watched_at_idx
  on public.video_progress (last_watched_at desc)
  where last_watched_at is not null;
create index if not exists watch_sessions_student_session_date_idx
  on public.watch_sessions (student_id, session_date, started_at desc);
create index if not exists watch_sessions_video_id_idx
  on public.watch_sessions (video_id);
create index if not exists watch_sessions_session_date_idx
  on public.watch_sessions (session_date, student_id);
create index if not exists daily_progress_student_completed_idx
  on public.daily_progress (student_id, completed, challenge_day_id);
create index if not exists daily_progress_challenge_day_completed_idx
  on public.daily_progress (challenge_day_id, completed, student_id);
create index if not exists daily_progress_last_activity_at_idx
  on public.daily_progress (last_activity_at desc)
  where last_activity_at is not null;
create index if not exists audit_logs_admin_created_at_idx
  on public.audit_logs (admin_id, created_at desc);
create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create or replace function private.normalize_challenge_day()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.title := btrim(new.title);
  new.description := nullif(btrim(new.description), '');
  return new;
end;
$$;

create or replace function private.normalize_video()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.title := btrim(new.title);
  new.description := nullif(btrim(new.description), '');
  new.thumbnail_url := nullif(btrim(new.thumbnail_url), '');
  new.video_url := nullif(btrim(new.video_url), '');
  new.playback_id := nullif(btrim(new.playback_id), '');
  return new;
end;
$$;

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select p.id
  from public.profiles as p
  where p.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.require_student_profile_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
set row_security = off
as $$
declare
  result uuid;
begin
  select p.id
  into result
  from public.profiles as p
  where p.auth_user_id = (select auth.uid())
    and p.role = 'student'::public.app_role;

  if result is null then
    raise exception 'An authenticated student profile is required'
      using errcode = '42501';
  end if;

  return result;
end;
$$;

create or replace function private.program_date()
returns date
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select (now() at time zone cs.timezone)::date
  from public.challenge_settings as cs
  where cs.id = 1;
$$;

create or replace function private.is_video_available(p_video_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select exists (
    select 1
    from public.videos as v
    join public.challenge_days as d on d.id = v.challenge_day_id
    where v.id = p_video_id
      and v.is_published
      and d.is_published
      and (d.release_date is null or d.release_date <= private.program_date())
  );
$$;

create or replace function private.validate_video_progress()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  video_duration integer;
  threshold numeric(5, 2);
  calculated_percentage numeric(5, 2);
begin
  select v.duration_seconds
  into video_duration
  from public.videos as v
  where v.id = new.video_id;

  if video_duration is null then
    raise exception 'Unknown video'
      using errcode = '23503';
  end if;

  if new.last_position_seconds > video_duration then
    raise exception 'Playback position exceeds video duration'
      using errcode = '22023';
  end if;

  calculated_percentage := least(
    100.00,
    round((new.watched_seconds::numeric * 100.00) / video_duration, 2)
  );
  new.completion_percentage := calculated_percentage;

  if tg_op = 'UPDATE' and old.completed then
    new.completed := true;
    new.completed_at := old.completed_at;
  elsif new.completed then
    select cs.video_completion_threshold
    into threshold
    from public.challenge_settings as cs
    where cs.id = 1;

    if calculated_percentage < threshold then
      raise exception 'Video completion threshold has not been met'
        using errcode = '22023';
    end if;

    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;

  return new;
end;
$$;

create or replace function private.recalculate_daily_progress(
  p_student_id uuid,
  p_challenge_day_id uuid
)
returns public.daily_progress
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  total_count integer;
  published_count integer;
  completed_count integer;
  watched_count integer;
  first_started timestamptz;
  last_activity timestamptz;
  was_completed boolean;
  old_completed_at timestamptz;
  calculated_percentage numeric(5, 2);
  result public.daily_progress;
begin
  select cs.videos_per_day::integer
  into total_count
  from public.challenge_settings as cs
  where cs.id = 1;

  select count(*)::integer
  into published_count
  from public.videos as v
  where v.challenge_day_id = p_challenge_day_id
    and v.is_published
    and v.video_number <= total_count;

  select
    count(*) filter (where vp.completed)::integer,
    min(vp.first_started_at),
    max(vp.last_watched_at)
  into completed_count, first_started, last_activity
  from public.videos as v
  left join public.video_progress as vp
    on vp.video_id = v.id
   and vp.student_id = p_student_id
  where v.challenge_day_id = p_challenge_day_id
    and v.is_published
    and v.video_number <= total_count;

  select coalesce(sum(ws.watched_seconds), 0)::integer
  into watched_count
  from public.watch_sessions as ws
  join public.videos as v on v.id = ws.video_id
  where ws.student_id = p_student_id
    and v.challenge_day_id = p_challenge_day_id;

  select dp.completed, dp.completed_at
  into was_completed, old_completed_at
  from public.daily_progress as dp
  where dp.student_id = p_student_id
    and dp.challenge_day_id = p_challenge_day_id;

  calculated_percentage := case
    when total_count = 0 then 0
    else round((completed_count::numeric * 100.00) / total_count, 2)
  end;

  insert into public.daily_progress (
    student_id,
    challenge_day_id,
    videos_completed,
    videos_total,
    watch_time_seconds,
    completion_percentage,
    completed,
    started_at,
    last_activity_at,
    completed_at
  )
  values (
    p_student_id,
    p_challenge_day_id,
    completed_count,
    total_count,
    watched_count,
    calculated_percentage,
    total_count > 0
      and published_count = total_count
      and completed_count = total_count,
    first_started,
    last_activity,
    case
      when total_count > 0
        and published_count = total_count
        and completed_count = total_count
        then coalesce(old_completed_at, now())
      else null
    end
  )
  on conflict (student_id, challenge_day_id) do update
  set videos_completed = excluded.videos_completed,
      videos_total = excluded.videos_total,
      watch_time_seconds = excluded.watch_time_seconds,
      completion_percentage = excluded.completion_percentage,
      completed = excluded.completed,
      started_at = coalesce(public.daily_progress.started_at, excluded.started_at),
      last_activity_at = excluded.last_activity_at,
      completed_at = excluded.completed_at
  returning * into result;

  return result;
end;
$$;

create or replace function private.build_progress_payload(
  p_student_id uuid,
  p_video_id uuid,
  p_accepted_delta_seconds integer default null
)
returns jsonb
language sql
stable
security definer
set search_path = ''
set row_security = off
as $$
  select jsonb_build_object(
      'video_id', vp.video_id,
      'watched_seconds', vp.watched_seconds,
      'last_position_seconds', vp.last_position_seconds,
      'completion_percentage', vp.completion_percentage,
      'completion_threshold', cs.video_completion_threshold,
      'eligible_to_complete',
        vp.completed or vp.completion_percentage >= cs.video_completion_threshold,
      'completed', vp.completed,
      'first_started_at', vp.first_started_at,
      'last_watched_at', vp.last_watched_at,
      'completed_at', vp.completed_at,
      'total_sessions', vp.total_sessions,
      'accepted_delta_seconds', p_accepted_delta_seconds,
      'daily_progress', jsonb_build_object(
        'challenge_day_id', dp.challenge_day_id,
        'videos_completed', dp.videos_completed,
        'videos_total', dp.videos_total,
        'watch_time_seconds', dp.watch_time_seconds,
        'completion_percentage', dp.completion_percentage,
        'completed', dp.completed
      )
  )
  from public.video_progress as vp
  join public.videos as v on v.id = vp.video_id
  join public.challenge_settings as cs on cs.id = 1
  left join public.daily_progress as dp
    on dp.student_id = vp.student_id
   and dp.challenge_day_id = v.challenge_day_id
  where vp.student_id = p_student_id
    and vp.video_id = p_video_id;
$$;

create or replace function private.audit_content_change()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  acting_admin_id uuid;
  row_id uuid;
begin
  -- SQL migrations, seeds, and trusted service jobs have no user JWT. Keep the
  -- audit trail focused on identifiable admin actions.
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  select p.id
  into acting_admin_id
  from public.profiles as p
  where p.auth_user_id = (select auth.uid())
    and p.role = 'admin'::public.app_role;

  if acting_admin_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  row_id := case when tg_op = 'DELETE' then old.id else new.id end;

  insert into public.audit_logs (
    admin_id,
    action,
    entity_type,
    entity_id,
    old_value,
    new_value
  )
  values (
    acting_admin_id,
    lower(tg_op),
    tg_table_name,
    row_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create or replace function private.refresh_progress_after_video_change()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  affected_day_id uuid;
  affected_student_id uuid;
begin
  if tg_op = 'UPDATE' and new.duration_seconds is distinct from old.duration_seconds then
    -- The validation trigger owns the percentage calculation, so a no-op update
    -- safely recalculates every existing row against the new duration.
    update public.video_progress
    set watched_seconds = watched_seconds,
        last_position_seconds = least(last_position_seconds, new.duration_seconds)
    where video_id = new.id;
  end if;

  for affected_day_id in
    select distinct day_id
    from unnest(array[
      case when tg_op <> 'INSERT' then old.challenge_day_id else null end,
      case when tg_op <> 'DELETE' then new.challenge_day_id else null end
    ]) as day_id
    where day_id is not null
  loop
    for affected_student_id in
      select dp.student_id
      from public.daily_progress as dp
      where dp.challenge_day_id = affected_day_id
      union
      select vp.student_id
      from public.video_progress as vp
      join public.videos as v on v.id = vp.video_id
      where v.challenge_day_id = affected_day_id
    loop
      perform private.recalculate_daily_progress(
        affected_student_id,
        affected_day_id
      );
    end loop;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists challenge_days_normalize on public.challenge_days;
create trigger challenge_days_normalize
before insert or update on public.challenge_days
for each row execute function private.normalize_challenge_day();

drop trigger if exists challenge_days_set_updated_at on public.challenge_days;
create trigger challenge_days_set_updated_at
before update on public.challenge_days
for each row execute function private.set_updated_at();

drop trigger if exists videos_normalize on public.videos;
create trigger videos_normalize
before insert or update on public.videos
for each row execute function private.normalize_video();

drop trigger if exists videos_set_updated_at on public.videos;
create trigger videos_set_updated_at
before update on public.videos
for each row execute function private.set_updated_at();

drop trigger if exists video_progress_validate on public.video_progress;
create trigger video_progress_validate
before insert or update on public.video_progress
for each row execute function private.validate_video_progress();

drop trigger if exists video_progress_set_updated_at on public.video_progress;
create trigger video_progress_set_updated_at
before update on public.video_progress
for each row execute function private.set_updated_at();

drop trigger if exists daily_progress_set_updated_at on public.daily_progress;
create trigger daily_progress_set_updated_at
before update on public.daily_progress
for each row execute function private.set_updated_at();

drop trigger if exists challenge_days_audit on public.challenge_days;
create trigger challenge_days_audit
after insert or update or delete on public.challenge_days
for each row execute function private.audit_content_change();

drop trigger if exists videos_audit on public.videos;
create trigger videos_audit
after insert or update or delete on public.videos
for each row execute function private.audit_content_change();

drop trigger if exists videos_refresh_progress_after_insert_delete on public.videos;
create trigger videos_refresh_progress_after_insert_delete
after insert or delete on public.videos
for each row execute function private.refresh_progress_after_video_change();

drop trigger if exists videos_refresh_progress_after_update on public.videos;
create trigger videos_refresh_progress_after_update
after update of challenge_day_id, video_number, duration_seconds, is_published on public.videos
for each row execute function private.refresh_progress_after_video_change();

alter table public.challenge_days enable row level security;
alter table public.videos enable row level security;
alter table public.video_progress enable row level security;
alter table public.watch_sessions enable row level security;
alter table public.daily_progress enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists challenge_days_read_available_or_admin on public.challenge_days;
create policy challenge_days_read_available_or_admin
on public.challenge_days
for select
to authenticated
using (
  (select private.is_admin())
  or (
    is_published
    and (release_date is null or release_date <= (select private.program_date()))
  )
);

drop policy if exists challenge_days_admin_insert on public.challenge_days;
create policy challenge_days_admin_insert
on public.challenge_days
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists challenge_days_admin_update on public.challenge_days;
create policy challenge_days_admin_update
on public.challenge_days
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists challenge_days_admin_delete on public.challenge_days;
create policy challenge_days_admin_delete
on public.challenge_days
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists videos_read_available_or_admin on public.videos;
create policy videos_read_available_or_admin
on public.videos
for select
to authenticated
using (
  (select private.is_admin())
  or (
    is_published
    and (select private.is_video_available(id))
  )
);

drop policy if exists videos_admin_insert on public.videos;
create policy videos_admin_insert
on public.videos
for insert
to authenticated
with check ((select private.is_admin()));

drop policy if exists videos_admin_update on public.videos;
create policy videos_admin_update
on public.videos
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

drop policy if exists videos_admin_delete on public.videos;
create policy videos_admin_delete
on public.videos
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists video_progress_read_own_or_admin on public.video_progress;
create policy video_progress_read_own_or_admin
on public.video_progress
for select
to authenticated
using (
  student_id = (select private.current_profile_id())
  or (select private.is_admin())
);

drop policy if exists watch_sessions_read_own_or_admin on public.watch_sessions;
create policy watch_sessions_read_own_or_admin
on public.watch_sessions
for select
to authenticated
using (
  student_id = (select private.current_profile_id())
  or (select private.is_admin())
);

drop policy if exists daily_progress_read_own_or_admin on public.daily_progress;
create policy daily_progress_read_own_or_admin
on public.daily_progress
for select
to authenticated
using (
  student_id = (select private.current_profile_id())
  or (select private.is_admin())
);

drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read
on public.audit_logs
for select
to authenticated
using ((select private.is_admin()));

create or replace function public.start_video_session(
  p_video_id uuid,
  p_session_id uuid,
  p_device_type text default 'web',
  p_position_seconds numeric default 0,
  p_expected_student_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  student uuid;
  video_record public.videos;
  normalized_device text;
  normalized_position integer;
  program_day date;
  inserted_session_id uuid;
  existing_session public.watch_sessions;
begin
  student := private.require_student_profile_id();

  if p_expected_student_id is not null
    and student <> p_expected_student_id
  then
    raise exception 'Authenticated student does not match expected_student_id'
      using errcode = '42501';
  end if;

  if p_session_id is null then
    raise exception 'session_id is required'
      using errcode = '22023';
  end if;

  normalized_device := lower(btrim(coalesce(p_device_type, 'web')));
  if char_length(normalized_device) not between 1 and 32
    or normalized_device !~ '^[a-z0-9][a-z0-9_-]*$'
  then
    raise exception 'device_type is invalid'
      using errcode = '22023';
  end if;

  if p_position_seconds is null or p_position_seconds < 0 then
    raise exception 'position_seconds must be zero or greater'
      using errcode = '22023';
  end if;

  select v.*
  into video_record
  from public.videos as v
  join public.challenge_days as d on d.id = v.challenge_day_id
  where v.id = p_video_id
    and v.is_published
    and d.is_published
    and (d.release_date is null or d.release_date <= private.program_date());

  if not found then
    raise exception 'Video is not available'
      using errcode = 'P0002';
  end if;

  if p_position_seconds > video_record.duration_seconds + 5 then
    raise exception 'position_seconds exceeds video duration'
      using errcode = '22023';
  end if;

  normalized_position := least(
    floor(p_position_seconds)::integer,
    video_record.duration_seconds
  );
  program_day := private.program_date();

  insert into public.video_progress (
    student_id,
    video_id,
    watched_seconds,
    last_position_seconds,
    completion_percentage,
    completed,
    first_started_at,
    last_watched_at,
    total_sessions
  )
  values (
    student,
    p_video_id,
    0,
    normalized_position,
    0,
    false,
    now(),
    null,
    0
  )
  on conflict (student_id, video_id) do nothing;

  insert into private.video_progress_guards (
    student_id,
    video_id,
    watch_credit_seconds,
    credit_updated_at
  )
  values (student, p_video_id, 0, clock_timestamp())
  on conflict (student_id, video_id) do nothing;

  insert into public.watch_sessions (
    client_session_id,
    student_id,
    video_id,
    started_at,
    watched_seconds,
    last_position_seconds,
    device_type,
    session_date,
    last_sequence,
    last_reported_at
  )
  values (
    p_session_id,
    student,
    p_video_id,
    now(),
    0,
    normalized_position,
    normalized_device,
    program_day,
    0,
    clock_timestamp()
  )
  on conflict (student_id, client_session_id) do nothing
  returning id into inserted_session_id;

  if inserted_session_id is null then
    select ws.*
    into existing_session
    from public.watch_sessions as ws
    where ws.student_id = student
      and ws.client_session_id = p_session_id;

    if existing_session.video_id is distinct from p_video_id then
      raise exception 'session_id is already associated with another video'
        using errcode = '23505';
    end if;
  else
    update public.video_progress
    set total_sessions = total_sessions + 1
    where student_id = student
      and video_id = p_video_id;
  end if;

  insert into private.watch_session_guards (
    student_id,
    client_session_id,
    watch_credit_seconds,
    credit_updated_at
  )
  values (student, p_session_id, 0, clock_timestamp())
  on conflict (student_id, client_session_id) do nothing;

  perform private.recalculate_daily_progress(student, video_record.challenge_day_id);

  return private.build_progress_payload(student, p_video_id, 0);
end;
$$;

create or replace function public.record_video_progress(
  p_video_id uuid,
  p_session_id uuid,
  p_sequence integer,
  p_position_seconds numeric,
  p_watched_delta_seconds numeric,
  p_device_type text default 'web',
  p_is_final boolean default false,
  p_expected_student_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  student uuid;
  video_record public.videos;
  session_record public.watch_sessions;
  progress_record public.video_progress;
  guard_record private.video_progress_guards;
  session_guard_record private.watch_session_guards;
  normalized_device text;
  normalized_position integer;
  requested_delta integer;
  accepted_delta integer := 0;
  accrued_credit numeric(10, 3);
  accrued_session_credit numeric(10, 3);
  current_clock timestamptz := clock_timestamp();
begin
  student := private.require_student_profile_id();

  if p_expected_student_id is not null
    and student <> p_expected_student_id
  then
    raise exception 'Authenticated student does not match expected_student_id'
      using errcode = '42501';
  end if;

  if p_session_id is null then
    raise exception 'session_id is required'
      using errcode = '22023';
  end if;

  if p_sequence is null or p_sequence < 1 then
    raise exception 'sequence must be at least 1'
      using errcode = '22023';
  end if;

  if p_position_seconds is null or p_position_seconds < 0 then
    raise exception 'position_seconds must be zero or greater'
      using errcode = '22023';
  end if;

  if p_watched_delta_seconds is null or p_watched_delta_seconds < 0 then
    raise exception 'watched_delta_seconds must be zero or greater'
      using errcode = '22023';
  end if;

  normalized_device := lower(btrim(coalesce(p_device_type, 'web')));
  if char_length(normalized_device) not between 1 and 32
    or normalized_device !~ '^[a-z0-9][a-z0-9_-]*$'
  then
    raise exception 'device_type is invalid'
      using errcode = '22023';
  end if;

  select v.*
  into video_record
  from public.videos as v
  join public.challenge_days as d on d.id = v.challenge_day_id
  where v.id = p_video_id
    and v.is_published
    and d.is_published
    and (d.release_date is null or d.release_date <= private.program_date());

  if not found then
    raise exception 'Video is not available'
      using errcode = 'P0002';
  end if;

  if p_position_seconds > video_record.duration_seconds + 5 then
    raise exception 'position_seconds exceeds video duration'
      using errcode = '22023';
  end if;

  normalized_position := least(
    floor(p_position_seconds)::integer,
    video_record.duration_seconds
  );
  requested_delta := least(floor(p_watched_delta_seconds), 30)::integer;

  select ws.*
  into session_record
  from public.watch_sessions as ws
  where ws.student_id = student
    and ws.client_session_id = p_session_id
  for update;

  if not found then
    raise exception 'Watch session not found; call start_video_session first'
      using errcode = 'P0002';
  end if;

  if session_record.video_id <> p_video_id then
    raise exception 'Watch session belongs to another video'
      using errcode = '22023';
  end if;

  select vp.*
  into progress_record
  from public.video_progress as vp
  where vp.student_id = student
    and vp.video_id = p_video_id
  for update;

  if not found then
    raise exception 'Video progress was not initialized'
      using errcode = 'P0002';
  end if;

  if p_sequence <= session_record.last_sequence then
    return private.build_progress_payload(student, p_video_id, 0);
  end if;

  if session_record.ended_at is not null then
    raise exception 'Watch session has already ended'
      using errcode = '55000';
  end if;

  select g.*
  into guard_record
  from private.video_progress_guards as g
  where g.student_id = student
    and g.video_id = p_video_id
  for update;

  if not found then
    insert into private.video_progress_guards (
      student_id,
      video_id,
      watch_credit_seconds,
      credit_updated_at
    )
    values (student, p_video_id, 0, current_clock)
    returning * into guard_record;
  end if;

  select g.*
  into session_guard_record
  from private.watch_session_guards as g
  where g.student_id = student
    and g.client_session_id = p_session_id
  for update;

  if not found then
    insert into private.watch_session_guards (
      student_id,
      client_session_id,
      watch_credit_seconds,
      credit_updated_at
    )
    values (student, p_session_id, 0, current_clock)
    returning * into session_guard_record;
  end if;

  -- The global credit is shared by every device/session for this video. It caps
  -- accepted media time at the supported 2x playback speed and carries fractional
  -- credit without granting a repeatable per-request jitter allowance. The bucket
  -- can retain at least one full supported video (up to 12 hours), so an offline or
  -- native-fullscreen interval is not truncated by a fixed short-session ceiling.
  accrued_credit := least(
    greatest(1800.000, video_record.duration_seconds::numeric),
    guard_record.watch_credit_seconds
      + greatest(
          0,
          extract(epoch from (current_clock - guard_record.credit_updated_at)) * 2.0
        )
  );
  accrued_session_credit := least(
    greatest(1800.000, video_record.duration_seconds::numeric),
    session_guard_record.watch_credit_seconds
      + greatest(
          0,
          extract(
            epoch from (current_clock - session_guard_record.credit_updated_at)
          ) * 2.0
        )
  );
  accepted_delta := least(
    requested_delta,
    floor(accrued_credit)::integer,
    floor(accrued_session_credit)::integer
  );

  update private.video_progress_guards
  set watch_credit_seconds = accrued_credit - accepted_delta,
      credit_updated_at = current_clock
  where student_id = student
    and video_id = p_video_id;

  update private.watch_session_guards
  set watch_credit_seconds = accrued_session_credit - accepted_delta,
      credit_updated_at = current_clock
  where student_id = student
    and client_session_id = p_session_id;

  update public.watch_sessions
  set watched_seconds = watched_seconds + accepted_delta,
      last_position_seconds = normalized_position,
      device_type = normalized_device,
      last_sequence = p_sequence,
      last_reported_at = current_clock,
      ended_at = case when p_is_final then now() else ended_at end
  where id = session_record.id;

  update public.video_progress
  set watched_seconds = watched_seconds + accepted_delta,
      last_position_seconds = normalized_position,
      last_watched_at = case
        when accepted_delta > 0 then now()
        else last_watched_at
      end
  where student_id = student
    and video_id = p_video_id;

  perform private.recalculate_daily_progress(student, video_record.challenge_day_id);

  return private.build_progress_payload(student, p_video_id, accepted_delta);
end;
$$;

create or replace function public.mark_video_complete(
  p_video_id uuid,
  p_expected_student_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  student uuid;
  video_record public.videos;
  progress_record public.video_progress;
  threshold numeric(5, 2);
  calculated_percentage numeric(5, 2);
begin
  student := private.require_student_profile_id();

  if p_expected_student_id is not null
    and student <> p_expected_student_id
  then
    raise exception 'Authenticated student does not match expected_student_id'
      using errcode = '42501';
  end if;

  select v.*
  into video_record
  from public.videos as v
  join public.challenge_days as d on d.id = v.challenge_day_id
  where v.id = p_video_id
    and v.is_published
    and d.is_published
    and (d.release_date is null or d.release_date <= private.program_date());

  if not found then
    raise exception 'Video is not available'
      using errcode = 'P0002';
  end if;

  select vp.*
  into progress_record
  from public.video_progress as vp
  where vp.student_id = student
    and vp.video_id = p_video_id
  for update;

  if not found then
    raise exception 'Watch progress is required before completion'
      using errcode = '22023';
  end if;

  if not progress_record.completed then
    select cs.video_completion_threshold
    into threshold
    from public.challenge_settings as cs
    where cs.id = 1;

    calculated_percentage := least(
      100.00,
      round(
        (progress_record.watched_seconds::numeric * 100.00)
          / video_record.duration_seconds,
        2
      )
    );

    if calculated_percentage < threshold then
      raise exception 'Watch at least % percent before marking complete', threshold
        using errcode = '22023';
    end if;

    update public.video_progress
    set completed = true,
        completed_at = now()
    where student_id = student
      and video_id = p_video_id;
  end if;

  perform private.recalculate_daily_progress(student, video_record.challenge_day_id);

  return private.build_progress_payload(student, p_video_id, 0);
end;
$$;

create or replace function public.reorder_day_videos(
  p_challenge_day_id uuid,
  p_ordered_video_ids uuid[]
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  existing_count integer;
  supplied_count integer;
  distinct_count integer;
  matching_count integer;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required'
      using errcode = '42501';
  end if;

  if p_challenge_day_id is null or p_ordered_video_ids is null then
    raise exception 'challenge_day_id and ordered_video_ids are required'
      using errcode = '22023';
  end if;

  select count(*)::integer
  into existing_count
  from public.videos as v
  where v.challenge_day_id = p_challenge_day_id;

  select count(*)::integer, count(distinct item)::integer
  into supplied_count, distinct_count
  from unnest(p_ordered_video_ids) as item;

  select count(*)::integer
  into matching_count
  from public.videos as v
  where v.challenge_day_id = p_challenge_day_id
    and v.id = any(p_ordered_video_ids);

  if existing_count = 0
    or supplied_count <> existing_count
    or distinct_count <> supplied_count
    or matching_count <> existing_count
  then
    raise exception 'ordered_video_ids must contain every day video exactly once'
      using errcode = '22023';
  end if;

  set constraints public.videos_challenge_day_video_number_key deferred;

  update public.videos as v
  set video_number = ordered.position::smallint
  from unnest(p_ordered_video_ids) with ordinality as ordered(video_id, position)
  where v.id = ordered.video_id
    and v.challenge_day_id = p_challenge_day_id;

  set constraints public.videos_challenge_day_video_number_key immediate;
end;
$$;

create or replace function public.upsert_day_videos(
  p_challenge_day_id uuid,
  p_videos jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  item jsonb;
  item_keys text[];
  item_id uuid;
  existing_id uuid;
  item_number smallint;
  item_title text;
  item_description text;
  item_duration integer;
  item_thumbnail_url text;
  item_source public.video_source_type;
  item_video_url text;
  item_playback_id text;
  item_is_published boolean;
  supplied_count integer;
  distinct_count integer;
begin
  if not private.is_admin() then
    raise exception 'Administrator access required'
      using errcode = '42501';
  end if;

  if p_challenge_day_id is null
    or not exists (
      select 1 from public.challenge_days as d where d.id = p_challenge_day_id
    )
  then
    raise exception 'A valid challenge_day_id is required'
      using errcode = '22023';
  end if;

  if p_videos is null or jsonb_typeof(p_videos) <> 'array' then
    raise exception 'videos must be a JSON array'
      using errcode = '22023';
  end if;

  supplied_count := jsonb_array_length(p_videos);
  if supplied_count not between 1 and 10 then
    raise exception 'videos must contain between 1 and 10 items'
      using errcode = '22023';
  end if;

  begin
    select count(distinct (value ->> 'video_number')::smallint)::integer
    into distinct_count
    from jsonb_array_elements(p_videos);
  exception
    when invalid_text_representation or numeric_value_out_of_range then
      raise exception 'Each video_number must be an integer from 1 through 10'
        using errcode = '22023';
  end;

  if distinct_count <> supplied_count then
    raise exception 'Each video_number must be unique in the payload'
      using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_videos)
  loop
    if jsonb_typeof(item) <> 'object' then
      raise exception 'Each videos item must be an object'
        using errcode = '22023';
    end if;

    select array_agg(key order by key)
    into item_keys
    from jsonb_object_keys(item) as key;

    if exists (
      select 1
      from unnest(item_keys) as supplied_key
      where supplied_key <> all(array[
        'id',
        'video_number',
        'title',
        'description',
        'duration_seconds',
        'thumbnail_url',
        'video_source_type',
        'video_url',
        'playback_id',
        'is_published'
      ])
    ) then
      raise exception 'A video payload contains an unknown field'
        using errcode = '22023';
    end if;

    begin
      item_id := nullif(btrim(item ->> 'id'), '')::uuid;
      item_number := (item ->> 'video_number')::smallint;
      item_duration := (item ->> 'duration_seconds')::integer;
      item_source := coalesce(
        nullif(btrim(item ->> 'video_source_type'), ''),
        'external_url'
      )::public.video_source_type;
      item_is_published := coalesce((item ->> 'is_published')::boolean, false);
    exception
      when invalid_text_representation or numeric_value_out_of_range then
        raise exception 'A video id, number, duration, source, or published value is invalid'
          using errcode = '22023';
    end;

    item_title := nullif(btrim(item ->> 'title'), '');
    item_description := nullif(btrim(item ->> 'description'), '');
    item_thumbnail_url := nullif(btrim(item ->> 'thumbnail_url'), '');
    item_video_url := nullif(btrim(item ->> 'video_url'), '');
    item_playback_id := nullif(btrim(item ->> 'playback_id'), '');

    if item_number not between 1 and 10 then
      raise exception 'Each video_number must be an integer from 1 through 10'
        using errcode = '22023';
    end if;

    if item_title is null then
      raise exception 'Each video title is required'
        using errcode = '22023';
    end if;

    if item_duration is null or item_duration not between 1 and 43200 then
      raise exception 'Each duration_seconds must be from 1 through 43200'
        using errcode = '22023';
    end if;

    if item_source = 'external_url'::public.video_source_type
      and item_video_url is null
    then
      raise exception 'external_url videos require video_url'
        using errcode = '22023';
    end if;

    if item_source in (
      'cloudflare_stream'::public.video_source_type,
      'mux'::public.video_source_type
    ) and item_playback_id is null
    then
      raise exception 'managed video providers require playback_id'
        using errcode = '22023';
    end if;

    select v.id
    into existing_id
    from public.videos as v
    where v.challenge_day_id = p_challenge_day_id
      and v.video_number = item_number
    for update;

    if existing_id is not null then
      if item_id is not null and item_id <> existing_id then
        raise exception 'A supplied video id does not match its existing day slot'
          using errcode = '22023';
      end if;

      update public.videos
      set title = item_title,
          description = item_description,
          duration_seconds = item_duration,
          thumbnail_url = item_thumbnail_url,
          video_source_type = item_source,
          video_url = item_video_url,
          playback_id = item_playback_id,
          is_published = item_is_published
      where id = existing_id;
    else
      insert into public.videos (
        id,
        challenge_day_id,
        video_number,
        title,
        description,
        duration_seconds,
        thumbnail_url,
        video_source_type,
        video_url,
        playback_id,
        is_published
      )
      values (
        coalesce(item_id, extensions.gen_random_uuid()),
        p_challenge_day_id,
        item_number,
        item_title,
        item_description,
        item_duration,
        item_thumbnail_url,
        item_source,
        item_video_url,
        item_playback_id,
        item_is_published
      );
    end if;

    item_id := null;
    existing_id := null;
  end loop;
end;
$$;

revoke all on table public.challenge_days from public, anon, authenticated;
revoke all on table public.videos from public, anon, authenticated;
revoke all on table public.video_progress from public, anon, authenticated;
revoke all on table public.watch_sessions from public, anon, authenticated;
revoke all on table public.daily_progress from public, anon, authenticated;
revoke all on table public.audit_logs from public, anon, authenticated;
revoke all on table private.video_progress_guards from public, anon, authenticated;
revoke all on table private.watch_session_guards from public, anon, authenticated;

grant select, insert, update, delete on table public.challenge_days to authenticated;
grant select, insert, update, delete on table public.videos to authenticated;
grant select on table public.video_progress to authenticated;
grant select on table public.watch_sessions to authenticated;
grant select on table public.daily_progress to authenticated;
grant select on table public.audit_logs to authenticated;

grant all on table public.challenge_days,
  public.videos,
  public.video_progress,
  public.watch_sessions,
  public.daily_progress,
  public.audit_logs
to service_role;
grant all on table private.video_progress_guards to service_role;
grant all on table private.watch_session_guards to service_role;
grant usage on type public.video_source_type to authenticated, service_role;

revoke all on function private.normalize_challenge_day() from public, anon, authenticated;
revoke all on function private.normalize_video() from public, anon, authenticated;
revoke all on function private.current_profile_id() from public, anon, authenticated;
revoke all on function private.require_student_profile_id() from public, anon, authenticated;
revoke all on function private.program_date() from public, anon, authenticated;
revoke all on function private.is_video_available(uuid) from public, anon, authenticated;
revoke all on function private.validate_video_progress() from public, anon, authenticated;
revoke all on function private.recalculate_daily_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function private.build_progress_payload(uuid, uuid, integer) from public, anon, authenticated;
revoke all on function private.audit_content_change() from public, anon, authenticated;
revoke all on function private.refresh_progress_after_video_change() from public, anon, authenticated;

revoke all on function public.start_video_session(uuid, uuid, text, numeric, uuid) from public, anon, authenticated;
revoke all on function public.record_video_progress(uuid, uuid, integer, numeric, numeric, text, boolean, uuid) from public, anon, authenticated;
revoke all on function public.mark_video_complete(uuid, uuid) from public, anon, authenticated;
revoke all on function public.reorder_day_videos(uuid, uuid[]) from public, anon, authenticated;
revoke all on function public.upsert_day_videos(uuid, jsonb) from public, anon, authenticated;

grant execute on function private.current_profile_id() to authenticated, service_role;
grant execute on function private.program_date() to authenticated, service_role;
grant execute on function private.is_video_available(uuid) to authenticated, service_role;
grant execute on function public.start_video_session(uuid, uuid, text, numeric, uuid) to authenticated;
grant execute on function public.record_video_progress(uuid, uuid, integer, numeric, numeric, text, boolean, uuid) to authenticated;
grant execute on function public.mark_video_complete(uuid, uuid) to authenticated;
grant execute on function public.reorder_day_videos(uuid, uuid[]) to authenticated;
grant execute on function public.upsert_day_videos(uuid, jsonb) to authenticated;

-- Supabase Realtime honors RLS for Postgres Changes. Publishing only these
-- synchronization-critical tables is safe and is idempotent across environments.
do $$
declare
  realtime_table text;
begin
  if exists (
    select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime'
  ) then
    foreach realtime_table in array array[
      'challenge_days',
      'videos',
      'video_progress',
      'daily_progress'
    ]
    loop
      if not exists (
        select 1
        from pg_catalog.pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = realtime_table
      ) then
        execute format(
          'alter publication supabase_realtime add table public.%I',
          realtime_table
        );
      end if;
    end loop;
  end if;
end
$$;

comment on table public.challenge_days is 'Admin-managed 1-100 challenge day catalogue.';
comment on table public.videos is 'Provider-neutral learning video metadata, ordered 1-10 per day.';
comment on table public.video_progress is 'Authoritative cross-device playback position and completion per student/video.';
comment on table public.watch_sessions is 'Per-device playback sessions updated only through progress RPCs.';
comment on table public.daily_progress is 'Server-recalculated learning totals per student/day.';
comment on table public.audit_logs is 'Identifiable admin mutations to managed content.';
comment on function public.start_video_session(uuid, uuid, text, numeric, uuid) is
  'Starts an idempotent client session. An optional expected student profile prevents an in-flight request from being attributed after an account switch.';
comment on function public.record_video_progress(uuid, uuid, integer, numeric, numeric, text, boolean, uuid) is
  'Records a sequence-idempotent heartbeat, rejects an optional expected-student mismatch, and caps media time globally at 2x wall-clock.';
comment on function public.mark_video_complete(uuid, uuid) is
  'Marks a video complete after the server-side threshold and rejects an optional expected-student mismatch.';
comment on function public.reorder_day_videos(uuid, uuid[]) is
  'Admin-only atomic reorder; the array must contain every video in the day exactly once.';
comment on function public.upsert_day_videos(uuid, jsonb) is
  'Admin-only atomic bulk insert/update for one to ten validated day video slots.';
