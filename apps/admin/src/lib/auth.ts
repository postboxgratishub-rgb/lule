import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { AdminIdentity } from "@/types";

export const getAdminIdentity = cache(async (): Promise<AdminIdentity> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");

  if (roleError || isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/login?error=not_authorized");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return {
    id: profile?.id ?? user.id,
    email: profile?.email ?? user.email ?? "",
    fullName:
      profile?.full_name ??
      (typeof user.user_metadata.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] ?? "Administrator"),
  };
});

export async function assertAdmin() {
  return getAdminIdentity();
}
