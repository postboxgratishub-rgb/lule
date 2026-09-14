import type { ProgressRpcResult } from "@/lib/challenge/types";
import {
  appendProgressEvent,
  progressEventKey,
  removeProgressEvent,
  type QueuedProgressEvent,
} from "@/lib/challenge/progress-events";
import { parseProgressRpcResult } from "@/lib/challenge/progress-result";
import { createClient } from "@/lib/supabase/client";

const STORAGE_KEY = "learning-progress-queue-v1";
const QUEUE_EVENT = "learning-progress-queued";

let memoryQueue: QueuedProgressEvent[] = [];
const drainPromises = new Map<string, Promise<ProgressRpcResult[]>>();
const startedSessions = new Set<string>();

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isQueuedProgressEvent(value: unknown): value is QueuedProgressEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Partial<QueuedProgressEvent>;
  return (
    typeof event.videoId === "string" &&
    typeof event.studentId === "string" &&
    typeof event.sessionId === "string" &&
    Number.isInteger(event.sequence) &&
    (event.sequence ?? 0) > 0 &&
    typeof event.positionSeconds === "number" &&
    typeof event.watchedDeltaSeconds === "number" &&
    event.deviceType === "web" &&
    typeof event.isFinal === "boolean" &&
    typeof event.startPositionSeconds === "number" &&
    typeof event.queuedAt === "string"
  );
}

function mergedQueue(...queues: QueuedProgressEvent[][]): QueuedProgressEvent[] {
  const byKey = new Map<string, QueuedProgressEvent>();
  for (const queue of queues) {
    for (const event of queue) byKey.set(progressEventKey(event), event);
  }
  return [...byKey.values()].sort((left, right) => {
    const queuedOrder = left.queuedAt.localeCompare(right.queuedAt);
    return queuedOrder || left.sequence - right.sequence;
  });
}

export function readProgressQueue(): QueuedProgressEvent[] {
  const storage = browserStorage();
  if (!storage) return memoryQueue;

  try {
    const raw = storage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const persisted = Array.isArray(parsed)
      ? parsed.filter(isQueuedProgressEvent)
      : [];
    memoryQueue = mergedQueue(memoryQueue, persisted);
  } catch {
    // Keep the in-memory copy if storage is unavailable or corrupted.
  }
  return memoryQueue;
}

function writeProgressQueue(queue: QueuedProgressEvent[]): void {
  memoryQueue = queue;
  const storage = browserStorage();
  if (!storage) return;
  try {
    if (queue.length === 0) storage.removeItem(STORAGE_KEY);
    else storage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // The in-memory queue still protects progress for this browser session.
  }
}

export function queueProgressEvent(event: QueuedProgressEvent): void {
  writeProgressQueue(appendProgressEvent(readProgressQueue(), event));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(QUEUE_EVENT));
}

async function ensureSessionStarted(event: QueuedProgressEvent): Promise<void> {
  if (startedSessions.has(event.sessionId)) return;
  const supabase = createClient();
  const { error } = await supabase.rpc("start_video_session", {
    p_video_id: event.videoId,
    p_session_id: event.sessionId,
    p_device_type: event.deviceType,
    p_position_seconds: event.startPositionSeconds,
  });
  if (error) throw new Error(error.message);
  startedSessions.add(event.sessionId);
}

export async function startProgressSession({
  videoId,
  sessionId,
  positionSeconds,
}: {
  videoId: string;
  sessionId: string;
  positionSeconds: number;
}): Promise<ProgressRpcResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("start_video_session", {
    p_video_id: videoId,
    p_session_id: sessionId,
    p_device_type: "web",
    p_position_seconds: positionSeconds,
  });
  if (error) throw new Error(error.message);
  startedSessions.add(sessionId);
  return parseProgressRpcResult(data);
}

async function drainQueue(studentId: string): Promise<ProgressRpcResult[]> {
  const results: ProgressRpcResult[] = [];

  while (true) {
    const event = readProgressQueue().find((item) => item.studentId === studentId);
    if (!event) return results;

    await ensureSessionStarted(event);
    const supabase = createClient();
    const { data, error } = await supabase.rpc("record_video_progress", {
      p_video_id: event.videoId,
      p_session_id: event.sessionId,
      p_sequence: event.sequence,
      p_position_seconds: event.positionSeconds,
      p_watched_delta_seconds: event.watchedDeltaSeconds,
      p_device_type: event.deviceType,
      p_is_final: event.isFinal,
    });

    if (error) throw new Error(error.message);
    const result = parseProgressRpcResult(data);
    results.push(result);
    writeProgressQueue(removeProgressEvent(readProgressQueue(), event));
  }
}

export function drainProgressQueue(studentId: string): Promise<ProgressRpcResult[]> {
  const existing = drainPromises.get(studentId);
  if (existing) return existing;

  const pending = drainQueue(studentId).finally(() => {
    drainPromises.delete(studentId);
  });
  drainPromises.set(studentId, pending);
  return pending;
}

export async function markVideoComplete(videoId: string): Promise<ProgressRpcResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("mark_video_complete", {
    p_video_id: videoId,
  });
  if (error) throw new Error(error.message);
  return parseProgressRpcResult(data);
}

export const progressQueueEventName = QUEUE_EVENT;
