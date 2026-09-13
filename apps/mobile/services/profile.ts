import { supabase } from "@/lib/supabase";

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
  school: { id: string; name: string; code: string } | null;
};

export type PublicSchool = {
  id: string;
  name: string;
  code: string;
  city: string | null;
  state: string | null;
};

export async function getMyProfile(authUserId: string): Promise<StudentProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,auth_user_id,full_name,email,phone,role,school_id,class_name,section,roll_number,date_of_birth,avatar_url,school:schools(id,name,code)")
    .eq("auth_user_id", authUserId)
    .single();

  if (error) throw error;
  return data as unknown as StudentProfile;
}

export async function getSchools(): Promise<PublicSchool[]> {
  const { data, error } = await supabase
    .from("schools")
    .select("id,name,code,city,state")
    .order("name");

  if (error) throw error;
  return (data ?? []) as PublicSchool[];
}
