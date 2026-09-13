import type { StudentProfile } from "@/lib/database.types";

const REQUIRED_PROFILE_FIELDS = [
  "full_name",
  "email",
  "phone",
  "school_id",
  "class_name",
  "section",
  "roll_number",
  "date_of_birth",
] as const satisfies ReadonlyArray<keyof StudentProfile>;

export function profileCompletionPercentage(
  profile: StudentProfile | null,
): number {
  if (!profile) return 0;
  const completed = REQUIRED_PROFILE_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === "string" && value.trim().length > 0;
  }).length;

  return Math.round((completed / REQUIRED_PROFILE_FIELDS.length) * 100);
}

export function initials(name: string | null | undefined): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return "ST";
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}
