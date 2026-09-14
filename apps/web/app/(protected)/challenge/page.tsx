import type { Metadata } from "next";
import Link from "next/link";

import { ChallengeGrid } from "@/components/challenge/challenge-grid";
import { ProgressBar } from "@/components/challenge/progress-bar";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { formatWatchTime } from "@/lib/challenge/logic";
import { getChallengeOverview } from "@/lib/data/challenge";

export const metadata: Metadata = { title: "100-day challenge" };

export default async function ChallengePage() {
  const overview = await getChallengeOverview();

  if (!overview) {
    return (
      <Alert title="Your learning profile is not ready" variant="error">
        We could not connect challenge progress to your student profile. Sign out,
        sign back in, or ask an administrator to repair your enrollment.
      </Alert>
    );
  }

  const { settings, focusDay } = overview;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-ink px-6 py-8 text-white shadow-card sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(99,102,241,0.55),transparent_30%),radial-gradient(circle_at_95%_110%,rgba(52,211,153,0.25),transparent_32%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-200">
              {settings.organization_name}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {settings.program_name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Learn consistently, resume on any device, and complete each video
              after the platform verifies your watch progress.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                {settings.total_days} days
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                {settings.videos_per_day} videos per day
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1.5 ring-1 ring-inset ring-white/10">
                {settings.video_completion_threshold}% watch threshold
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">
                  Overall progress
                </p>
                <p className="mt-1 text-3xl font-black">
                  {Math.round(overview.overallPercentage)}%
                </p>
              </div>
              <p className="pb-1 text-xs text-slate-300">
                {overview.completedVideos} / {overview.totalVideos} videos
              </p>
            </div>
            <ProgressBar
              value={overview.overallPercentage}
              label="Overall challenge progress"
              className="mt-4 bg-white/15"
            />
            <p className="mt-3 text-xs text-slate-300">
              {overview.completedDays} days complete · {formatWatchTime(overview.totalWatchSeconds)} watched
            </p>
          </div>
        </div>
      </section>

      {focusDay ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-brand-700">
              Continue learning
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">
              Day {focusDay.dayNumber}: {focusDay.day?.title}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {focusDay.progress?.videos_completed ?? 0} of {settings.videos_per_day} videos completed.
            </p>
          </div>
          <Link
            href={`/challenge/${focusDay.dayNumber}`}
            className={buttonClassName("primary", "shrink-0")}
          >
            {focusDay.state === "in_progress" ? "Continue day" : "Open day"}
          </Link>
        </section>
      ) : (
        <Alert title="No challenge day is available yet">
          Your administrator has not released the first learning day. This page
          will update when content is published.
        </Alert>
      )}

      <ChallengeGrid days={overview.days} videosPerDay={settings.videos_per_day} />
    </div>
  );
}
