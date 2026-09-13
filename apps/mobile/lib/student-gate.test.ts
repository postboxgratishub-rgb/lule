import { describe, expect, it } from "vitest";

import { resolveStudentGate } from "./student-gate";

const verifiedStudent = {
  authLoading: false,
  hasSession: true,
  profileLoading: false,
  profileError: false,
  role: "student",
};

describe("resolveStudentGate", () => {
  it("authorizes only a verified student role", () => {
    expect(resolveStudentGate(verifiedStudent)).toBe("authorized");
    expect(resolveStudentGate({ ...verifiedStudent, role: "admin" })).toBe(
      "unauthorized",
    );
    expect(resolveStudentGate({ ...verifiedStudent, role: "unexpected" })).toBe(
      "unauthorized",
    );
  });

  it("fails closed when the profile cannot be verified", () => {
    expect(
      resolveStudentGate({ ...verifiedStudent, profileError: true }),
    ).toBe("error");
    expect(resolveStudentGate({ ...verifiedStudent, role: undefined })).toBe(
      "error",
    );
  });

  it("distinguishes loading from a missing session", () => {
    expect(resolveStudentGate({ ...verifiedStudent, authLoading: true })).toBe(
      "loading",
    );
    expect(resolveStudentGate({ ...verifiedStudent, profileLoading: true })).toBe(
      "loading",
    );
    expect(resolveStudentGate({ ...verifiedStudent, hasSession: false })).toBe(
      "unauthenticated",
    );
  });
});
