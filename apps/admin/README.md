# 100 Days Admin

The Phase 1 administration interface for the 100-Day Educational Learning Challenge. It is a Next.js App Router application backed directly by the shared Supabase project. Production code contains no mock data and never uses a service-role key.

## Phase 1 capabilities

- Email/password sign-in, sign-out, password recovery, and password update through Supabase Auth.
- Two independent authorization gates: middleware and the protected server layout both verify the user with `auth.getUser()` and the RLS-safe `is_admin()` RPC.
- Dashboard totals, recent registrations, and a Recharts school-distribution chart from live database data.
- School create, search, edit, and safe delete. Schools with students cannot be deleted.
- Server-paginated and searchable student directory with school filtering.
- Basic student profile view and safe edits to enrolment metadata.
- Validation for all mutations plus responsive loading, empty, and error states.

Challenge content, video progress, activity analytics, reports, and certificates are intentionally not represented here; they belong to later implementation phases.

## Prerequisites

- Node.js 20 or later
- npm 10 or later
- A Supabase project with the repository's Phase 1 migrations and seed applied

The database must expose `public.is_admin()` and `public.get_admin_overview()` and enable the supplied RLS policies. The UI does not bypass those policies.

## Environment

Copy `.env.example` to `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_ADMIN_URL=http://localhost:3001
```

Add `http://localhost:3001/auth/callback` to the Supabase Auth redirect allow-list. For deployment, set `NEXT_PUBLIC_ADMIN_URL` to the canonical HTTPS admin origin and add its callback URL as well.

Never add `SUPABASE_SERVICE_ROLE_KEY` or any other private credential to this application.

## Run locally

From the repository root after workspace dependencies are installed:

```bash
npm run dev --workspace @100-days/admin
```

Or from this directory:

```bash
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001). The deterministic development seed creates:

```text
Email:    admin@example.com
Password: Admin123!
```

Change seeded credentials before using any internet-accessible environment.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Unit tests cover route classification/open-redirect protection, server pagination boundaries, search sanitization, overview RPC normalization, and mutation validation. End-to-end RLS assertions live with the shared Supabase database tests because they require a running database and authenticated JWTs.

## Security notes

- Browser and server clients use only the anonymous/publishable key plus the user's JWT.
- `auth.getUser()` verifies the session with Supabase Auth; cookie contents alone are never trusted.
- `is_admin()` is checked in middleware, again in the protected server layout, and again before every mutation.
- Profile identity, authentication user ID, email, and role are not writable through the student edit form.
- Search input is length-limited and stripped of PostgREST filter control characters.
- Password-reset responses do not disclose whether an account exists.
- Database RLS remains the final authorization boundary for all reads and writes.

## Production build

```bash
npm run build
npm run start
```

Deploy behind HTTPS and configure the exact production callback origin in Supabase. No separate API server is required for Phase 1.
