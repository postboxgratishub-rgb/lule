# Phase 1-3 database

The schema is built in order by:

1. [`20260913000000_phase1_foundation.sql`](../supabase/migrations/20260913000000_phase1_foundation.sql)
2. [`20260914000000_phase2_content_phase3_video.sql`](../supabase/migrations/20260914000000_phase2_content_phase3_video.sql)
3. [`20260914183000_optimize_content_progress_refresh.sql`](../supabase/migrations/20260914183000_optimize_content_progress_refresh.sql)
4. [`20260919000000_add_school_block_name.sql`](../supabase/migrations/20260919000000_add_school_block_name.sql)
5. [`20260919010000_import_ay2026_school_directory.sql`](../supabase/migrations/20260919010000_import_ay2026_school_directory.sql)

All timestamps are `timestamptz` and stored in UTC. Programme-date decisions use
the timezone in the singleton `challenge_settings` row, which defaults to
`Asia/Kolkata`.

## Foundation tables

### `schools`

Stores the enrollment directory and school contact details. `code` is the unique
school identity and is normalized to uppercase; the AY 2026-27 import uses the
11-digit UDISE code. `block_name` supports grouping and searching the 419 imported
schools across 12 administrative blocks. Authenticated users may read schools;
anonymous registration receives column-level access only to safe directory
fields. Only administrators may mutate rows. The import is idempotent: it updates
only changed names/blocks for an existing code and preserves IDs and contact data.

### `profiles`

Maps exactly one application profile to `auth.users` through unique
`auth_user_id`. The `app_role` enum permits only `student` and `admin`.
The Auth insert trigger always assigns `student`, ignoring requested role
metadata. Students can update only approved personal fields; administrators may
maintain enrollment.

Indexes cover school, role, school/role filtering, and case-insensitive name
lookup.

### `challenge_settings`

A singleton settings row holds `total_days` (1-100), `videos_per_day` (1-10),
programme timezone, and `video_completion_threshold` (90% by default). JSON
settings for unimplemented later capabilities are configuration placeholders only.
Authenticated users may read settings; only administrators may update them.

## Content tables

### `challenge_days`

One row per unique `day_number` from 1 through 100, with title, optional
description, release date, and publication state. Students can read a row only
when it is published and its release date is absent or has arrived in the
configured programme timezone. Administrators can manage all rows.

### `videos`

Contains ordered slots 1-10 within a challenge day. The
`(challenge_day_id, video_number)` constraint is unique and deferrable so an
admin reorder can be atomic. Every row has a title, duration from 1 to 43,200
seconds, publication state, optional thumbnail/description, and a provider-neutral
source:

- `external_url` requires an HTTP(S) `video_url` (use HTTPS in production);
- `cloudflare_stream` requires a `playback_id`; or
- `mux` requires a `playback_id`.

Students can read only published videos belonging to a currently available,
published day. Administrators can manage all video rows.

### `audit_logs`

Immutable application-facing records of challenge-day and video inserts, updates,
and deletes. Trigger entries include the authenticated administrator, action,
entity, old/new JSON values, and timestamp. Administrators may read the log;
clients receive no direct mutation grant.

## Progress tables

### `video_progress`

The canonical row per student/video: accepted watch seconds, last position,
calculated percentage, completion state/timestamps, and session count. A student
can read only their own rows; admins may read all. Authenticated clients have no
direct insert/update/delete grant.

### `watch_sessions`

One row per client-generated session UUID, scoped to a student and video. It stores
device type, programme date, accepted watch seconds, latest position, monotonic
sequence, report time, and optional end time. Clients can read their own rows but
mutations occur only inside the progress RPCs.

### `daily_progress`

A derived student/day row with videos completed/total, accepted watch time,
percentage, and activity/completion timestamps. PostgreSQL recalculates it after
progress or relevant video changes. A day completes only when its configured
required slots exist, are published, and are completed. Clients may read allowed
rows but cannot write aggregates directly.

### Private anti-inflation tables

`private.video_progress_guards` is a token bucket shared across concurrent
sessions for one student/video. `private.watch_session_guards` applies the same
rule to a concrete session. They cap accepted media time at the supported 2x
playback rate. The bounded reserve is the greater of 1,800 seconds or that video's
duration (videos are capped at 12 hours), allowing one full video's delayed/offline
events to drain without creating unlimited credit. The `private` schema is not
exposed through the client API and grants are reserved for trusted database
execution/service operations.

## Public RPCs

Student playback uses security-definer functions with an empty search path and
row security disabled only inside their narrow trusted operation:

- `start_video_session`: verifies the authenticated student and released video,
  creates idempotent progress/session rows, validates the initial position, and
  returns the canonical progress snapshot.
- `record_video_progress`: requires an existing matching session, accepts a
  monotonic sequence, caps a requested delta to 30 seconds and available watch
  credit, updates position/session state, and recalculates daily progress.
- `mark_video_complete`: recalculates eligibility from accepted watch time and
  duration, then marks completion only when the configured threshold is met.

Each RPC derives identity from `auth.uid()`. Their optional
`p_expected_student_id` argument is only an additional stale-account guard; it
cannot select or impersonate a student. Progress responses include video totals,
resume position, eligibility/completion state, accepted delta, timestamps/session
count, and the updated daily aggregate.

Admin content operations use:

- `upsert_day_videos`: validates and atomically creates/updates 1-10 supplied
  slots without deleting omitted existing rows.
- `reorder_day_videos`: requires every video ID for the day exactly once and
  updates all slot numbers atomically.

Both functions reject non-admin callers even though authenticated users need
`execute` permission to reach the internal role check.

Foundation functions include `public.is_admin()`,
`public.get_admin_overview()`, the Auth/profile triggers, field-protection
triggers, normalization, and updated-at triggers. Content changes also run audit
and progress-recalculation triggers.

## RLS and grant summary

| Resource | Anonymous | Student | Admin |
| --- | --- | --- | --- |
| School directory | Safe columns, read only | Read | Read/create/update/delete |
| Own profile | None | Read; safe personal edits | Read/manage enrollment |
| Other profiles | None | None | Read/manage enrollment |
| Challenge settings | None | Read | Read/update |
| Available day/video content | None | Read released/published rows | Read/manage all |
| Video/session/daily progress | None | Read own; mutate through RPCs only | Read all |
| Content audit log | None | None | Read |
| Admin overview/content RPCs | None | Rejected | Execute |

Table grants, field-protection triggers, RLS, and RPC checks are intentionally
overlapping. A hidden page or disabled button is never treated as authorization.

## Realtime

The Phase 2/3 migration idempotently adds `challenge_days`, `videos`,
`video_progress`, and `daily_progress` to the `supabase_realtime`
publication. RLS still controls which change rows a subscriber can receive.

The follow-up optimization migration keeps duration-derived video progress
immediate, ignores no-op content assignments, and defers content-driven daily
aggregation until the transaction's final state. A multi-video save or reorder
then performs one set-based refresh per affected day instead of recalculating the
same cohort once per video row.

## Development seed

[`seed.sql`](../supabase/seed.sql) creates three schools, ten email-confirmed
student identities, one administrator, matching profiles, the settings singleton,
three published days with ten playable sample videos each, and varied progress and
watch-session rows. It is deterministic and intended only for local
`supabase db reset`.

## Tests

[`phase1_foundation.test.sql`](../supabase/tests/phase1_foundation.test.sql)
contains the foundation's 49 planned pgTAP assertions.
[`phase2_phase3_content_video.test.sql`](../supabase/tests/phase2_phase3_content_video.test.sql)
adds transactional coverage for schema constraints, publication visibility,
content-admin isolation, audit records, direct progress-write denial, RPC identity
and session rules, anti-inflation behavior, completion thresholds, Realtime setup,
and daily aggregation.

Run both against a disposable local/staging database:

```bash
npx supabase db reset
npx supabase test db
```

Do not run `seed.sql` against production, and do not use production as a test
fixture database.
