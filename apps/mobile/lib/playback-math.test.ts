import { describe, expect, it } from "vitest";

import { acceptedPlaybackDelta, completionState, formatPlayerTime, splitHeartbeatSeconds } from "./playback-math";

describe("mobile playback math", () => {
  it("counts normal and 2x playback but ignores seeking", () => {
    expect(acceptedPlaybackDelta({ previousPosition: 10, currentPosition: 11, elapsedWallSeconds: 1 })).toBe(1);
    expect(acceptedPlaybackDelta({ previousPosition: 10, currentPosition: 12, elapsedWallSeconds: 1 })).toBe(2);
    expect(acceptedPlaybackDelta({ previousPosition: 10, currentPosition: 80, elapsedWallSeconds: 1 })).toBe(0);
    expect(acceptedPlaybackDelta({ previousPosition: 10, currentPosition: 4, elapsedWallSeconds: 1 })).toBe(0);
  });

  it("derives every completion state", () => {
    expect(completionState({ watched_seconds: 0, completed: false }, 90)).toBe("not_started");
    expect(completionState({ watched_seconds: 40, completed: false }, 90)).toBe("in_progress");
    expect(completionState({ watched_seconds: 90, completed: false }, 90)).toBe("eligible");
    expect(completionState({ watched_seconds: 1, completed: true }, 90)).toBe("completed");
  });

  it("formats player durations", () => {
    expect(formatPlayerTime(0)).toBe("00:00");
    expect(formatPlayerTime(755)).toBe("12:35");
    expect(formatPlayerTime(3723)).toBe("1:02:03");
  });

  it("splits fullscreen catch-up into server-sized heartbeats", () => {
    expect(splitHeartbeatSeconds(95)).toEqual([30, 30, 30, 5]);
    expect(splitHeartbeatSeconds(0.8)).toEqual([0]);
  });
});
