import { cache } from "react";

import type { School, StudentProfile } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

type CurrentStudent = {
  userId: string;
  authEmail: string | null;
  profile: StudentProfile | null;
  school: School | null;
  schoolError: string | null;
};

export const getCurrentStudent = cache(
  async (): Promise<CurrentStudent | null> => {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return null;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`Unable to load your student profile: ${profileError.message}`);
    }

    const profile = profileData as StudentProfile | null;

    let school: School | null = null;
    let schoolError: string | null = null;

    if (profile?.school_id) {
      const result = await supabase
        .from("schools")
        .select("*")
        .eq("id", profile.school_id)
        .maybeSingle();

      school = result.data as School | null;
      schoolError = result.error?.message ?? null;
    }

    return {
      userId: user.id,
      authEmail: user.email ?? null,
      profile,
      school,
      schoolError,
    };
  },
);
