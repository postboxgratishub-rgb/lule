# 100-Day Educational Learning Challenge

A production-oriented learning platform with an Expo student app, a Next.js
student website, a Next.js admin dashboard, and one Supabase source of truth.
Phases 1-3 are implemented: authentication and enrollment, challenge content
management, video playback, and synchronized learning progress.

## Implemented scope

| Surface | Available capabilities |
| --- | --- |
| Expo mobile | Student auth, profile, 100-day roadmap, released day/video screens, native video player, resume, completion, offline progress retry, Realtime refresh |
| Student web | Student auth/profile, released challenge catalogue, custom responsive player, HLS/direct playback, resume, completion, browser progress queue, Realtime refresh |
| Admin web | Admin auth/dashboard, school and student operations, challenge-day publishing, ten-slot video editor, source selection, video publishing/reordering/deletion |
| Supabase | Auth profile trigger, content and progress schema, RLS/grants, server-authoritative playback RPCs, daily aggregation, audit log, Realtime publication |
| Shared packages | Domain/database contracts, validation schemas, defaults, and framework-neutral helpers |

Supported video records are external HTTP(S) URLs (including supported Google Drive
links), Cloudflare Stream playback IDs, and Mux playback IDs. Video delivery remains
with the selected provider; Supabase stores metadata and progress, not the video
files.

This repository does not claim later-phase analytics, reports, certificates, or
notification delivery. See [architecture](docs/ARCHITECTURE.md),
[database](docs/DATABASE.md), [security](docs/SECURITY.md), and
[deployment](docs/DEPLOYMENT.md) for operational details.

## Prerequisites

- Node.js 20.19 or newer and npm 10 or newer
- Docker Desktop for the local Supabase stack
- Supabase CLI (the commands below use it through `npx`)
- Android Studio/emulator or an Android device for mobile development
- An Expo account only when producing EAS builds

## Local setup

From the repository root:

```bash
npm install
npx supabase start
npx supabase db reset
```

`db reset` applies all repository migrations and the development seed. Read the
local API URL and public anon key from `npx supabase status`, then create each app's
environment file:

```powershell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Use the local API URL (normally `http://127.0.0.1:54321`) and public key for the
matching `NEXT_PUBLIC_*` and `EXPO_PUBLIC_*` values. Never put a service-role or
Supabase secret key in a browser/mobile environment variable.

For a hosted project, link and push every migration before deploying the clients:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Do not run the development seed in production.

## Run each interface

Open a separate terminal for each process:

```bash
npm run dev:web
npm run dev:admin
npm run dev:mobile
```

- Student website: `http://localhost:3000`
- Admin dashboard: `http://localhost:3001`
- Mobile: press `a` in the Expo terminal to open Android, or use a compatible
  development client on a device.

Password-reset email for local Supabase is captured by the local mail service shown
by `npx supabase status` (commonly `http://127.0.0.1:54324`).

## Local development data

After `npx supabase db reset`:

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` |
| Student | `student01@example.com` through `student10@example.com` | `Student123!` |

These identities are local test data only. The seed also creates three schools,
three complete challenge days with ten playable videos each, and varied sample
progress. Never apply these credentials or rows to an internet-accessible project.

## Content workflow

1. Sign in to the admin dashboard and open **Challenge content**.
2. Create a unique day from 1 through 100 and set its release date.
3. Fill the ten numbered video slots. Each slot needs a title, duration, source,
   and either an HTTP(S) video URL or a managed-provider playback ID. Use HTTPS in
   production.
4. Publish all ten videos, then publish the day. A published day can be viewed by
   students on or after its release date.
5. Unpublish the day before reordering, deleting, or unpublishing its videos.

Published content is still filtered by database RLS; hiding a route in a client is
not the access-control mechanism.

## Playback and progress behavior

- Students resume from the latest canonical position on web or mobile.
- Active playback sends small, sequence-numbered heartbeats. Pause, end,
  background/navigation, and page-exit events flush pending progress.
- Temporary network failures leave progress in a student-tagged retry queue (mobile
  uses a separate storage key per student) and retry when the app/browser is active
  and online. This does not download video for offline viewing.
- PostgreSQL derives the student from the authenticated JWT, limits accepted watch
  time, rejects invalid session sequences, computes percentages, and enforces the
  configured completion threshold (90% by default).
- Realtime changes refresh progress across open devices; the database remains the
  canonical source after reconnect.

## Verification

Run all workspace checks and production builds:

```bash
npm run check
npm run build
```

With local Supabase running, reset and execute both transactional pgTAP suites:

```bash
npx supabase db reset
npx supabase test db
```

Run the HTTP-level auth/RLS smoke test with the public local key shown by
`npx supabase status`:

```powershell
$env:SMOKE_SUPABASE_URL="http://127.0.0.1:54321"
$env:SMOKE_SUPABASE_KEY="<local publishable or anon key>"
npm run test:smoke
```

The SQL tests cover authentication/profile boundaries, admin access, content
release visibility, progress-table write denial, playback RPC validation,
cross-student isolation, completion rules, and daily aggregation. A database test
failure is a release blocker.

## Environment variables

| Variable | Used by | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Student/admin web | Public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Student web | Preferred browser-safe project key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Student/admin web | Legacy public anon key; student web accepts it as fallback |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Public project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Public anon/publishable key |
| `NEXT_PUBLIC_ADMIN_URL` | Admin auth redirects | Public admin origin |
| `EXPO_PUBLIC_APP_SCHEME` | Mobile auth redirects | Public scheme (`hundreddays`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Operator/server tasks only | Secret; unused by the three clients |

Cloudflare Stream and Mux playback IDs are metadata, not API secrets. Provider API
secrets are not needed for playback and must not be added to client builds.

## Hosted Supabase checklist

1. Create separate staging and production projects.
2. Set the Auth site URL to the student website origin.
3. Add student/admin callback URLs and the `hundreddays://` mobile URLs to the Auth
   redirect allow-list.
4. Enable email/password auth and production email confirmation as appropriate.
5. Push all migrations; never run `seed.sql` in production.
6. Create the first administrator through a controlled operator workflow;
   self-registration always creates a student.
7. Confirm database tests in staging, then deploy web/admin and create a fresh EAS
   binary after native dependency changes.
8. Monitor database/Auth usage and load-test the real video/CDN mix before a large
   launch. The indexed, stateless architecture is suitable for an initial target of
   about 5,000 registered users, but concurrency and plan limits must be measured.
