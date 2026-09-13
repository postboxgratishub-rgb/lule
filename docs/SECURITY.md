# Security model

## Trust boundaries

All mobile and browser code is untrusted. The public Supabase URL and anon key may be
bundled in those clients, but the service-role key must exist only in a protected
server/Edge Function environment. None of the Phase 1 apps needs it.

PostgreSQL Row Level Security is enabled on every application table. Policies
use the authenticated user's profile and an internal security-definer role helper.
The helper has a fixed `search_path` and is not directly writable by clients.

## Profile safety

- Signup always produces a student role, regardless of submitted metadata.
- A student can read only their own full profile.
- Student profile edits are restricted to an explicit safe column set.
- Students cannot change `role`, `auth_user_id`, ownership, or another profile.
- Administrators can manage schools and view the students required for operations.
- Anonymous registration can read only the public school-directory columns.

Application route guards are defense in depth. Never weaken RLS because a page is
hidden in the UI.

## Operational checklist

Before production:

1. Enable email confirmation and configure approved redirect URLs.
2. Create administrator accounts through a controlled operator process; never expose
   a public "create admin" route.
3. Rotate any credential that has appeared in source or logs.
4. Keep leaked-password protection and appropriate Auth rate limits enabled.
5. Run the SQL RLS tests against a staging project after every migration.
6. Review Supabase Auth and PostgreSQL logs; alert on repeated failed sign-ins.
7. Back up the database and test restoration before onboarding students.
8. Define retention and guardian-consent policies appropriate to student ages and
   applicable Indian privacy/education requirements with qualified counsel.

## Future phases

Playback completion must be accepted through a database function or secure Edge
Function that validates server-maintained watch increments against video duration.
Clients must never be granted unrestricted completion updates. Certificate public
views must expose only the minimum verification fields.
