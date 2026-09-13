const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const mobileEnv = {
  supabaseUrl: supabaseUrl ?? "https://configuration-required.invalid",
  supabaseAnonKey: supabaseAnonKey ?? "configuration-required",
  appScheme: process.env.EXPO_PUBLIC_APP_SCHEME?.trim() || "hundreddays",
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey),
} as const;
