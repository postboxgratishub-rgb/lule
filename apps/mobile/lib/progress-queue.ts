import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  recordVideoProgress,
  startVideoSession,
  type ProgressSnapshot,
} from "../services/learning";
import {
  isTerminalProgressQueueError,
  type HeartbeatItem,
  type QueuedProgressItem,
  type StartItem,
} from "./progress-queue-core";

const QUEUE_KEY_PREFIX = "learning-progress-queue-v2";
let operation = Promise.resolve<unknown>(undefined);

function serial<T>(task: () => Promise<T>): Promise<T> {
  const next = operation.then(task, task);
  operation = next.then(() => undefined, () => undefined);
  return next;
}

function storageKey(studentId: string): string {
  return `${QUEUE_KEY_PREFIX}:${studentId}`;
}

function isQueueItem(value: unknown, studentId: string): value is QueuedProgressItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<QueuedProgressItem>;
  return item.studentId === studentId &&
    typeof item.id === "string" &&
    typeof item.videoId === "string" &&
    typeof item.sessionId === "string" &&
    (item.kind === "start" || item.kind === "heartbeat");
}

async function readQueue(studentId: string): Promise<QueuedProgressItem[]> {
  const raw = await AsyncStorage.getItem(storageKey(studentId));
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => isQueueItem(item, studentId))
      : [];
  } catch {
    await AsyncStorage.removeItem(storageKey(studentId));
    return [];
  }
}

async function writeQueue(studentId: string, queue: QueuedProgressItem[]): Promise<void> {
  if (queue.length === 0) {
    await AsyncStorage.removeItem(storageKey(studentId));
    return;
  }
  // Never renumber, merge, or truncate persisted events: the original sequence
  // IDs make retries idempotent even if a prior remote write succeeded just
  // before the local storage update failed.
  await AsyncStorage.setItem(storageKey(studentId), JSON.stringify(queue));
}

async function deliver(item: QueuedProgressItem): Promise<ProgressSnapshot> {
  if (item.kind === "start") {
    return startVideoSession({
      studentId: item.studentId,
      videoId: item.videoId,
      sessionId: item.sessionId,
      positionSeconds: item.positionSeconds,
    });
  }
  return recordVideoProgress({
    studentId: item.studentId,
    videoId: item.videoId,
    sessionId: item.sessionId,
    sequence: item.sequence,
    positionSeconds: item.positionSeconds,
    watchedDeltaSeconds: item.watchedDeltaSeconds,
    isFinal: item.isFinal,
  });
}

async function drainQueue(studentId: string, targetId?: string): Promise<{
  snapshot: ProgressSnapshot | null;
  remaining: QueuedProgressItem[];
}> {
  let queue = await readQueue(studentId);
  let targetSnapshot: ProgressSnapshot | null = null;
  const blockedSessions = new Set<string>();
  const attemptedItems = new Set<string>();
  let pendingWrites = 0;

  const persist = async (): Promise<boolean> => {
    if (pendingWrites === 0) return true;
    try {
      await writeQueue(studentId, queue);
      pendingWrites = 0;
      return true;
    } catch {
      // The queue was durably written before draining began. If rewriting it
      // fails, leave the older idempotent events in storage for a later retry.
      return false;
    }
  };

  while (true) {
    const item = queue.find(
      (candidate) => !attemptedItems.has(candidate.id) && !blockedSessions.has(candidate.sessionId),
    );
    if (!item) break;

    try {
      const snapshot = await deliver(item);
      if (item.id === targetId) targetSnapshot = snapshot;
      queue = queue.filter((candidate) => candidate.id !== item.id);
      pendingWrites += 1;
    } catch (error) {
      if (isTerminalProgressQueueError(error)) {
        // A stale/invalid session can never recover. Remove that session only,
        // allowing every other video to continue synchronizing.
        queue = queue.filter((candidate) => candidate.sessionId !== item.sessionId);
        pendingWrites += 1;
      } else {
        attemptedItems.add(item.id);
        blockedSessions.add(item.sessionId);
      }
    }

    if (pendingWrites >= 25 && !(await persist())) {
      const storedQueue = await readQueue(studentId).catch(() => queue);
      return { snapshot: targetSnapshot, remaining: storedQueue };
    }
  }
  if (!(await persist())) {
    const storedQueue = await readQueue(studentId).catch(() => queue);
    return { snapshot: targetSnapshot, remaining: storedQueue };
  }
  return { snapshot: targetSnapshot, remaining: queue };
}

async function appendAndDrain(item: QueuedProgressItem): Promise<{
  snapshot: ProgressSnapshot | null;
  queued: boolean;
}> {
  const queue = await readQueue(item.studentId);
  if (!queue.some((queued) => queued.id === item.id)) queue.push(item);
  await writeQueue(item.studentId, queue);
  const result = await drainQueue(item.studentId, item.id);
  return {
    snapshot: result.snapshot,
    queued: result.remaining.some((queued) => queued.sessionId === item.sessionId),
  };
}

export function createClientSessionId(): string {
  const nativeUuid = globalThis.crypto?.randomUUID?.();
  if (nativeUuid) return nativeUuid;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function enqueueSessionStart(input: Omit<StartItem, "id" | "kind">) {
  const item: StartItem = {
    ...input,
    kind: "start",
    id: `start:${input.studentId}:${input.sessionId}`,
  };
  return serial(() => appendAndDrain(item));
}

export function enqueueHeartbeat(input: Omit<HeartbeatItem, "id" | "kind">) {
  const item: HeartbeatItem = {
    ...input,
    kind: "heartbeat",
    id: `heartbeat:${input.studentId}:${input.sessionId}:${input.sequence}`,
  };
  return serial(() => appendAndDrain(item));
}

export function flushPendingProgress(studentId: string, sessionId?: string): Promise<number> {
  return serial(async () => {
    const remaining = (await drainQueue(studentId)).remaining;
    return sessionId
      ? remaining.filter((item) => item.sessionId === sessionId).length
      : remaining.length;
  });
}
