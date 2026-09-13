const required = (value: string | undefined, name: string) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export function getSupabaseEnvironment() {
  return {
    url: required(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    anonKey: required(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  };
}

export function getAdminBaseUrl() {
  return (process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001").replace(
    /\/$/,
    "",
  );
}
