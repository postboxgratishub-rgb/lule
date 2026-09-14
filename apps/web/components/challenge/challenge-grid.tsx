import { ChallengeDayCard } from "@/components/challenge/day-card";
import type { ChallengeDayCard as ChallengeDayCardData } from "@/lib/challenge/types";

export function ChallengeGrid({
  days,
  videosPerDay,
}: {
  days: ChallengeDayCardData[];
  videosPerDay: number;
}) {
  const counts = days.reduce(
    (total, day) => ({ ...total, [day.state]: total[day.state] + 1 }),
    { locked: 0, available: 0, in_progress: 0, completed: 0 },
  );

  return (
    <section aria-labelledby="learning-days-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-600">
            Your learning path
          </p>
          <h2 id="learning-days-heading" className="mt-1 text-2xl font-bold text-ink">
            All {days.length} challenge days
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700">
            {counts.completed} completed
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700">
            {counts.in_progress} in progress
          </span>
          <span className="rounded-full bg-indigo-50 px-3 py-1.5 text-brand-700">
            {counts.available} available
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5">
            {counts.locked} locked
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {days.map((day) => (
          <ChallengeDayCard
            key={day.dayNumber}
            card={day}
            videosPerDay={videosPerDay}
          />
        ))}
      </div>
    </section>
  );
}
