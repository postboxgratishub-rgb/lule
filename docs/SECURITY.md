# Security model

## Trust boundaries

All mobile and browser code, local storage, AsyncStorage, form input, player events,
and Realtime messages are untrusted. The public Supabase URL and browser-safe
publishable/anon key may be bundled in those clients. Database passwords,
`service_role`/Supabase secret keys, SMTP credentials, and video-provider API
secrets must remain in controlled operator or server environments.

None of the Phase 1-3 clients requires a service-role key. Next.js server
components/actions in this repository also use the signed-in user's JWT and remain
subject to database authorization.

PostgreSQL Row Level Security is enabled on every application table. Policies use
the authenticated profile and an internal security-definer role helper. Trusted
functions use a fixed/empty `search_path`, narrow execute grants, and explicit
validation.

## Identity and profile safety

- Signup always produces a student role, regardless of submitted metadata.
- A student can read only their own full profile.
- Student profile edits are restricted to an explicit safe field set.
- Students cannot change `role`, `auth_user_id`, ownership, or another profile.
- Administrators can manage schools and the enrollment fields required for
  operations.
- Anonymous registration can read only safe school-directory columns.
- Middleware and layout checks protect navigation, but do not replace RLS.

Administrator identities must be created/promoted only through a controlled
operator workflow. There is no public create-admin route.

## Content safety

- Only an administrator can create, change, publish, reorder, or delete challenge
  content.
- Students can select only published videos inside published days whose release
  date has arrived in the configured programme timezone.
- Draft/future rows are filtered by RLS even if a student guesses an ID or calls
  PostgREST directly.
- Admin content changes are captured by database triggers in `audit_logs`;
  clients cannot edit that log.
- The admin workflow requires a release date and ten published videos before day
  publication, and requires unpublishing the day before destructive/reorder
  operations.

The database policies protect visibility and role boundaries. Operational review is
still required for lesson correctness, age appropriateness, copyright/licensing,
and malicious/incorrect outbound URLs.

## Playback and progress integrity

Students have select-only table grants for their own `video_progress`,
`watch_sessions`, and `daily_progress`. Direct insert, update, and delete are
denied. All mutation passes through:

- `start_video_session`;
- `record_video_progress`; and
- `mark_video_complete`.

The RPCs derive the student from `auth.uid()`, require a student profile, and
verify that the video is published and released. They never trust a caller-supplied
student as authority. An optional expected-student parameter can reject a stale
account session but cannot select another identity.

Progress hardening includes:

- a client-generated UUID bound to one student/video;
- monotonic per-session sequence numbers for idempotent retries;
- rejection of an ended session for new progress;
- validation and clamping of resume positions against video duration;
- a 30-second maximum requested watch delta per heartbeat;
- shared student/video and per-session token buckets that accept at most 2x media
  time per elapsed wall time, including concurrent-device attempts;
- a bounded token reserve (the greater of 1,800 seconds or that video's duration,
  with video duration capped at 12 hours) so one full video's delayed events can
  synchronize without unlimited credit;
- server-calculated completion percentage from accepted watch time;
- threshold enforcement in `mark_video_complete` (90% by default);
- server-recalculated daily totals and timestamps.

Seeking changes the resume position but does not grant watched time. Tampering with
the browser/mobile queue, replaying a sequence, reporting a large delta, or opening
parallel players therefore cannot directly mark a video complete.

The offline queues improve delivery reliability only. Mobile data is stored under a
student-specific key; web events carry the student identity and drain only for the
current signed-in student. The database re-verifies every delivered event. Do not
treat client queue contents as an audit record.

## Realtime and data exposure

Realtime is enabled for challenge content plus video/daily progress so active
clients can refresh promptly. RLS continues to apply to Realtime subscriptions:
students must not receive another student's progress or unpublished content.
Clients also refetch canonical rows after focus/reconnect because delivery of every
Realtime message is not assumed.

`watch_sessions` and `audit_logs` can become sensitive behavioral records.
Restrict admin access, define a documented retention period, and avoid exporting
them to analytics/support systems without a lawful purpose and access controls.

## Video-provider safety

Playback IDs and public delivery URLs are not provider API credentials. Keep upload,
signing, account, and API tokens out of Supabase public tables and all
`NEXT_PUBLIC_*`/`EXPO_PUBLIC_*` variables.

For production:

- serve application and media URLs over HTTPS;
- restrict provider playback/CORS origins where supported;
- use signed/private playback if content licensing requires it (that needs a
  separate trusted token-minting design and is not implemented here);
- validate provider privacy, retention, geographic delivery, and student-data terms;
- never place a URL containing a long-lived secret in a video record.

External and Google Drive URLs must be intentionally shareable to students. A
private Drive link will fail to play; making it public can disclose it outside the
application.

## Operational checklist

Before production:

1. Use separate staging and production projects and require MFA on provider/operator
   accounts.
2. Enable email confirmation, production SMTP, leaked-password protection, and
   suitable Auth rate limits.
3. Configure an exact redirect allow-list for both web origins and mobile routes.
4. Rotate any credential that has appeared in source, chat, terminal output, logs,
   screenshots, or build artifacts.
5. Keep local seed identities and sample content out of production.
6. Run workspace checks plus SQL/RLS tests on disposable staging after every
   migration.
7. Test a student calling PostgREST/RPCs directly, not only through the UI.
8. Review Supabase Auth/PostgreSQL logs and alert on repeated failed sign-ins,
   authorization errors, unusual progress volume, and RPC latency.
9. Configure backups/PITR and rehearse restoration before onboarding students.
10. Define retention, deletion, guardian-consent, and incident-response policies
    appropriate to student ages and applicable Indian privacy/education law with
    qualified counsel.
11. Load-test expected concurrent authentication, heartbeat writes, Realtime
    subscriptions, and video delivery; set budget/quota alerts.

## Implemented security boundary

This document covers authentication/enrollment, admin content management, and
video-progress synchronization implemented in Phases 1-3. It does not assert
security for analytics/report exports, certificate verification, notification
delivery, or signed private-video playback because those capabilities are not
implemented.
