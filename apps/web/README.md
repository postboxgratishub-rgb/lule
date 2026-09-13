# Student website

The `@100-days/web` workspace is the Phase 1 student experience for the 100-Day
Learning Platform. It uses Next.js App Router, TypeScript, Tailwind CSS, and real
Supabase Authentication/Postgres data. No mock account, school, or progress data is
used.

## Phase 1 scope

- Email/password registration with full name, mobile number, school, class,
  section, roll number, and date of birth
- Email confirmation callback, sign in, sign out, forgot password, and secure
  password update
- Supabase SSR cookie handling and protected `/dashboard` and `/profile` routes
- Student-role authorization in the protected layout
- Live school selection and private profile/school reads through Supabase RLS
- A motivating foundation dashboard using only persisted Phase 1 data
- Explicit empty state for challenge content, which belongs to Phase 2
- Loading, network error, missing-profile, empty-school, 404, and retry states
- Unit tests for environment safety, redirect safety, auth validation, and profile
  readiness logic

## Environment

Copy the example file and fill in browser-safe values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Legacy Supabase projects can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` in place of the
publishable key. Never place a service-role key or `sb_secret_...` key in a
`NEXT_PUBLIC_*` variable; startup validation rejects it.

## Required Supabase contract

Apply the repository migrations before running this app. Registration expects:

1. An anon-readable `schools` table so a student can select a valid school before
   authentication.
2. A trigger on `auth.users` that creates the associated `profiles` row. The form
   sends these exact `raw_user_meta_data` keys: `full_name`, `phone`, `school_id`,
   `class_name`, `section`, `roll_number`, and `date_of_birth`.
3. The trigger must set `role = 'student'` itself. The browser never chooses or
   elevates its role.
4. Authenticated students can select their own profile and its linked school under
   RLS. No service credential is used by this app.

In Supabase **Authentication → URL Configuration**, add:

- Site URL: `http://localhost:3000` for local development
- Redirect URL: `http://localhost:3000/auth/callback`
- The equivalent HTTPS callback URL for every deployed student-web origin

Email confirmation must be configured according to the environment. With
confirmation enabled, registration shows a neutral “check your inbox” response.
With confirmation disabled for local development, Supabase returns a session and
the student moves directly to the dashboard.

## Run locally

From the repository root:

```bash
npm install
npm run dev:web
```

Or from this directory:

```bash
npm run dev
```

The student site runs at `http://localhost:3000` by default.

## Verification

```bash
npm run typecheck --workspace @100-days/web
npm run lint --workspace @100-days/web
npm run test --workspace @100-days/web
npm run build --workspace @100-days/web
```

The production build requires the same public Supabase values used at runtime.

## Route/security notes

- `middleware.ts` refreshes Supabase cookies and redirects unauthenticated requests
  away from student routes.
- The protected layout verifies the user again on the server and refuses any
  profile whose persisted role is not `student`.
- `safeRedirectPath` prevents auth callback and post-login open redirects.
- Password reset uses Supabase's PKCE callback before allowing an update.
- A missing profile is not silently invented in the browser; the dashboard exposes
  a recoverable enrollment-sync state.

## Next phase

Phase 2 should query published `challenge_days` and `videos`, add real day/video
routes, and replace the current labeled content placeholder. Video playback,
cross-device progress, completion verification, watch-time analytics, streaks, and
certificates remain intentionally outside this Phase 1 package.
