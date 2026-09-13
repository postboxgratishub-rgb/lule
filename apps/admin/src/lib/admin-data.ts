import { createClient } from "@/lib/supabase/server";
import type {
  AdminOverview,
  ProfileWithSchool,
  SchoolDistributionPoint,
} from "@/types";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeDistribution(value: unknown): SchoolDistributionPoint[] {
  let candidate = value;

  if (typeof value === "string") {
    try {
      candidate = JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(candidate)) return [];

  return candidate.flatMap((item) => {
    const record = asRecord(item);
    if (!record || typeof record.school_name !== "string") return [];

    return [
      {
        school_id:
          typeof record.school_id === "string" ? record.school_id : null,
        school_name: record.school_name,
        student_count: asNumber(record.student_count),
      },
    ];
  });
}

export function normalizeAdminOverview(value: unknown): AdminOverview {
  const record = asRecord(Array.isArray(value) ? value[0] : value);

  return {
    total_students: asNumber(record?.total_students),
    total_schools: asNumber(record?.total_schools),
    new_students_last_7_days: asNumber(record?.new_students_last_7_days),
    students_by_school: normalizeDistribution(record?.students_by_school),
  };
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createClient();
  const overviewResult = await supabase.rpc("get_admin_overview").single();

  if (!overviewResult.error && overviewResult.data) {
    return normalizeAdminOverview(overviewResult.data);
  }

  // A query fallback keeps local setup diagnosable while preserving RLS. It does
  // not use a service key and never bypasses the authenticated admin policies.
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [studentsResult, schoolsResult, newStudentsResult, distributionResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase.from("schools").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .gte("created_at", sevenDaysAgo),
    supabase.from("schools").select("id, name, profiles(count)").order("name"),
  ]);

  if (
    studentsResult.error ||
    schoolsResult.error ||
    newStudentsResult.error ||
    distributionResult.error
  ) {
    throw new Error("Unable to load the admin overview.");
  }

  const distribution = (distributionResult.data as unknown[] | null)?.flatMap(
    (item) => {
      const record = asRecord(item);
      const profileCounts = Array.isArray(record?.profiles)
        ? record.profiles
        : [];
      const countRecord = asRecord(profileCounts[0]);

      if (typeof record?.id !== "string" || typeof record.name !== "string") {
        return [];
      }

      return [
        {
          school_id: record.id,
          school_name: record.name,
          student_count: asNumber(countRecord?.count),
        },
      ];
    },
  );

  return {
    total_students: studentsResult.count ?? 0,
    total_schools: schoolsResult.count ?? 0,
    new_students_last_7_days: newStudentsResult.count ?? 0,
    students_by_school: distribution ?? [],
  };
}

export async function getRecentStudents(limit = 6): Promise<ProfileWithSchool[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, auth_user_id, full_name, email, phone, role, school_id, class_name, section, roll_number, date_of_birth, avatar_url, created_at, updated_at, school:schools!profiles_school_id_fkey(id, name, code)",
    )
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(1, limit), 20));

  if (error) throw new Error("Unable to load recent students.");
  return (data ?? []) as unknown as ProfileWithSchool[];
}
