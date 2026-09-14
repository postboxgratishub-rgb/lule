export type QueueBase = {
  id: string;
  studentId: string;
  videoId: string;
  sessionId: string;
};

export type StartItem = QueueBase & {
  kind: "start";
  positionSeconds: number;
};

export type HeartbeatItem = QueueBase & {
  kind: "heartbeat";
  sequence: number;
  positionSeconds: number;
  watchedDeltaSeconds: number;
  isFinal: boolean;
};

export type QueuedProgressItem = StartItem | HeartbeatItem;

export function isTerminalProgressQueueError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  // Authentication can recover after a token refresh, sign-in, or account switch.
  // In particular, never discard an old account's queue merely because the new
  // account correctly fails the expected-student guard.
  if (
    /authenticated|authentication|profile|expected[_ -]student|jwt|token|signed?\s*out|session expired/i.test(
      message,
    )
  ) {
    return false;
  }

  return /watch session has already ended|watch session belongs to another video|session_id is already associated with another video|watch session not found|video is not available|session_id is required|device_type is invalid|sequence must be at least|position_seconds (?:must be|exceeds)|watched_delta_seconds must be|invalid input syntax/i.test(
    message,
  );
}
