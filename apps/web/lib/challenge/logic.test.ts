import { describe, expect, it } from "vitest";

import type {
  ChallengeDay,
  ChallengeSettings,
  DailyProgress,
  VideoProgress,
} from "@/lib/database.types";
import {
  buildDayCards,
  chooseFocusDay,
  dateInTimezone,
  formatDuration,
  getDayState,
  getVideoState,
  percentage,
} from "@/lib/challenge/logic";

const day: ChallengeDay = {
  id: "day-1",
  day_number: 1,
  title: "Foundations",
  description: null,
  release_date: "2026-09-14",
  is_published: true,
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const settings: ChallengeSettings = {
  id: 1,
  program_name: "100 Days",
  organization_name: "Learning Org",
  challenge_start_date: null,
  challenge_end_date: null,
  timezone: "Asia/Kolkata",
  total_days: 3,
  videos_per_day: 10,
  video_completion_threshold: 90,
  minimum_completion: 100,
  certificate_rules: {},
  streak_rules: {},
  notification_settings: {},
  created_at: "2026-09-01T00:00:00Z",
  updated_at: "2026-09-01T00:00:00Z",
};

const progress: DailyProgress = {
  id: "progress-1",
  student_id: "student-1",
  challenge_day_id: day.id,
  videos_completed: 2,
  videos_total: 10,
  watch_time_seconds: 420,
  completion_percentage: 20,
  completed: false,
  started_at: "2026-09-14T03:00:00Z",
  last_activity_at: "2026-09-14T04:00:00Z",
  completed_at: null,
  created_at: "2026-09-14T03:00:00Z",
  updated_at: "2026-09-14T04:00:00Z",
};

describe("challenge state logic", () => {
  it("uses the configured timezone for release-day comparisons", () => {
    expect(dateInTimezone(new Date("2026-09-13T20:00:00Z"), "Asia/Kolkata")).toBe(
      "2026-09-14",
    );
    expect(getDayState(day, null, "2026-09-13")).toBe("locked");
    expect(getDayState(day, null, "2026-09-14")).toBe("available");
  });

  it("derives all day and video completion states from persisted progress", () => {
    expect(getDayState(day, progress, "2026-09-14")).toBe("in_progress");
    expect(getDayState(day, { ...progress, completed: true }, "2026-09-14")).toBe(
      "completed",
    );
    expect(getVideoState(null, 90)).toBe("not_started");
    expect(
      getVideoState({ watched_seconds: 12, completion_percentage: 12, completed: false }, 90),
    ).toBe("in_progress");
    expect(
      getVideoState({ watched_seconds: 90, completion_percentage: 90, completed: false }, 90),
    ).toBe("eligible");
    expect(
      getVideoState({ watched_seconds: 90, completion_percentage: 90, completed: true }, 90),
    ).toBe("completed");
  });

  it("generates every configured slot without exposing missing unpublished days", () => {
    const cards = buildDayCards({
      settings,
      days: [day],
      progress: [progress],
      now: new Date("2026-09-14T06:00:00Z"),
    });

    expect(cards).toHaveLength(3);
    expect(cards.map((card) => card.state)).toEqual([
      "in_progress",
      "locked",
      "locked",
    ]);
    expect(cards[1]?.day).toBeNull();
    expect(
      chooseFocusDay([
        { ...cards[0]!, state: "available" },
        { ...cards[1]!, state: "in_progress" },
      ])?.dayNumber,
    ).toBe(2);
  });

  it("handles percentages and display duration safely", () => {
    expect(percentage(9, 10)).toBe(90);
    expect(percentage(1, 0)).toBe(0);
    expect(formatDuration(755)).toBe("12:35");
    expect(formatDuration(3_725)).toBe("1:02:05");
  });
});

// Compile-time guard: completion-state inputs must remain compatible with the
// generated progress row even if the database types are refreshed later.
const _progressShape: Pick<
  VideoProgress,
  "completed" | "watched_seconds" | "completion_percentage"
> = { completed: false, watched_seconds: 0, completion_percentage: 0 };
void _progressShape;
