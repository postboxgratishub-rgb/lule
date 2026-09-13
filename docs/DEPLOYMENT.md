# Deployment

## Supabase

Create separate Supabase projects for staging and production. Link the CLI to the
appropriate project and apply migrations with:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Seed data contains development identities and must not be applied to production.
Use migrations for schema and a controlled invitation process for the first real
administrator.

Configure Auth redirect allow-lists for the deployed student and admin origins and
the mobile scheme. Production examples:

```text
https://learn.example.org/auth/callback
https://admin.example.org/auth/callback
hundreddays://update-password
```

## Student and admin websites

Deploy `apps/web` and `apps/admin` as independent Next.js projects (for example on
Vercel). Set each project's root directory and public Supabase environment values.
Do not set the service-role key unless a later server-only feature requires it.

Run these checks in CI before deployment:

```bash
npm ci
npm run check
npm run build
```

## Mobile

Use an Expo Application Services project for signed Android builds. Configure the
public Supabase values as EAS environment variables, choose unique Android/iOS
application identifiers, and build from `apps/mobile`:

```bash
npx eas-cli build --platform android --profile preview
```

Email confirmation and password-recovery links must include the registered app
scheme. Test both from a cold app start and while the app is already open.

## Rollback

Database migrations should be additive wherever possible. Take a backup before a
destructive migration. Roll web/mobile clients back through their hosting release
history; do not use `git reset` or delete production data as a rollback strategy.
