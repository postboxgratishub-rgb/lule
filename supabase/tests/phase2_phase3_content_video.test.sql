begin;

create extension if not exists pgtap with schema extensions;

select extensions.no_plan();

-- Isolated users and content; the transaction is rolled back after this file.
insert into public.schools (id, name, code, city, state)
values ('92000000-0000-4000-8000-000000000001', 'Phase 2 Test School', 'P23TEST', 'Bengaluru', 'Karnataka');

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    '92100000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'phase23.student1@example.com',
    extensions.crypt('Test123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 23 Student One","school_id":"92000000-0000-4000-8000-000000000001"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '92100000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'phase23.student2@example.com',
    extensions.crypt('Test123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 23 Student Two","school_id":"92000000-0000-4000-8000-000000000001"}',
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '92100000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'phase23.admin@example.com',
    extensions.crypt('Test123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Phase 23 Administrator"}',
    now(), now(), '', '', '', ''
  );

update public.profiles
set role = 'admin'
where auth_user_id = '92100000-0000-4000-8000-000000000003';

-- Use a two-video requirement for this compact end-to-end fixture. Production
-- and the development seed retain the configured default of ten.
update public.challenge_settings
set videos_per_day = 2
where id = 1;

insert into public.challenge_days (
  id, day_number, title, description, release_date, is_published
)
values
  (
    '92200000-0000-4000-8000-000000000001',
    91,
    'Available Test Day',
    'Published and released.',
    private.program_date(),
    true
  ),
  (
    '92200000-0000-4000-8000-000000000002',
    92,
    'Future Test Day',
    'Published but not released.',
    private.program_date() + 1,
    true
  ),
  (
    '92200000-0000-4000-8000-000000000003',
    93,
    'Draft Test Day',
    'Not published.',
    private.program_date(),
    false
  );

insert into public.videos (
  id,
  challenge_day_id,
  video_number,
  title,
  duration_seconds,
  video_source_type,
  video_url,
  playback_id,
  is_published
)
values
  (
    '92300000-0000-4000-8000-000000000001',
    '92200000-0000-4000-8000-000000000001',
    1,
    'First Available Video',
    40,
    'external_url',
    'https://example.com/video-1.mp4',
    null,
    true
  ),
  (
    '92300000-0000-4000-8000-000000000002',
    '92200000-0000-4000-8000-000000000001',
    2,
    'Second Available Video',
    20,
    'mux',
    null,
    'mux-public-playback-id',
    true
  ),
  (
    '92300000-0000-4000-8000-000000000003',
    '92200000-0000-4000-8000-000000000001',
    3,
    'Draft Video',
    30,
    'external_url',
    'https://example.com/video-draft.mp4',
    null,
    false
  ),
  (
    '92300000-0000-4000-8000-000000000004',
    '92200000-0000-4000-8000-000000000002',
    1,
    'Future Day Video',
    30,
    'external_url',
    'https://example.com/video-future.mp4',
    null,
    true
  ),
  (
    '92300000-0000-4000-8000-000000000005',
    '92200000-0000-4000-8000-000000000003',
    1,
    'Draft Day Video',
    30,
    'cloudflare_stream',
    null,
    'cloudflare-public-playback-id',
    true
  );

-- Schema, constraints, indexes, and the public RPC surface.
select extensions.has_table('public', 'challenge_days', 'challenge_days exists');
select extensions.has_table('public', 'videos', 'videos exists');
select extensions.has_table('public', 'video_progress', 'video_progress exists');
select extensions.has_table('public', 'watch_sessions', 'watch_sessions exists');
select extensions.has_table('public', 'daily_progress', 'daily_progress exists');
select extensions.has_table('public', 'audit_logs', 'audit_logs exists');
select extensions.has_table('private', 'video_progress_guards', 'private playback guard exists');
select extensions.has_table('private', 'watch_session_guards', 'private session playback guard exists');
select extensions.ok(to_regtype('public.video_source_type') is not null, 'video source type exists');
select extensions.is(
  (
    select array_agg(e.enumlabel order by e.enumsortorder)::text
    from pg_catalog.pg_enum as e
    where e.enumtypid = 'public.video_source_type'::regtype
  ),
  '{external_url,cloudflare_stream,mux}'::text,
  'video source type is provider-neutral'
);
select extensions.col_is_pk('public', 'challenge_days', 'id', 'challenge day id is the primary key');
select extensions.col_is_pk('public', 'videos', 'id', 'video id is the primary key');
select extensions.col_is_pk('public', 'video_progress', 'id', 'video progress id is the primary key');
select extensions.col_is_pk('public', 'watch_sessions', 'id', 'watch session id is the primary key');
select extensions.col_is_pk('public', 'daily_progress', 'id', 'daily progress id is the primary key');
select extensions.has_column('public', 'watch_sessions', 'client_session_id', 'client session id is stored');
select extensions.has_column('public', 'watch_sessions', 'last_sequence', 'heartbeat sequence is stored');
select extensions.has_column('public', 'videos', 'playback_id', 'provider playback id is stored');
select extensions.has_function(
  'public',
  'start_video_session',
  array['uuid', 'uuid', 'text', 'numeric'],
  'start session RPC exists'
);
select extensions.has_function(
  'public',
  'record_video_progress',
  array['uuid', 'uuid', 'integer', 'numeric', 'numeric', 'text', 'boolean'],
  'heartbeat RPC exists'
);
select extensions.has_function(
  'public',
  'mark_video_complete',
  array['uuid'],
  'mark complete RPC exists'
);
select extensions.has_function(
  'public',
  'reorder_day_videos',
  array['uuid', 'uuid[]'],
  'admin reorder RPC exists'
);
select extensions.has_function(
  'public',
  'upsert_day_videos',
  array['uuid', 'jsonb'],
  'admin bulk video save RPC exists'
);
select extensions.has_index(
  'public',
  'video_progress',
  'video_progress_student_completed_idx',
  'student completion lookup is indexed'
);
select extensions.has_index(
  'public',
  'watch_sessions',
  'watch_sessions_session_date_idx',
  'today activity lookup is indexed'
);
select extensions.has_index(
  'public',
  'daily_progress',
  'daily_progress_challenge_day_completed_idx',
  'day completion lookup is indexed'
);
select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'challenge_days', 'videos', 'video_progress',
        'watch_sessions', 'daily_progress', 'audit_logs'
      )
      and c.relrowsecurity
  ),
  6::bigint,
  'RLS is enabled on every new public table'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.challenge_days', 'SELECT'),
  'anonymous users cannot read challenge content'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.video_progress', 'INSERT'),
  'clients cannot insert progress directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.video_progress', 'UPDATE'),
  'clients cannot update progress directly'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.watch_sessions', 'INSERT'),
  'clients cannot insert watch sessions directly'
);
select extensions.ok(
  has_function_privilege(
    'authenticated',
    'public.record_video_progress(uuid,uuid,integer,numeric,numeric,text,boolean)',
    'EXECUTE'
  ),
  'authenticated clients can execute the secured heartbeat RPC'
);
select extensions.ok(
  not has_function_privilege(
    'anon',
    'public.record_video_progress(uuid,uuid,integer,numeric,numeric,text,boolean)',
    'EXECUTE'
  ),
  'anonymous clients cannot execute the heartbeat RPC'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.video_progress_guards', 'SELECT'),
  'playback anti-abuse state is not client-readable'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'private.watch_session_guards', 'SELECT'),
  'session anti-abuse state is not client-readable'
);

select extensions.throws_ok(
  $$insert into public.challenge_days (day_number, title) values (101, 'Invalid Day')$$,
  '23514',
  null,
  'day numbers above 100 are rejected'
);
select extensions.throws_ok(
  $$update public.challenge_settings set total_days = 101 where id = 1$$,
  '23514',
  null,
  'settings cannot advertise more than the supported 100 days'
);
select extensions.throws_ok(
  $$update public.challenge_settings set videos_per_day = 11 where id = 1$$,
  '23514',
  null,
  'settings cannot advertise more than the supported ten video slots'
);
select extensions.throws_ok(
  $$insert into public.challenge_days (day_number, title) values (91, 'Duplicate Day')$$,
  '23505',
  null,
  'day numbers are unique'
);
select extensions.throws_ok(
  $$
    insert into public.videos (
      challenge_day_id, video_number, title, duration_seconds,
      video_source_type, video_url
    ) values (
      '92200000-0000-4000-8000-000000000001', 11, 'Invalid Number', 60,
      'external_url', 'https://example.com/invalid.mp4'
    )
  $$,
  '23514',
  null,
  'video numbers above ten are rejected'
);
select extensions.throws_ok(
  $$
    insert into public.videos (
      challenge_day_id, video_number, title, duration_seconds,
      video_source_type, video_url
    ) values (
      '92200000-0000-4000-8000-000000000001', 4, 'Missing URL', 60,
      'external_url', null
    )
  $$,
  '23514',
  null,
  'external sources require a URL'
);
select extensions.throws_ok(
  $$
    insert into public.videos (
      challenge_day_id, video_number, title, duration_seconds,
      video_source_type, video_url
    ) values (
      '92200000-0000-4000-8000-000000000001', 4, 'Unsafe URL', 60,
      'external_url', 'javascript:alert(1)'
    )
  $$,
  '23514',
  null,
  'external video locators require an HTTP or HTTPS URL'
);
select extensions.throws_ok(
  $$
    insert into public.videos (
      challenge_day_id, video_number, title, duration_seconds,
      video_source_type, playback_id
    ) values (
      '92200000-0000-4000-8000-000000000001', 4, 'Missing Playback', 60,
      'mux', null
    )
  $$,
  '23514',
  null,
  'managed providers require a playback id'
);
select extensions.throws_ok(
  $$
    insert into public.videos (
      challenge_day_id, video_number, title, duration_seconds,
      video_source_type, video_url
    ) values (
      '92200000-0000-4000-8000-000000000001', 1, 'Duplicate Position', 60,
      'external_url', 'https://example.com/duplicate.mp4'
    )
  $$,
  '23505',
  null,
  'video position is unique within a day'
);

select extensions.ok(
  not exists (
    select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime'
  )
  or (
    select count(*) = 4
    from pg_catalog.pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename in ('challenge_days', 'videos', 'video_progress', 'daily_progress')
  ),
  'synchronization tables are in Realtime when its publication exists'
);

-- Student One sees only released content and uses the secured playback flow.
set local request.jwt.claim.sub = '92100000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"92100000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

select extensions.is(
  (select count(*) from public.challenge_days where id::text like '92200000-%'),
  1::bigint,
  'a student sees only published and released days'
);
select extensions.is(
  (select count(*) from public.videos where id::text like '92300000-%'),
  2::bigint,
  'a student sees only videos published under an available day'
);
select extensions.is(
  (
    public.start_video_session(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      'WEB',
      0
    ) ->> 'watched_seconds'
  )::integer,
  0,
  'opening a video starts a session but adds no watch time'
);
select extensions.is(
  (
    public.start_video_session(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      'web',
      0
    ) ->> 'total_sessions'
  )::integer,
  1,
  'starting the same client session is idempotent'
);
select extensions.is(
  (
    select last_watched_at
    from public.video_progress
    where video_id = '92300000-0000-4000-8000-000000000001'
  ),
  null::timestamptz,
  'opening a player does not create valid watch activity'
);
select extensions.throws_ok(
  $$select public.start_video_session(
      '92300000-0000-4000-8000-000000000004',
      '92400000-0000-4000-8000-000000000004',
      'web', 0
    )$$,
  'P0002',
  'Video is not available',
  'a student cannot start a future-day video'
);
select extensions.throws_ok(
  $$select public.start_video_session(
      '92300000-0000-4000-8000-000000000003',
      '92400000-0000-4000-8000-000000000003',
      'web', 0
    )$$,
  'P0002',
  'Video is not available',
  'a student cannot start an unpublished video'
);
select extensions.throws_ok(
  $$select public.reorder_day_videos(
      '92200000-0000-4000-8000-000000000001',
      array['92300000-0000-4000-8000-000000000001'::uuid]
    )$$,
  '42501',
  'Administrator access required',
  'a student cannot reorder content'
);

reset role;

-- Give exactly ten wall-clock seconds of shared 2x credit. The first request
-- cannot claim more than approximately twenty media seconds even if it submits 30.
update private.video_progress_guards
set watch_credit_seconds = 0,
    credit_updated_at = clock_timestamp() - interval '10 seconds'
where student_id = '92100000-0000-4000-8000-000000000001'
  and video_id = '92300000-0000-4000-8000-000000000001';
update private.watch_session_guards
set watch_credit_seconds = 0,
    credit_updated_at = clock_timestamp() - interval '10 seconds'
where student_id = '92100000-0000-4000-8000-000000000001'
  and client_session_id = '92400000-0000-4000-8000-000000000001';

set local role authenticated;

select extensions.ok(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      1,
      20,
      30,
      'web',
      false
    ) ->> 'accepted_delta_seconds'
  )::integer between 19 and 21,
  'a forged 30-second heartbeat is capped to the supported 2x wall-clock rate'
);
select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      1,
      39,
      30,
      'web',
      false
    ) ->> 'accepted_delta_seconds'
  )::integer,
  0,
  'a duplicate heartbeat sequence adds no watch time'
);
select extensions.ok(
  (
    select last_position_seconds between 19 and 20
    from public.video_progress
    where video_id = '92300000-0000-4000-8000-000000000001'
  ),
  'a stale heartbeat cannot overwrite the canonical resume position'
);
select extensions.throws_ok(
  $$select public.mark_video_complete('92300000-0000-4000-8000-000000000001')$$,
  '22023',
  'Watch at least 90.00 percent before marking complete',
  'completion is rejected below the configured threshold'
);

reset role;
update private.video_progress_guards
set watch_credit_seconds = 30,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and video_id = '92300000-0000-4000-8000-000000000001';
update private.watch_session_guards
set watch_credit_seconds = 30,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and client_session_id = '92400000-0000-4000-8000-000000000001';
set local role authenticated;

select extensions.ok(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      2,
      40,
      40 - (
        select watched_seconds
        from public.video_progress
        where student_id = '92100000-0000-4000-8000-000000000001'
          and video_id = '92300000-0000-4000-8000-000000000001'
      ),
      'web',
      true
    ) ->> 'eligible_to_complete'
  )::boolean,
  'server-validated watch time makes the video eligible'
);
select extensions.ok(
  (
    public.mark_video_complete('92300000-0000-4000-8000-000000000001')
      ->> 'completed'
  )::boolean,
  'the explicit mark-complete action persists completion'
);
select extensions.is(
  (
    public.mark_video_complete('92300000-0000-4000-8000-000000000001')
      -> 'daily_progress' ->> 'completed'
  )::boolean,
  false,
  'a day cannot complete until every configured required video is complete'
);
select extensions.is(
  (
    public.mark_video_complete('92300000-0000-4000-8000-000000000001')
      ->> 'completed'
  )::boolean,
  true,
  'mark complete is idempotent and completion remains sticky'
);
select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      2,
      40,
      30,
      'web',
      true
    ) ->> 'accepted_delta_seconds'
  )::integer,
  0,
  'retrying the final heartbeat remains idempotent after session close'
);

select extensions.is(
  (
    public.start_video_session(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000002',
      'android',
      40
    ) ->> 'total_sessions'
  )::integer,
  2,
  'a second device session is tracked once'
);

reset role;
update private.video_progress_guards
set watch_credit_seconds = 0,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and video_id = '92300000-0000-4000-8000-000000000001';
set local role authenticated;

select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000002',
      1,
      40,
      30,
      'android',
      false
    ) ->> 'accepted_delta_seconds'
  )::integer,
  0,
  'concurrent devices share one global playback credit bucket'
);
select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000002',
      2,
      40,
      99999999999999999999999999999999999999,
      'android',
      true
    ) ->> 'accepted_delta_seconds'
  )::integer,
  0,
  'an extreme claimed delta is safely bounded before integer conversion'
);

select extensions.is(
  (
    public.start_video_session(
      '92300000-0000-4000-8000-000000000002',
      '92400000-0000-4000-8000-000000000005',
      'web',
      0
    ) -> 'daily_progress' ->> 'videos_total'
  )::integer,
  2,
  'daily denominator uses the configured required-video count'
);

reset role;
update private.video_progress_guards
set watch_credit_seconds = 20,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and video_id = '92300000-0000-4000-8000-000000000002';
update private.watch_session_guards
set watch_credit_seconds = 20,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and client_session_id = '92400000-0000-4000-8000-000000000005';
set local role authenticated;

select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000002',
      '92400000-0000-4000-8000-000000000005',
      1,
      20,
      20,
      'web',
      true
    ) ->> 'accepted_delta_seconds'
  )::integer,
  20,
  'legitimate accumulated media time is accepted'
);
select extensions.ok(
  (
    public.mark_video_complete('92300000-0000-4000-8000-000000000002')
      -> 'daily_progress' ->> 'completed'
  )::boolean,
  'completing every published video marks the day complete atomically'
);
select extensions.is(
  (
    select videos_completed::integer
    from public.daily_progress
    where challenge_day_id = '92200000-0000-4000-8000-000000000001'
  ),
  2,
  'daily progress has the authoritative completed-video count'
);
select extensions.is(
  (
    select completion_percentage::text
    from public.daily_progress
    where challenge_day_id = '92200000-0000-4000-8000-000000000001'
  ),
  '100.00',
  'daily completion percentage is recalculated server-side'
);
select extensions.ok(
  (
    select watch_time_seconds between 59 and 61
    from public.daily_progress
    where challenge_day_id = '92200000-0000-4000-8000-000000000001'
  ),
  'daily watch time is the sum of accepted session seconds'
);
select extensions.is(
  (
    public.start_video_session(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000006',
      'android',
      0
    ) ->> 'total_sessions'
  )::integer,
  3,
  'a reconnect can start a fresh tracked session'
);

reset role;
update private.video_progress_guards
set watch_credit_seconds = 60,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and video_id = '92300000-0000-4000-8000-000000000001';
update private.watch_session_guards
set watch_credit_seconds = 60,
    credit_updated_at = clock_timestamp()
where student_id = '92100000-0000-4000-8000-000000000001'
  and client_session_id = '92400000-0000-4000-8000-000000000006';
set local role authenticated;

select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000006',
      1,
      12,
      12,
      'android',
      false
    ) ->> 'accepted_delta_seconds'
  )::integer,
  12,
  'the first queued offline heartbeat consumes accumulated session credit'
);
select extensions.is(
  (
    public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000006',
      2,
      24,
      12,
      'android',
      true
    ) ->> 'accepted_delta_seconds'
  )::integer,
  12,
  'later queued heartbeats retain and consume offline credit without waiting again'
);
select extensions.is(
  (
    select watch_time_seconds
    from public.daily_progress
    where challenge_day_id = '92200000-0000-4000-8000-000000000001'
  ),
  84,
  'accepted offline heartbeats are preserved in the daily watch-time aggregate'
);
select extensions.is(
  (select count(*) from public.video_progress),
  2::bigint,
  'a student sees only their own progress rows'
);
select extensions.is(
  (select count(*) from public.watch_sessions),
  4::bigint,
  'a student sees only their own device sessions'
);
select extensions.is(
  (select count(*) from public.audit_logs),
  0::bigint,
  'students cannot read admin audit logs'
);

-- Student Two cannot see or mutate Student One's learning state.
reset role;
set local request.jwt.claim.sub = '92100000-0000-4000-8000-000000000002';
set local request.jwt.claims = '{"sub":"92100000-0000-4000-8000-000000000002","role":"authenticated"}';
set local role authenticated;

select extensions.is(
  (select count(*) from public.video_progress),
  0::bigint,
  'another student cannot see the first student progress'
);
select extensions.is(
  (select count(*) from public.watch_sessions),
  0::bigint,
  'another student cannot see the first student sessions'
);
select extensions.is(
  (select count(*) from public.daily_progress),
  0::bigint,
  'another student cannot see the first student daily aggregate'
);
select extensions.throws_ok(
  $$select public.record_video_progress(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000001',
      3, 40, 20, 'web', false
    )$$,
  'P0002',
  'Watch session not found; call start_video_session first',
  'a session id cannot be stolen across students'
);

-- Admins see all content and learning rows, can manage/reorder content, and
-- identifiable changes are captured by the audit trigger.
reset role;
set local request.jwt.claim.sub = '92100000-0000-4000-8000-000000000003';
set local request.jwt.claims = '{"sub":"92100000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

select extensions.is(
  (select count(*) from public.challenge_days where id::text like '92200000-%'),
  3::bigint,
  'an admin sees published, future, and draft days'
);
select extensions.is(
  (select count(*) from public.videos where id::text like '92300000-%'),
  5::bigint,
  'an admin sees published and draft videos'
);
select extensions.is(
  (
    select count(*)
    from public.video_progress
    where student_id = '92100000-0000-4000-8000-000000000001'
      and video_id::text like '92300000-%'
  ),
  2::bigint,
  'an admin can inspect student progress'
);
select extensions.is(
  (
    select count(*)
    from public.watch_sessions
    where student_id = '92100000-0000-4000-8000-000000000001'
      and video_id::text like '92300000-%'
  ),
  4::bigint,
  'an admin can inspect watch sessions'
);
select extensions.results_eq(
  $$
    update public.challenge_days
    set title = 'Available Test Day Updated'
    where id = '92200000-0000-4000-8000-000000000001'
    returning title
  $$,
  $$values ('Available Test Day Updated'::text)$$,
  'an admin can edit challenge content'
);
select extensions.is(
  (
    select count(*)
    from public.audit_logs
    where admin_id = '92100000-0000-4000-8000-000000000003'
      and entity_type = 'challenge_days'
      and action = 'update'
      and entity_id = '92200000-0000-4000-8000-000000000001'
  ),
  1::bigint,
  'an admin content edit creates an attributable audit row'
);
select extensions.lives_ok(
  $$update public.videos
    set is_published = false
    where id = '92300000-0000-4000-8000-000000000002'$$,
  'admin can unpublish a required video'
);
select extensions.is(
  (
    select completed
    from public.daily_progress
    where student_id = '92100000-0000-4000-8000-000000000001'
      and challenge_day_id = '92200000-0000-4000-8000-000000000001'
  ),
  false,
  'daily completion is recalculated when required content is unpublished'
);
select extensions.lives_ok(
  $$update public.videos
    set is_published = true
    where id = '92300000-0000-4000-8000-000000000002'$$,
  'admin can republish a required video'
);
select extensions.is(
  (
    select completed
    from public.daily_progress
    where student_id = '92100000-0000-4000-8000-000000000001'
      and challenge_day_id = '92200000-0000-4000-8000-000000000001'
  ),
  true,
  'daily completion is recalculated when required content is republished'
);
select extensions.lives_ok(
  $$select public.reorder_day_videos(
      '92200000-0000-4000-8000-000000000001',
      array[
        '92300000-0000-4000-8000-000000000003'::uuid,
        '92300000-0000-4000-8000-000000000002'::uuid,
        '92300000-0000-4000-8000-000000000001'::uuid
      ]
    )$$,
  'admin can atomically reorder all videos in a day'
);
select extensions.is(
  (
    select video_number::integer
    from public.videos
    where id = '92300000-0000-4000-8000-000000000003'
  ),
  1,
  'reorder assigns the first requested position'
);
select extensions.is(
  (
    select video_number::integer
    from public.videos
    where id = '92300000-0000-4000-8000-000000000001'
  ),
  3,
  'reorder assigns the last requested position'
);
select extensions.throws_ok(
  $$select public.reorder_day_videos(
      '92200000-0000-4000-8000-000000000001',
      array[
        '92300000-0000-4000-8000-000000000001'::uuid,
        '92300000-0000-4000-8000-000000000001'::uuid,
        '92300000-0000-4000-8000-000000000002'::uuid
      ]
    )$$,
  '22023',
  'ordered_video_ids must contain every day video exactly once',
  'reorder rejects duplicate or incomplete arrays'
);
select extensions.throws_ok(
  $$select public.start_video_session(
      '92300000-0000-4000-8000-000000000001',
      '92400000-0000-4000-8000-000000000009',
      'web', 0
    )$$,
  '42501',
  'An authenticated student profile is required',
  'an admin cannot manufacture student progress through the client RPC'
);
select extensions.lives_ok(
  $$select public.upsert_day_videos(
      '92200000-0000-4000-8000-000000000003',
      '[{"video_number":2,"title":"Bulk inserted video","duration_seconds":75,"video_source_type":"external_url","video_url":"https://example.com/bulk.mp4","is_published":false}]'::jsonb
    )$$,
  'admin can atomically insert missing video slots from JSON'
);
select extensions.is(
  (
    select title
    from public.videos
    where challenge_day_id = '92200000-0000-4000-8000-000000000003'
      and video_number = 2
  ),
  'Bulk inserted video',
  'bulk save inserts the requested slot'
);
select extensions.lives_ok(
  $$select public.upsert_day_videos(
      '92200000-0000-4000-8000-000000000003',
      '[{"video_number":2,"title":"Bulk updated video","duration_seconds":80,"video_source_type":"external_url","video_url":"https://example.com/bulk-updated.mp4","is_published":true}]'::jsonb
    )$$,
  'admin can atomically update an existing slot without ON CONFLICT'
);
select extensions.is(
  (
    select title
    from public.videos
    where challenge_day_id = '92200000-0000-4000-8000-000000000003'
      and video_number = 2
  ),
  'Bulk updated video',
  'bulk save updates by day and video number'
);
select extensions.throws_ok(
  $$select public.upsert_day_videos(
      '92200000-0000-4000-8000-000000000003',
      '[{"video_number":2,"title":"Duplicate A","duration_seconds":80,"video_source_type":"external_url","video_url":"https://example.com/a.mp4"},{"video_number":2,"title":"Duplicate B","duration_seconds":80,"video_source_type":"external_url","video_url":"https://example.com/b.mp4"}]'::jsonb
    )$$,
  '22023',
  'Each video_number must be unique in the payload',
  'bulk save rejects duplicate slots before making changes'
);

select * from extensions.finish();
rollback;
