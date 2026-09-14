import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Search,
  Video,
} from "lucide-react";

import { ChallengeDayForm } from "@/components/content/challenge-day-form";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { getDayPublicationReadiness } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { sanitizeSearchTerm } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import type { ChallengeDaySummary, Video as ChallengeVideo } from "@/types";

export const metadata: Metadata = { title: "Challenge content" };
export const dynamic = "force-dynamic";

interface ContentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const params = await searchParams;
  const search = sanitizeSearchTerm(params.q);
  const requestedStatus = Array.isArray(params.status) ? params.status[0] : params.status;
  const status = requestedStatus === "published" || requestedStatus === "draft"
    ? requestedStatus
    : "all";
  const supabase = await createClient();

  let query = supabase
    .from("challenge_days")
    .select(
      "id, day_number, title, description, release_date, is_published, created_at, updated_at, videos(video_number, is_published)",
    )
    .order("day_number");

  if (search) query = query.ilike("title", `%${search}%`);
  if (status !== "all") query = query.eq("is_published", status === "published");

  const { data, error } = await query;
  if (error) throw new Error("Unable to load challenge content.");

  const days: ChallengeDaySummary[] = (data ?? []).map((item) => {
    const videos = Array.isArray(item.videos)
      ? (item.videos as Pick<ChallengeVideo, "video_number" | "is_published">[])
      : [];
    const readiness = getDayPublicationReadiness(item.release_date, videos);
    return {
      id: item.id,
      day_number: item.day_number,
      title: item.title,
      description: item.description,
      release_date: item.release_date,
      is_published: item.is_published,
      created_at: item.created_at,
      updated_at: item.updated_at,
      video_count: readiness.videoCount,
      published_video_count: readiness.publishedVideoCount,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Learning programme"
        title="Challenge content"
        description="Build each learning day, fill its 10 video slots, and control exactly when students can access it."
      />

      <details className="panel mb-6 overflow-hidden" open={days.length === 0}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 marker:hidden sm:px-6">
          <div>
            <h2 className="font-bold text-ink-950">Create a challenge day</h2>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Day numbers are unique and limited to 1 through 100.
            </p>
          </div>
          <span className="button-secondary pointer-events-none shrink-0">
            <CalendarDays className="size-4" aria-hidden="true" />
            New day
          </span>
        </summary>
        <div className="border-t border-slate-100 px-5 py-5 sm:px-6 sm:py-6">
          <ChallengeDayForm />
        </div>
      </details>

      <section className="panel overflow-hidden" aria-labelledby="content-list-title">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-end">
          <div>
            <h2 id="content-list-title" className="font-bold text-ink-950">
              All challenge days
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              {days.length} matching day{days.length === 1 ? "" : "s"}
            </p>
          </div>

          <form action="/content" className="grid w-full gap-2 sm:grid-cols-[minmax(0,1fr)_170px_auto] lg:w-auto" role="search">
            <label className="sr-only" htmlFor="content-search">
              Search challenge days
            </label>
            <div className="relative min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                className="field-input min-h-10 py-2 pl-9"
                id="content-search"
                name="q"
                defaultValue={search}
                placeholder="Search titles"
              />
            </div>
            <label className="sr-only" htmlFor="content-status">
              Publication status
            </label>
            <select
              className="field-input min-h-10 py-2"
              id="content-status"
              name="status"
              defaultValue={status}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button className="button-secondary" type="submit">
              Filter
            </button>
          </form>
        </div>

        {days.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="table-cell">Day</th>
                  <th className="table-cell">Release</th>
                  <th className="table-cell">Video slots</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {days.map((day) => (
                  <tr key={day.id} className="transition hover:bg-slate-50/70">
                    <td className="table-cell max-w-sm whitespace-normal">
                      <div className="flex items-start gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-950 text-xs font-extrabold text-white">
                          {day.day_number}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink-950">{day.title}</span>
                          <span className="mt-1 line-clamp-1 block text-xs text-ink-500">
                            {day.description || "No description yet"}
                          </span>
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-ink-500">{formatDate(day.release_date)}</td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-ink-700">
                        <Video className="size-4 text-brand-600" aria-hidden="true" />
                        {day.video_count} / 10
                      </span>
                      <span className="mt-1 block text-[11px] text-ink-500">
                        {day.published_video_count} published
                      </span>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          day.is_published
                            ? "bg-brand-50 text-brand-800"
                            : "bg-amber-50 text-amber-800"
                        }`}
                      >
                        {day.is_published ? (
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        ) : (
                          <CircleDashed className="size-3.5" aria-hidden="true" />
                        )}
                        {day.is_published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/content/${day.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
                      >
                        Manage day
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={search || status !== "all" ? "No matching challenge days" : "No challenge days yet"}
            description={
              search || status !== "all"
                ? "Clear or change the filters to see other days."
                : "Create Day 1 above, then add its 10 learning videos."
            }
            action={
              search || status !== "all" ? (
                <Link href="/content" className="button-secondary">
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        )}
      </section>
    </>
  );
}
