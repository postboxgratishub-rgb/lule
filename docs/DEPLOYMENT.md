# Deployment

Deploy in this order: database migrations, admin/student web clients, content
publication, then a fresh mobile binary. The Phase 2/3 clients depend on the new
tables and RPCs, so deploying them before the database migration produces runtime
failures.

## 1. Supabase

Use separate Supabase projects for development/staging and production. From the
repository root, link the intended project, inspect migration state, dry-run the
push, and apply:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase migration list --linked
npx supabase db push --dry-run
npx supabase db push
npx supabase migration list --linked
```

The push must include the Phase 1 foundation migration, the Phase 2/3
content/progress migration, the additive content-refresh optimization, and the
school block/directory migrations. The directory migration imports 419 AY 2026-27
schools under their unique UDISE codes and is safe to rerun. The Phase 2/3
migration also configures the required Realtime publication. Do not run `seed.sql`
in production: it contains deterministic local identities, sample content, and
sample progress.

Create the first production administrator through a controlled operator workflow.
The public registration path always creates a student, by design.

### Auth URL configuration

Set the student site's canonical HTTPS origin as the Auth site URL. Add exact
student/admin callbacks and the mobile scheme to the redirect allow-list:

```text
https://learn.example.org/auth/callback
https://admin.example.org/auth/callback
hundreddays://login
hundreddays://update-password
```

Keep localhost/Expo development URLs out of a production allow-list unless they are
needed for a controlled test. Enable production email confirmation, SMTP delivery,
leaked-password protection, and suitable Auth rate limits.

### Database validation

Run `npx supabase db reset && npx supabase test db` against local or disposable
staging infrastructure before the push. Do not create pgTAP fixtures in production.
After the staging deployment, perform controlled smoke checks that:

- all repository migrations appear in `migration list --linked`;
- `start_video_session`, `record_video_progress`, and
  `mark_video_complete` are callable by an authenticated test student;
- direct student writes to progress tables are rejected;
- draft/future content is invisible to the student;
- a published/released test video records progress and resumes on another client;
- Realtime updates reach a second signed-in client.

Use a dedicated staging identity/content row for these checks and remove it through
the same controlled operator process. After the production push, confirm migration
state and normal read paths without importing the staging fixtures.

## 2. Student and admin websites

Deploy `apps/web` and `apps/admin` as separate Next.js projects (for example,
two Vercel projects) with the repository connected as a monorepo. Configure each
hosting project's root directory:

| Project | Root directory | Default local port |
| --- | --- | --- |
| Student | `apps/web` | 3000 |
| Admin | `apps/admin` | 3001 |

Set browser-safe variables in each project:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

The admin currently uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`; set it to the project's
public anon/publishable-compatible key and also set:

```dotenv
NEXT_PUBLIC_ADMIN_URL=https://admin.example.org
```

Never configure `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or provider API
secrets in either Next.js client project. Next.js server actions in this repository
still execute with the user's cookie/JWT, not a privileged key.

Run release checks from the repository root:

```bash
npm ci
npm run check
npm run build
```

If using Vercel CLI, link the intended Vercel project before each production
deployment and run `npx vercel deploy --prod` from the directory expected by that
project's configured root. Verify that:

- public login/register/recovery routes return successfully;
- protected routes redirect when signed out;
- a student can open `/challenge` but cannot enter `/content`;
- an administrator can create a draft day, fill all ten slots, and publish it;
- the student sees the day only at/after its release date;
- HLS and direct media play from the deployed origin.

For HLS/direct URLs, configure the video provider's playback permissions and CORS
policy for the student origin. Cloudflare Stream and Mux API secrets are not
required for playback; only their public playback locator is stored.

## 3. Mobile

The mobile player uses the native `expo-video` module, so a JavaScript-only update
cannot add it to an older binary. Configure the public Supabase values in the
appropriate EAS `preview` and `production` environments, confirm the application
identifier and deep-link scheme in `apps/mobile/app.json`, then build from
`apps/mobile`:

```bash
npx eas-cli build --platform android --profile preview --non-interactive
npx eas-cli build --platform android --profile production --non-interactive
```

The preview profile produces an internally distributed APK. The production profile
produces the signed store artifact and auto-increments its version. Build iOS only
after configuring Apple credentials and the matching universal/deep-link behavior.

Before distribution, test sign-up confirmation and password recovery from a cold
start and while the app is already open. Also test:

- direct media plus the managed provider(s) actually in use;
- resume after switching between web and mobile;
- progress while connectivity drops and returns;
- background/foreground and player close paths;
- completion below and above the configured threshold.

Offline queuing covers progress events only. Videos are streamed and are not
downloaded for offline playback.

## Content launch checklist

For each learning day:

1. Create the day as a draft and set the intended release date.
2. Fill all ten slots with correct title, duration, source, and locator.
3. Test every source in staging on the supported browser and Android build.
4. Publish all ten videos and then publish the day.
5. Confirm student RLS visibility using a non-admin account.

Unpublish a day before reordering, deleting, or unpublishing a video. Content
updates are written to `audit_logs`.

## Capacity and monitoring

The stateless clients, indexed schema, focused Realtime subscriptions, and
provider-hosted video delivery are suitable for an initial population around 5,000
registered users, but this is not a guarantee of 5,000 concurrent streams. Before a
large launch:

- load-test progress RPC writes at the expected heartbeat and concurrency rate;
- confirm Supabase Auth, database, connection, storage, egress, and Realtime quotas;
- confirm the video provider's concurrent delivery, geographic performance, and
  egress costs;
- monitor RPC errors, query latency, database size, Realtime connections, failed
  sign-ins, and player/network error rates;
- define retention/archival for old watch sessions and audit records.

Scale the Supabase and video-provider plans from measured staging results rather
than registered-user count alone.

## Rollback

Migrations should remain additive wherever practical, and a database backup/PITR
policy must be in place before production changes. Roll web clients back through
the hosting provider's release history. Mobile rollback requires distributing a
known-good store/internal build unless the change is eligible for the configured
over-the-air update path.

Do not remove the Phase 2/3 RPCs or tables while any deployed client depends on
them. Do not use `git reset` or production data deletion as a rollback strategy.
