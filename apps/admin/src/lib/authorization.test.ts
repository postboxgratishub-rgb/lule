import { describe, expect, it } from "vitest";

import { isPublicAdminPath, safeNextPath } from "@/lib/authorization";

describe("admin route authorization helpers", () => {
  it("keeps only the intentionally public authentication routes public", () => {
    expect(isPublicAdminPath("/login")).toBe(true);
    expect(isPublicAdminPath("/forgot-password")).toBe(true);
    expect(isPublicAdminPath("/auth/callback")).toBe(true);
    expect(isPublicAdminPath("/dashboard")).toBe(false);
    expect(isPublicAdminPath("/students")).toBe(false);
  });

  it("accepts an internal post-login destination", () => {
    expect(safeNextPath("/students?page=2")).toBe("/students?page=2");
  });

  it.each([
    ["https://malicious.example", "/dashboard"],
    ["//malicious.example", "/dashboard"],
    ["/\\malicious.example", "/dashboard"],
    [null, "/dashboard"],
  ])("rejects unsafe redirect value %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});
