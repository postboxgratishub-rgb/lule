import type { ChallengeDay, DailyProgress } from "@/services/learning";

export type DayTile = {
  dayNumber: number;
  day: ChallengeDay | null;
  progress: DailyProgress | null;
  state: "locked" | "available" | "in_progress" | "completed";
};

export function dateInTimezone(timezone: string, date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}
export function isReleased(day: ChallengeDay, timezone: string, now = new Date()): boolean {
  return day.is_published && (!day.release_date || day.release_date <= dateInTimezone(timezone, now));
}

export function buildDayTiles(input: {
  totalDays: number;
  days: ChallengeDay[];
  dailyProgress: DailyProgress[];
  timezone: string;
  now?: Date;
}): DayTile[] {
  const days = new Map(input.days.map((day) => [day.day_number, day]));
  const progress = new Map(input.dailyProgress.map((item) => [item.challenge_day_id, item]));

  return Array.from({ length: input.totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const day = days.get(dayNumber) ?? null;
    const dayProgress = day ? progress.get(day.id) ?? null : null;
    let state: DayTile["state"] = "locked";
    if (day && isReleased(day, input.timezone, input.now)) {
      if (dayProgress?.completed) state = "completed";
      else if ((dayProgress?.videos_completed ?? 0) > 0 || (dayProgress?.watch_time_seconds ?? 0) > 0) state = "in_progress";
      else state = "available";
    }
    return { dayNumber, day, progress: dayProgress, state };
  });
}
