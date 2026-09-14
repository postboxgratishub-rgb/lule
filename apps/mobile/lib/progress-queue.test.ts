import { describe, expect, it } from "vitest";

import {
  isTerminalProgressQueueError,
  terminalFailureAffectsTarget,
  type QueuedProgressItem,
} from "./progress-queue-core";

describe("mobile progress queue error handling", () => {
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

describe("mobile progress queue target failure propagation", () => {
  const queue: QueuedProgressItem[] = [
    {
      id: "start:student-a:session-a",
      kind: "start",
      studentId: "student-a",
      videoId: "video-a",
      sessionId: "session-a",
      positionSeconds: 0,
    },
    {
      id: "heartbeat:student-a:session-a:1",
      kind: "heartbeat",
      studentId: "student-a",
      videoId: "video-a",
      sessionId: "session-a",
      sequence: 1,
      positionSeconds: 12,
      watchedDeltaSeconds: 12,
      isFinal: false,
    },
    {
      id: "start:student-a:session-b",
      kind: "start",
      studentId: "student-a",
      videoId: "video-b",
      sessionId: "session-b",
      positionSeconds: 0,
    },
  ];

  it("propagates a terminal failure that invalidates the current enqueue", () => {
    expect(
      terminalFailureAffectsTarget(
        queue,
        "session-a",
        "heartbeat:student-a:session-a:1",
      ),
    ).toBe(true);
  });

  it("still discards a stale background session without failing another target", () => {
    expect(
      terminalFailureAffectsTarget(
        queue,
        "session-a",
        "start:student-a:session-b",
      ),
    ).toBe(false);
  });
});
