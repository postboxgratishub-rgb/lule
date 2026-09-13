import { describe, expect, it } from "vitest";

import {
  EnvironmentConfigurationError,
  parsePublicSupabaseEnv,
} from "@/lib/env";

function jwtWithRole(role: string): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ role })}.signature`;
}

describe("parsePublicSupabaseEnv", () => {
  it("accepts a browser-safe publishable key and normalizes the URL", () => {
    expect(
      parsePublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co/",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
      }),
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_example",
    });
  });

  it("supports a legacy anon key", () => {
    const anonKey = jwtWithRole("anon");
    expect(
      parsePublicSupabaseEnv({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
      }).publishableKey,
    ).toBe(anonKey);
  });

  it("rejects missing variables", () => {
    expect(() => parsePublicSupabaseEnv({})).toThrow(
      EnvironmentConfigurationError,
    );
  });

  it.each(["sb_secret_do-not-expose", jwtWithRole("service_role")])(
    "rejects privileged key %s",
    (key) => {
      expect(() =>
        parsePublicSupabaseEnv({
          NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
        }),
      ).toThrow(/cannot be exposed/i);
    },
  );
});
