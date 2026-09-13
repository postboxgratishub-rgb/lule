# 100-Day Educational Learning Challenge

Phase 1 of a synchronized mobile, student-web, and admin platform backed by one
Supabase project. This repository currently provides the secure foundation: real
authentication, role-based access, schools, student profiles, starter dashboards,
shared TypeScript contracts, migrations, Row Level Security, seed data, and tests.

Content authoring and playback are intentionally not included yet. They are Phase 2
and Phase 3 work, respectively.

## What is included

| Surface | Phase 1 capability |
| --- | --- |
| Expo mobile | Student signup/login/recovery, persisted session, profile, school, starter dashboard |
| Student web | Student signup/login/recovery, protected profile/dashboard, responsive UI |
| Admin web | Admin-only login/dashboard, real student/school data, school management |
| Supabase | Auth profile trigger, normalized foundation schema, RLS, grants, admin reporting RPC, seed |
| Shared packages | Domain types, validation schemas, defaults, framework-neutral helpers |

See [architecture](docs/ARCHITECTURE.md), [database](docs/DATABASE.md),
[security](docs/SECURITY.md), and [deployment](docs/DEPLOYMENT.md) for the design.

## Prerequisites

- Node.js 20.19 or newer and npm 10 or newer
- Docker Desktop running
- Supabase CLI (the commands below use it through `npx`, so a global install is not required)
- Android Studio/emulator or an Android device with Expo Go for mobile development

## Local setup

From the repository root:

```bash
npm install
npx supabase start
npx supabase db reset
```

`db reset` applies the Phase 1 migration and the development seed. Read the API URL
and anon key from `npx supabase status`, then create each app's local environment
file:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Use the local API URL (normally `http://127.0.0.1:54321`) and its anon key for the
matching `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` values. Never put the service-role key
in any of these client app files.

For a hosted Supabase project, apply schema changes with `npx supabase link` followed
by `npx supabase db push`. Do not run the development seed in production.

## Run each interface

Open a separate terminal for each process:

```bash
npm run dev:web
npm run dev:admin
npm run dev:mobile
```

- Student website: `http://localhost:3000`
- Admin dashboard: `http://localhost:3001`
- Mobile: press `a` in the Expo terminal for Android, or scan the QR code with a
  compatible development client.

Password-reset email for local Supabase is captured by the local Mailpit/Inbucket
service shown by `npx supabase status` (commonly `http://127.0.0.1:54324`).

## Development accounts

After `npx supabase db reset`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Student | `student01@example.com` through `student10@example.com` | `Student123!` |

These are local test identities only. The seed creates three schools and students
with varied classes and sections. Remove or replace all seeded credentials outside
local development.

## Verification

Run framework checks and unit tests:

```bash
npm run check
npm run build
```

With local Supabase running, run the database/RLS suite:

```bash
npx supabase test db
```

Run the HTTP-level authentication/RLS smoke test with the public local key shown by
`npx supabase status`:

```powershell
$env:SMOKE_SUPABASE_URL="http://127.0.0.1:54321"
$env:SMOKE_SUPABASE_KEY="<local publishable or anon key>"
npm run test:smoke
```

The SQL tests exercise anonymous school visibility, self-only student reads,
restricted role updates, admin access, and the admin overview function. A database
test failure is a release blocker; page-level route guards do not replace RLS.

## Environment variables

| Variable | Used by | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Student/admin web | Public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Student web | Preferred public project key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Student/admin web | Public anon key; student web also accepts it as a fallback |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Public project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Public anon/publishable key |
| `NEXT_PUBLIC_ADMIN_URL` | Admin auth redirects | Public origin |
| `EXPO_PUBLIC_APP_SCHEME` | Mobile auth redirects | Public scheme (`hundreddays`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Future secure server operations only | Secret; never client-side |

Placeholders for later video, Firebase, and certificate secrets are documented in
the root `.env.example` but unused in Phase 1.

## Supabase configuration

For a hosted project:

1. Set the Auth site URL to the student website origin.
2. Add student/admin callback URLs and the `hundreddays://` mobile URLs to the Auth
   redirect allow-list.
3. Enable email/password auth and email confirmation for production.
4. Apply the migration with `npx supabase db push`.
5. Create the first production administrator through a controlled SQL/operator
   workflow; registration always creates a student.
6. Confirm the RLS tests against staging before deploying clients.

## Next implementation phase

Phase 2 should add `challenge_days` and `videos`, the ten-video/day constraints,
publish/release rules, source-provider abstraction, admin content management, bulk
entry, and student day/video lists. It should include RLS and database tests before
starting Phase 3's custom player and progress synchronization.
