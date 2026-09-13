import { describe, expect, it } from "vitest";

import { safeRedirectPath } from "@/lib/auth/redirect";

describe("safeRedirectPath", () => {
  it("keeps a local application path with its query", () => {
    expect(safeRedirectPath("/dashboard?welcome=1")).toBe(
      "/dashboard?welcome=1",
    );
  });

  it.each([
    "https://malicious.example/path",
    "//malicious.example/path",
    "/\\malicious.example/path",
    "%2F%2Fmalicious.example/path",
    "javascript:alert(1)",
  ])("rejects unsafe redirect %s", (value) => {
    expect(safeRedirectPath(value)).toBe("/dashboard");
  });

  it("uses a supplied fallback when no destination exists", () => {
    expect(safeRedirectPath(null, "/login")).toBe("/login");
  });
});
