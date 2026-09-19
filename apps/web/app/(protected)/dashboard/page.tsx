import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ChallengeDayCard } from "@/components/challenge/day-card";
import { ProgressBar } from "@/components/challenge/progress-bar";
import { ProfileMissing } from "@/components/dashboard/profile-missing";
import { StatCard } from "@/components/dashboard/stat-card";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { formatWatchTime } from "@/lib/challenge/logic";
import { getChallengeOverview } from "@/lib/data/challenge";
import { getCurrentStudent } from "@/lib/data/current-student";

export const metadata: Metadata = { title: "Student dashboard" };

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Student";
}

export default async function DashboardPage() {
  const [student, overview] = await Promise.all([
    getCurrentStudent(),
    getChallengeOverview(),
  ]);
  if (!student) redirect("/login");
  if (!student.profile) return <ProfileMissing email={student.authEmail} />;

  const { profile, school } = student;
  const focus = overview?.focusDay ?? null;
  const previewDays = overview
    ? [
        ...(focus ? [focus] : []),
        ...overview.days.filter(
          (day) => day.dayNumber !== focus?.dayNumber && day.state !== "locked",
        ),
        ...overview.days.filter((day) => day.state === "locked"),
      ].slice(0, 4)
    : [];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white shadow-card sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(99,102,241,0.52),transparent_28%),radial-gradient(circle_at_95%_100%,rgba(251,146,60,0.30),transparent_30%)]" />
        <div className="relative grid gap-7 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-indigo-100 ring-1 ring-inset ring-white/10">
              <span className="size-2 rounded-full bg-emerald-400" />
              Progress sync is active
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {firstName(profile.full_name)}!
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Keep your learning momentum going. Every verified minute and
              completion is shared securely with the mobile app.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={focus ? `/challenge/${focus.dayNumber}` : "/challenge"}
                className={buttonClassName("primary", "bg-white text-ink hover:bg-slate-100")}
              >
                {focus?.state === "in_progress" ? "Continue learning" : "Open challenge"}
              </Link>
              <Link
                href="/profile"
                className={buttonClassName(
                  "secondary",
                  "border-white/15 bg-white/10 text-white hover:border-white/25 hover:bg-white/15",
                )}
              >
                My profile
              </Link>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/10">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Overall progress
                </p>
                <p className="mt-1 text-3xl font-black">
                  {Math.round(overview?.overallPercentage ?? 0)}%
                </p>
              </div>
              <p className="pb-1 text-xs text-slate-300">
                {overview?.completedVideos ?? 0} videos done
              </p>
            </div>
            <ProgressBar
              value={overview?.overallPercentage ?? 0}
              label="Overall challenge progress"
              className="mt-4 bg-white/15"
            />
          </div>
        </div>
      </section>

      {student.schoolError ? (
        <Alert title="School details could not be loaded" variant="error">
          Your progress is safe, but the school service returned an error. Refresh
          this page to retry.
        </Alert>
      ) : null}

      <section aria-labelledby="learning-overview-heading">
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
            Live learning data
          </p>
          <h2 id="learning-overview-heading" className="mt-1 text-2xl font-bold text-ink">
            Your progress overview
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            eyebrow="Current day"
            value={focus ? `Day ${focus.dayNumber}` : "Waiting"}
            detail={focus?.day?.title ?? "No challenge day has been released yet."}
            icon={<span aria-hidden="true">▶</span>}
          />
          <StatCard
            eyebrow="Days completed"
            value={`${overview?.completedDays ?? 0} / ${overview?.settings.total_days ?? 100}`}
            detail="A day completes after all required videos are confirmed."
            icon={<span aria-hidden="true">✓</span>}
          />
          <StatCard
            eyebrow="Total watch time"
            value={formatWatchTime(overview?.totalWatchSeconds ?? 0)}
            detail="Validated playback time across web and mobile."
            icon={<span aria-hidden="true">◷</span>}
          />
          <StatCard
            eyebrow="School"
            value={school?.code ?? "—"}
            detail={
              school
                ? [school.name, school.block_name].filter(Boolean).join(" · ")
                : "School details are not available."
            }
            icon={<span aria-hidden="true">⌂</span>}
          />
        </div>
      </section>

      <section aria-labelledby="next-days-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
              Learning path
            </p>
            <h2 id="next-days-heading" className="mt-1 text-2xl font-bold text-ink">
              Continue your challenge
            </h2>
          </div>
          <Link href="/challenge" className={buttonClassName("secondary", "hidden sm:inline-flex")}>
            View all {overview?.settings.total_days ?? 100} days
          </Link>
        </div>

        {overview ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previewDays.map((day) => (
              <ChallengeDayCard
                key={day.dayNumber}
                card={day}
                videosPerDay={overview.settings.videos_per_day}
              />
            ))}
          </div>
        ) : (
          <Alert title="Challenge data is unavailable" variant="error">
            Refresh the page to try loading your learning plan again.
          </Alert>
        )}
      </section>
    </div>
  );
}
