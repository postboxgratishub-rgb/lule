import { supabase } from "@/lib/supabase";
import type { SchoolDirectoryEntry } from "@/lib/school-directory";

export type StudentProfile = {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "student" | "admin";
  school_id: string | null;
  class_name: string | null;
  section: string | null;
  roll_number: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  school: {
    id: string;
    name: string;
    code: string;
    block_name: string | null;
  } | null;
};

export type PublicSchool = SchoolDirectoryEntry;

export async function getMyProfile(authUserId: string): Promise<StudentProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,auth_user_id,full_name,email,phone,role,school_id,class_name,section,roll_number,date_of_birth,avatar_url,school:schools(id,name,code,block_name)")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) throw error;
  return data as unknown as StudentProfile;
}

export async function getSchools(): Promise<PublicSchool[]> {
  const { data, error } = await supabase
    .from("schools")
    .select("id,name,code,block_name,city,state")
    .order("block_name", { ascending: true, nullsFirst: false })
    .order("name")
    .range(0, 999);

  if (error) throw error;
  return (data ?? []) as PublicSchool[];
}
