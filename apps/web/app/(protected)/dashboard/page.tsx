import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ProfileMissing } from "@/components/dashboard/profile-missing";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { getCurrentStudent } from "@/lib/data/current-student";
import { formatDateTime } from "@/lib/format";
import { profileCompletionPercentage } from "@/lib/profile";

export const metadata: Metadata = { title: "Student dashboard" };

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Student";
}

export default async function DashboardPage() {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  if (!student.profile) return <ProfileMissing email={student.authEmail} />;

  const { profile, school } = student;
  const readiness = profileCompletionPercentage(profile);
  const cohort = [
    profile.class_name ? `Class ${profile.class_name}` : null,
    profile.section ? `Section ${profile.section}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white shadow-card sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.52),transparent_28%),radial-gradient(circle_at_95%_100%,rgba(251,146,60,0.30),transparent_30%)]" />
        <div className="relative max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 ring-1 ring-inset ring-white/10">
            <span className="size-2 rounded-full bg-emerald-400" />
            Student account ready
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome, {firstName(profile.full_name)}!
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Your learning identity is connected to your school. You’ll use this
            same account when the 100-day challenge content opens.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className={buttonClassName(
                "secondary",
                "border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15",
              )}
            >
              View my profile
            </Link>
          </div>
        </div>
      </section>

      {student.schoolError ? (
        <Alert title="School details could not be loaded" variant="error">
          Your profile is safe, but the school service returned an error. Refresh
          the page to retry.
        </Alert>
      ) : null}

      <section aria-labelledby="account-overview-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Foundation
            </p>
            <h2
              id="account-overview-heading"
              className="mt-1 text-2xl font-bold tracking-tight text-ink"
            >
              Account overview
            </h2>
          </div>
          <span className="hidden text-xs text-slate-400 sm:block">
            Joined {formatDateTime(profile.created_at)}
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            eyebrow="Enrollment"
            value="Registered"
            detail="Your secure student record is active."
            icon={<span aria-hidden="true">✓</span>}
          />
          <StatCard
            eyebrow="Profile readiness"
            value={`${readiness}%`}
            detail={`${readiness === 100 ? "All required details are connected." : "Some enrollment details need attention."}`}
            icon={<span aria-hidden="true">◔</span>}
          />
          <StatCard
            eyebrow="Cohort"
            value={cohort || "Pending"}
            detail={
              profile.roll_number
                ? `Roll number ${profile.roll_number}`
                : "No roll number is recorded."
            }
            icon={<span aria-hidden="true">♙</span>}
          />
          <StatCard
            eyebrow="School"
            value={school?.code ?? "—"}
            detail={school?.name ?? "School details are not available."}
            icon={<span aria-hidden="true">⌂</span>}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
                Coming in Phase 2
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight text-ink">
                Your 100-day learning plan
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Challenge days, lessons, and progress are not published in this
                foundation phase. They will appear here when content management is
                enabled in Phase 2—no activity has been assumed or fabricated.
              </p>
            </div>
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-100 to-orange-100 text-2xl">
              <span aria-hidden="true">↗</span>
            </div>
          </div>
          <div className="mt-7 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-8 text-center">
            <div className="mx-auto grid size-11 place-items-center rounded-xl bg-white text-lg shadow-sm">
              <span aria-hidden="true">▦</span>
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">
              No challenge days are available in Phase 1
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Published learning content and real progress metrics will live here.
            </p>
          </div>
        </article>

        <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Getting ready
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">Your setup path</h2>
          <ol className="mt-6 space-y-5">
            {[
              {
                label: "Student account created",
                done: true,
                detail: profile.email,
              },
              {
                label: "School connected",
                done: Boolean(school),
                detail: school?.name ?? "Awaiting school details",
              },
              {
                label: "Challenge content published",
                done: false,
                detail: "Scheduled for Phase 2",
              },
            ].map((step, index) => (
              <li key={step.label} className="flex gap-3">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    step.done
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {step.done ? "✓" : index + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{step.label}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-500">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </div>
  );
}
