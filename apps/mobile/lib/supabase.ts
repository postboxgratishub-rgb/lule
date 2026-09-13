import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { mobileEnv } from "./env";

function createMobileClient() {
  return createClient(mobileEnv.supabaseUrl, mobileEnv.supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      // Browsers need a cross-tab navigator lock; native runtimes use the
      // single-process lock recommended by Supabase for React Native.
      lock: Platform.OS === "web" ? undefined : processLock,
    },
  });
}

type MobileSupabaseClient = ReturnType<typeof createMobileClient>;
const runtime = globalThis as typeof globalThis & {
  __hundredDaysSupabase?: MobileSupabaseClient;
};

export const supabase = runtime.__hundredDaysSupabase ?? createMobileClient();

// Preserve one Auth client through Expo Fast Refresh and browser hot reloads.
runtime.__hundredDaysSupabase = supabase;
