# Student website

The `@100-days/web` workspace is the authenticated student experience for the
100-Day Learning Platform. It uses Next.js App Router, TypeScript, Tailwind CSS,
and the same Supabase source of truth as the mobile app and admin dashboard.

## Implemented scope

- Registration, email/password authentication, password reset, session refresh,
  student-role authorization, school enrollment, and private profiles
- Live 100-day challenge catalogue with locked, available, in-progress, and
  completed states
- Release-aware day pages with ten ordered video slots and unpublished-content
  privacy enforced by RLS
- In-platform custom HTML5 player with play/pause, seek, volume, playback speed,
  fullscreen, duration, loading, retry, previous/next, and watch-again controls
- Provider-neutral playback resolution for external/Google Drive, Cloudflare
  Stream, and Mux records
- Cross-device resume from the canonical Supabase playback position
- Server-authoritative completion eligibility and `Mark as complete` RPC flow
- Twelve-second playback heartbeats plus pause, end, visibility, navigation, and
  page-exit flushes
- A session/sequence-idempotent local progress queue with online/focus retry and
  Supabase Realtime refresh
- Real dashboard metrics and all configured challenge-day cards; no fabricated
  progress data
- Loading, empty, locked, media-error, network-error, retry, and success states

## Environment

Copy the example file and fill in browser-safe values:

```bash
cp apps/web/.env.example apps/web/.env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Legacy projects can use `NEXT_PUBLIC_SUPABASE_ANON_KEY` instead of the publishable
key. Never place a service-role or `sb_secret_...` key in a `NEXT_PUBLIC_*`
variable; startup validation rejects it.

Apply every repository migration before running the website. Phase 2/3 requires
the published challenge/video read policies and these authenticated RPCs:

- `start_video_session`
- `record_video_progress`
- `mark_video_complete`

The browser never writes progress tables directly and never submits a student ID
to those RPCs. The database derives the student from the authenticated session,
caps believable playback deltas, checks monotonic session sequences, and verifies
the configured completion threshold.

For Google Drive, use a publicly readable file share URL; the resolver converts
supported Drive file links to an in-player media URL. Managed-provider records use
their playback ID and may also use an explicit browser-compatible delivery URL.
Cloudflare Stream and Mux playback IDs resolve to HLS streams.

## Supabase Auth URL configuration

Add the local and deployed callback origins in **Authentication → URL
Configuration**:

- `http://localhost:3000/auth/callback`
- `https://your-student-domain.example/auth/callback`

## Run and verify

From the repository root:

```bash
npm install
npm run dev:web
```

The student site runs at `http://localhost:3000` by default.

```bash
npm run test --workspace @100-days/web
npm run typecheck --workspace @100-days/web
npm run lint --workspace @100-days/web
npm run build --workspace @100-days/web
```

The production build requires the same public Supabase values used at runtime.
