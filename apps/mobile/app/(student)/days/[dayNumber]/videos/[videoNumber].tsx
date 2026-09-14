/* eslint-disable react-hooks/immutability -- expo-video exposes an intentionally imperative player API. */
import { useEvent, useEventListener } from "expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Href, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView, type VideoSource } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";

import { CenteredState, Notice, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { acceptedPlaybackDelta, completionState, formatPlayerTime, HEARTBEAT_INTERVAL_MS, splitHeartbeatSeconds } from "@/lib/playback-math";
import { needsNewWatchSession, shouldFinalizeForAppState } from "@/lib/player-lifecycle";
import { createClientSessionId, enqueueHeartbeat, enqueueSessionStart, flushPendingProgress } from "@/lib/progress-queue";
import { isTerminalProgressQueueError } from "@/lib/progress-queue-core";
import { supabase } from "@/lib/supabase";
import { resolveVideoUri } from "@/lib/video-source";
import { completeVideo, getDayContent, type LearningVideo, type ProgressSnapshot, type VideoProgress } from "@/services/learning";
import { getMyProfile } from "@/services/profile";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];
const VOLUMES = [0, 0.25, 0.5, 0.75, 1];

type ProgressWriteResult = {
  snapshot: ProgressSnapshot | null;
  queued: boolean;
};

const EMPTY_PROGRESS_WRITE: ProgressWriteResult = {
  snapshot: null,
  queued: false,
};

function emptySnapshot(videoId: string, progress: VideoProgress | undefined, threshold: number): ProgressSnapshot {
  return {
    video_id: videoId,
    watched_seconds: progress?.watched_seconds ?? 0,
    last_position_seconds: progress?.last_position_seconds ?? 0,
    completion_percentage: progress?.completion_percentage ?? 0,
    completed: progress?.completed ?? false,
    first_started_at: progress?.first_started_at ?? null,
    last_watched_at: progress?.last_watched_at ?? null,
    completed_at: progress?.completed_at ?? null,
    total_sessions: progress?.total_sessions ?? 0,
    completion_threshold: threshold,
    eligible_to_complete: progress?.completed || (progress?.completion_percentage ?? 0) >= threshold,
    daily_progress: null,
  };
}

function ControlButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} className={`min-h-11 min-w-11 items-center justify-center rounded-xl px-3 ${disabled ? "bg-slate-700 opacity-40" : "bg-slate-700 active:bg-slate-600"}`}>
      <Text className="text-sm font-black text-white">{label}</Text>
    </Pressable>
  );
}

function TrackedPlayer({
  dayNumber,
  video,
  videos,
  initialProgress,
  threshold,
  studentId,
  usingCachedContent,
}: {
  dayNumber: number;
  video: LearningVideo;
  videos: LearningVideo[];
  initialProgress?: VideoProgress;
  threshold: number;
  studentId: string;
  usingCachedContent: boolean;
}) {
  const queryClient = useQueryClient();
  const uri = resolveVideoUri(video);
  const initialSnapshot = useMemo(() => emptySnapshot(video.id, initialProgress, threshold), [initialProgress, threshold, video.id]);
  const [progress, setProgress] = useState(initialSnapshot);
  const [currentTime, setCurrentTime] = useState(initialSnapshot.last_position_seconds);
  const [queued, setQueued] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [mediaRetryError, setMediaRetryError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [progressWidth, setProgressWidth] = useState(1);
  const [startingPosition] = useState(() => initialSnapshot.last_position_seconds);
  const sessionId = useRef(createClientSessionId());
  const sequence = useRef(0);
  const pendingWatched = useRef(0);
  const lastPosition = useRef(startingPosition);
  const lastTickAt = useRef(0);
  const isPlayingRef = useRef(false);
  const sessionStarted = useRef(false);
  const sessionEnded = useRef(true);
  const endingRequested = useRef(false);
  const finalizationVersion = useRef(0);
  const nativeFullscreen = useRef(false);
  const lifecycleOperation = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  const videoView = useRef<VideoView>(null);

  const source = useMemo<VideoSource | null>(() => uri ? {
    uri,
    useCaching: !uri.toLowerCase().includes(".m3u8"),
    metadata: { title: video.title, artist: `Day ${dayNumber}` },
  } : null, [dayNumber, uri, video.title]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.staysActiveInBackground = false;
    instance.timeUpdateEventInterval = 1;
    instance.currentTime = Math.max(0, startingPosition);
  });
  const playingEvent = useEvent(player, "playingChange", { isPlaying: player.playing });
  const statusEvent = useEvent(player, "statusChange", { status: player.status });

  const acceptSnapshot = useCallback((snapshot: ProgressSnapshot | null) => {
    if (!snapshot || !mounted.current) return;
    setProgress(snapshot);
    setSyncError(null);
    const row: VideoProgress = {
      video_id: snapshot.video_id,
      watched_seconds: snapshot.watched_seconds,
      last_position_seconds: snapshot.last_position_seconds,
      completion_percentage: snapshot.completion_percentage,
      completed: snapshot.completed,
      first_started_at: snapshot.first_started_at,
      last_watched_at: snapshot.last_watched_at,
      completed_at: snapshot.completed_at,
      total_sessions: snapshot.total_sessions,
      eligible_to_complete: snapshot.eligible_to_complete,
      completion_threshold: snapshot.completion_threshold,
    };
    queryClient.setQueryData<Awaited<ReturnType<typeof getDayContent>>>(
      ["day-content", dayNumber, studentId],
      (current) => current ? {
        ...current,
        progress: [
          ...current.progress.filter((item) => item.video_id !== snapshot.video_id),
          row,
        ],
      } : current,
    );
  }, [dayNumber, queryClient, studentId]);

  const scheduleLifecycle = useCallback((task: () => Promise<ProgressWriteResult>) => {
    const next = lifecycleOperation.current.then(task, task);
    lifecycleOperation.current = next.then(() => undefined, () => undefined);
    return next;
  }, []);

  const performFlush = useCallback(async (
    isFinal: boolean,
    positionSeconds: number,
  ): Promise<ProgressWriteResult> => {
    if (!sessionStarted.current || sessionEnded.current) return EMPTY_PROGRESS_WRITE;

    const activeSessionId = sessionId.current;
    const accumulated = pendingWatched.current;
    const transferableSeconds = Math.floor(accumulated);
    const chunks = splitHeartbeatSeconds(transferableSeconds);
    let persistedSeconds = 0;
    pendingWatched.current = isFinal ? 0 : accumulated - transferableSeconds;
    if (isFinal) sessionEnded.current = true;

    let lastResult: ProgressWriteResult = EMPTY_PROGRESS_WRITE;
    try {
      // Android pauses JavaScript while the native fullscreen player is open.
      // Split the recovered interval into <=30-second server heartbeats while
      // keeping the complete session transition serialized.
      for (const [index, watchedDeltaSeconds] of chunks.entries()) {
        const isLastChunk = index === chunks.length - 1;
        sequence.current += 1;
        lastResult = await enqueueHeartbeat({
          studentId,
          videoId: video.id,
          sessionId: activeSessionId,
          sequence: sequence.current,
          positionSeconds,
          watchedDeltaSeconds,
          isFinal: isFinal && isLastChunk,
        });
        persistedSeconds += watchedDeltaSeconds;
        if (mounted.current) setQueued(lastResult.queued);
        acceptSnapshot(lastResult.snapshot);
      }
      return lastResult;
    } catch (error) {
      const terminal = isTerminalProgressQueueError(error);
      // Storage failures happen before a segment is safely queued. Restore only
      // the unsaved media time so a later heartbeat can retry it without double
      // counting segments that were already persisted.
      if (terminal) {
        // The server has rejected this watch session permanently. Continuing
        // playback would look successful while every later heartbeat is lost.
        player.pause();
        sessionStarted.current = false;
        sessionEnded.current = true;
      } else {
        pendingWatched.current += Math.max(0, transferableSeconds - persistedSeconds);
        if (isFinal) sessionEnded.current = false;
      }
      if (mounted.current) {
        setQueued(!terminal);
        setSyncError(error instanceof Error ? error.message : "Progress is waiting to sync.");
      }
      return { snapshot: null, queued: !terminal };
    }
  }, [acceptSnapshot, player, studentId, video.id]);

  const flush = useCallback((isFinal = false) => {
    const positionSeconds = Math.max(0, player.currentTime);
    if (!isFinal) {
      return scheduleLifecycle(() => performFlush(false, positionSeconds));
    }

    const version = finalizationVersion.current + 1;
    finalizationVersion.current = version;
    endingRequested.current = true;
    const operation = scheduleLifecycle(() => performFlush(true, positionSeconds));
    return operation.then(
      (result) => {
        if (finalizationVersion.current === version) endingRequested.current = false;
        return result;
      },
      (error) => {
        if (finalizationVersion.current === version) endingRequested.current = false;
        throw error;
      },
    );
  }, [performFlush, player, scheduleLifecycle]);

  const ensureSessionStarted = useCallback((positionSeconds: number) => {
    const normalizedPosition = Math.max(0, positionSeconds);
    const finalizationAtRequest = finalizationVersion.current;
    return scheduleLifecycle(async () => {
      // A newer finalization request means this Play/Fullscreen request became
      // stale while it was waiting (for example, the app backgrounded). Do not
      // create a session that would immediately be orphaned.
      if (
        endingRequested.current &&
        finalizationVersion.current !== finalizationAtRequest
      ) {
        return EMPTY_PROGRESS_WRITE;
      }
      if (finalizationVersion.current === finalizationAtRequest) {
        endingRequested.current = false;
      }
      if (
        !needsNewWatchSession({
          sessionStarted: sessionStarted.current,
          sessionEnded: sessionEnded.current,
          endingRequested: endingRequested.current,
        })
      ) {
        return EMPTY_PROGRESS_WRITE;
      }
      sessionId.current = createClientSessionId();
      sequence.current = 0;
      sessionStarted.current = true;
      sessionEnded.current = false;
      lastPosition.current = normalizedPosition;
      lastTickAt.current = Date.now();
      try {
        const result = await enqueueSessionStart({
          studentId,
          videoId: video.id,
          sessionId: sessionId.current,
          positionSeconds: normalizedPosition,
        });
        if (mounted.current) setQueued(result.queued);
        acceptSnapshot(result.snapshot);
        return result;
      } catch (error) {
        sessionStarted.current = false;
        sessionEnded.current = true;
        throw error;
      }
    });
  }, [acceptSnapshot, scheduleLifecycle, studentId, video.id]);

  const reconcileFullscreenProgress = useCallback(() => {
    const now = Date.now();
    const nextPosition = Math.max(0, player.currentTime);
    pendingWatched.current += acceptedPlaybackDelta({
      previousPosition: lastPosition.current,
      currentPosition: nextPosition,
      elapsedWallSeconds: (now - lastTickAt.current) / 1000,
    });
    lastPosition.current = nextPosition;
    lastTickAt.current = now;
    isPlayingRef.current = player.playing;
    if (mounted.current) setCurrentTime(nextPosition);
  }, [player]);

  const handleFullscreenExit = useCallback(() => {
    reconcileFullscreenProgress();
    nativeFullscreen.current = false;
    void flush(false);
  }, [flush, reconcileFullscreenProgress]);

  useEffect(() => {
    mounted.current = true;
    const timer = setInterval(() => {
      if (pendingWatched.current > 0) {
        void flush(false);
        return;
      }
      void flushPendingProgress(studentId)
        .then((remaining) => {
          if (mounted.current) setQueued(remaining > 0);
        })
        .catch(() => {
          if (mounted.current) setQueued(true);
        });
    }, HEARTBEAT_INTERVAL_MS);
    return () => {
      mounted.current = false;
      clearInterval(timer);
      void flush(true);
    };
  }, [flush, studentId]);

  useEffect(() => {
    if (
      initialProgress &&
      (
        (initialProgress.completed && !progress.completed) ||
        initialProgress.watched_seconds > progress.watched_seconds
      )
    ) {
      const timer = setTimeout(() => setProgress(emptySnapshot(video.id, initialProgress, threshold)), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [initialProgress, progress.completed, progress.last_watched_at, progress.watched_seconds, threshold, video.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void flushPendingProgress(studentId)
          .then((remaining) => {
            if (mounted.current) setQueued(remaining > 0);
          })
          .catch(() => {
            if (mounted.current) setQueued(true);
          });
      } else if (
        shouldFinalizeForAppState(
          state,
          Platform.OS === "android" && nativeFullscreen.current,
        )
      ) {
        player.pause();
        void flush(true);
      }
    });
    return () => subscription.remove();
  }, [flush, player, studentId]);

  useFocusEffect(useCallback(() => {
    void flushPendingProgress(studentId)
      .then((remaining) => {
        if (mounted.current) setQueued(remaining > 0);
      })
      .catch(() => {
        if (mounted.current) setQueued(true);
      });
    return () => {
      player.pause();
      void flush(true);
    };
  }, [flush, player, studentId]));

  useEffect(() => {
    const channel = supabase
      .channel(`mobile-video-progress-${video.id}-${studentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_progress", filter: `student_id=eq.${studentId}` },
        (payload) => {
          const row = payload.new as VideoProgress & { student_id?: string };
          if (row.student_id && row.student_id !== studentId) return;
          if (row.video_id !== video.id) return;
          const incoming = emptySnapshot(video.id, row, threshold);
          setProgress((current) => {
            if (current.completed && !incoming.completed) return current;
            return incoming.completed ||
              incoming.watched_seconds > current.watched_seconds ||
              (
                incoming.watched_seconds === current.watched_seconds &&
                incoming.last_position_seconds > current.last_position_seconds
              )
              ? incoming
              : current;
          });
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [studentId, threshold, video.id]);

  useEventListener(player, "timeUpdate", ({ currentTime: nextPosition }) => {
    // Android suspends JavaScript in its native fullscreen Activity. Ignore any
    // queued events until onFullscreenExit reconciles the full interval once.
    if (Platform.OS === "android" && nativeFullscreen.current) return;
    const now = Date.now();
    const elapsedWallSeconds = (now - lastTickAt.current) / 1000;
    if (isPlayingRef.current) {
      pendingWatched.current += acceptedPlaybackDelta({
        previousPosition: lastPosition.current,
        currentPosition: nextPosition,
        elapsedWallSeconds,
      });
    }
    lastPosition.current = nextPosition;
    lastTickAt.current = now;
    if (mounted.current) setCurrentTime(nextPosition);
  });

  useEventListener(player, "playingChange", ({ isPlaying }) => {
    isPlayingRef.current = isPlaying;
    if (Platform.OS === "android" && nativeFullscreen.current) return;
    lastTickAt.current = Date.now();
    lastPosition.current = player.currentTime;
    if (!isPlaying) void flush(false);
  });

  useEventListener(player, "playToEnd", () => {
    if (nativeFullscreen.current) reconcileFullscreenProgress();
    void flush(true);
  });

  const completion = useMutation({
    mutationFn: async () => {
      await flush(false);
      const remaining = await flushPendingProgress(studentId, sessionId.current);
      if (remaining > 0) throw new Error("Reconnect so your latest watch time can be verified.");
      return completeVideo(video.id, studentId);
    },
    onSuccess: (snapshot) => {
      acceptSnapshot(snapshot);
    },
  });

  const duration = Math.max(1, player.duration || video.duration_seconds || 1);
  const playerPercent = Math.min(100, Math.max(0, (currentTime / duration) * 100));
  const state = completionState(progress, (threshold / 100) * video.duration_seconds);
  const eligible = progress.completed || progress.eligible_to_complete || progress.completion_percentage >= threshold;
  const currentIndex = videos.findIndex((item) => item.id === video.id);
  const previous = currentIndex > 0 ? videos[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  const seek = (event: GestureResponderEvent) => {
    const ratio = Math.min(1, Math.max(0, event.nativeEvent.locationX / progressWidth));
    const nextPosition = ratio * duration;
    player.currentTime = nextPosition;
    lastPosition.current = nextPosition;
    lastTickAt.current = Date.now();
    setCurrentTime(nextPosition);
  };

  const cycleSpeed = () => {
    const index = SPEEDS.indexOf(speed);
    const nextSpeed = SPEEDS[(index + 1) % SPEEDS.length];
    player.playbackRate = nextSpeed;
    setSpeed(nextSpeed);
  };

  const cycleVolume = () => {
    const index = VOLUMES.findIndex((candidate) => Math.abs(candidate - volume) < 0.01);
    const nextVolume = VOLUMES[(index + 1) % VOLUMES.length];
    player.volume = nextVolume;
    player.muted = nextVolume === 0;
    setVolume(nextVolume);
  };

  const navigateTo = (target: LearningVideo | null) => {
    if (!target) return;
    player.pause();
    void flush(true);
    router.replace(`/days/${dayNumber}/videos/${target.video_number}` as Href);
  };

  const startPlayback = async (position?: number) => {
    if (typeof position === "number") {
      player.currentTime = position;
      setCurrentTime(position);
    }
    try {
      if (
        needsNewWatchSession({
          sessionStarted: sessionStarted.current,
          sessionEnded: sessionEnded.current,
          endingRequested: endingRequested.current,
        })
      ) {
        await ensureSessionStarted(player.currentTime);
      }
      if (
        !sessionStarted.current ||
        sessionEnded.current ||
        endingRequested.current
      ) {
        return;
      }
      setSyncError(null);
      player.play();
    } catch (error) {
      setQueued(!isTerminalProgressQueueError(error));
      setSyncError(error instanceof Error ? error.message : "Playback progress could not be initialized.");
    }
  };

  const enterNativeFullscreen = async () => {
    try {
      if (
        needsNewWatchSession({
          sessionStarted: sessionStarted.current,
          sessionEnded: sessionEnded.current,
          endingRequested: endingRequested.current,
        })
      ) {
        await ensureSessionStarted(player.currentTime);
      }
      if (
        !sessionStarted.current ||
        sessionEnded.current ||
        endingRequested.current
      ) {
        return;
      }

      setSyncError(null);
      lastPosition.current = player.currentTime;
      lastTickAt.current = Date.now();
      // Set this before invoking the native method: Android backgrounds the
      // React host as it opens FullscreenPlayerActivity.
      nativeFullscreen.current = true;
      await videoView.current?.enterFullscreen();
    } catch (error) {
      nativeFullscreen.current = false;
      setQueued(!isTerminalProgressQueueError(error));
      setSyncError(error instanceof Error ? error.message : "Fullscreen playback could not be initialized.");
    }
  };

  const retryMedia = async () => {
    if (!source) return;
    setMediaRetryError(null);
    try {
      const resumePosition = currentTime;
      await player.replaceAsync(source);
      player.currentTime = Math.min(resumePosition, Math.max(0, player.duration || video.duration_seconds));
    } catch {
      setMediaRetryError("The video still could not load. Check your connection or ask an administrator to verify its source.");
    }
  };

  if (!uri || !source) {
    return <CenteredState title="Video source unavailable" detail="This lesson does not have a playable URL yet. Ask an administrator to check its source settings." action={<PrimaryButton onPress={() => router.back()}>Back to Day {dayNumber}</PrimaryButton>} />;
  }

  return (
    <ScrollView className="flex-1 bg-slate-950" contentContainerStyle={{ paddingBottom: 60 }}>
      <View className="px-4 pt-14">
        <Pressable accessibilityRole="button" onPress={() => { player.pause(); void flush(true); router.back(); }} className="mb-5 self-start rounded-full bg-slate-800 px-4 py-2 active:opacity-70">
          <Text className="font-bold text-white">← Day {dayNumber}</Text>
        </Pressable>
        <Text className="text-xs font-black uppercase tracking-[3px] text-teal-300">Day {dayNumber} · Video {video.video_number}</Text>
        <Text className="mt-3 text-2xl font-black leading-8 text-white">{video.title}</Text>
      </View>

      <View className="mt-5 overflow-hidden bg-black">
        <VideoView
          ref={videoView}
          player={player}
          style={styles.video}
          nativeControls={false}
          contentFit="contain"
          fullscreenOptions={{ enable: true }}
          onFullscreenEnter={() => { nativeFullscreen.current = true; }}
          onFullscreenExit={handleFullscreenExit}
        />
        {statusEvent.status === "loading" ? <View style={styles.playerOverlay}><ActivityIndicator color="white" size="large" /><Text className="mt-3 text-white">Loading video…</Text></View> : null}
        {statusEvent.status === "error" ? (
          <View style={styles.playerOverlay}>
            <Text className="text-center font-bold text-white">The video could not load.</Text>
            <Pressable onPress={() => { void retryMedia(); }} className="mt-4 rounded-xl bg-white px-5 py-3"><Text className="font-black text-slate-950">Retry</Text></Pressable>
            {mediaRetryError ? <Text className="mt-3 text-center text-sm text-red-200">{mediaRetryError}</Text> : null}
          </View>
        ) : null}
      </View>

      <View className="px-4 py-5">
        <Pressable
          accessibilityRole="adjustable"
          accessibilityLabel="Video progress"
          accessibilityValue={{
            min: 0,
            max: Math.round(duration),
            now: Math.round(currentTime),
            text: `${formatPlayerTime(currentTime)} of ${formatPlayerTime(duration)}`,
          }}
          accessibilityActions={[
            { name: "decrement", label: "Rewind 10 seconds" },
            { name: "increment", label: "Forward 10 seconds" },
          ]}
          onAccessibilityAction={(event) => {
            const change = event.nativeEvent.actionName === "increment" ? 10 : -10;
            const nextPosition = Math.min(duration, Math.max(0, player.currentTime + change));
            player.currentTime = nextPosition;
            lastPosition.current = nextPosition;
            lastTickAt.current = Date.now();
            setCurrentTime(nextPosition);
          }}
          onLayout={(event) => setProgressWidth(event.nativeEvent.layout.width)}
          onPress={seek}
          className="h-5 justify-center"
        >
          <View className="h-2 overflow-hidden rounded-full bg-slate-700"><View className="h-full rounded-full bg-teal-400" style={{ width: `${playerPercent}%` }} /></View>
        </Pressable>
        <View className="mt-1 flex-row justify-between"><Text className="text-xs font-semibold text-slate-300">{formatPlayerTime(currentTime)}</Text><Text className="text-xs font-semibold text-slate-300">{formatPlayerTime(duration)}</Text></View>

        <View className="mt-4 flex-row flex-wrap items-center justify-between gap-2">
          <ControlButton label="−10" onPress={() => { player.seekBy(-10); lastPosition.current = player.currentTime; }} />
          <ControlButton label={playingEvent.isPlaying ? "Pause" : "Play"} onPress={() => playingEvent.isPlaying ? player.pause() : void startPlayback()} />
          <ControlButton label="+10" onPress={() => { player.seekBy(10); lastPosition.current = player.currentTime; }} />
          <ControlButton label={`${speed}×`} onPress={cycleSpeed} />
          <ControlButton label={volume === 0 ? "Muted" : `Vol ${Math.round(volume * 100)}%`} onPress={cycleVolume} />
          <ControlButton label="Full" onPress={() => { void enterNativeFullscreen(); }} />
        </View>
      </View>

      <View className="rounded-t-[32px] bg-slate-50 px-5 pb-8 pt-7">
        {usingCachedContent ? <Notice>Playing saved lesson details while the latest update reconnects.</Notice> : null}
        {queued ? <Notice>Offline-safe mode: progress is stored on this device and will synchronize automatically.</Notice> : null}
        {syncError ? <View className="mt-3"><Notice tone="error">{syncError}</Notice></View> : null}
        <View className="mt-4 rounded-3xl bg-white p-5 shadow-sm">
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1"><Text className="text-sm font-bold text-slate-500">Verified progress</Text><Text className="mt-1 text-3xl font-black text-slate-950">{Math.floor(progress.completion_percentage)}%</Text></View>
            <Text className={`rounded-full px-3 py-1.5 text-xs font-black ${state === "completed" ? "bg-emerald-100 text-emerald-800" : state === "eligible" ? "bg-teal-100 text-teal-800" : state === "in_progress" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              {state === "completed" ? "Completed" : state === "eligible" ? "Eligible" : state === "in_progress" ? "In progress" : "Not started"}
            </Text>
          </View>
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><View className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, progress.completion_percentage)}%` }} /></View>

          {progress.completed ? (
            <View className="mt-5 gap-3">
              <Notice tone="success">✓ Completed. This result is synchronized across mobile and web.</Notice>
              <PrimaryButton onPress={() => { lastPosition.current = 0; void startPlayback(0); }}>Watch Again</PrimaryButton>
            </View>
          ) : (
            <View className="mt-5 gap-3">
              <PrimaryButton disabled={!eligible} loading={completion.isPending} onPress={() => completion.mutate()}>✓ Mark as Complete</PrimaryButton>
              {!eligible ? <Text className="text-center text-sm leading-5 text-slate-500">Watch at least {threshold}% to unlock completion. Only verified playback time counts.</Text> : null}
              {completion.isError ? <Notice tone="error">{completion.error.message}</Notice> : null}
            </View>
          )}
        </View>

        {video.description ? <View className="mt-5 rounded-3xl bg-white p-5"><Text className="text-lg font-black text-slate-950">About this lesson</Text><Text className="mt-2 leading-6 text-slate-600">{video.description}</Text></View> : null}

        <View className="mt-5 flex-row gap-3">
          <View className="flex-1"><PrimaryButton disabled={!previous} onPress={() => navigateTo(previous)}>← Previous</PrimaryButton></View>
          <View className="flex-1"><PrimaryButton disabled={!next} onPress={() => navigateTo(next)}>Next →</PrimaryButton></View>
        </View>
      </View>
    </ScrollView>
  );
}

export default function VideoScreen() {
  const params = useLocalSearchParams<{ dayNumber: string; videoNumber: string }>();
  const dayNumber = Number(params.dayNumber);
  const videoNumber = Number(params.videoNumber);
  const { session } = useAuth();
  const profile = useQuery({ queryKey: ["profile", session!.user.id], queryFn: () => getMyProfile(session!.user.id) });
  const content = useQuery({
    queryKey: ["day-content", dayNumber, profile.data?.id],
    queryFn: () => getDayContent(dayNumber, profile.data!.id),
    enabled: Number.isInteger(dayNumber) && Number.isInteger(videoNumber) && Boolean(profile.data?.id),
  });

  if (profile.isLoading || content.isLoading) return <CenteredState title="Preparing your lesson" detail="Restoring your latest saved position." action={<ActivityIndicator color="#0F766E" size="large" />} />;
  const video = content.data?.videos.find((item) => item.video_number === videoNumber);
  if (!content.data || !profile.data || !video) {
    return <CenteredState title="Lesson unavailable" detail="This video may not be published, or the connection was interrupted." action={<PrimaryButton loading={content.isFetching} onPress={() => void content.refetch()}>Try again</PrimaryButton>} />;
  }
  const progress = content.data.progress.find((item) => item.video_id === video.id);
  return <TrackedPlayer key={video.id} dayNumber={dayNumber} video={video} videos={content.data.videos} initialProgress={progress} threshold={content.data.settings.video_completion_threshold} studentId={profile.data.id} usingCachedContent={profile.isRefetchError || content.isRefetchError} />;
}

const styles = StyleSheet.create({
  video: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  playerOverlay: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.72)", padding: 24 },
});
