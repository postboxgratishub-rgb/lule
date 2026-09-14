import Link from "next/link";

import { ProgressBar } from "@/components/challenge/progress-bar";
import { formatDuration } from "@/lib/challenge/logic";
import type { VideoWithProgress } from "@/lib/challenge/types";
import { cn } from "@/lib/cn";

const videoState = {
  not_started: { label: "Not started", style: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In progress", style: "bg-amber-50 text-amber-700" },
  eligible: { label: "Ready to complete", style: "bg-indigo-50 text-brand-700" },
  completed: { label: "Completed", style: "bg-emerald-50 text-emerald-700" },
} as const;

export function VideoCard({
  item,
  dayNumber,
}: {
  item: VideoWithProgress;
  dayNumber: number;
}) {
  const { video, progress, state } = item;
  const presentation = videoState[state];
  const resumeAt = progress?.last_position_seconds ?? 0;

  return (
    <Link
      href={`/challenge/${dayNumber}/video/${video.video_number}`}
      className="group rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
    >
      <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all group-hover:-translate-y-0.5 group-hover:border-brand-300 group-hover:shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 font-black text-brand-700">
            {video.video_number}
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
              presentation.style,
            )}
          >
            {state === "completed" ? "✓ " : ""}
            {presentation.label}
          </span>
        </div>
        <h3 className="mt-4 line-clamp-2 text-base font-bold leading-6 text-ink">
          {video.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
          {video.description || "Open this lesson and learn at your own pace."}
        </p>

        <div className="mt-auto pt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>{formatDuration(video.duration_seconds)}</span>
            <span className="font-semibold">
              {resumeAt > 0 && state !== "completed"
                ? `Resume at ${formatDuration(resumeAt)}`
                : `${Math.round(progress?.completion_percentage ?? 0)}%`}
            </span>
          </div>
          <ProgressBar
            value={progress?.completion_percentage ?? 0}
            label={`${video.title} progress`}
          />
          <span className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-slate-50 text-sm font-bold text-slate-700 transition-colors group-hover:bg-brand-600 group-hover:text-white">
            {state === "not_started"
              ? "Start video"
              : state === "completed"
                ? "Watch again"
                : "Continue watching"}
          </span>
        </div>
      </article>
    </Link>
  );
}
