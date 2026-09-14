import { cache } from "react";

import {
  buildDayCards,
  chooseFocusDay,
  getVideoState,
  percentage,
} from "@/lib/challenge/logic";
import type {
  ChallengeDayDetails,
  ChallengeOverview,
  VideoWithProgress,
} from "@/lib/challenge/types";
import type {
  ChallengeDay,
  ChallengeSettings,
  DailyProgress,
  Video,
  VideoProgress,
} from "@/lib/database.types";
import { getCurrentStudent } from "@/lib/data/current-student";
import { createClient } from "@/lib/supabase/server";

function queryError(context: string, message: string): Error {
  return new Error(`${context}. ${message}`);
}

export const getChallengeOverview = cache(
  async (): Promise<ChallengeOverview | null> => {
    const student = await getCurrentStudent();
    if (!student?.profile) return null;

    const supabase = await createClient();
    const [settingsResult, daysResult, progressResult] = await Promise.all([
      supabase.from("challenge_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("challenge_days")
        .select("*")
        .eq("is_published", true)
        .order("day_number", { ascending: true }),
      supabase
        .from("daily_progress")
        .select("*")
        .eq("student_id", student.profile.id),
    ]);

    if (settingsResult.error) {
      throw queryError("Unable to load challenge settings", settingsResult.error.message);
    }
    if (!settingsResult.data) {
      throw new Error("Challenge settings have not been configured.");
    }
    if (daysResult.error) {
      throw queryError("Unable to load challenge days", daysResult.error.message);
    }
    if (progressResult.error) {
      throw queryError("Unable to load your daily progress", progressResult.error.message);
    }

    const settings = settingsResult.data as ChallengeSettings;
    const progress = (progressResult.data ?? []) as DailyProgress[];
    const cards = buildDayCards({
      settings,
      days: (daysResult.data ?? []) as ChallengeDay[],
      progress,
    });
    const completedDays = cards.filter((card) => card.state === "completed").length;
    const completedVideos = progress.reduce(
      (total, item) => total + item.videos_completed,
      0,
    );
    const totalVideos = settings.total_days * settings.videos_per_day;

    return {
      settings,
      days: cards,
      completedDays,
      completedVideos,
      totalVideos,
      overallPercentage: percentage(completedVideos, totalVideos),
      totalWatchSeconds: progress.reduce(
        (total, item) => total + Number(item.watch_time_seconds),
        0,
      ),
      focusDay: chooseFocusDay(cards),
    };
  },
);

export const getChallengeDay = cache(
  async (dayNumber: number): Promise<ChallengeDayDetails | null> => {
    const student = await getCurrentStudent();
    if (!student?.profile) return null;

    const supabase = await createClient();
    const [settingsResult, dayResult] = await Promise.all([
      supabase.from("challenge_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("challenge_days")
        .select("*")
        .eq("day_number", dayNumber)
        .eq("is_published", true)
        .maybeSingle(),
    ]);

    if (settingsResult.error) {
      throw queryError("Unable to load challenge settings", settingsResult.error.message);
    }
    if (!settingsResult.data) {
      throw new Error("Challenge settings have not been configured.");
    }
    if (dayResult.error) {
      throw queryError("Unable to load this challenge day", dayResult.error.message);
    }
    if (!dayResult.data) return null;

    const day = dayResult.data as ChallengeDay;
    const [videosResult, dailyResult] = await Promise.all([
      supabase
        .from("videos")
        .select("*")
        .eq("challenge_day_id", day.id)
        .eq("is_published", true)
        .order("video_number", { ascending: true }),
      supabase
        .from("daily_progress")
        .select("*")
        .eq("student_id", student.profile.id)
        .eq("challenge_day_id", day.id)
        .maybeSingle(),
    ]);

    if (videosResult.error) {
      throw queryError("Unable to load videos for this day", videosResult.error.message);
    }
    if (dailyResult.error) {
      throw queryError("Unable to load your progress for this day", dailyResult.error.message);
    }

    const videos = (videosResult.data ?? []) as Video[];
    let progress: VideoProgress[] = [];

    if (videos.length > 0) {
      const progressResult = await supabase
        .from("video_progress")
        .select("*")
        .eq("student_id", student.profile.id)
        .in(
          "video_id",
          videos.map((video) => video.id),
        );

      if (progressResult.error) {
        throw queryError("Unable to load video progress", progressResult.error.message);
      }
      progress = (progressResult.data ?? []) as VideoProgress[];
    }

    const progressMap = new Map(progress.map((item) => [item.video_id, item]));
    const threshold = Number(settingsResult.data.video_completion_threshold);
    const videosWithProgress: VideoWithProgress[] = videos.map((video) => {
      const videoProgress = progressMap.get(video.id) ?? null;
      return {
        video,
        progress: videoProgress,
        state: getVideoState(videoProgress, threshold),
      };
    });

    return {
      studentId: student.profile.id,
      settings: settingsResult.data as ChallengeSettings,
      day,
      videos: videosWithProgress,
      dailyProgress: (dailyResult.data as DailyProgress | null) ?? null,
    };
  },
);
