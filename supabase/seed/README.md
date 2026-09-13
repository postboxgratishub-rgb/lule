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
