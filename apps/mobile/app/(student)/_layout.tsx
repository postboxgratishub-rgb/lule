import { useQuery } from "@tanstack/react-query";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { CenteredState, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { resolveStudentGate } from "@/lib/student-gate";
import { getMyProfile } from "@/services/profile";

export default function StudentLayout() {
  const { session, isLoading } = useAuth();
  const profile = useQuery({
    queryKey: ["profile", session?.user.id],
    queryFn: () => getMyProfile(session!.user.id),
    enabled: Boolean(session),
  });

  const gate = resolveStudentGate({
    authLoading: isLoading,
    hasSession: Boolean(session),
    profileLoading: profile.isLoading,
    profileError: profile.isError,
    role: profile.data?.role,
  });

  if (gate === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator color="#0F766E" size="large" />
        <Text className="mt-3 text-slate-500">Loading your account…</Text>
      </View>
    );
  }

  if (gate === "unauthenticated") return <Redirect href="/login" />;

  if (gate === "error") {
    return (
      <CenteredState
        title="We couldn’t verify your student profile"
        detail="Your learning area stays locked until your profile can be verified. Check your connection and try again."
        action={
          <PrimaryButton
            loading={profile.isFetching}
            onPress={() => void profile.refetch()}
          >
            Retry profile check
          </PrimaryButton>
        }
      />
    );
  }

  if (gate === "unauthorized") return <Redirect href="/unauthorized" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0F766E",
        tabBarStyle: { height: 66, paddingBottom: 9, paddingTop: 7 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 18 }}>⌂</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 17 }}>●</Text>
          ),
        }}
      />
    </Tabs>
  );
}
