begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(49);

-- Isolated fixtures. The transaction is rolled back after the test run.
insert into public.schools (id, name, code, city, state, updated_at)
values
  ('90000000-0000-4000-8000-000000000001', 'RLS Test Academy', 'RLSA', 'Bengaluru', 'Karnataka', '2000-01-01 00:00:00+00'),
  ('90000000-0000-4000-8000-000000000002', 'RLS Test School Two', 'RLSTWO', 'Mysuru', 'Karnataka', '2000-01-01 00:00:00+00');

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
    '91000000-0000-4000-8000-000000000001',
    'authenticated',
    'authenticated',
    'rls.student1@example.com',
    extensions.crypt('Test123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"RLS Student One","school_id":"90000000-0000-4000-8000-000000000001","class_name":"8","section":"A","roll_number":"RLS-001","date_of_birth":"2012-01-01","role":"admin"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-4000-8000-000000000002',
    'authenticated',
    'authenticated',
    'rls.student2@example.com',
    extensions.crypt('Test123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"RLS Student Two","school_id":"90000000-0000-4000-8000-000000000001","class_name":"8","section":"A","roll_number":"RLS-002"}',
    now(),
    now(),
    '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '91000000-0000-4000-8000-000000000003',
    'authenticated',
    'authenticated',
    'rls.admin@example.com',
    extensions.crypt('Test123!', extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"RLS Administrator","role":"admin"}',
    now(),
    now(),
    '', '', '', ''
  );

-- Only trusted SQL/server operations may assign an application admin role.
update public.profiles
set role = 'admin'
where auth_user_id = '91000000-0000-4000-8000-000000000003';

-- 1-10: core schema and defaults.
select extensions.has_table('public', 'schools', 'schools table exists');
select extensions.has_table('public', 'profiles', 'profiles table exists');
select extensions.has_table('public', 'challenge_settings', 'challenge_settings table exists');
select extensions.col_is_pk('public', 'schools', 'id', 'schools.id is the primary key');
select extensions.col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select extensions.ok(to_regtype('public.app_role') is not null, 'application role type exists');
select extensions.is(
  (
    select array_agg(e.enumlabel order by e.enumsortorder)::text
    from pg_catalog.pg_enum as e
    where e.enumtypid = 'public.app_role'::regtype
  ),
  '{student,admin}'::text,
  'application role contains only student and admin'
);
select extensions.is(
  (select total_days::integer from public.challenge_settings where id = 1),
  100,
  'challenge defaults to 100 days'
);
select extensions.is(
  (select video_completion_threshold::text from public.challenge_settings where id = 1),
  '90.00',
  'completion threshold defaults to 90 percent'
);
select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_class as c
    join pg_catalog.pg_namespace as n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in ('schools', 'profiles', 'challenge_settings')
      and c.relrowsecurity
  ),
  3::bigint,
  'RLS is enabled on every Phase 1 table'
);

-- 11-20: policies, trigger behavior, and explicit grants.
select extensions.is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('schools', 'profiles', 'challenge_settings')
  ),
  8::bigint,
  'all Phase 1 RLS policies are installed'
);
select extensions.is(
  (select count(*) from public.profiles where auth_user_id::text like '91000000-%'),
  3::bigint,
  'Auth inserts create one profile each'
);
select extensions.is(
  (select role::text from public.profiles where auth_user_id = '91000000-0000-4000-8000-000000000001'),
  'student',
  'signup ignores an attempted admin metadata role'
);
select extensions.is(
  (select id from public.profiles where auth_user_id = '91000000-0000-4000-8000-000000000001'),
  '91000000-0000-4000-8000-000000000001'::uuid,
  'signup creates a deterministic one-to-one profile identifier'
);
select extensions.ok(
  not has_function_privilege('anon', 'public.is_admin()', 'EXECUTE'),
  'anonymous clients cannot execute is_admin'
);
select extensions.ok(
  has_column_privilege('anon', 'public.schools', 'id', 'SELECT'),
  'anonymous clients can read school directory identifiers'
);
select extensions.ok(
  not has_column_privilege('anon', 'public.schools', 'contact_phone', 'SELECT'),
  'anonymous clients cannot read school contact details'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'anonymous clients have no profile access'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
  'authenticated clients have profile SELECT subject to RLS'
);
select extensions.ok(
  has_table_privilege('authenticated', 'public.profiles', 'UPDATE'),
  'authenticated clients have profile UPDATE subject to RLS and field guards'
);

-- 21: the pre-auth school picker works through the actual anon role.
set local role anon;
select extensions.is(
  (select count(*) from public.schools where id::text like '90000000-%'),
  2::bigint,
  'anonymous clients can list directory-safe schools'
);
reset role;

-- Simulate Student One's authenticated JWT.
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local role authenticated;

-- 22-32: student isolation and restricted-field protection.
select extensions.is(public.is_admin(), false, 'a student is not an admin');
select extensions.is(
  (select count(*) from public.profiles),
  1::bigint,
  'a student sees only their own profile'
);
select extensions.is(
  (select auth_user_id from public.profiles),
  '91000000-0000-4000-8000-000000000001'::uuid,
  'the visible profile belongs to the JWT subject'
);
select extensions.results_eq(
  $$
    update public.profiles
    set full_name = 'RLS Student One Updated'
    where auth_user_id = '91000000-0000-4000-8000-000000000001'
    returning full_name
  $$,
  $$values ('RLS Student One Updated'::text)$$,
  'a student can edit an allowed personal field'
);
select extensions.throws_ok(
  $$update public.profiles set role = 'admin' where auth_user_id = '91000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Identity and role fields cannot be changed from a client session',
  'a student cannot self-promote'
);
select extensions.throws_ok(
  $$update public.profiles set school_id = '90000000-0000-4000-8000-000000000002' where auth_user_id = '91000000-0000-4000-8000-000000000001'$$,
  '42501',
  'Enrollment fields can only be changed by an administrator',
  'a student cannot change enrollment fields'
);
select extensions.is_empty(
  $$
    update public.profiles
    set full_name = 'Unauthorized edit'
    where auth_user_id = '91000000-0000-4000-8000-000000000002'
    returning 1
  $$,
  'a student cannot update another profile'
);
select extensions.is_empty(
  $$
    update public.schools
    set name = 'Unauthorized school edit'
    where id = '90000000-0000-4000-8000-000000000001'
    returning 1
  $$,
  'a student cannot mutate a school'
);
select extensions.is(
  (select count(*) from public.challenge_settings),
  1::bigint,
  'a student can read challenge settings'
);
select extensions.is_empty(
  $$update public.challenge_settings set total_days = 99 where id = 1 returning 1$$,
  'a student cannot update challenge settings'
);
select extensions.throws_ok(
  $$select * from public.get_admin_overview()$$,
  '42501',
  'Administrator access required',
  'a student cannot execute the admin overview'
);

reset role;
set local request.jwt.claim.sub = '91000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claims = '{"sub":"91000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local role authenticated;

-- 33-46: admin access, overview contract, validation, and audit timestamps.
select extensions.is(public.is_admin(), true, 'the seeded fixture administrator is recognized');
select extensions.ok(
  (select count(*) from public.profiles where auth_user_id::text like '91000000-%') = 3,
  'an admin can see all fixture profiles'
);
select extensions.lives_ok(
  $$insert into public.schools (id, name, code, city, state) values ('90000000-0000-4000-8000-000000000003', 'Admin Created School', 'admtest', 'Hubballi', 'Karnataka')$$,
  'an admin can create a school'
);
select extensions.results_eq(
  $$
    update public.profiles
    set school_id = '90000000-0000-4000-8000-000000000002'
    where auth_user_id = '91000000-0000-4000-8000-000000000002'
    returning school_id
  $$,
  $$values ('90000000-0000-4000-8000-000000000002'::uuid)$$,
  'an admin can update student enrollment'
);
select extensions.throws_ok(
  $$update public.profiles set role = 'admin' where auth_user_id = '91000000-0000-4000-8000-000000000002'$$,
  '42501',
  'Identity and role fields cannot be changed from a client session',
  'even admins cannot assign roles from a client session'
);
select extensions.results_eq(
  $$update public.challenge_settings set total_days = 120 where id = 1 returning total_days::integer$$,
  $$values (120)$$,
  'an admin can update valid challenge settings'
);
select extensions.throws_ok(
  $$update public.challenge_settings set timezone = 'Mars/Olympus' where id = 1$$,
  '22023',
  'Unknown IANA timezone: Mars/Olympus',
  'challenge settings reject an invalid IANA timezone'
);
select extensions.is(
  (select total_students from public.get_admin_overview()),
  (select count(*) from public.profiles where role = 'student'),
  'admin overview returns the authoritative student count'
);
select extensions.is(
  (select total_schools from public.get_admin_overview()),
  (select count(*) from public.schools),
  'admin overview returns the authoritative school count'
);
select extensions.ok(
  (
    select bool_and(
      item ? 'school_id'
      and item ? 'school_name'
      and item ? 'student_count'
    )
    from public.get_admin_overview() as overview
    cross join lateral jsonb_array_elements(overview.students_by_school) as item
  ),
  'admin overview school items have the documented JSON shape'
);
select extensions.is(
  (select new_students_last_7_days from public.get_admin_overview()),
  (
    select count(*)
    from public.profiles
    where role = 'student'
      and created_at >= now() - interval '7 days'
  ),
  'admin overview returns the authoritative recent-student count'
);
select extensions.results_eq(
  $$
    update public.schools
    set name = 'RLS Test Academy Updated'
    where id = '90000000-0000-4000-8000-000000000001'
    returning updated_at > '2000-01-01 00:00:00+00'::timestamptz
  $$,
  $$values (true)$$,
  'updated_at advances automatically'
);
select extensions.is(
  (select code from public.schools where id = '90000000-0000-4000-8000-000000000003'),
  'ADMTEST',
  'school codes are normalized before validation'
);
select extensions.ok(
  jsonb_array_length((select students_by_school from public.get_admin_overview())) >= 3,
  'admin overview includes schools even when they have no students'
);

reset role;

-- The auth email trigger must be able to pass the client field guard safely.
update auth.users
set email = 'rls.student1.changed@example.com'
where id = '91000000-0000-4000-8000-000000000001';

select extensions.is(
  (select email from public.profiles where auth_user_id = '91000000-0000-4000-8000-000000000001'),
  'rls.student1.changed@example.com',
  'an Auth email change synchronizes to the application profile'
);

-- 48-49: validate local seed data when it is installed. Hosted staging and
-- production projects intentionally have no development identities.
select extensions.ok(
  not exists (
    select 1
    from auth.users
    where email = 'admin@example.com'
  )
  or coalesce(
    (
      select encrypted_password = extensions.crypt('Admin123!', encrypted_password)
      from auth.users
      where email = 'admin@example.com'
    ),
    false
  ),
  'the documented local admin password matches when the local seed is installed'
);
select extensions.ok(
  (
    select count(*)
    from public.profiles
    where email ~ '^student(0[1-9]|10)@example[.]com$'
      and role = 'student'
  ) in (0, 10),
  'the local student seed is absent or contains the complete ten-student fixture'
);

select * from extensions.finish();
rollback;
