import { describe, expect, it } from "vitest";
import { compactPhone, initials, postAuthRoute, profileCompletion } from "../src/index";

describe("shared identity helpers", () => {
  it("creates concise initials", () => expect(initials("  Ananya Sharma ")).toBe("AS"));
  it("normalizes a phone number", () => expect(compactPhone("+91 98765-43210")).toBe("+919876543210"));
  it("keeps admin users out of the student surface", () => expect(postAuthRoute("admin", "student")).toBe("/unauthorized"));
  it("calculates profile completeness", () => expect(profileCompletion(["a", "b", null, ""])).toBe(50));
});
