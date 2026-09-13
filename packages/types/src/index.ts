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
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      get_admin_overview: {
        Args: Record<string, never>;
        Returns: Array<AdminOverview & { students_by_school: Json }>;
      };
    };
    Enums: {
      app_role: UserRole;
    };
    CompositeTypes: Record<string, never>;
  };
}
