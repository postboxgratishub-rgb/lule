"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import {
  drainProgressQueue,
  progressQueueEventName,
} from "@/lib/challenge/progress-sync";
import { createClient } from "@/lib/supabase/client";

export function ProgressSynchronizer({ studentId }: { studentId: string }) {
  const router = useRouter();

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    let active = true;

    const scheduleRefresh = () => {
      if (!active || refreshTimer) return;
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        if (active) router.refresh();
      }, 500);
    };

    const retryQueuedProgress = () => {
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      void drainProgressQueue(studentId)
        .then((results) => {
          if (results.length > 0) scheduleRefresh();
        })
        .catch(() => {
          // Events stay in local storage and retry on the next network/focus event.
        });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        retryQueuedProgress();
        scheduleRefresh();
      }
    };

    retryQueuedProgress();
    window.addEventListener("online", retryQueuedProgress);
    window.addEventListener("focus", retryQueuedProgress);
    window.addEventListener(progressQueueEventName, retryQueuedProgress);
    document.addEventListener("visibilitychange", onVisible);

    const supabase = createClient();
    const channel = supabase
      .channel(`student-progress-${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_progress",
          filter: `student_id=eq.${studentId}`,
        },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "daily_progress",
          filter: `student_id=eq.${studentId}`,
        },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      active = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      window.removeEventListener("online", retryQueuedProgress);
      window.removeEventListener("focus", retryQueuedProgress);
      window.removeEventListener(progressQueueEventName, retryQueuedProgress);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [router, studentId]);

  return null;
}
