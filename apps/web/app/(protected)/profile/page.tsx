import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ProfileMissing } from "@/components/dashboard/profile-missing";
import { Alert } from "@/components/ui/alert";
import { getCurrentStudent } from "@/lib/data/current-student";
import { formatBirthDate, formatDateTime } from "@/lib/format";
import { initials, profileCompletionPercentage } from "@/lib/profile";

export const metadata: Metadata = { title: "My profile" };

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 break-words text-sm font-semibold text-slate-700">
        {value || "Not provided"}
      </dd>
    </div>
  );
}

export default async function ProfilePage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  if (!student.profile) return <ProfileMissing email={student.authEmail} />;

  const { profile, school } = student;
  const readiness = profileCompletionPercentage(profile);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
          Student account
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">My profile</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This is the private enrollment information connected to your learning
          account.
        </p>
      </header>

      {student.schoolError ? (
        <Alert title="School details unavailable" variant="error">
          We could not load your linked school. Refresh the page to retry.
        </Alert>
      ) : null}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-ink via-slate-800 to-brand-700 px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="grid size-20 shrink-0 place-items-center rounded-3xl bg-white/10 text-2xl font-black ring-1 ring-inset ring-white/15">
              {initials(profile.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-2xl font-bold">{profile.full_name}</h2>
              <p className="mt-1 truncate text-sm text-indigo-100">{profile.email}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-300/20">
                  Student
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/80 ring-1 ring-inset ring-white/10">
                  Profile {readiness}% complete
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 p-6 sm:p-8">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Personal details
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Full name" value={profile.full_name} />
              <Detail label="Email" value={profile.email} />
              <Detail label="Mobile number" value={profile.phone} />
              <Detail
                label="Date of birth"
                value={
                  profile.date_of_birth
                    ? formatBirthDate(profile.date_of_birth)
                    : null
                }
              />
              <Detail
                label="Account created"
                value={formatDateTime(profile.created_at)}
              />
            </dl>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              School enrollment
            </h3>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="School" value={school?.name ?? null} />
              <Detail label="School code" value={school?.code ?? null} />
              <Detail label="Block" value={school?.block_name ?? null} />
              <Detail
                label="Location"
                value={[school?.city, school?.state].filter(Boolean).join(", ") || null}
              />
              <Detail label="Class / grade" value={profile.class_name} />
              <Detail label="Section" value={profile.section} />
              <Detail label="Roll number" value={profile.roll_number} />
            </dl>
          </div>

          <Alert title="Need to correct something?">
            Ask your school administrator to update verified enrollment details.
            Self-service profile editing is intentionally deferred until an audited
            update flow is available.
          </Alert>
        </div>
      </section>
    </div>
  );
}
