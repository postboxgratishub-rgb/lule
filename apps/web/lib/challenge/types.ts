import type {
  ChallengeDay,
  ChallengeSettings,
  DailyProgress,
  Video,
  VideoProgress,
} from "@/lib/database.types";

export type DayVisualState =
  | "locked"
  | "available"
  | "in_progress"
  | "completed";

export type VideoVisualState =
  | "not_started"
  | "in_progress"
  | "eligible"
  | "completed";

export type ChallengeDayCard = {
  dayNumber: number;
  day: ChallengeDay | null;
  progress: DailyProgress | null;
  state: DayVisualState;
};

export type ChallengeOverview = {
  settings: ChallengeSettings;
  days: ChallengeDayCard[];
  completedDays: number;
  completedVideos: number;
  totalVideos: number;
  overallPercentage: number;
  totalWatchSeconds: number;
  focusDay: ChallengeDayCard | null;
};

export type VideoWithProgress = {
  video: Video;
  progress: VideoProgress | null;
  state: VideoVisualState;
};

export type ChallengeDayDetails = {
  studentId: string;
  settings: ChallengeSettings;
  day: ChallengeDay;
  videos: VideoWithProgress[];
  dailyProgress: DailyProgress | null;
};

export type ProgressRpcDailyProgress = {
  challenge_day_id: string;
  videos_completed: number;
  videos_total: number;
  watch_time_seconds: number;
  completion_percentage: number;
  completed: boolean;
};

export type ProgressRpcResult = {
  video_id: string;
  watched_seconds: number;
  last_position_seconds: number;
  completion_percentage: number;
  completion_threshold: number;
  eligible_to_complete: boolean;
  completed: boolean;
  first_started_at: string | null;
  last_watched_at: string | null;
  completed_at: string | null;
  total_sessions: number;
  accepted_delta_seconds?: number;
  daily_progress: ProgressRpcDailyProgress | null;
};
