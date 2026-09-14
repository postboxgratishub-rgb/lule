export const HEARTBEAT_INTERVAL_MS = 12_000;

export function acceptedPlaybackDelta(input: {
  previousPosition: number;
  currentPosition: number;
  elapsedWallSeconds: number;
  maximumPlaybackRate?: number;
}): number {
  const mediaDelta = input.currentPosition - input.previousPosition;
  if (!Number.isFinite(mediaDelta) || mediaDelta <= 0) return 0;

  const elapsed = Math.max(0, input.elapsedWallSeconds);
  const rate = input.maximumPlaybackRate ?? 2;
  // A forward seek creates a jump much larger than elapsed playback and must
  // not count as watched media. A small allowance handles timer jitter.
  const plausibleMaximum = elapsed * rate + 0.75;
  return mediaDelta <= plausibleMaximum ? mediaDelta : 0;
}

export function completionState(progress: {
  watched_seconds: number;
  completed: boolean;
  eligible_to_complete?: boolean;
}, thresholdSeconds: number): "not_started" | "in_progress" | "eligible" | "completed" {
  if (progress.completed) return "completed";
  if (progress.eligible_to_complete || progress.watched_seconds >= thresholdSeconds) return "eligible";
  return progress.watched_seconds > 0 ? "in_progress" : "not_started";
}

export function splitHeartbeatSeconds(totalSeconds: number, maximum = 30): number[] {
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

export function formatPlayerTime(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "00:00";
  const total = Math.floor(value);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
