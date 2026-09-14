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

-- Phase 2 development catalogue: three complete days with ten playable external
-- videos each. These public sample MP4s exercise the provider-neutral player
-- contract without coupling the application to Google Drive.
insert into public.challenge_days (
  id,
  day_number,
  title,
  description,
  release_date,
  is_published
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    1,
    'Learning How to Learn',
    'Build practical habits for attention, memory, and deliberate practice.',
    (now() at time zone 'Asia/Kolkata')::date - 2,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    2,
    'Digital Foundations',
    'Understand computers, networks, digital safety, and responsible creation.',
    (now() at time zone 'Asia/Kolkata')::date - 1,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    3,
    'Creative Problem Solving',
    'Apply observation, decomposition, experimentation, and reflection.',
    (now() at time zone 'Asia/Kolkata')::date,
    true
  )
on conflict (id) do update
set day_number = excluded.day_number,
    title = excluded.title,
    description = excluded.description,
    release_date = excluded.release_date,
    is_published = excluded.is_published;

with day_video_seed (
  challenge_day_id,
  titles,
  durations,
  urls,
  thumbnails
) as (
  values
    (
      '40000000-0000-4000-8000-000000000001'::uuid,
      array[
        'Welcome and Challenge Mindset',
        'Set a Meaningful Learning Goal',
        'Design Your Study Space',
        'Focus in Short, Effective Blocks',
        'Use Active Recall',
        'Practice Spaced Repetition',
        'Take Notes That Help You Think',
        'Ask Better Questions',
        'Reflect on Mistakes',
        'Build Tomorrow''s Learning Plan'
      ]::text[],
      array[596, 634, 578, 721, 665, 608, 749, 687, 642, 704]::integer[],
      array[
        'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4'
      ]::text[],
      array[
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg'
      ]::text[]
    ),
    (
      '40000000-0000-4000-8000-000000000002'::uuid,
      array[
        'Inside a Computer',
        'Files, Folders, and Backups',
        'How the Internet Moves Information',
        'Search and Source Evaluation',
        'Create Strong Passphrases',
        'Recognize Phishing',
        'Protect Your Digital Footprint',
        'Collaborate Respectfully Online',
        'Create Accessible Digital Content',
        'Your Digital Citizenship Plan'
      ]::text[],
      array[612, 558, 676, 625, 571, 649, 704, 618, 692, 660]::integer[],
      array[
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
      ]::text[],
      array[
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg'
      ]::text[]
    ),
    (
      '40000000-0000-4000-8000-000000000003'::uuid,
      array[
        'Observe Before You Solve',
        'Break Problems into Parts',
        'Find Patterns and Constraints',
        'Generate More Than One Idea',
        'Choose a Testable Hypothesis',
        'Build a Small Experiment',
        'Learn from Evidence',
        'Improve Through Feedback',
        'Explain Your Solution Clearly',
        'Reflect and Transfer the Skill'
      ]::text[],
      array[584, 603, 647, 691, 625, 668, 713, 636, 679, 652]::integer[],
      array[
        'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4'
      ]::text[],
      array[
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/Sintel.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/TearsOfSteel.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ElephantsDream.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
        'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg'
      ]::text[]
    )
), expanded as (
  select
    md5('lule-video-' || d.challenge_day_id::text || '-' || item.array_index)::uuid as id,
    d.challenge_day_id,
    item.array_index::smallint as video_number,
    d.titles[item.array_index] as title,
    'A guided lesson with a short reflection activity.'::text as description,
    d.durations[item.array_index] as duration_seconds,
    d.thumbnails[item.array_index] as thumbnail_url,
    d.urls[item.array_index] as video_url
  from day_video_seed as d
  cross join lateral generate_subscripts(d.titles, 1)
    as item(array_index)
)
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
select
  e.id,
  e.challenge_day_id,
  e.video_number,
  e.title,
  e.description,
  e.duration_seconds,
  e.thumbnail_url,
  'external_url'::public.video_source_type,
  e.video_url,
  null,
  true
from expanded as e
on conflict (id) do update
set challenge_day_id = excluded.challenge_day_id,
    video_number = excluded.video_number,
    title = excluded.title,
    description = excluded.description,
    duration_seconds = excluded.duration_seconds,
    thumbnail_url = excluded.thumbnail_url,
    video_source_type = excluded.video_source_type,
    video_url = excluded.video_url,
    playback_id = excluded.playback_id,
    is_published = excluded.is_published;

-- Realistic local progress: one learner is steadily ahead, one is partway
-- through Day 1, one is ahead through Day 3, and one last watched yesterday.
with progress_plan (student_id, challenge_day_id, max_complete_video, partial_video, partial_ratio, activity_offset) as (
  values
    ('20000000-0000-4000-8000-000000000002'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 10, null::integer, null::numeric, interval '0 hours'),
    ('20000000-0000-4000-8000-000000000002'::uuid, '40000000-0000-4000-8000-000000000002'::uuid, 4, 5, 0.42, interval '0 hours'),
    ('20000000-0000-4000-8000-000000000003'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 3, 4, 0.55, interval '0 hours'),
    ('20000000-0000-4000-8000-000000000005'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 10, null::integer, null::numeric, interval '0 hours'),
    ('20000000-0000-4000-8000-000000000005'::uuid, '40000000-0000-4000-8000-000000000002'::uuid, 10, null::integer, null::numeric, interval '0 hours'),
    ('20000000-0000-4000-8000-000000000005'::uuid, '40000000-0000-4000-8000-000000000003'::uuid, 2, 3, 0.35, interval '0 hours'),
    ('20000000-0000-4000-8000-000000000006'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 0, 1, 0.31, interval '1 day')
), planned_progress as (
  select
    pp.student_id,
    v.id as video_id,
    v.challenge_day_id,
    v.video_number,
    v.duration_seconds,
    case
      when v.video_number <= pp.max_complete_video then ceil(v.duration_seconds * 0.93)::integer
      else floor(v.duration_seconds * pp.partial_ratio)::integer
    end as watched_seconds,
    v.video_number <= pp.max_complete_video as completed,
    pp.activity_offset
  from progress_plan as pp
  join public.videos as v on v.challenge_day_id = pp.challenge_day_id
  where v.video_number <= pp.max_complete_video
     or v.video_number = pp.partial_video
)
insert into public.video_progress (
  id,
  student_id,
  video_id,
  watched_seconds,
  last_position_seconds,
  completed,
  first_started_at,
  last_watched_at,
  completed_at,
  total_sessions
)
select
  md5('lule-progress-' || p.student_id::text || '-' || p.video_id::text)::uuid,
  p.student_id,
  p.video_id,
  p.watched_seconds,
  least(p.watched_seconds, p.duration_seconds),
  p.completed,
  now() - p.activity_offset - interval '45 minutes',
  now() - p.activity_offset - interval '5 minutes',
  case when p.completed then now() - p.activity_offset - interval '5 minutes' else null end,
  1
from planned_progress as p
on conflict (student_id, video_id) do update
set watched_seconds = excluded.watched_seconds,
    last_position_seconds = excluded.last_position_seconds,
    completed = excluded.completed,
    first_started_at = excluded.first_started_at,
    last_watched_at = excluded.last_watched_at,
    completed_at = excluded.completed_at,
    total_sessions = excluded.total_sessions;

with progress_rows as (
  select
    vp.student_id,
    vp.video_id,
    vp.watched_seconds,
    vp.last_position_seconds,
    vp.first_started_at,
    vp.last_watched_at,
    v.challenge_day_id
  from public.video_progress as vp
  join public.videos as v on v.id = vp.video_id
  where vp.student_id in (
    '20000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    '20000000-0000-4000-8000-000000000005',
    '20000000-0000-4000-8000-000000000006'
  )
    and v.challenge_day_id in (
      '40000000-0000-4000-8000-000000000001',
      '40000000-0000-4000-8000-000000000002',
      '40000000-0000-4000-8000-000000000003'
    )
)
insert into public.watch_sessions (
  id,
  client_session_id,
  student_id,
  video_id,
  started_at,
  ended_at,
  watched_seconds,
  last_position_seconds,
  device_type,
  session_date,
  last_sequence,
  last_reported_at
)
select
  md5('lule-watch-row-' || p.student_id::text || '-' || p.video_id::text)::uuid,
  md5('lule-watch-client-' || p.student_id::text || '-' || p.video_id::text)::uuid,
  p.student_id,
  p.video_id,
  p.first_started_at,
  p.last_watched_at,
  p.watched_seconds,
  p.last_position_seconds,
  case when p.student_id::text like '%0005' then 'android' else 'web' end,
  (p.last_watched_at at time zone 'Asia/Kolkata')::date,
  greatest(1, ceil(p.watched_seconds / 15.0)::integer),
  p.last_watched_at
from progress_rows as p
on conflict (student_id, client_session_id) do update
set ended_at = excluded.ended_at,
    watched_seconds = excluded.watched_seconds,
    last_position_seconds = excluded.last_position_seconds,
    device_type = excluded.device_type,
    session_date = excluded.session_date,
    last_sequence = excluded.last_sequence,
    last_reported_at = excluded.last_reported_at;

insert into private.watch_session_guards (
  student_id,
  client_session_id,
  watch_credit_seconds,
  credit_updated_at
)
select ws.student_id, ws.client_session_id, 0, now()
from public.watch_sessions as ws
on conflict (student_id, client_session_id) do update
set watch_credit_seconds = 0,
    credit_updated_at = excluded.credit_updated_at;

insert into private.video_progress_guards (
  student_id,
  video_id,
  watch_credit_seconds,
  credit_updated_at
)
select vp.student_id, vp.video_id, 0, now()
from public.video_progress as vp
on conflict (student_id, video_id) do update
set watch_credit_seconds = 0,
    credit_updated_at = excluded.credit_updated_at;

do $$
declare
  progress_pair record;
begin
  for progress_pair in
    select distinct vp.student_id, v.challenge_day_id
    from public.video_progress as vp
    join public.videos as v on v.id = vp.video_id
  loop
    perform private.recalculate_daily_progress(
      progress_pair.student_id,
      progress_pair.challenge_day_id
    );
  end loop;
end
$$;
