import { describe, expect, it } from "vitest";

import { buildDayTiles, dateInTimezone } from "./challenge-state";

const day = (dayNumber: number, releaseDate: string | null = null) => ({
  id: `00000000-0000-4000-8000-${String(dayNumber).padStart(12, "0")}`,
  day_number: dayNumber,
  title: `Day ${dayNumber}`,
  description: null,
  release_date: releaseDate,
  is_published: true,
});

describe("mobile challenge day states", () => {
  it("uses the configured timezone for release dates", () => {
    expect(dateInTimezone("Asia/Kolkata", new Date("2026-09-14T19:30:00Z"))).toBe("2026-09-15");
  });

  it("builds locked, available, active, and complete tiles", () => {
    const days = [day(1), day(2), day(3), day(4, "2026-09-16")];
    const dailyProgress = [
      { challenge_day_id: days[1].id, videos_completed: 1, videos_total: 10, watch_time_seconds: 60, completion_percentage: 10, completed: false, last_activity_at: null },
      { challenge_day_id: days[2].id, videos_completed: 10, videos_total: 10, watch_time_seconds: 600, completion_percentage: 100, completed: true, last_activity_at: null },
    ];
    const tiles = buildDayTiles({ totalDays: 5, days, dailyProgress, timezone: "Asia/Kolkata", now: new Date("2026-09-15T00:00:00Z") });
    expect(tiles.map((tile) => tile.state)).toEqual(["available", "in_progress", "completed", "locked", "locked"]);
  });
});
