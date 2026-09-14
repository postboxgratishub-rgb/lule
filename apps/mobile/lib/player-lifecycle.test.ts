import { describe, expect, it } from "vitest";

import {
  needsNewWatchSession,
  shouldFinalizeForAppState,
} from "./player-lifecycle";

describe("mobile player lifecycle", () => {
  it("does not finalize when Android native fullscreen backgrounds the React host", () => {
    expect(shouldFinalizeForAppState("background", true)).toBe(false);
    expect(shouldFinalizeForAppState("inactive", true)).toBe(false);
  });

  it("does finalize a normal app background or inactive transition", () => {
    expect(shouldFinalizeForAppState("background", false)).toBe(true);
    expect(shouldFinalizeForAppState("inactive", false)).toBe(true);
    expect(shouldFinalizeForAppState("active", false)).toBe(false);
  });

  it("requires a fresh session as soon as finalization is requested", () => {
    expect(
      needsNewWatchSession({
        sessionStarted: true,
        sessionEnded: false,
        endingRequested: true,
      }),
    ).toBe(true);
    expect(
      needsNewWatchSession({
        sessionStarted: true,
        sessionEnded: false,
        endingRequested: false,
      }),
    ).toBe(false);
  });
});
