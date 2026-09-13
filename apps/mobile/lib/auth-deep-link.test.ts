import { describe, expect, it } from "vitest";
import { extractAuthCode, extractSessionTokens } from "./auth-deep-link";

describe("authentication deep links", () => {
  it("extracts implicit-flow recovery tokens", () => {
    expect(extractSessionTokens("hundreddays://update-password#access_token=access&refresh_token=refresh&type=recovery")).toEqual({ accessToken: "access", refreshToken: "refresh" });
  });
  it("extracts a PKCE authorization code", () => {
    expect(extractAuthCode("hundreddays://update-password?code=secure-code")).toBe("secure-code");
  });
  it("does not fabricate missing credentials", () => {
    expect(extractSessionTokens("hundreddays://login")).toBeNull();
  });
});
