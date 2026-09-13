-- DEVELOPMENT/TEST DATA ONLY. Never use these credentials in a hosted project.
-- Applied locally by `supabase db reset` when seed.enabled is true in config.toml.

insert into public.schools (
  id,
  name,
  code,
  address,
  city,
  state,
  contact_name,
  contact_phone
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'Vidya Mandir Senior Secondary School',
    'VMSSS',
    '18 Residency Road',
    'Bengaluru',
    'Karnataka',
    'Meera Rao',
    '+91 98765 41001'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'Green Valley Public School',
    'GVPS',
    '42 Lake View Avenue',
    'Mysuru',
    'Karnataka',
    'Arun Prakash',
    '+91 98765 41002'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'Dr. A.P.J. Abdul Kalam Government School',
    'AKGS',
    '7 Knowledge Park',
    'Tumakuru',
    'Karnataka',
    'Farah Khan',
    '+91 98765 41003'
  )
on conflict (id) do update
set name = excluded.name,
    code = excluded.code,
    address = excluded.address,
    city = excluded.city,
    state = excluded.state,
    contact_name = excluded.contact_name,
    contact_phone = excluded.contact_phone;

-- auth.users is seeded directly so local Supabase Auth supports real email/password
-- login. Passwords are hashed; the plaintext development credentials are listed in
-- supabase/seed/README.md.
with seed_users (
  id,
  email,
  password,
  full_name,
  phone,
  school_id,
  class_name,
  section,
  roll_number,
  date_of_birth
) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'admin@example.com', 'Admin123!', 'Kavya Iyer', '+91 90000 10001', null::uuid, null::text, null::text, null::text, '1990-06-12'::date),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'student01@example.com', 'Student123!', 'Ananya Sharma', '+91 90000 10002', '10000000-0000-4000-8000-000000000001'::uuid, '8', 'A', 'VM-8A-014', '2012-03-18'::date),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'student02@example.com', 'Student123!', 'Arjun Nair', '+91 90000 10003', '10000000-0000-4000-8000-000000000001'::uuid, '9', 'B', 'VM-9B-007', '2011-11-02'::date),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'student03@example.com', 'Student123!', 'Diya Patel', '+91 90000 10004', '10000000-0000-4000-8000-000000000001'::uuid, '10', 'A', 'VM-10A-021', '2010-07-25'::date),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'student04@example.com', 'Student123!', 'Ishaan Verma', '+91 90000 10005', '10000000-0000-4000-8000-000000000002'::uuid, '8', 'C', 'GV-8C-011', '2012-01-09'::date),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'student05@example.com', 'Student123!', 'Meera Krishnan', '+91 90000 10006', '10000000-0000-4000-8000-000000000002'::uuid, '9', 'A', 'GV-9A-018', '2011-05-14'::date),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'student06@example.com', 'Student123!', 'Rehan Ahmed', '+91 90000 10007', '10000000-0000-4000-8000-000000000002'::uuid, '10', 'B', 'GV-10B-004', '2010-09-30'::date),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'student07@example.com', 'Student123!', 'Saanvi Reddy', '+91 90000 10008', '10000000-0000-4000-8000-000000000003'::uuid, '8', 'A', 'AK-8A-025', '2012-12-07'::date),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'student08@example.com', 'Student123!', 'Vihaan Gupta', '+91 90000 10009', '10000000-0000-4000-8000-000000000003'::uuid, '9', 'B', 'AK-9B-016', '2011-04-21'::date),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'student09@example.com', 'Student123!', 'Zoya Siddiqui', '+91 90000 10010', '10000000-0000-4000-8000-000000000003'::uuid, '10', 'A', 'AK-10A-009', '2010-08-16'::date),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'student10@example.com', 'Student123!', 'Aarav Kulkarni', '+91 90000 10011', '10000000-0000-4000-8000-000000000003'::uuid, '8', 'B', 'AK-8B-013', '2012-06-11'::date)
)
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
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  u.id,
  'authenticated',
  'authenticated',
  lower(u.email),
  extensions.crypt(u.password, extensions.gen_salt('bf')),
  now(),
  jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
  jsonb_strip_nulls(jsonb_build_object(
    'full_name', u.full_name,
    'phone', u.phone,
    'school_id', u.school_id,
    'class_name', u.class_name,
    'section', u.section,
    'roll_number', u.roll_number,
    'date_of_birth', u.date_of_birth
  )),
  now(),
  now(),
  '',
  '',
  '',
  ''
from seed_users as u
on conflict (id) do update
set aud = excluded.aud,
    role = excluded.role,
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = excluded.updated_at;

with seed_identities (id, user_id, email) as (
  values
    ('30000000-0000-4000-8000-000000000001'::uuid, '20000000-0000-4000-8000-000000000001'::uuid, 'admin@example.com'),
    ('30000000-0000-4000-8000-000000000002'::uuid, '20000000-0000-4000-8000-000000000002'::uuid, 'student01@example.com'),
    ('30000000-0000-4000-8000-000000000003'::uuid, '20000000-0000-4000-8000-000000000003'::uuid, 'student02@example.com'),
    ('30000000-0000-4000-8000-000000000004'::uuid, '20000000-0000-4000-8000-000000000004'::uuid, 'student03@example.com'),
    ('30000000-0000-4000-8000-000000000005'::uuid, '20000000-0000-4000-8000-000000000005'::uuid, 'student04@example.com'),
    ('30000000-0000-4000-8000-000000000006'::uuid, '20000000-0000-4000-8000-000000000006'::uuid, 'student05@example.com'),
    ('30000000-0000-4000-8000-000000000007'::uuid, '20000000-0000-4000-8000-000000000007'::uuid, 'student06@example.com'),
    ('30000000-0000-4000-8000-000000000008'::uuid, '20000000-0000-4000-8000-000000000008'::uuid, 'student07@example.com'),
    ('30000000-0000-4000-8000-000000000009'::uuid, '20000000-0000-4000-8000-000000000009'::uuid, 'student08@example.com'),
    ('30000000-0000-4000-8000-000000000010'::uuid, '20000000-0000-4000-8000-000000000010'::uuid, 'student09@example.com'),
    ('30000000-0000-4000-8000-000000000011'::uuid, '20000000-0000-4000-8000-000000000011'::uuid, 'student10@example.com')
)
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  i.id,
  i.user_id,
  i.user_id::text,
  jsonb_build_object(
    'sub', i.user_id::text,
    'email', i.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from seed_identities as i
on conflict (provider_id, provider) do update
set user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = excluded.updated_at;

-- Reconcile application profiles explicitly. The Auth trigger already created each
-- row and forced `student`; this statement promotes only the deterministic admin.
with seed_profiles (
  id,
  full_name,
  email,
  phone,
  app_role,
  school_id,
  class_name,
  section,
  roll_number,
  date_of_birth
) as (
  values
    ('20000000-0000-4000-8000-000000000001'::uuid, 'Kavya Iyer', 'admin@example.com', '+91 90000 10001', 'admin'::public.app_role, null::uuid, null::text, null::text, null::text, '1990-06-12'::date),
    ('20000000-0000-4000-8000-000000000002'::uuid, 'Ananya Sharma', 'student01@example.com', '+91 90000 10002', 'student'::public.app_role, '10000000-0000-4000-8000-000000000001'::uuid, '8', 'A', 'VM-8A-014', '2012-03-18'::date),
    ('20000000-0000-4000-8000-000000000003'::uuid, 'Arjun Nair', 'student02@example.com', '+91 90000 10003', 'student'::public.app_role, '10000000-0000-4000-8000-000000000001'::uuid, '9', 'B', 'VM-9B-007', '2011-11-02'::date),
    ('20000000-0000-4000-8000-000000000004'::uuid, 'Diya Patel', 'student03@example.com', '+91 90000 10004', 'student'::public.app_role, '10000000-0000-4000-8000-000000000001'::uuid, '10', 'A', 'VM-10A-021', '2010-07-25'::date),
    ('20000000-0000-4000-8000-000000000005'::uuid, 'Ishaan Verma', 'student04@example.com', '+91 90000 10005', 'student'::public.app_role, '10000000-0000-4000-8000-000000000002'::uuid, '8', 'C', 'GV-8C-011', '2012-01-09'::date),
    ('20000000-0000-4000-8000-000000000006'::uuid, 'Meera Krishnan', 'student05@example.com', '+91 90000 10006', 'student'::public.app_role, '10000000-0000-4000-8000-000000000002'::uuid, '9', 'A', 'GV-9A-018', '2011-05-14'::date),
    ('20000000-0000-4000-8000-000000000007'::uuid, 'Rehan Ahmed', 'student06@example.com', '+91 90000 10007', 'student'::public.app_role, '10000000-0000-4000-8000-000000000002'::uuid, '10', 'B', 'GV-10B-004', '2010-09-30'::date),
    ('20000000-0000-4000-8000-000000000008'::uuid, 'Saanvi Reddy', 'student07@example.com', '+91 90000 10008', 'student'::public.app_role, '10000000-0000-4000-8000-000000000003'::uuid, '8', 'A', 'AK-8A-025', '2012-12-07'::date),
    ('20000000-0000-4000-8000-000000000009'::uuid, 'Vihaan Gupta', 'student08@example.com', '+91 90000 10009', 'student'::public.app_role, '10000000-0000-4000-8000-000000000003'::uuid, '9', 'B', 'AK-9B-016', '2011-04-21'::date),
    ('20000000-0000-4000-8000-000000000010'::uuid, 'Zoya Siddiqui', 'student09@example.com', '+91 90000 10010', 'student'::public.app_role, '10000000-0000-4000-8000-000000000003'::uuid, '10', 'A', 'AK-10A-009', '2010-08-16'::date),
    ('20000000-0000-4000-8000-000000000011'::uuid, 'Aarav Kulkarni', 'student10@example.com', '+91 90000 10011', 'student'::public.app_role, '10000000-0000-4000-8000-000000000003'::uuid, '8', 'B', 'AK-8B-013', '2012-06-11'::date)
)
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
  date_of_birth
)
select
  p.id,
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.app_role,
  p.school_id,
  p.class_name,
  p.section,
  p.roll_number,
  p.date_of_birth
from seed_profiles as p
on conflict (auth_user_id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    school_id = excluded.school_id,
    class_name = excluded.class_name,
    section = excluded.section,
    roll_number = excluded.roll_number,
    date_of_birth = excluded.date_of_birth;

update public.challenge_settings
set program_name = '100-Day Learning Challenge',
    organization_name = 'Learning Futures Foundation',
    timezone = 'Asia/Kolkata',
    total_days = 100,
    videos_per_day = 10,
    video_completion_threshold = 90.00,
    minimum_completion = 100.00,
    certificate_rules = '{"required_days": 100, "minimum_completion_percentage": 100}'::jsonb,
    streak_rules = '{"reset_on_missed_required_day": true, "timezone": "Asia/Kolkata"}'::jsonb,
    notification_settings = '{"enabled": true, "daily_reminder": true}'::jsonb
where id = 1;
