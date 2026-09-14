import { supabase } from "@/lib/supabase";
import type { VideoSourceType } from "@/lib/video-source";

export type ChallengeSettingsSummary = {
  program_name: string;
  organization_name: string;
  total_days: number;
  videos_per_day: number;
  timezone: string;
  video_completion_threshold: number;
};

export type ChallengeDay = {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  release_date: string | null;
  is_published: boolean;
};

export type LearningVideo = {
  id: string;
  challenge_day_id: string;
  video_number: number;
  title: string;
  description: string | null;
  duration_seconds: number;
  thumbnail_url: string | null;
  video_source_type: VideoSourceType;
  video_url: string | null;
  playback_id: string | null;
  is_published: boolean;
};

export type VideoProgress = {
  video_id: string;
  watched_seconds: number;
  last_position_seconds: number;
  completion_percentage: number;
  completed: boolean;
  first_started_at: string | null;
  last_watched_at: string | null;
  completed_at: string | null;
  total_sessions: number;
  eligible_to_complete?: boolean;
  completion_threshold?: number;
};

export type DailyProgress = {
  challenge_day_id: string;
  videos_completed: number;
  videos_total: number;
  watch_time_seconds: number;
  completion_percentage: number;
  completed: boolean;
  last_activity_at: string | null;
};

export type ProgressSnapshot = VideoProgress & {
  completion_threshold: number;
  eligible_to_complete: boolean;
  accepted_delta_seconds?: number;
  daily_progress: Omit<DailyProgress, "last_activity_at"> | null;
};

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export async function getChallengeHome(studentId: string): Promise<{
  settings: ChallengeSettingsSummary;
  days: ChallengeDay[];
  dailyProgress: DailyProgress[];
}> {
  const [settingsResult, daysResult, progressResult] = await Promise.all([
    supabase
      .from("challenge_settings")
      .select("program_name,organization_name,total_days,videos_per_day,timezone,video_completion_threshold")
      .eq("id", 1)
      .single(),
    supabase
      .from("challenge_days")
      .select("id,day_number,title,description,release_date,is_published")
      .order("day_number"),
    supabase
      .from("daily_progress")
      .select("challenge_day_id,videos_completed,videos_total,watch_time_seconds,completion_percentage,completed,last_activity_at")
      .eq("student_id", studentId),
  ]);

  throwIfError(settingsResult.error);
  throwIfError(daysResult.error);
  throwIfError(progressResult.error);

  return {
    settings: settingsResult.data as ChallengeSettingsSummary,
    days: (daysResult.data ?? []) as ChallengeDay[],
    dailyProgress: (progressResult.data ?? []) as DailyProgress[],
  };
}

export async function getDayContent(dayNumber: number, studentId: string): Promise<{
  day: ChallengeDay;
  videos: LearningVideo[];
  progress: VideoProgress[];
  settings: ChallengeSettingsSummary;
}> {
  const [dayResult, settingsResult] = await Promise.all([
    supabase
      .from("challenge_days")
      .select("id,day_number,title,description,release_date,is_published")
      .eq("day_number", dayNumber)
      .single(),
    supabase
      .from("challenge_settings")
      .select("program_name,organization_name,total_days,videos_per_day,timezone,video_completion_threshold")
      .eq("id", 1)
      .single(),
  ]);

  throwIfError(dayResult.error);
  throwIfError(settingsResult.error);
  const day = dayResult.data as ChallengeDay;

  const videosResult = await supabase
    .from("videos")
    .select("id,challenge_day_id,video_number,title,description,duration_seconds,thumbnail_url,video_source_type,video_url,playback_id,is_published")
    .eq("challenge_day_id", day.id)
    .order("video_number");
  throwIfError(videosResult.error);
  const videos = (videosResult.data ?? []) as LearningVideo[];

  let progress: VideoProgress[] = [];
  if (videos.length > 0) {
    const progressResult = await supabase
      .from("video_progress")
      .select("video_id,watched_seconds,last_position_seconds,completion_percentage,completed,first_started_at,last_watched_at,completed_at,total_sessions")
      .eq("student_id", studentId)
      .in("video_id", videos.map((video) => video.id));
    throwIfError(progressResult.error);
    progress = (progressResult.data ?? []) as VideoProgress[];
  }

  return {
    day,
    videos,
    progress,
    settings: settingsResult.data as ChallengeSettingsSummary,
  };
}

export async function startVideoSession(input: {
  studentId: string;
  videoId: string;
  sessionId: string;
  positionSeconds: number;
}): Promise<ProgressSnapshot> {
  const { data, error } = await supabase.rpc("start_video_session", {
    p_video_id: input.videoId,
    p_session_id: input.sessionId,
    p_device_type: "mobile",
    p_position_seconds: Math.max(0, input.positionSeconds),
    p_expected_student_id: input.studentId,
  });
  throwIfError(error);
  return data as ProgressSnapshot;
}

export async function recordVideoProgress(input: {
  studentId: string;
  videoId: string;
  sessionId: string;
  sequence: number;
  positionSeconds: number;
  watchedDeltaSeconds: number;
  isFinal?: boolean;
}): Promise<ProgressSnapshot> {
  const { data, error } = await supabase.rpc("record_video_progress", {
    p_video_id: input.videoId,
    p_session_id: input.sessionId,
    p_sequence: input.sequence,
    p_position_seconds: Math.max(0, input.positionSeconds),
    p_watched_delta_seconds: Math.max(0, input.watchedDeltaSeconds),
    p_device_type: "mobile",
    p_is_final: input.isFinal ?? false,
    p_expected_student_id: input.studentId,
  });
  throwIfError(error);
  return data as ProgressSnapshot;
}

export async function completeVideo(
  videoId: string,
  studentId: string,
): Promise<ProgressSnapshot> {
  const { data, error } = await supabase.rpc("mark_video_complete", {
    p_video_id: videoId,
    p_expected_student_id: studentId,
  });
  throwIfError(error);
  return data as ProgressSnapshot;
}
