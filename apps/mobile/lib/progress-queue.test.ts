import { describe, expect, it } from "vitest";

import {
  isTerminalProgressQueueError,
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
