import type {
  ChallengeDay,
  ChallengeSettings,
  DailyProgress,
  VideoProgress,
} from "@/lib/database.types";
import type {
  ChallengeDayCard,
  DayVisualState,
  VideoVisualState,
} from "@/lib/challenge/types";

export const DEFAULT_TOTAL_DAYS = 100;
export const DEFAULT_VIDEOS_PER_DAY = 10;
export const DEFAULT_COMPLETION_THRESHOLD = 90;
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function percentage(numerator: number, denominator: number): number {
  if (!Number.isFinite(denominator) || denominator <= 0) return 0;
  return Math.round(clampPercentage((numerator / denominator) * 100) * 10) / 10;
}

export function dateInTimezone(
  date: Date = new Date(),
  timezone = DEFAULT_TIMEZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function isDayReleased(
  day: Pick<ChallengeDay, "is_published" | "release_date"> | null,
  today: string,
): boolean {
  if (!day?.is_published) return false;
  return !day.release_date || day.release_date <= today;
}

export function getDayState(
  day: Pick<ChallengeDay, "is_published" | "release_date"> | null,
  progress: Pick<
    DailyProgress,
    "completed" | "videos_completed" | "watch_time_seconds"
  > | null,
  today: string,
  requiredVideos?: number,
): DayVisualState {
  if (!isDayReleased(day, today)) return "locked";
  if (
    progress?.completed &&
    (!requiredVideos || progress.videos_completed >= requiredVideos)
  ) {
    return "completed";
  }
  if ((progress?.videos_completed ?? 0) > 0 || (progress?.watch_time_seconds ?? 0) > 0) {
    return "in_progress";
  }
  return "available";
}

export function getVideoState(
  progress: Pick<
    VideoProgress,
    "completed" | "watched_seconds" | "completion_percentage"
  > | null,
  threshold = DEFAULT_COMPLETION_THRESHOLD,
): VideoVisualState {
  if (progress?.completed) return "completed";
  if ((progress?.completion_percentage ?? 0) >= threshold) return "eligible";
  if ((progress?.watched_seconds ?? 0) > 0) return "in_progress";
  return "not_started";
}

export function buildDayCards({
  settings,
  days,
  progress,
  now = new Date(),
}: {
  settings: Pick<ChallengeSettings, "total_days" | "videos_per_day" | "timezone">;
  days: ChallengeDay[];
  progress: DailyProgress[];
  now?: Date;
}): ChallengeDayCard[] {
  const totalDays = Math.max(1, settings.total_days || DEFAULT_TOTAL_DAYS);
  const today = dateInTimezone(now, settings.timezone || DEFAULT_TIMEZONE);
  const dayMap = new Map(days.map((day) => [day.day_number, day]));
  const progressMap = new Map(
    progress.map((item) => [item.challenge_day_id, item]),
  );

  return Array.from({ length: totalDays }, (_, index) => {
    const dayNumber = index + 1;
    const day = dayMap.get(dayNumber) ?? null;
    const dayProgress = day ? progressMap.get(day.id) ?? null : null;

    return {
      dayNumber,
      day,
      progress: dayProgress,
      state: getDayState(day, dayProgress, today, settings.videos_per_day),
    };
  });
}

export function chooseFocusDay(days: ChallengeDayCard[]): ChallengeDayCard | null {
  const available = days.filter((day) => day.state !== "locked");
  if (available.length === 0) return null;

  const active =
    available.find((day) => day.state === "in_progress") ??
    available.find((day) => day.state === "available");
  return active ?? available.at(-1) ?? null;
}

export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatWatchTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  if (safeSeconds < 60) return `${safeSeconds} sec`;
  const minutes = Math.round(safeSeconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} hr ${remainder} min` : `${hours} hr`;
}
