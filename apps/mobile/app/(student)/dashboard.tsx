import { useQuery } from "@tanstack/react-query";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";

import {
  CenteredState,
  Notice,
  PrimaryButton,
  StatCard,
} from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { getMyProfile } from "@/services/profile";

export default function DashboardScreen() {
  const { session } = useAuth();
  const profile = useQuery({
    queryKey: ["profile", session!.user.id],
    queryFn: () => getMyProfile(session!.user.id),
  });
  const settings = useQuery({
    queryKey: ["challenge-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_settings")
        .select(
          "program_name,organization_name,total_days,videos_per_day,timezone",
        )
        .eq("id", 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (profile.isLoading) {
    return (
      <CenteredState
        title="Loading your dashboard"
        detail="We’re securely retrieving your student profile."
        action={<ActivityIndicator color="#0F766E" size="large" />}
      />
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <CenteredState
        title="Your profile could not be loaded"
        detail="No profile details have been substituted. Check your connection and try again."
        action={
          <PrimaryButton
            loading={profile.isFetching}
            onPress={() => void profile.refetch()}
          >
            Retry
          </PrimaryButton>
        }
      />
    );
  }

  const firstName = profile.data.full_name.trim().split(/\s+/)[0];
  const refresh = () =>
    void Promise.all([profile.refetch(), settings.refetch()]);

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      refreshControl={
        <RefreshControl
          refreshing={profile.isRefetching || settings.isRefetching}
          onRefresh={refresh}
          tintColor="#0F766E"
        />
      }
      contentContainerClassName="px-5 pb-10 pt-16"
    >
      <View className="mx-auto w-full max-w-2xl">
        {settings.data ? (
          <Text className="text-sm font-bold uppercase tracking-[3px] text-brand-700">
            {settings.data.organization_name}
          </Text>
        ) : null}
        <Text className="mt-3 text-3xl font-black text-slate-950">
          Welcome, {firstName}
        </Text>
        <Text className="mt-2 text-base text-slate-600">
          Your learning foundation is ready.
        </Text>

        {settings.isLoading ? (
          <View className="mt-7 items-center rounded-[28px] bg-brand-900 p-8">
            <ActivityIndicator color="white" size="large" />
            <Text className="mt-3 text-sm text-brand-100">
              Loading program settings…
            </Text>
          </View>
        ) : settings.isError ? (
          <View className="mt-7 gap-4">
            <Notice tone="error">
              Program settings could not be loaded. No challenge values or
              progress have been assumed.
            </Notice>
            <PrimaryButton
              loading={settings.isFetching}
              onPress={() => void settings.refetch()}
            >
              Retry program settings
            </PrimaryButton>
          </View>
        ) : settings.data ? (
          <>
            <View className="mt-7 rounded-[28px] bg-brand-900 p-6">
              <Text className="text-sm font-bold uppercase tracking-widest text-brand-100">
                {settings.data.program_name}
              </Text>
              <Text className="mt-4 text-2xl font-black text-white">
                Challenge content arrives in Phase 2
              </Text>
              <Text className="mt-3 text-sm leading-6 text-brand-100">
                Challenge days and lessons are not published in this foundation
                phase. Your account and school profile are synchronized now.
              </Text>
            </View>

            <View className="mt-5 flex-row flex-wrap gap-3">
              <StatCard
                label="Learning days"
                value={`${settings.data.total_days}`}
                detail="Configured program structure"
              />
              <StatCard
                label="Videos / day"
                value={`${settings.data.videos_per_day}`}
                detail="Released in Phase 2"
              />
              <StatCard
                label="School"
                value={profile.data.school?.code ?? "—"}
                detail={profile.data.school?.name ?? "Not linked"}
              />
              <StatCard
                label="Class"
                value={profile.data.class_name ?? "—"}
                detail={
                  profile.data.section
                    ? `Section ${profile.data.section}`
                    : "Not provided"
                }
              />
            </View>

            <View className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white p-6">
              <Text className="text-lg font-bold text-slate-900">
                Learning roadmap
              </Text>
              <Text className="mt-2 leading-6 text-slate-600">
                Days and lessons will appear here once an administrator publishes
                challenge content in Phase 2.
              </Text>
            </View>
          </>
        ) : (
          <View className="mt-7">
            <Notice>
              Program settings are not available yet. Pull down to check again.
            </Notice>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
