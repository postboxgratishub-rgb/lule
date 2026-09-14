import { describe, expect, it } from "vitest";

import {
  acceptedPlaybackDelta,
  appendProgressEvent,
  removeProgressEvent,
  type QueuedProgressEvent,
} from "@/lib/challenge/progress-events";

const event: QueuedProgressEvent = {
  studentId: "student-1",
  videoId: "video-1",
  sessionId: "session-1",
  sequence: 1,
  positionSeconds: 12,
  watchedDeltaSeconds: 12,
  deviceType: "web",
  isFinal: false,
  startPositionSeconds: 0,
  reason: "heartbeat",
  queuedAt: "2026-09-14T00:00:00.000Z",
};

describe("playback progress events", () => {
  it("does not count seek jumps as watched time", () => {
    expect(
      acceptedPlaybackDelta({
        previousMediaSeconds: 10,
        currentMediaSeconds: 80,
        elapsedWallSeconds: 1,
        playbackRate: 1,
      }),
    ).toBeLessThan(3);
    expect(
      acceptedPlaybackDelta({
        previousMediaSeconds: 20,
        currentMediaSeconds: 19,
        elapsedWallSeconds: 1,
        playbackRate: 1,
      }),
    ).toBe(0);
  });

  it("allows legitimate playback-rate-adjusted progression", () => {
    expect(
      acceptedPlaybackDelta({
        previousMediaSeconds: 10,
        currentMediaSeconds: 12,
        elapsedWallSeconds: 1,
        playbackRate: 2,
      }),
    ).toBe(2);
  });

  it("deduplicates session sequences and acknowledges one event only", () => {
    const replacement = { ...event, positionSeconds: 13 };
    const queue = appendProgressEvent(appendProgressEvent([], event), replacement);
    expect(queue).toEqual([replacement]);
    expect(removeProgressEvent(queue, event)).toEqual([]);
  });
});
