import { describe, expect, it } from "vitest";

import {
  normalizePhone,
  registrationSchema,
  updatePasswordSchema,
} from "@/lib/validation/auth";

const validRegistration = {
  fullName: "Aanya Sharma",
  email: "aanya@example.com",
  phone: "+91 98765 43210",
  schoolId: "11111111-1111-4111-8111-111111111111",
  className: "8",
  section: "A",
  rollNumber: "24",
  dateOfBirth: "2012-04-18",
  password: "learn100days",
  confirmPassword: "learn100days",
};

describe("student auth validation", () => {
  it("accepts a complete student registration", () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("requires a real school UUID", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      schoolId: "school-1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a future date of birth", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      dateOfBirth: "2999-01-01",
    });
    expect(result.success).toBe(false);
  });

  it("requires matching passwords", () => {
    const result = updatePasswordSchema.safeParse({
      password: "learn100days",
      confirmPassword: "different100",
    });
    expect(result.success).toBe(false);
  });

  it("normalizes common mobile formatting before metadata storage", () => {
    expect(normalizePhone("+91 (98765) 43210")).toBe("+919876543210");
  });
});
