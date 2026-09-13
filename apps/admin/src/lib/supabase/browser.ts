"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseEnvironment } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnvironment();
    browserClient = createBrowserClient(url, anonKey);
  }

  return browserClient;
}
