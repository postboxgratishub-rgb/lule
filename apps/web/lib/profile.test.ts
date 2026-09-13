import { describe, expect, it } from "vitest";

import type { StudentProfile } from "@/lib/database.types";
import { initials, profileCompletionPercentage } from "@/lib/profile";

const completeProfile: StudentProfile = {
  id: "profile-id",
  auth_user_id: "auth-id",
  full_name: "Aanya Sharma",
  email: "aanya@example.com",
  phone: "+919876543210",
  role: "student",
  school_id: "school-id",
  class_name: "8",
  section: "A",
  roll_number: "24",
  date_of_birth: "2012-04-18",
  avatar_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("student profile helpers", () => {
  it("derives readiness only from required, persisted profile fields", () => {
    expect(profileCompletionPercentage(completeProfile)).toBe(100);
    expect(
      profileCompletionPercentage({ ...completeProfile, section: null }),
    ).toBe(88);
    expect(profileCompletionPercentage(null)).toBe(0);
  });

  it("creates accessible avatar initials", () => {
    expect(initials("Aanya Sharma")).toBe("AS");
    expect(initials("  Aanya  ")).toBe("A");
    expect(initials(null)).toBe("ST");
  });
});
