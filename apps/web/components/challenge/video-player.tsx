"use client";

import Hls from "hls.js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { ProgressBar } from "@/components/challenge/progress-bar";
import { Alert } from "@/components/ui/alert";
import { Button, buttonClassName } from "@/components/ui/button";
import {
  acceptedPlaybackDelta,
  PROGRESS_HEARTBEAT_SECONDS,
  splitProgressDelta,
  type ProgressSyncReason,
} from "@/lib/challenge/progress-events";
import {
  drainProgressQueue,
  markVideoComplete,
  queueProgressEvent,
  startProgressSession,
} from "@/lib/challenge/progress-sync";
import { formatDuration } from "@/lib/challenge/logic";
import type { ProgressRpcResult } from "@/lib/challenge/types";
import { resolveVideoSource } from "@/lib/challenge/video-source";
import type { ChallengeDay, Video, VideoProgress } from "@/lib/database.types";

type SyncStatus = "synced" | "syncing" | "queued";

type SessionState = {
  id: string;
  sequence: number;
  startPosition: number;
  lastQueuedPosition: number;
  startAttempted: boolean;
  finalized: boolean;
};

type VerifiedProgress = {
  watchedSeconds: number;
  positionSeconds: number;
  percentage: number;
  threshold: number;
  eligible: boolean;
  completed: boolean;
};

function newSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function friendlyProgressError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Progress could not be synced.";
  if (/network|fetch|offline|connection/i.test(message)) {
    return "You appear to be offline. Progress is saved on this device and will retry automatically.";
  }
  if (/eligible|threshold|watch/i.test(message)) {
    return "The server has not verified enough watch time yet. Keep watching, then try again.";
  }
  return message;
}

function initialVerifiedProgress(
  progress: VideoProgress | null,
  threshold: number,
): VerifiedProgress {
  const completionPercentage = Number(progress?.completion_percentage ?? 0);
  return {
    watchedSeconds: Number(progress?.watched_seconds ?? 0),
    positionSeconds: Number(progress?.last_position_seconds ?? 0),
    percentage: completionPercentage,
    threshold,
    eligible: Boolean(progress?.completed || completionPercentage >= threshold),
    completed: Boolean(progress?.completed),
  };
}

export function VideoPlayer({
  day,
  video,
  initialProgress,
  completionThreshold,
  studentId,
  previousHref,
  nextHref,
}: {
  day: ChallengeDay;
  video: Video;
  initialProgress: VideoProgress | null;
  completionThreshold: number;
  studentId: string;
  previousHref: string | null;
  nextHref: string | null;
}) {
  const router = useRouter();
  const source = useMemo(() => resolveVideoSource(video), [video]);
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<SessionState | null>(null);
  const sampleRef = useRef<{ mediaSeconds: number; wallMilliseconds: number } | null>(
    null,
  );
  const pendingDeltaRef = useRef(0);
  const resumeAppliedRef = useRef(false);

  const [verified, setVerified] = useState(() =>
    initialVerifiedProgress(initialProgress, completionThreshold),
  );
  const [currentTime, setCurrentTime] = useState(
    Number(initialProgress?.last_position_seconds ?? 0),
  );
  const [duration, setDuration] = useState(Math.max(0, video.duration_seconds));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaError, setMediaError] = useState<string | null>(source.error ?? null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("synced");
  const [pendingSeconds, setPendingSeconds] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);

  const applyResult = useCallback(
    (result: ProgressRpcResult) => {
      if (result.video_id !== video.id) return;
      setVerified({
        watchedSeconds: result.watched_seconds,
        positionSeconds: result.last_position_seconds,
        percentage: result.completion_percentage,
        threshold: result.completion_threshold,
        eligible: result.eligible_to_complete || result.completed,
        completed: result.completed,
      });
      setPendingSeconds(Math.max(0, pendingDeltaRef.current));
      setSyncError(null);
    },
    [video.id],
  );

  useEffect(() => {
    const incoming = initialVerifiedProgress(initialProgress, completionThreshold);
    const timer = window.setTimeout(() => {
      setVerified((current) =>
        incoming.watchedSeconds >= current.watchedSeconds || incoming.completed
          ? incoming
          : current,
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, [completionThreshold, initialProgress]);

  const ensureSession = useCallback((): SessionState => {
    if (!sessionRef.current || sessionRef.current.finalized) {
      const position = Math.min(
        video.duration_seconds,
        videoRef.current?.currentTime ?? verified.positionSeconds,
      );
      sessionRef.current = {
        id: newSessionId(),
        sequence: 0,
        startPosition: position,
        lastQueuedPosition: position,
        startAttempted: false,
        finalized: false,
      };
    }
    return sessionRef.current;
  }, [verified.positionSeconds, video.duration_seconds]);

  const capturePlayback = useCallback((force = false) => {
    const element = videoRef.current;
    if (!element) return;
    const now = performance.now();
    const previous = sampleRef.current;

    if (
      previous &&
      !element.seeking &&
      (force || (!element.paused && document.visibilityState === "visible"))
    ) {
      const delta = acceptedPlaybackDelta({
        previousMediaSeconds: previous.mediaSeconds,
        currentMediaSeconds: element.currentTime,
        elapsedWallSeconds: (now - previous.wallMilliseconds) / 1_000,
        playbackRate: element.playbackRate,
      });
      if (delta > 0) {
        pendingDeltaRef.current += delta;
        setPendingSeconds(pendingDeltaRef.current);
      }
    }

    sampleRef.current = {
      mediaSeconds: element.currentTime,
      wallMilliseconds: now,
    };
    setCurrentTime(element.currentTime);
  }, []);

  const enqueuePending = useCallback(
    (reason: ProgressSyncReason, isFinal: boolean): boolean => {
      const element = videoRef.current;
      const session = sessionRef.current;
      if (!element || !session || session.finalized) return false;

      const delta = Math.max(0, pendingDeltaRef.current);
      const transferableDelta = Math.floor(delta);
      const position = Math.min(
        video.duration_seconds,
        Math.max(0, element.currentTime || 0),
      );
      const positionChanged = Math.abs(position - session.lastQueuedPosition) >= 0.5;
      if (transferableDelta === 0 && !positionChanged && !isFinal) return false;

      const chunks = splitProgressDelta(transferableDelta);
      session.lastQueuedPosition = position;
      pendingDeltaRef.current = isFinal ? 0 : delta - transferableDelta;
      setPendingSeconds(pendingDeltaRef.current);

      for (const [index, watchedDeltaSeconds] of chunks.entries()) {
        const finalChunk = isFinal && index === chunks.length - 1;
        session.sequence += 1;
        queueProgressEvent({
          studentId,
          videoId: video.id,
          sessionId: session.id,
          sequence: session.sequence,
          positionSeconds: Math.round(position * 1_000) / 1_000,
          watchedDeltaSeconds,
          deviceType: "web",
          isFinal: finalChunk,
          startPositionSeconds: Math.round(session.startPosition * 1_000) / 1_000,
          reason,
          queuedAt: new Date().toISOString(),
        });
        if (finalChunk) session.finalized = true;
      }
      setSyncStatus("queued");
      return true;
    },
    [studentId, video.duration_seconds, video.id],
  );

  const syncQueuedProgress = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setSyncStatus("queued");
      setSyncError(
        "You are offline. Progress is saved on this device and will retry automatically.",
      );
      return [] as ProgressRpcResult[];
    }

    setSyncStatus("syncing");
    try {
      const results = await drainProgressQueue(studentId);
      const currentVideoResults = results.filter((result) => result.video_id === video.id);
      const latest = currentVideoResults.at(-1);
      if (latest) applyResult(latest);
      setSyncStatus("synced");
      setSyncError(null);
      return results;
    } catch (error) {
      setSyncStatus("queued");
      setSyncError(friendlyProgressError(error));
      return [] as ProgressRpcResult[];
    }
  }, [applyResult, studentId, video.id]);

  const startSession = useCallback(() => {
    const session = ensureSession();
    if (session.startAttempted) return;
    session.startAttempted = true;
    setSyncStatus("syncing");
    void startProgressSession({
      studentId,
      videoId: video.id,
      sessionId: session.id,
      positionSeconds: session.startPosition,
    })
      .then((result) => {
        applyResult(result);
        setSyncStatus("synced");
      })
      .catch((error) => {
        session.startAttempted = false;
        setSyncStatus("queued");
        setSyncError(friendlyProgressError(error));
      });
  }, [applyResult, ensureSession, studentId, video.id]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !source.url) return;

    setMediaError(source.error ?? null);
    setIsLoading(true);
    if (source.mimeType !== "application/vnd.apple.mpegurl") {
      element.src = source.url;
      element.load();
      return () => {
        element.removeAttribute("src");
        element.load();
      };
    }

    if (element.canPlayType("application/vnd.apple.mpegurl")) {
      element.src = source.url;
      element.load();
      return () => {
        element.removeAttribute("src");
        element.load();
      };
    }

    if (!Hls.isSupported()) {
      const timer = window.setTimeout(() => {
        setIsLoading(false);
        setMediaError("This browser cannot play HLS video streams.");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const hls = new Hls({ enableWorker: true });
    hls.loadSource(source.url);
    hls.attachMedia(element);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      setIsLoading(false);
      setMediaError("The HLS stream could not be loaded. Check the provider playback settings and retry.");
    });

    return () => hls.destroy();
  }, [retryKey, source.error, source.mimeType, source.url]);

  useEffect(() => {
    const heartbeat = window.setInterval(() => {
      const element = videoRef.current;
      if (!element || element.paused || element.ended) return;
      capturePlayback();
      if (enqueuePending("heartbeat", false)) void syncQueuedProgress();
    }, PROGRESS_HEARTBEAT_SECONDS * 1_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        capturePlayback(true);
        if (enqueuePending("hidden", false)) void syncQueuedProgress();
      } else {
        const element = videoRef.current;
        sampleRef.current = element
          ? { mediaSeconds: element.currentTime, wallMilliseconds: performance.now() }
          : null;
        void syncQueuedProgress();
      }
    };

    const onPageHide = () => {
      capturePlayback(true);
      if (enqueuePending("pagehide", true)) void syncQueuedProgress();
    };

    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      capturePlayback(true);
      enqueuePending("pagehide", true);
      void drainProgressQueue(studentId).catch(() => {
        // The queued event remains in local storage for the next mounted page.
      });
    };
  }, [capturePlayback, enqueuePending, studentId, syncQueuedProgress]);

  const handleLoadedMetadata = () => {
    const element = videoRef.current;
    if (!element) return;
    const mediaDuration = Number.isFinite(element.duration)
      ? element.duration
      : video.duration_seconds;
    setDuration(mediaDuration);

    if (!resumeAppliedRef.current && verified.positionSeconds > 0) {
      const resumePosition = Math.min(
        verified.positionSeconds,
        Math.max(0, mediaDuration - 1),
      );
      element.currentTime = resumePosition;
      setCurrentTime(resumePosition);
      resumeAppliedRef.current = true;
    }
    setIsLoading(false);
    setMediaError(null);
  };

  const handlePlay = () => {
    const element = videoRef.current;
    if (!element) return;
    ensureSession();
    sampleRef.current = {
      mediaSeconds: element.currentTime,
      wallMilliseconds: performance.now(),
    };
    setIsPlaying(true);
    setIsLoading(false);
    startSession();
  };

  const handlePause = () => {
    const element = videoRef.current;
    setIsPlaying(false);
    if (!element || element.ended) return;
    capturePlayback(true);
    if (enqueuePending("pause", false)) void syncQueuedProgress();
  };

  const handleEnded = () => {
    setIsPlaying(false);
    capturePlayback(true);
    if (enqueuePending("ended", true)) void syncQueuedProgress();
  };

  const togglePlayback = async () => {
    const element = videoRef.current;
    if (!element || mediaError) return;
    try {
      if (element.paused) await element.play();
      else element.pause();
    } catch {
      setMediaError("Playback could not start. Check the video URL and your connection.");
    }
  };

  const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
    const element = videoRef.current;
    if (!element) return;
    const position = Number(event.target.value);
    sampleRef.current = null;
    element.currentTime = position;
    setCurrentTime(position);
    sampleRef.current = { mediaSeconds: position, wallMilliseconds: performance.now() };
  };

  const handleVolume = (event: ChangeEvent<HTMLInputElement>) => {
    const element = videoRef.current;
    const nextVolume = Number(event.target.value);
    if (element) {
      element.volume = nextVolume;
      element.muted = nextVolume === 0;
    }
    setVolume(nextVolume);
  };

  const handlePlaybackRate = (event: ChangeEvent<HTMLSelectElement>) => {
    capturePlayback(true);
    const element = videoRef.current;
    const rate = Number(event.target.value);
    if (element) element.playbackRate = rate;
    setPlaybackRate(rate);
    if (element) {
      sampleRef.current = {
        mediaSeconds: element.currentTime,
        wallMilliseconds: performance.now(),
      };
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch {
      setMediaError("Fullscreen is not available in this browser.");
    }
  };

  const retryPlayback = () => {
    setMediaError(source.error ?? null);
    setIsLoading(true);
    setRetryKey((value) => value + 1);
  };

  const watchAgain = async () => {
    const element = videoRef.current;
    if (!element) return;
    sessionRef.current = null;
    sampleRef.current = null;
    element.currentTime = 0;
    setCurrentTime(0);
    try {
      await element.play();
    } catch {
      setMediaError("Playback could not restart. Please try again.");
    }
  };

  const completeVideo = async () => {
    if (!verified.eligible || verified.completed) return;
    setIsCompleting(true);
    setCompletionMessage(null);
    setSyncError(null);
    capturePlayback(true);
    enqueuePending("pause", false);
    await syncQueuedProgress();

    try {
      const result = await markVideoComplete(video.id, studentId);
      applyResult(result);
      setCompletionMessage("Video completed. Your daily progress is up to date.");
      router.refresh();
    } catch (error) {
      setSyncError(friendlyProgressError(error));
    } finally {
      setIsCompleting(false);
    }
  };

  const displayDuration = duration || video.duration_seconds;
  const remainingThreshold = Math.max(0, verified.threshold - verified.percentage);

  return (
    <div className="space-y-6">
      <section
        ref={playerRef}
        className="overflow-hidden rounded-3xl bg-slate-950 shadow-2xl ring-1 ring-black/10 fullscreen:flex fullscreen:h-screen fullscreen:flex-col fullscreen:justify-center fullscreen:rounded-none"
        aria-label={`${video.title} video player`}
      >
        <div className="relative aspect-video w-full bg-black">
          {source.url ? (
            <video
              key={`${source.url}-${retryKey}`}
              ref={videoRef}
              className="h-full w-full object-contain"
              poster={video.thumbnail_url ?? undefined}
              preload="metadata"
              playsInline
              onLoadStart={() => setIsLoading(true)}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={() => setIsLoading(false)}
              onWaiting={() => setIsLoading(true)}
              onPlaying={() => setIsLoading(false)}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
              onTimeUpdate={() => capturePlayback()}
              onSeeking={() => {
                sampleRef.current = null;
              }}
              onSeeked={() => {
                const element = videoRef.current;
                if (element) {
                  sampleRef.current = {
                    mediaSeconds: element.currentTime,
                    wallMilliseconds: performance.now(),
                  };
                  setCurrentTime(element.currentTime);
                }
              }}
              onError={() => {
                setIsLoading(false);
                setMediaError(
                  source.mimeType === "application/vnd.apple.mpegurl"
                    ? "The configured HLS stream could not be loaded. Check the provider settings or retry."
                    : "The video could not be loaded. Check your connection or ask an administrator to verify its URL.",
                );
              }}
            />
          ) : null}

          {!mediaError && isLoading ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/45 text-white">
              <div className="flex flex-col items-center gap-3">
                <span className="size-9 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span className="text-sm font-semibold">Loading video…</span>
              </div>
            </div>
          ) : null}

          {!mediaError && !isLoading && !isPlaying ? (
            <button
              type="button"
              onClick={() => void togglePlayback()}
              className="absolute inset-0 grid place-items-center bg-black/15 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-white"
              aria-label={currentTime > 0 ? "Continue video" : "Play video"}
            >
              <span className="grid size-16 place-items-center rounded-full bg-white/95 pl-1 text-2xl text-brand-700 shadow-xl">
                ▶
              </span>
            </button>
          ) : null}

          {mediaError ? (
            <div className="absolute inset-0 grid place-items-center bg-slate-950 px-6 text-center text-white">
              <div className="max-w-lg">
                <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-rose-500/15 text-xl text-rose-200">!</div>
                <p className="mt-4 text-base font-bold">Video unavailable</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{mediaError}</p>
                <Button
                  variant="secondary"
                  className="mt-5 border-white/15 bg-white/10 text-white hover:bg-white/15"
                  onClick={retryPlayback}
                >
                  Retry video
                </Button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-3 bg-slate-900 px-4 py-4 text-white sm:px-5">
          <div className="flex items-center gap-3">
            <span className="w-11 text-xs font-medium tabular-nums text-slate-300">
              {formatDuration(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={Math.max(1, displayDuration)}
              step={0.1}
              value={Math.min(currentTime, Math.max(1, displayDuration))}
              onChange={handleSeek}
              className="video-range h-2 min-w-0 flex-1 cursor-pointer accent-indigo-400"
              aria-label="Video position"
            />
            <span className="w-11 text-right text-xs font-medium tabular-nums text-slate-300">
              {formatDuration(displayDuration)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => void togglePlayback()}
              disabled={Boolean(mediaError)}
              className="grid size-10 place-items-center rounded-xl bg-white/10 text-sm font-bold transition-colors hover:bg-white/20 disabled:opacity-40"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? "Ⅱ" : "▶"}
            </button>
            <label className="flex min-h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-xs text-slate-300">
              <span aria-hidden="true">{volume === 0 ? "🔇" : "🔊"}</span>
              <span className="sr-only">Volume</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={volume}
                onChange={handleVolume}
                className="w-20 accent-indigo-400"
                aria-label="Volume"
              />
            </label>
            <label className="flex min-h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-xs text-slate-300">
              <span>Speed</span>
              <select
                value={playbackRate}
                onChange={handlePlaybackRate}
                className="rounded-lg border-0 bg-slate-800 px-2 py-1 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Playback speed"
              >
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <option key={rate} value={rate}>{rate}×</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="ml-auto min-h-10 rounded-xl bg-white/10 px-3 text-xs font-bold transition-colors hover:bg-white/20"
            >
              Fullscreen
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-600">
              Day {day.day_number} · Video {video.video_number}
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {video.title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {video.description || "Watch this lesson and mark it complete after your verified progress reaches the required threshold."}
            </p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold capitalize text-slate-600">
            {source.provider.replaceAll("_", " ")}
          </span>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Server-verified progress
                </p>
                <p className="mt-1 text-2xl font-black text-ink">
                  {Math.round(verified.percentage)}%
                </p>
              </div>
              <p className="text-xs text-slate-500">
                {formatDuration(verified.watchedSeconds)} verified · {verified.threshold}% required
              </p>
            </div>
            <ProgressBar value={verified.percentage} label="Verified video progress" className="h-2.5" />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span
                className={
                  syncStatus === "synced"
                    ? "font-semibold text-emerald-700"
                    : syncStatus === "syncing"
                      ? "font-semibold text-brand-700"
                      : "font-semibold text-amber-700"
                }
                aria-live="polite"
              >
                {syncStatus === "synced"
                  ? "✓ Progress synced"
                  : syncStatus === "syncing"
                    ? "Syncing progress…"
                    : "Saved on this device · waiting to sync"}
              </span>
              {pendingSeconds >= 0.5 ? (
                <span className="text-slate-400">
                  {Math.floor(pendingSeconds)} sec waiting for the next heartbeat
                </span>
              ) : null}
            </div>
          </div>

          <div className="lg:w-64">
            {verified.completed ? (
              <div className="grid gap-2">
                <div className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-50 px-4 text-sm font-bold text-emerald-700">
                  ✓ Completed
                </div>
                <Button variant="secondary" onClick={() => void watchAgain()}>
                  Watch again
                </Button>
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={!verified.eligible || isCompleting}
                onClick={() => void completeVideo()}
              >
                {isCompleting ? "Verifying…" : "✓ Mark as complete"}
              </Button>
            )}
          </div>
        </div>

        {!verified.completed && !verified.eligible ? (
          <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Watch at least {verified.threshold}% to complete this video. You need
            approximately {Math.ceil(remainingThreshold)}% more verified progress.
          </p>
        ) : null}
        {syncError ? <div className="mt-4"><Alert variant="error">{syncError}</Alert></div> : null}
        {completionMessage ? (
          <div className="mt-4"><Alert variant="success">{completionMessage}</Alert></div>
        ) : null}
      </section>

      <nav className="flex items-center justify-between gap-3" aria-label="Video navigation">
        {previousHref ? (
          <Link href={previousHref} className={buttonClassName("secondary")}>
            ← Previous video
          </Link>
        ) : <span />}
        {nextHref ? (
          <Link href={nextHref} className={buttonClassName("primary")}>
            Next video →
          </Link>
        ) : (
          <Link href={`/challenge/${day.day_number}`} className={buttonClassName("primary")}>
            Back to Day {day.day_number}
          </Link>
        )}
      </nav>
    </div>
  );
}
