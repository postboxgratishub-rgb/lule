# 100 Days Admin

The Phase 1-3 administration interface for the 100-Day Educational Learning
Challenge. It is a Next.js App Router application backed directly by the shared
Supabase project. Production code contains no mock data and never uses a
service-role key.

## Implemented capabilities

- Email/password sign-in, sign-out, recovery, and password update through Supabase
  Auth.
- Middleware and protected server layout checks using `auth.getUser()` and the
  RLS-safe `is_admin()` RPC.
- Live dashboard totals, recent registrations, and school-distribution chart.
- School create, search, edit, and safe delete; a school with students cannot be
  deleted.
- Server-paginated/searchable student directory, school filter, profile view, and
  safe enrollment edits.
- Challenge-day create/edit, search/status filters, release date, draft/published
  state, and readiness summary.
- Ten-slot bulk video editor with title, description, duration, thumbnail, source,
  locator, and per-video publication state.
- External URL/Google Drive, Cloudflare Stream, and Mux source metadata.
- Atomic bulk saves and reordering through database RPCs, individual publish
  controls, guarded deletion, and validation/error states.
- Database-audited content mutations.

The implemented dashboard does not include advanced activity analytics, reports,
certificates, or notification controls.

## Publication workflow

1. Open **Challenge content** and create a unique day number from 1 through 100.
2. Add a release date.
3. Open each of the ten slots and enter its video title, duration, source, and
   required locator. Empty slots are ignored; saving does not delete existing rows.
4. Publish all ten videos.
5. Publish the day. Students can read it at/after the release date.

The interface refuses day publication until it has a release date, ten filled slots,
and ten published videos. Once a day is live, unpublish it before
reordering, deleting, or unpublishing a video. Database role checks and RLS remain
authoritative even if UI controls are bypassed.

For an external source, provide a full HTTP(S) URL; use HTTPS in production.
Google Drive links must be intentionally readable by students. Cloudflare accepts a
`customer-code/video-id` locator; Mux accepts its playback ID. Never paste an API
secret or signed long-lived credential into these fields.

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- A Supabase project with both repository migrations applied

The database must expose `public.is_admin()`, `public.get_admin_overview()`,
`public.upsert_day_videos()`, and `public.reorder_day_videos()`, with the
repository's RLS/grants. The UI does not bypass those policies.

## Environment

Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-compatible-key
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

Add `http://localhost:3001/auth/callback` to the Supabase Auth redirect allow-list.
For deployment, set `NEXT_PUBLIC_ADMIN_URL` to the canonical HTTPS admin origin
and add its callback URL.

Never add `SUPABASE_SERVICE_ROLE_KEY`, a database password, a Supabase secret key,
or video-provider API credentials to this application.

## Run locally

From the repository root after workspace dependencies are installed:

```bash
npm run dev:admin
```

Or from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). A local
`npx supabase db reset` creates the deterministic development administrator
documented in the root README. Never use seeded identities in an
internet-accessible environment.

## Verification

From this workspace:

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Unit tests cover authorization, pagination/search handling, overview normalization,
school/content validation, publication readiness, source locators, bulk slot
payloads, and reordering. End-to-end RLS/RPC assertions live in the shared Supabase
test suites because they require PostgreSQL and authenticated claims.

## Security notes

- Browser and server clients use only the public key plus the user's JWT.
- `auth.getUser()` verifies the session with Supabase Auth; cookie contents alone
  are never trusted.
- `is_admin()` is checked by middleware/layout and again before mutations.
- Content RLS and admin-only RPC checks are the final mutation boundary.
- Profile identity, Auth user ID, email, and role are not writable through student
  edits.
- Search input is length-limited and stripped of PostgREST filter controls.
- Password-recovery responses do not disclose whether an account exists.
- Content triggers preserve old/new values in an admin-readable audit log.

## Production build

```bash
npm run build
npm run start
```

Apply both database migrations before deploying this client, serve it behind HTTPS,
and configure the exact production callback origin. No separate API server is
required for the implemented Phase 1-3 admin features.
