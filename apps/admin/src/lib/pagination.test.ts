import { describe, expect, it } from "vitest";

import {
  getPageRange,
  getTotalPages,
  parsePositiveInteger,
  sanitizeSearchTerm,
} from "@/lib/pagination";

describe("server pagination", () => {
  it("builds inclusive Supabase ranges without overlapping pages", () => {
    expect(getPageRange(1, 20)).toEqual({ from: 0, to: 19 });
    expect(getPageRange(2, 20)).toEqual({ from: 20, to: 39 });
  });

  it("normalizes invalid page values", () => {
    expect(parsePositiveInteger("0")).toBe(1);
    expect(parsePositiveInteger("not-a-number")).toBe(1);
    expect(parsePositiveInteger("7")).toBe(7);
  });

  it("always exposes at least one page", () => {
    expect(getTotalPages(0, 20)).toBe(1);
    expect(getTotalPages(41, 20)).toBe(3);
  });

  it("removes PostgREST filter control characters from searches", () => {
    expect(sanitizeSearchTerm("  Ada%,(Lovelace)_  ")).toBe("Ada Lovelace");
  });
});
