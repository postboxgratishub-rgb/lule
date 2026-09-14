export const PROGRESS_HEARTBEAT_SECONDS = 12;
export const MAX_HEARTBEAT_DELTA_SECONDS = 30;
export const MAX_PROGRESS_QUEUE_SIZE = 1_000;

export type ProgressSyncReason =
  | "heartbeat"
  | "pause"
  | "ended"
  | "hidden"
  | "pagehide";

export type QueuedProgressEvent = {
  studentId: string;
  videoId: string;
  sessionId: string;
  sequence: number;
  positionSeconds: number;
  watchedDeltaSeconds: number;
  deviceType: "web";
  isFinal: boolean;
  startPositionSeconds: number;
  reason: ProgressSyncReason;
  queuedAt: string;
};

export function progressEventKey(
  event: Pick<QueuedProgressEvent, "studentId" | "sessionId" | "sequence">,
): string {
  return `${event.studentId}:${event.sessionId}:${event.sequence}`;
}

export function appendProgressEvent(
  queue: QueuedProgressEvent[],
  event: QueuedProgressEvent,
  limit = MAX_PROGRESS_QUEUE_SIZE,
): QueuedProgressEvent[] {
  const key = progressEventKey(event);
  const withoutDuplicate = queue.filter(
    (queued) => progressEventKey(queued) !== key,
  );
  return [...withoutDuplicate, event].slice(-Math.max(1, limit));
}

export function removeProgressEvent(
  queue: QueuedProgressEvent[],
  event: Pick<QueuedProgressEvent, "studentId" | "sessionId" | "sequence">,
): QueuedProgressEvent[] {
  const key = progressEventKey(event);
  return queue.filter((queued) => progressEventKey(queued) !== key);
}

export function removeProgressSession(
  queue: QueuedProgressEvent[],
  studentId: string,
  sessionId: string,
): QueuedProgressEvent[] {
  return queue.filter(
    (queued) =>
      queued.studentId !== studentId || queued.sessionId !== sessionId,
  );
}

export function nextProcessableProgressEvent(
  queue: QueuedProgressEvent[],
  studentId: string,
  blockedSessions: ReadonlySet<string>,
): QueuedProgressEvent | undefined {
  return queue.find(
    (queued) =>
      queued.studentId === studentId && !blockedSessions.has(queued.sessionId),
  );
}

export function isTerminalProgressQueueError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);

  // Authentication failures can recover after a refresh/sign-in. An expected
  // student mismatch specifically means an old account's queue must be retained,
  // never replayed into the newly authenticated account or silently discarded.
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

export function acceptedPlaybackDelta({
  previousMediaSeconds,
  currentMediaSeconds,
  elapsedWallSeconds,
  playbackRate,
}: {
  previousMediaSeconds: number;
  currentMediaSeconds: number;
  elapsedWallSeconds: number;
  playbackRate: number;
}): number {
  const mediaDelta = currentMediaSeconds - previousMediaSeconds;
  if (!Number.isFinite(mediaDelta) || mediaDelta <= 0) return 0;

  const safeElapsed = Math.max(0, elapsedWallSeconds);
  const safeRate = Math.min(4, Math.max(0.25, playbackRate || 1));
  // The small tolerance covers infrequent `timeupdate` events without allowing a
  // seek jump to be counted as watched playback. The database applies its own cap.
  const maximumPlausibleDelta = safeElapsed * safeRate * 1.35 + 0.75;
  return Math.max(0, Math.min(mediaDelta, maximumPlausibleDelta));
}

export function splitProgressDelta(
  totalSeconds: number,
  maximum = MAX_HEARTBEAT_DELTA_SECONDS,
): number[] {
  let remaining = Math.max(0, Math.floor(totalSeconds));
  if (remaining === 0) return [0];
  const chunks: number[] = [];
  while (remaining > 0) {
    const chunk = Math.min(maximum, remaining);
    chunks.push(chunk);
    remaining -= chunk;
  }
  return chunks;
}
