import "../global.css";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CenteredState } from "@/components/ui";
import { AuthProvider } from "@/lib/auth-context";
import { mobileEnv } from "@/lib/env";

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 2, staleTime: 30_000 },
      mutations: { retry: 0 },
    },
  }));

  if (!mobileEnv.isConfigured) {
    return (
      <SafeAreaProvider>
        <CenteredState
          title="Configuration required"
          detail="Copy .env.example to .env and add the Expo public Supabase URL and anon key, then restart Expo."
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(student)" />
            <Stack.Screen name="unauthorized" />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
