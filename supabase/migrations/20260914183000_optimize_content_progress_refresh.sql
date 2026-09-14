-- Coalesce content-driven daily-progress maintenance for production-sized cohorts.
--
-- The Phase 2/3 row trigger recalculated every student/day once for every video
-- row touched. A ten-slot bulk save or reorder could therefore repeat the same
-- day calculation ten times. Keep duration-derived video percentages immediate,
-- but defer daily aggregation until the transaction's final content state is
-- visible and process each affected day only once.

create or replace function private.refresh_video_progress_after_duration_change()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
begin
  update public.video_progress
  set watched_seconds = watched_seconds,
      last_position_seconds = least(last_position_seconds, new.duration_seconds)
  where video_id = new.id;

  return new;
end;
$$;

create or replace function private.recalculate_daily_progress_for_day(
  p_challenge_day_id uuid
)
returns void
language sql
security definer
set search_path = ''
set row_security = off
as $$
  with challenge_config as materialized (
    select cs.videos_per_day::integer as videos_total
    from public.challenge_settings as cs
    where cs.id = 1
  ),
  affected_students as materialized (
    select dp.student_id
    from public.daily_progress as dp
    where dp.challenge_day_id = p_challenge_day_id
    union
    select vp.student_id
    from public.video_progress as vp
    join public.videos as v on v.id = vp.video_id
    where v.challenge_day_id = p_challenge_day_id
  ),
  publication_summary as (
    select count(*)::integer as published_count
    from public.videos as v
    cross join challenge_config as config
    where v.challenge_day_id = p_challenge_day_id
      and v.is_published
      and v.video_number <= config.videos_total
  ),
  progress_summary as (
    select
      students.student_id,
      count(*) filter (where vp.completed)::integer as videos_completed,
      min(vp.first_started_at) as first_started_at,
      max(vp.last_watched_at) as last_activity_at
    from affected_students as students
    cross join challenge_config as config
    left join public.videos as v
      on v.challenge_day_id = p_challenge_day_id
     and v.is_published
     and v.video_number <= config.videos_total
    left join public.video_progress as vp
      on vp.student_id = students.student_id
     and vp.video_id = v.id
    group by students.student_id
  ),
  watch_summary as (
    select
      ws.student_id,
      coalesce(sum(ws.watched_seconds), 0)::integer as watch_time_seconds
    from public.videos as v
    join public.watch_sessions as ws on ws.video_id = v.id
    join affected_students as students on students.student_id = ws.student_id
    where v.challenge_day_id = p_challenge_day_id
    group by ws.student_id
  ),
  desired as (
    select
      progress.student_id,
      p_challenge_day_id as challenge_day_id,
      progress.videos_completed,
      config.videos_total,
      coalesce(watch.watch_time_seconds, 0) as watch_time_seconds,
      round(
        (progress.videos_completed::numeric * 100.00) / config.videos_total,
        2
      ) as completion_percentage,
      publication.published_count = config.videos_total
        and progress.videos_completed = config.videos_total as completed,
      progress.first_started_at,
      progress.last_activity_at
    from progress_summary as progress
    cross join challenge_config as config
    cross join publication_summary as publication
    left join watch_summary as watch on watch.student_id = progress.student_id
  )
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
  select
    desired.student_id,
    desired.challenge_day_id,
    desired.videos_completed,
    desired.videos_total,
    desired.watch_time_seconds,
    desired.completion_percentage,
    desired.completed,
    desired.first_started_at,
    desired.last_activity_at,
    case when desired.completed then now() else null end
  from desired
  on conflict (student_id, challenge_day_id) do update
  set videos_completed = excluded.videos_completed,
      videos_total = excluded.videos_total,
      watch_time_seconds = excluded.watch_time_seconds,
      completion_percentage = excluded.completion_percentage,
      completed = excluded.completed,
      started_at = coalesce(public.daily_progress.started_at, excluded.started_at),
      last_activity_at = excluded.last_activity_at,
      completed_at = case
        when excluded.completed
          then coalesce(public.daily_progress.completed_at, now())
        else null
      end
  where row(
      public.daily_progress.videos_completed,
      public.daily_progress.videos_total,
      public.daily_progress.watch_time_seconds,
      public.daily_progress.completion_percentage,
      public.daily_progress.completed,
      public.daily_progress.started_at,
      public.daily_progress.last_activity_at,
      public.daily_progress.completed_at
    ) is distinct from row(
      excluded.videos_completed,
      excluded.videos_total,
      excluded.watch_time_seconds,
      excluded.completion_percentage,
      excluded.completed,
      coalesce(public.daily_progress.started_at, excluded.started_at),
      excluded.last_activity_at,
      case
        when excluded.completed
          then coalesce(public.daily_progress.completed_at, now())
        else null
      end
    );
$$;

create or replace function private.refresh_daily_progress_after_video_change_deferred()
returns trigger
language plpgsql
security definer
set search_path = ''
set row_security = off
as $$
declare
  affected_day_id uuid;
  refreshed_days text := coalesce(
    nullif(current_setting('lule.content_progress_refreshed_days', true), ''),
    ''
  );
begin
  -- UPDATE OF triggers also fire when a column is assigned its existing value.
  -- Avoid touching thousands of daily rows for an unchanged bulk-save payload.
  if tg_op = 'UPDATE'
    and new.challenge_day_id is not distinct from old.challenge_day_id
    and new.video_number is not distinct from old.video_number
    and new.is_published is not distinct from old.is_published
  then
    return new;
  end if;

  for affected_day_id in
    select distinct day_id
    from unnest(array[
      case when tg_op <> 'INSERT' then old.challenge_day_id else null end,
      case when tg_op <> 'DELETE' then new.challenge_day_id else null end
    ]) as day_id
    where day_id is not null
  loop
    -- This custom setting is transaction-local. Deferred row events from one
    -- bulk operation share it, so the first event sees the transaction's final
    -- table state and later events for the same day become inexpensive no-ops.
    if position(',' || affected_day_id::text || ',' in ',' || refreshed_days || ',') = 0 then
      refreshed_days := concat_ws(
        ',',
        nullif(refreshed_days, ''),
        affected_day_id::text
      );
      perform set_config(
        'lule.content_progress_refreshed_days',
        refreshed_days,
        true
      );

      perform private.recalculate_daily_progress_for_day(affected_day_id);
    end if;
  end loop;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists videos_refresh_progress_after_insert_delete on public.videos;
drop trigger if exists videos_refresh_progress_after_update on public.videos;

drop trigger if exists videos_progress_refresh_after_duration_change on public.videos;
create trigger videos_progress_refresh_after_duration_change
after update of duration_seconds on public.videos
for each row
when (old.duration_seconds is distinct from new.duration_seconds)
execute function private.refresh_video_progress_after_duration_change();

drop trigger if exists videos_daily_progress_refresh_deferred on public.videos;
create constraint trigger videos_daily_progress_refresh_deferred
after insert or delete or update of challenge_day_id, video_number, is_published
on public.videos
deferrable initially deferred
for each row
execute function private.refresh_daily_progress_after_video_change_deferred();

revoke all on function private.refresh_video_progress_after_duration_change()
from public, anon, authenticated;
revoke all on function private.recalculate_daily_progress_for_day(uuid)
from public, anon, authenticated;
revoke all on function private.refresh_daily_progress_after_video_change_deferred()
from public, anon, authenticated;

comment on function private.refresh_video_progress_after_duration_change() is
  'Revalidates existing video progress only when a video duration actually changes.';
comment on function private.recalculate_daily_progress_for_day(uuid) is
  'Set-based content-maintenance refresh for every student aggregate in one challenge day.';
comment on function private.refresh_daily_progress_after_video_change_deferred() is
  'Coalesces content-driven daily-progress refreshes to one run per affected day and transaction.';
