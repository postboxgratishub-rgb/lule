# Architecture

## Phase 1 system

The mobile app, student website, and admin dashboard are separate clients of one
Supabase project. Supabase Auth owns credentials and sessions; PostgreSQL owns all
application data. The `profiles.auth_user_id` foreign key maps an Auth user to one
application profile.

```text
Expo mobile ───────────────┐
                          │  anon key + user JWT
Next.js student website ──┼──────────────► Supabase Auth + PostgreSQL
                          │                     │
Next.js admin dashboard ──┘                     └── RLS is the authorization boundary
```

There is no client-side service-role key, duplicated database, or custom API in
Phase 1. Browser server components and mobile clients both operate as the signed-in
user. This preserves one identity and one source of truth while keeping MVP hosting
cost and operational overhead low.

## Repository boundaries

- `apps/mobile`: Expo Router student app with persistent Supabase sessions.
- `apps/web`: Next.js App Router student experience.
- `apps/admin`: Next.js App Router administrator experience.
- `packages/types`: shared domain and Supabase contract types.
- `packages/validation`: reusable input schemas for later cross-app adoption.
- `packages/shared`: framework-neutral helpers.
- `packages/config`: non-secret platform defaults.
- `supabase`: local project configuration, migrations, seed data, and database tests.

Apps are independently deployable npm workspaces. Shared packages contain no
framework-specific code and business rules should move there only when they truly
apply to more than one surface.

## Authentication and authorization

Registration uses `supabase.auth.signUp`. Student fields are sent as signup metadata;
a database trigger creates the profile transactionally and always assigns the
`student` role. It does not trust a role supplied by the client.

Authorization is layered:

1. Next.js middleware refreshes auth cookies and protects navigation.
2. App layouts verify the profile role before rendering a protected surface.
3. PostgreSQL grants and Row Level Security enforce every data operation.

The third layer is authoritative. Route checks improve UX but are not the security
boundary.

## Scale posture

The Phase 1 design is intentionally conventional for roughly 5,000 users:

- indexed profile and school foreign keys;
- paginated admin queries;
- server-rendered initial web data;
- TanStack Query caching on mobile;
- no N+1 queries for profile/school views;
- no always-on application server.

Later phases add challenge content, progress RPCs, analytics views, certificate
generation, and notification jobs without changing the identity model or introducing
a second source of truth.

## Phase boundary

Phase 1 intentionally does not create lesson/video management, playback tracking,
progress aggregation, analytics, certificates, or notifications. Those belong to
Phases 2–7 and should be added only after this foundation has been deployed and its
RLS tests pass in the target Supabase project.
