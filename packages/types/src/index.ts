export type UserRole = "student" | "admin";

export interface School {
  id: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  school_id: string | null;
  class_name: string | null;
  section: string | null;
  roll_number: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileWithSchool extends Profile {
  school: Pick<School, "id" | "name" | "code"> | null;
}

export interface ChallengeSettings {
  id: number;
  program_name: string;
  organization_name: string;
  challenge_start_date: string | null;
  challenge_end_date: string | null;
  timezone: string;
  total_days: number;
  videos_per_day: number;
  video_completion_threshold: number;
  minimum_completion: number;
  certificate_rules: Record<string, unknown>;
  streak_rules: Record<string, unknown>;
  notification_settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type VideoSourceType = "external_url" | "cloudflare_stream" | "mux";

export interface ChallengeDay {
  id: string;
  day_number: number;
  title: string;
  description: string | null;
  release_date: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Video {
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
  created_at: string;
  updated_at: string;
}

export interface VideoProgress {
  id: string;
  student_id: string;
  video_id: string;
  watched_seconds: number;
  last_position_seconds: number;
  completion_percentage: number;
  completed: boolean;
  first_started_at: string | null;
  last_watched_at: string | null;
  completed_at: string | null;
  total_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface WatchSession {
  id: string;
  client_session_id: string;
  student_id: string;
  video_id: string;
  started_at: string;
  ended_at: string | null;
  watched_seconds: number;
  last_position_seconds: number;
  device_type: string;
  session_date: string;
  last_sequence: number;
  last_reported_at: string;
  created_at: string;
}

export interface DailyProgress {
  id: string;
  student_id: string;
  challenge_day_id: string;
  videos_completed: number;
  videos_total: number;
  watch_time_seconds: number;
  completion_percentage: number;
  completed: boolean;
  started_at: string | null;
  last_activity_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  created_at: string;
}

export interface ProgressSnapshot {
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
  daily_progress: Omit<DailyProgress, "id" | "student_id" | "started_at" | "last_activity_at" | "completed_at" | "created_at" | "updated_at"> | null;
}

export interface AdminOverview {
  total_students: number;
  total_schools: number;
  new_students_last_7_days: number;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: School;
        Insert: Pick<School, "name" | "code"> & Partial<Omit<School, "name" | "code">>;
        Update: Partial<Omit<School, "id" | "created_at">>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Pick<Profile, "auth_user_id" | "full_name"> & Partial<Omit<Profile, "auth_user_id" | "full_name">>;
        Update: Partial<Omit<Profile, "id" | "auth_user_id" | "created_at">>;
        Relationships: [];
      };
      challenge_settings: {
        Row: ChallengeSettings;
        Insert: Partial<ChallengeSettings>;
        Update: Partial<Omit<ChallengeSettings, "id" | "created_at">>;
        Relationships: [];
      };
      challenge_days: {
        Row: ChallengeDay;
        Insert: Pick<ChallengeDay, "day_number" | "title"> & Partial<Omit<ChallengeDay, "day_number" | "title">>;
        Update: Partial<Omit<ChallengeDay, "id" | "created_at">>;
        Relationships: [];
      };
      videos: {
        Row: Video;
        Insert: Pick<Video, "challenge_day_id" | "video_number" | "title" | "duration_seconds"> & Partial<Omit<Video, "challenge_day_id" | "video_number" | "title" | "duration_seconds">>;
        Update: Partial<Omit<Video, "id" | "challenge_day_id" | "created_at">>;
        Relationships: [];
      };
      video_progress: {
        Row: VideoProgress;
        Insert: Partial<VideoProgress>;
        Update: Partial<VideoProgress>;
        Relationships: [];
      };
      watch_sessions: {
        Row: WatchSession;
        Insert: Partial<WatchSession>;
        Update: Partial<WatchSession>;
        Relationships: [];
      };
      daily_progress: {
        Row: DailyProgress;
        Insert: Partial<DailyProgress>;
        Update: Partial<DailyProgress>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      get_admin_overview: {
        Args: Record<string, never>;
        Returns: Array<AdminOverview & { students_by_school: Json }>;
      };
      start_video_session: {
        Args: { p_video_id: string; p_session_id: string; p_device_type?: string; p_position_seconds?: number; p_expected_student_id?: string };
        Returns: ProgressSnapshot;
      };
      record_video_progress: {
        Args: { p_video_id: string; p_session_id: string; p_sequence: number; p_position_seconds: number; p_watched_delta_seconds: number; p_device_type?: string; p_is_final?: boolean; p_expected_student_id?: string };
        Returns: ProgressSnapshot;
      };
      mark_video_complete: {
        Args: { p_video_id: string; p_expected_student_id?: string };
        Returns: ProgressSnapshot;
      };
      reorder_day_videos: {
        Args: { p_challenge_day_id: string; p_ordered_video_ids: string[] };
        Returns: undefined;
      };
      upsert_day_videos: {
        Args: { p_challenge_day_id: string; p_videos: Json };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: UserRole;
      video_source_type: VideoSourceType;
    };
    CompositeTypes: Record<string, never>;
  };
}
