# Phase 1 database

The foundation migration is
[`20260913000000_phase1_foundation.sql`](../supabase/migrations/20260913000000_phase1_foundation.sql).
All timestamps are `timestamptz` and are stored in UTC. Display-time timezone rules
default to `Asia/Kolkata` in the singleton challenge settings row.

## Tables

### `schools`

Stores the enrollment directory and school contact details. `code` is unique,
uppercased by a trigger, and indexed by its unique constraint. Authenticated users
may read schools; anonymous registration receives column-level access only to `id`,
`name`, `code`, `city`, and `state`. Only administrators may mutate rows.

### `profiles`

Maps exactly one application profile to `auth.users` through unique
`auth_user_id`. Profile IDs intentionally equal Auth user IDs for locally seeded and
newly registered users, but clients query by `auth_user_id` rather than relying on
that implementation detail.

The `app_role` enum permits only `student` and `admin`. The Auth insert trigger always
uses `student`, ignoring any requested metadata role. Application sessions cannot
change authorization or identity fields. Administrators may maintain enrollment;
students can update only approved personal fields and can read only themselves.

Indexes cover school, role, school/role filtering, and case-insensitive name lookup.

### `challenge_settings`

A singleton settings row establishes cross-client defaults without hardcoding them:
100 total days, 10 videos/day, `Asia/Kolkata`, a 90% future video threshold, and JSON
objects for later certificate, streak, and notification rules. Authenticated users
may read it; only administrators may update it. Phase 1 creates no content rows.

## Functions and triggers

- `private.handle_new_user()`: validates signup metadata and creates a student
  profile transactionally.
- `private.sync_auth_email()`: keeps the private profile email aligned with Auth.
- `private.protect_profile_fields()`: rejects client attempts to change identity,
  roles, or unauthorized enrollment fields.
- `private.is_admin()`: non-recursive policy helper with a fixed search path.
- `public.is_admin()`: safe current-user role check for protected admin navigation.
- `public.get_admin_overview()`: admin-only student/school/new-registration counts
  and a school-distribution JSON aggregate.
- normalization and `updated_at` triggers keep mutable records consistent.

Security-definer functions use a blank/fixed `search_path`, disable row security only
inside their narrow trusted operation, and have explicit execute grants.

## RLS summary

| Resource | Anonymous | Student | Admin |
| --- | --- | --- | --- |
| School directory | Safe columns, read only | Read | Read/create/update/delete |
| Own profile | None | Read; safe personal edits | Read/manage enrollment |
| Other profiles | None | None | Read/manage enrollment |
| Challenge settings | None | Read | Read/update |
| Admin overview RPC | None | Rejected | Execute |

Database grants and field-protection triggers complement RLS. A page being hidden or
a button being disabled is never treated as authorization.

## Seed

[`seed.sql`](../supabase/seed.sql) creates three schools, ten email-confirmed student
Auth identities, one administrator, matching profiles, and the settings singleton.
It is deterministic and intended only for `supabase db reset` in development.

## Tests

[`phase1_foundation.test.sql`](../supabase/tests/phase1_foundation.test.sql) contains
49 transactional pgTAP assertions. It tests schema/defaults, grants, anonymous
directory access, trigger behavior, cross-student isolation, self-promotion and
enrollment attacks, admin operations, aggregate accuracy, email synchronization,
and documented seed credentials.

Run it against the local stack:

```bash
npx supabase db reset
npx supabase test db
```
