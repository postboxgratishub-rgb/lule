import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LockedDay } from "@/components/challenge/locked-day";
import { ProgressBar } from "@/components/challenge/progress-bar";
import { VideoCard } from "@/components/challenge/video-card";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { formatWatchTime, percentage } from "@/lib/challenge/logic";
import { getChallengeDay } from "@/lib/data/challenge";

type DayPageProps = { params: Promise<{ dayNumber: string }> };

function parseDayNumber(value: string): number | null {
  if (!/^\d{1,3}$/.test(value)) return null;
  const dayNumber = Number(value);
  return Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 365
    ? dayNumber
    : null;
}

export async function generateMetadata({ params }: DayPageProps): Promise<Metadata> {
  const dayNumber = parseDayNumber((await params).dayNumber);
  return { title: dayNumber ? `Day ${dayNumber}` : "Challenge day" };
}

export default async function DayPage({ params }: DayPageProps) {
  const dayNumber = parseDayNumber((await params).dayNumber);
  if (!dayNumber) notFound();

  const details = await getChallengeDay(dayNumber);
  if (!details) return <LockedDay dayNumber={dayNumber} />;

  const { day, settings, dailyProgress, videos } = details;
  const totalSlots = settings.videos_per_day;
  const videosCompleted = dailyProgress?.videos_completed ?? 0;
  const dailyPercentage = percentage(videosCompleted, totalSlots);
  const slots = Array.from({ length: totalSlots }, (_, index) => {
    const videoNumber = index + 1;
    return videos.find((item) => item.video.video_number === videoNumber) ?? null;
  });

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/challenge" className="font-semibold hover:text-brand-700">
          100-day challenge
        </Link>
        <span className="mx-2" aria-hidden="true">/</span>
        <span aria-current="page">Day {day.day_number}</span>
      </nav>

      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">
              Day {day.day_number} of {settings.total_days}
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
              {day.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {day.description || "Complete each published video to finish this learning day."}
            </p>
          </div>
          <div className="w-full rounded-2xl bg-slate-50 p-5 lg:w-72">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold text-ink">Daily progress</span>
              <span className="text-xl font-black text-brand-700">
                {Math.round(dailyPercentage)}%
              </span>
            </div>
            <ProgressBar value={dailyPercentage} label={`Day ${day.day_number} progress`} className="mt-3" />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
              <span>{videosCompleted} / {totalSlots} completed</span>
              <span>{formatWatchTime(dailyProgress?.watch_time_seconds ?? 0)}</span>
            </div>
          </div>
        </div>
      </header>

      {videos.length === 0 ? (
        <Alert title="Videos are not available yet">
          This day is open, but its lessons have not been published. Check again
          after your administrator finishes the video list.
        </Alert>
      ) : null}

      <section aria-labelledby="videos-heading">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Lessons
            </p>
            <h2 id="videos-heading" className="mt-1 text-2xl font-bold text-ink">
              {totalSlots} videos for Day {day.day_number}
            </h2>
          </div>
          <Link href="/challenge" className={buttonClassName("secondary", "hidden sm:inline-flex")}>
            All days
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((item, index) =>
            item ? (
              <VideoCard key={item.video.id} item={item} dayNumber={day.day_number} />
            ) : (
              <article
                key={`empty-${index + 1}`}
                className="flex min-h-64 flex-col rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-5"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-slate-100 font-black text-slate-400">
                  {index + 1}
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-500">Video not published</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  This lesson slot will become available after content review and publication.
                </p>
                <span className="mt-auto pt-5 text-xs font-semibold text-slate-400">Locked</span>
              </article>
            ),
          )}
        </div>
      </section>
    </div>
  );
}
