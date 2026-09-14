export type UserRole = "admin" | "student";

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

export interface SchoolSummary extends School {
  student_count: number;
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

export interface SchoolDistributionPoint {
  school_id: string | null;
  school_name: string;
  student_count: number;
}

export interface AdminOverview {
  total_students: number;
  total_schools: number;
  new_students_last_7_days: number;
  students_by_school: SchoolDistributionPoint[];
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

export interface ChallengeDayWithVideos extends ChallengeDay {
  videos: Video[];
}

export interface ChallengeDaySummary extends ChallengeDay {
  video_count: number;
  published_video_count: number;
}

export interface AdminIdentity {
  id: string;
  email: string;
  fullName: string;
}

export interface ActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const INITIAL_ACTION_STATE: ActionState = { status: "idle" };
