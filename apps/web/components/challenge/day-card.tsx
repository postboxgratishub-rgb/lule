import Link from "next/link";

import { ProgressBar } from "@/components/challenge/progress-bar";
import { percentage } from "@/lib/challenge/logic";
import type { ChallengeDayCard as ChallengeDayCardData } from "@/lib/challenge/types";
import { cn } from "@/lib/cn";

const statePresentation = {
  locked: {
    label: "Locked",
    icon: "🔒",
    badge: "bg-slate-100 text-slate-500",
    border: "border-slate-200 bg-slate-50/70",
  },
  available: {
    label: "Available",
    icon: "▶",
    badge: "bg-indigo-50 text-brand-700",
    border: "border-indigo-200 bg-white hover:-translate-y-0.5 hover:shadow-card",
  },
  in_progress: {
    label: "In progress",
    icon: "◔",
    badge: "bg-amber-50 text-amber-700",
    border: "border-amber-200 bg-white hover:-translate-y-0.5 hover:shadow-card",
  },
  completed: {
    label: "Completed",
    icon: "✓",
    badge: "bg-emerald-50 text-emerald-700",
    border: "border-emerald-200 bg-white hover:-translate-y-0.5 hover:shadow-card",
  },
} as const;

export function ChallengeDayCard({
  card,
  videosPerDay,
}: {
  card: ChallengeDayCardData;
  videosPerDay: number;
}) {
  const presentation = statePresentation[card.state];
  const completed = card.progress?.videos_completed ?? 0;
  const total = videosPerDay;
  const progress = percentage(completed, total);

  const content = (
    <article
      className={cn(
        "group flex h-full min-h-48 flex-col rounded-2xl border p-5 transition-all",
        presentation.border,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">
          Day {card.dayNumber}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-bold",
            presentation.badge,
          )}
        >
          <span aria-hidden="true">{presentation.icon}</span>
          {presentation.label}
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 text-base font-bold leading-6 text-ink">
        {card.day?.title ?? `Learning day ${card.dayNumber}`}
      </h3>
      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
        {card.state === "locked"
          ? "This learning day will open when it is published and released."
          : card.day?.description || "Your next set of learning videos is ready."}
      </p>

      <div className="mt-auto pt-5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600">
            {completed} / {total} videos
          </span>
          <span className="font-bold text-slate-500">{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} label={`Day ${card.dayNumber} progress`} />
      </div>
    </article>
  );

  if (card.state === "locked") return content;
  return (
    <Link
      href={`/challenge/${card.dayNumber}`}
      className="rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      aria-label={`Open Day ${card.dayNumber}: ${card.day?.title ?? "Learning day"}`}
    >
      {content}
    </Link>
  );
}
