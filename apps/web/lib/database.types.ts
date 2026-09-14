export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "admin";
export type VideoSourceType = "external_url" | "cloudflare_stream" | "mux";

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
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
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string;
          role: UserRole;
          school_id: string | null;
          class_name: string | null;
          section: string | null;
          roll_number: string | null;
          date_of_birth: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          full_name: string;
          email: string;
          phone: string;
          role?: UserRole;
          school_id?: string | null;
          class_name?: string | null;
          section?: string | null;
          roll_number?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          phone?: string;
          school_id?: string | null;
          class_name?: string | null;
          section?: string | null;
          roll_number?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      challenge_settings: {
        Row: {
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
          certificate_rules: Json;
          streak_rules: Json;
          notification_settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          program_name?: string;
          organization_name?: string;
          challenge_start_date?: string | null;
          challenge_end_date?: string | null;
          timezone?: string;
          total_days?: number;
          videos_per_day?: number;
          video_completion_threshold?: number;
          minimum_completion?: number;
          certificate_rules?: Json;
          streak_rules?: Json;
          notification_settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["challenge_settings"]["Insert"]
        >;
        Relationships: [];
      };
      challenge_days: {
        Row: {
          id: string;
          day_number: number;
          title: string;
          description: string | null;
          release_date: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_number: number;
          title: string;
          description?: string | null;
          release_date?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["challenge_days"]["Insert"]
        >;
        Relationships: [];
      };
      videos: {
        Row: {
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
        };
        Insert: {
          id?: string;
          challenge_day_id: string;
          video_number: number;
          title: string;
          description?: string | null;
          duration_seconds: number;
          thumbnail_url?: string | null;
          video_source_type?: VideoSourceType;
          video_url?: string | null;
          playback_id?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "videos_challenge_day_id_fkey";
            columns: ["challenge_day_id"];
            isOneToOne: false;
            referencedRelation: "challenge_days";
            referencedColumns: ["id"];
          },
        ];
      };
      video_progress: {
        Row: {
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
        };
        Insert: {
          id?: string;
          student_id: string;
          video_id: string;
          watched_seconds?: number;
          last_position_seconds?: number;
          completion_percentage?: number;
          completed?: boolean;
          first_started_at?: string | null;
          last_watched_at?: string | null;
          completed_at?: string | null;
          total_sessions?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["video_progress"]["Insert"]
        >;
        Relationships: [];
      };
      watch_sessions: {
        Row: {
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
        };
        Insert: {
          id?: string;
          client_session_id: string;
          student_id: string;
          video_id: string;
          started_at?: string;
          ended_at?: string | null;
          watched_seconds?: number;
          last_position_seconds?: number;
          device_type?: string;
          session_date: string;
          last_sequence?: number;
          last_reported_at?: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["watch_sessions"]["Insert"]
        >;
        Relationships: [];
      };
      daily_progress: {
        Row: {
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
        };
        Insert: {
          id?: string;
          student_id: string;
          challenge_day_id: string;
          videos_completed?: number;
          videos_total?: number;
          watch_time_seconds?: number;
          completion_percentage?: number;
          completed?: boolean;
          started_at?: string | null;
          last_activity_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["daily_progress"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      start_video_session: {
        Args: {
          p_video_id: string;
          p_session_id: string;
          p_device_type?: string;
          p_position_seconds?: number;
          p_expected_student_id?: string;
        };
        Returns: Json;
      };
      record_video_progress: {
        Args: {
          p_video_id: string;
          p_session_id: string;
          p_sequence: number;
          p_position_seconds: number;
          p_watched_delta_seconds: number;
          p_device_type?: string;
          p_is_final?: boolean;
          p_expected_student_id?: string;
        };
        Returns: Json;
      };
      mark_video_complete: {
        Args: { p_video_id: string; p_expected_student_id?: string };
        Returns: Json;
      };
    };
    Enums: {
      app_role: UserRole;
      video_source_type: VideoSourceType;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type School = Database["public"]["Tables"]["schools"]["Row"];
export type StudentProfile = Database["public"]["Tables"]["profiles"]["Row"];
export type ChallengeSettings =
  Database["public"]["Tables"]["challenge_settings"]["Row"];
export type ChallengeDay =
  Database["public"]["Tables"]["challenge_days"]["Row"];
export type Video = Database["public"]["Tables"]["videos"]["Row"];
export type VideoProgress =
  Database["public"]["Tables"]["video_progress"]["Row"];
export type DailyProgress =
  Database["public"]["Tables"]["daily_progress"]["Row"];
