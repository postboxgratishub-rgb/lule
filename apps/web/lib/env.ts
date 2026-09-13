export type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

type PublicEnvSource = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

function decodeJwtRole(key: string): string | undefined {
  const segments = key.split(".");
  if (segments.length !== 3 || typeof atob !== "function") return undefined;

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : undefined;
  } catch {
    return undefined;
  }
}

export function parsePublicSupabaseEnv(
  source: PublicEnvSource,
): PublicSupabaseEnv {
  const url = source.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = (
    source.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    source.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )?.trim();

  const missing: string[] = [];
  if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!publishableKey) {
    missing.push(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)",
    );
  }

  if (missing.length > 0) {
    throw new EnvironmentConfigurationError(
      `Missing required public environment variable${missing.length > 1 ? "s" : ""}: ${missing.join(
        ", ",
      )}. Copy .env.example to .env.local and add your Supabase project values.`,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url as string);
  } catch {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP(S) URL.",
    );
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL must use HTTP or HTTPS.",
    );
  }

  if (
    publishableKey?.startsWith("sb_secret_") ||
    decodeJwtRole(publishableKey as string) === "service_role"
  ) {
    throw new EnvironmentConfigurationError(
      "A Supabase service-role/secret key cannot be exposed through NEXT_PUBLIC_* variables. Use the publishable or legacy anon key.",
    );
  }

  return {
    url: parsedUrl.toString().replace(/\/$/, ""),
    publishableKey: publishableKey as string,
  };
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  // Keep each access explicit so Next.js can safely inline NEXT_PUBLIC_* values.
  return parsePublicSupabaseEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
