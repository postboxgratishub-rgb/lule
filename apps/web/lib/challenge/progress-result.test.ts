import { describe, expect, it } from "vitest";

import { parseProgressRpcResult } from "@/lib/challenge/progress-result";

const response = {
  video_id: "video-1",
  watched_seconds: 90,
  last_position_seconds: 91,
  completion_percentage: 90,
  completion_threshold: 90,
  eligible_to_complete: true,
  completed: false,
  first_started_at: "2026-09-14T00:00:00Z",
  last_watched_at: "2026-09-14T00:02:00Z",
  completed_at: null,
  total_sessions: 1,
  accepted_delta_seconds: 12,
  daily_progress: {
    challenge_day_id: "day-1",
    videos_completed: 0,
    videos_total: 10,
    watch_time_seconds: 90,
    completion_percentage: 0,
    completed: false,
  },
};

describe("progress RPC response validation", () => {
  it("normalizes trusted numeric payload fields", () => {
    expect(parseProgressRpcResult({ ...response, watched_seconds: "90" })).toMatchObject({
      watched_seconds: 90,
      eligible_to_complete: true,
    });
  });

  it("rejects malformed responses before they can enable completion", () => {
    expect(() =>
      parseProgressRpcResult({ ...response, eligible_to_complete: "yes" }),
    ).toThrow("unexpected response");
  });
});
