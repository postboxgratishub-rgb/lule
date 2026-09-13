import { createClient } from "@supabase/supabase-js";

const url = process.env.SMOKE_SUPABASE_URL;
const key = process.env.SMOKE_SUPABASE_KEY;

if (!url || !key) {
  throw new Error("Set SMOKE_SUPABASE_URL and SMOKE_SUPABASE_KEY to a local/staging Supabase project before running this test.");
}

function client() {
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const student = client();
const studentLogin = await student.auth.signInWithPassword({
  email: "student01@example.com",
  password: "Student123!",
});
assert(!studentLogin.error && studentLogin.data.user, `Student login failed: ${studentLogin.error?.message ?? "unknown error"}`);

const ownProfiles = await student.from("profiles").select("id,email,role");
assert(!ownProfiles.error, `Student profile read failed: ${ownProfiles.error?.message}`);
assert(ownProfiles.data?.length === 1, `Student RLS returned ${ownProfiles.data?.length ?? 0} profiles instead of one`);
assert(ownProfiles.data?.[0]?.role === "student", "Student profile has the wrong application role");

const selfPromotion = await student
  .from("profiles")
  .update({ role: "admin" })
  .eq("auth_user_id", studentLogin.data.user.id);
assert(Boolean(selfPromotion.error), "Student self-promotion unexpectedly succeeded");
await student.auth.signOut();

const admin = client();
const adminLogin = await admin.auth.signInWithPassword({
  email: "admin@example.com",
  password: "Admin123!",
});
assert(!adminLogin.error && adminLogin.data.user, `Admin login failed: ${adminLogin.error?.message ?? "unknown error"}`);

const adminRole = await admin.rpc("is_admin");
assert(!adminRole.error && adminRole.data === true, "Admin role RPC did not authorize the seeded administrator");

const overview = await admin.rpc("get_admin_overview").single();
assert(!overview.error, `Admin overview failed: ${overview.error?.message}`);
assert(Number(overview.data?.total_students) === 10, "Admin overview did not return ten students");
assert(Number(overview.data?.total_schools) === 3, "Admin overview did not return three schools");
await admin.auth.signOut();

console.log("Auth/PostgREST smoke test passed: student isolation, role protection, admin authorization, and overview counts are valid.");
