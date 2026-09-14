import { describe, expect, it } from "vitest";

import {
  acceptedPlaybackDelta,
  appendProgressEvent,
  isTerminalProgressQueueError,
  nextProcessableProgressEvent,
  removeProgressEvent,
  removeProgressSession,
  splitProgressDelta,
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

  it("splits delayed playback into server-sized monotonic batches", () => {
    expect(splitProgressDelta(95)).toEqual([30, 30, 30, 5]);
    expect(splitProgressDelta(0.9)).toEqual([0]);
  });

  it("continues with another video when one session is temporarily blocked", () => {
    const blocked = { ...event, sessionId: "blocked", videoId: "video-blocked" };
    const ready = {
      ...event,
      sessionId: "ready",
      videoId: "video-ready",
      queuedAt: "2026-09-14T00:00:01.000Z",
    };
    const queue = [blocked, ready];

    expect(nextProcessableProgressEvent(queue, event.studentId, new Set(["blocked"]))).toBe(
      ready,
    );
    expect(removeProgressSession(queue, event.studentId, "blocked")).toEqual([ready]);
  });

  it.each([
    "Watch session has already ended",
    "Watch session belongs to another video",
    "Watch session not found; call start_video_session first",
    "Video is not available",
    "position_seconds exceeds video duration",
    "device_type is invalid",
  ])("drops a permanently invalid session after: %s", (message) => {
    expect(isTerminalProgressQueueError(new Error(message))).toBe(true);
  });

  it.each([
    "An authenticated student profile is required",
    "Authenticated student does not match expected_student_id",
    "JWT expired",
    "Failed to fetch",
  ])("retains a queue that can recover after: %s", (message) => {
    expect(isTerminalProgressQueueError(new Error(message))).toBe(false);
  });
});
