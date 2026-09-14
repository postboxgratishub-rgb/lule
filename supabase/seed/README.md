# Local seed accounts

These accounts are deterministic development fixtures created by
[`../seed.sql`](../seed.sql). They work with the local Supabase email/password
flow after `supabase db reset`. All users are email-confirmed, and the seed also
creates their `email` identity records.

Do not use these passwords in a hosted environment.

| Role | Email | Password | School |
| --- | --- | --- | --- |
| Admin | `admin@example.com` | `Admin123!` | — |
| Student | `student01@example.com` | `Student123!` | Vidya Mandir Senior Secondary School |
| Student | `student02@example.com` | `Student123!` | Vidya Mandir Senior Secondary School |
| Student | `student03@example.com` | `Student123!` | Vidya Mandir Senior Secondary School |
| Student | `student04@example.com` | `Student123!` | Green Valley Public School |
| Student | `student05@example.com` | `Student123!` | Green Valley Public School |
| Student | `student06@example.com` | `Student123!` | Green Valley Public School |
| Student | `student07@example.com` | `Student123!` | Dr. A.P.J. Abdul Kalam Government School |
| Student | `student08@example.com` | `Student123!` | Dr. A.P.J. Abdul Kalam Government School |
| Student | `student09@example.com` | `Student123!` | Dr. A.P.J. Abdul Kalam Government School |
| Student | `student10@example.com` | `Student123!` | Dr. A.P.J. Abdul Kalam Government School |

The seed contains eleven total Auth users and eleven profiles: one administrator
and ten students. Self-signups always receive the `student` application role even
if a caller includes a different role in Auth metadata.

It also creates three published challenge days with ten provider-neutral sample
videos per day. The videos use public development MP4 URLs and are not intended
as production curriculum.

The local progress fixtures cover the main dashboard states:

- `student01@example.com` has completed Day 1 and started Day 2.
- `student02@example.com` is partway through Day 1.
- `student04@example.com` is ahead, with Days 1 and 2 completed and Day 3 started.
- `student05@example.com` has incomplete activity from yesterday.
- The remaining students have not started, which supports empty-state and
  not-active-today testing.

Every fixture watch row represents accepted playback time; simply opening a
video does not add any watch seconds.
