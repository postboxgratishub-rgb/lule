# Architecture

## Phase 1-3 system

The Expo mobile app, student website, and admin dashboard are independent clients
of one Supabase project. Supabase Auth owns credentials and sessions; PostgreSQL
owns profiles, content, watch progress, daily aggregates, and audit records. The
`profiles.auth_user_id` foreign key maps an Auth identity to one application
profile.

```text
Expo student app -----------+
                            | public key + authenticated user JWT
Next.js student website ----+----> Supabase Auth + PostgreSQL
                            |              |
Next.js admin dashboard ----+              +--> RLS and trusted RPCs
                                            |
Video CDN/provider <--- playback locator ---+
```

The clients contain no service-role key and there is no always-on custom application
server. Next.js server components/actions and Expo call Supabase as the signed-in
user. RLS is the authorization boundary; trusted PostgreSQL functions handle
operations that students must not perform as direct table writes.

## Repository boundaries

- `apps/mobile`: Expo Router student app, native playback, and a durable mobile
  progress queue.
- `apps/web`: Next.js App Router student experience and custom browser player.
- `apps/admin`: Next.js App Router administrator experience, including challenge
  content authoring.
- `packages/types`: shared domain and Supabase contract types.
- `packages/validation`: reusable input schemas.
- `packages/shared`: framework-neutral helpers.
- `packages/config`: non-secret platform defaults.
- `supabase`: project configuration, ordered migrations, development seed, and
  transactional database tests.

Each app is an independently deployable npm workspace. Shared packages contain no
framework-specific UI.

## Authentication and authorization

Registration uses `supabase.auth.signUp`. Student fields are sent as signup
metadata; a database trigger creates the profile transactionally and always assigns
the `student` role. Client-supplied role metadata is ignored.

Authorization is layered:

1. Next.js middleware refreshes auth cookies and protects navigation.
2. Protected layouts verify the signed-in profile and expected role.
3. PostgreSQL grants and Row Level Security enforce every data operation.
4. Security-definer RPCs independently derive the student from `auth.uid()` and
   validate privileged content/progress operations.

The database layers are authoritative. Route checks improve user experience but do
not grant access.

## Content publishing flow

Administrators create `challenge_days` and manage up to ten ordered `videos` per
day. The ten-slot editor saves a group atomically through `upsert_day_videos`;
reordering uses `reorder_day_videos`. Content mutations require the admin role and
are recorded in `audit_logs`.

A day is ready for publication only when it has a release date, all ten slots are
filled, and all ten videos are published. The admin UI prevents unsafe transitions,
while RLS independently hides draft days, draft videos, and future release dates
from students. A released video resolves to one of these delivery forms:

- an external HTTP(S)/direct media URL, including supported Google Drive links;
- a Cloudflare Stream customer/video locator; or
- a Mux playback ID.

Cloudflare and Mux resolve to HLS. The web player uses native HLS where available
and `hls.js` otherwise; mobile uses the platform player through `expo-video`.
Supabase stores the locator and learning state, while the provider serves media
bytes.

## Playback and progress flow

```text
open video
  -> read canonical video_progress position
  -> start_video_session(session UUID, device, position)
  -> play and enqueue sequence-numbered heartbeats
  -> record_video_progress(position, watched delta, final flag)
  -> PostgreSQL validates and accepts believable watch time
  -> recalculate video_progress and daily_progress
  -> Realtime refreshes other active clients
  -> mark_video_complete only after threshold eligibility
```

Progress is server-authoritative:

- the JWT determines the student; callers cannot write another student's progress;
- each client session has monotonic sequence numbers, so retries are idempotent;
- reported deltas are capped per heartbeat and by private student/video and
  session-level token buckets;
- completion percentage is computed from accepted watch time and video duration;
- `mark_video_complete` enforces the configured threshold (90% by default);
- daily totals are recalculated in PostgreSQL rather than trusted from a client.

The browser queues unsent events in local storage and tags them with the signed-in
student. Mobile stores separate queues per student in AsyncStorage. Both retry on
connectivity/app-focus transitions and reconcile with canonical Supabase rows.
This preserves progress through temporary outages; it is not offline video
download. Pause, end, background, navigation, and page-exit paths request a final
flush.

## Realtime model

`challenge_days`, `videos`, `video_progress`, and `daily_progress` are added
to the Supabase Realtime publication by migration. Subscriptions improve freshness
for active clients. Screens still refetch on focus/navigation, so missed Realtime
events or a disconnected device do not become the source of truth.

## Scale posture

The implemented design is appropriate for an initial target around 5,000 registered
users, subject to measured concurrency and the selected Supabase/video-provider
plans:

- indexed release, day/video, student/progress, session-date, and audit queries;
- paginated/searchable admin lists;
- server-rendered initial student/admin web data;
- client caching and focused Realtime subscriptions instead of global polling;
- compact progress heartbeats and computed daily rows;
- stateless web deployments and media delivery offloaded to a video CDN/provider;
- no N+1 reads on the primary profile, content, and dashboard paths.

Five thousand registered users is not the same as five thousand simultaneous video
sessions. Before onboarding at scale, load-test login, challenge reads, progress RPC
write volume, Realtime connections, and provider bandwidth using the intended plan
limits. Monitor table/index growth and archive old `watch_sessions` only under a
documented retention policy.

## Implemented boundary

This architecture documents Phases 1-3 only: foundation/authentication, content
management, and synchronized playback progress. Advanced analytics/reporting,
certificate issuance, and notification delivery are outside the implemented scope
and must not be inferred from placeholder settings fields.
