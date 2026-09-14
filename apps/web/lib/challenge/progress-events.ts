export const PROGRESS_HEARTBEAT_SECONDS = 12;
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
