import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Circle,
  Info,
  ShieldAlert,
  Video,
} from "lucide-react";
import { notFound } from "next/navigation";

import { BulkVideoForm } from "@/components/content/bulk-video-form";
import { ChallengeDayForm } from "@/components/content/challenge-day-form";
import { DayPublishButton } from "@/components/content/day-publish-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDayPublicationReadiness } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeDay, Video as ChallengeVideo } from "@/types";

export const metadata: Metadata = { title: "Manage challenge day" };
export const dynamic = "force-dynamic";

export default async function ChallengeDayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, queryParams] = await Promise.all([params, searchParams]);
  const supabase = await createClient();
  const [dayResult, videosResult] = await Promise.all([
    supabase.from("challenge_days").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("videos")
      .select("*")
      .eq("challenge_day_id", id)
      .order("video_number"),
  ]);

  if (dayResult.error) throw new Error("Unable to load this challenge day.");
  if (!dayResult.data) notFound();
  if (videosResult.error) throw new Error("Unable to load this day's videos.");

  const day = dayResult.data as ChallengeDay;
  const videos = (videosResult.data ?? []) as ChallengeVideo[];
  const readiness = getDayPublicationReadiness(day.release_date, videos);
  const created = queryParams.created === "1";

  return (
    <>
      <PageHeader
        eyebrow={`Challenge day ${day.day_number}`}
        title={day.title}
        description="Edit the day, manage all 10 video slots, and publish only when the learning set is ready."
        actions={
          <Link href="/content" className="button-secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All challenge days
          </Link>
        }
      />

      {created && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900" role="status">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Challenge day created. Add its 10 videos below, then publish the day.
        </div>
      )}

      {day.is_published && (
        <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900" role="status">
          <ShieldAlert className="mt-1 size-4 shrink-0" aria-hidden="true" />
          This day is live for students. Unpublish it before deleting, reordering, or unpublishing a video.
        </div>
      )}

      <section className="mb-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <article className="panel p-5 sm:p-6" aria-labelledby="day-details-title">
          <div className="mb-5">
            <h2 id="day-details-title" className="font-bold text-ink-950">
              Day details
            </h2>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Changes to a published day become visible after saving.
            </p>
          </div>
          <ChallengeDayForm day={day} />
        </article>

        <aside className="panel p-5 sm:p-6" aria-labelledby="publication-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="publication-title" className="font-bold text-ink-950">
                Publication
              </h2>
              <p className="mt-1 text-xs text-ink-500">
                {day.is_published ? "Available to students" : "Admin-only draft"}
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                day.is_published
                  ? "bg-brand-50 text-brand-800"
                  : "bg-amber-50 text-amber-800"
              }`}
            >
              {day.is_published ? "Published" : "Draft"}
            </span>
          </div>

          <div className="my-5 h-2 overflow-hidden rounded-full bg-slate-100" aria-label={`${readiness.publishedVideoCount} of 10 videos published`}>
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${readiness.publishedVideoCount * 10}%` }}
            />
          </div>

          <ul className="mb-5 space-y-3 text-sm">
            <li className="flex items-center gap-2.5">
              {readiness.hasReleaseDate ? (
                <CheckCircle2 className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
              ) : (
                <Circle className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
              )}
              <span className="text-ink-700">
                {readiness.hasReleaseDate
                  ? `Releases ${formatDate(day.release_date)}`
                  : "Add a release date"}
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              {readiness.videoCount === 10 ? (
                <CheckCircle2 className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
              ) : (
                <Circle className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
              )}
              <span className="text-ink-700">{readiness.videoCount} of 10 video slots filled</span>
            </li>
            <li className="flex items-center gap-2.5">
              {readiness.publishedVideoCount === 10 ? (
                <CheckCircle2 className="size-4 shrink-0 text-brand-600" aria-hidden="true" />
              ) : (
                <Circle className="size-4 shrink-0 text-slate-300" aria-hidden="true" />
              )}
              <span className="text-ink-700">{readiness.publishedVideoCount} of 10 videos published</span>
            </li>
          </ul>

          <DayPublishButton dayId={day.id} published={day.is_published} />

          {!readiness.ready && !day.is_published && (
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-ink-500">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Complete all three checks before publishing this day.
            </p>
          )}
        </aside>
      </section>

      <section className="panel p-4 sm:p-6" aria-labelledby="video-slots-title">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Video className="size-5 text-brand-600" aria-hidden="true" />
              <h2 id="video-slots-title" className="font-bold text-ink-950">
                Video slots
              </h2>
            </div>
            <p className="mt-1.5 text-xs leading-5 text-ink-500">
              Add or edit all lessons in one save. Source details remain provider-independent.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <CalendarCheck2 className="size-4" aria-hidden="true" />
            Day {day.day_number} · {videos.length}/10 videos
          </span>
        </div>
        <BulkVideoForm day={day} videos={videos} />
      </section>
    </>
  );
}
