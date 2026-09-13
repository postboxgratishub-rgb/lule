import { describe, expect, it } from "vitest";

import { schoolFormSchema, studentProfileFormSchema } from "@/lib/validation";

describe("school input validation", () => {
  it("normalizes the unique school code and empty optional values", () => {
    const parsed = schoolFormSchema.parse({
      id: null,
      name: "  Greenwood Public School ",
      code: " gps-01 ",
      address: "",
      city: " Bengaluru ",
      state: "Karnataka",
      contact_name: "",
      contact_phone: "",
    });

    expect(parsed.name).toBe("Greenwood Public School");
    expect(parsed.id).toBeUndefined();
    expect(parsed.code).toBe("GPS-01");
    expect(parsed.address).toBeNull();
    expect(parsed.city).toBe("Bengaluru");
  });

  it("rejects filter syntax in a school code", () => {
    expect(
      schoolFormSchema.safeParse({
        name: "Valid School",
        code: "ABC,or(id.eq.1)",
        address: "",
        city: "",
        state: "",
        contact_name: "",
        contact_phone: "",
      }).success,
    ).toBe(false);
  });
});

describe("student profile validation", () => {
  const base = {
    id: "4ca26876-8a9b-4fc1-9b68-b679395bc303",
    full_name: "Student One",
    phone: "",
    school_id: "",
    class_name: "10",
    section: "A",
    roll_number: "10-A-01",
  };

  it("accepts a past date and normalizes an unassigned school", () => {
    const parsed = studentProfileFormSchema.parse({
      ...base,
      date_of_birth: "2010-05-21",
    });
    expect(parsed.school_id).toBeNull();
    expect(parsed.date_of_birth).toBe("2010-05-21");
  });

  it("rejects a future date of birth", () => {
    expect(
      studentProfileFormSchema.safeParse({
        ...base,
        date_of_birth: "2999-01-01",
      }).success,
    ).toBe(false);
  });
});
