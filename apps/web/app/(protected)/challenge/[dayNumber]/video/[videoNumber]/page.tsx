import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LockedDay } from "@/components/challenge/locked-day";
import { VideoPlayer } from "@/components/challenge/video-player";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";
import { getChallengeDay } from "@/lib/data/challenge";

type VideoPageProps = {
  params: Promise<{ dayNumber: string; videoNumber: string }>;
};

function positiveInteger(value: string, maximum: number): number | null {
  if (!/^\d{1,3}$/.test(value)) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= maximum
    ? number
    : null;
}

export async function generateMetadata({ params }: VideoPageProps): Promise<Metadata> {
  const values = await params;
  const dayNumber = positiveInteger(values.dayNumber, 365);
  const videoNumber = positiveInteger(values.videoNumber, 50);
  return {
    title:
      dayNumber && videoNumber
        ? `Day ${dayNumber} · Video ${videoNumber}`
        : "Challenge video",
  };
}

export default async function VideoPage({ params }: VideoPageProps) {
  const values = await params;
  const dayNumber = positiveInteger(values.dayNumber, 365);
  const videoNumber = positiveInteger(values.videoNumber, 50);
  if (!dayNumber || !videoNumber) notFound();

  const details = await getChallengeDay(dayNumber);
  if (!details) return <LockedDay dayNumber={dayNumber} />;

  const index = details.videos.findIndex(
    (item) => item.video.video_number === videoNumber,
  );
  const item = details.videos[index];

  if (!item) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-12 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-2xl">
          <span aria-hidden="true">▦</span>
        </div>
        <h1 className="text-3xl font-bold text-ink">Video not published</h1>
        <p className="text-sm leading-6 text-slate-600">
          Video {videoNumber} is not available in Day {dayNumber}. It may still be
          in draft or outside this day&apos;s configured lesson slots.
        </p>
        <Alert title="Your progress is safe">
          Return to the day page and choose one of the published videos.
        </Alert>
        <Link
          href={`/challenge/${dayNumber}`}
          className={buttonClassName("primary")}
        >
          Back to Day {dayNumber}
        </Link>
      </div>
    );
  }

  const previous = details.videos[index - 1]?.video ?? null;
  const next = details.videos[index + 1]?.video ?? null;
  const hrefFor = (number: number) =>
    `/challenge/${dayNumber}/video/${number}`;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/challenge" className="font-semibold hover:text-brand-700">
          Challenge
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          href={`/challenge/${dayNumber}`}
          className="font-semibold hover:text-brand-700"
        >
          Day {dayNumber}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Video {videoNumber}</span>
      </nav>

      <VideoPlayer
        day={details.day}
        video={item.video}
        initialProgress={item.progress}
        studentId={details.studentId}
        completionThreshold={Number(details.settings.video_completion_threshold)}
        previousHref={previous ? hrefFor(previous.video_number) : null}
        nextHref={next ? hrefFor(next.video_number) : null}
      />
    </div>
  );
}
