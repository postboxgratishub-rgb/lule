import { describe, expect, it } from "vitest";
import { registrationSchema, schoolSchema } from "../src/index";

const validRegistration = {
  fullName: "Ananya Sharma",
  email: "ananya@example.com",
  phone: "+919876543210",
  password: "Learning100",
  schoolId: "11111111-1111-4111-8111-111111111111",
  className: "10",
  section: "A",
  rollNumber: "10A-12",
  dateOfBirth: "2010-04-12",
};

describe("registrationSchema", () => {
  it("accepts a complete student registration", () => {
    expect(registrationSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects weak passwords and malformed phone numbers", () => {
    const result = registrationSchema.safeParse({
      ...validRegistration,
      password: "password",
      phone: "123",
    });

    expect(result.success).toBe(false);
  });
});

describe("schoolSchema", () => {
  it("normalizes school codes", () => {
    const result = schoolSchema.parse({ name: "Demo School", code: "demo-01" });
    expect(result.code).toBe("DEMO-01");
  });
});
