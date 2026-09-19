import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Href, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";

import { BrandLogo } from "@/components/brand-logo";
import { CenteredState, Notice, PrimaryButton, StatCard } from "@/components/ui";
import { buildDayTiles, type DayTile } from "@/lib/challenge-state";
import { useAuth } from "@/lib/auth-context";
import { flushPendingProgress } from "@/lib/progress-queue";
import { supabase } from "@/lib/supabase";
import { getChallengeHome, type DailyProgress } from "@/services/learning";
import { getMyProfile } from "@/services/profile";

const tileStyles: Record<DayTile["state"], { shell: string; eyebrow: string; badge: string; label: string }> = {
  locked: { shell: "border-slate-200 bg-slate-100", eyebrow: "text-slate-400", badge: "bg-slate-200 text-slate-500", label: "Locked" },
  available: { shell: "border-teal-200 bg-white", eyebrow: "text-brand-700", badge: "bg-teal-50 text-brand-800", label: "Available" },
  in_progress: { shell: "border-amber-200 bg-amber-50", eyebrow: "text-amber-700", badge: "bg-amber-100 text-amber-800", label: "In progress" },
  completed: { shell: "border-emerald-200 bg-emerald-50", eyebrow: "text-emerald-700", badge: "bg-emerald-100 text-emerald-800", label: "Completed" },
};

function DayCard({ tile }: { tile: DayTile }) {
  const style = tileStyles[tile.state];
  const enabled = tile.state !== "locked" && tile.day;
  const completed = tile.progress?.videos_completed ?? 0;
  const total = tile.progress?.videos_total ?? 10;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Day ${tile.dayNumber}, ${style.label}`}
      disabled={!enabled}
      onPress={() => router.push(`/days/${tile.dayNumber}` as Href)}
      className={`min-h-44 flex-1 rounded-3xl border p-4 ${style.shell} ${enabled ? "active:opacity-70" : "opacity-80"}`}
    >
      <Text className={`text-xs font-black uppercase tracking-[2px] ${style.eyebrow}`}>
        Day {tile.dayNumber}
      </Text>
      <Text className="mt-3 text-base font-extrabold leading-5 text-slate-950" numberOfLines={2}>
        {tile.day?.title ?? "Coming soon"}
      </Text>
      <View className="mt-auto pt-4">
        <Text className="text-xs font-semibold text-slate-500">
          {tile.state === "locked" ? "Content unavailable" : `${completed} / ${total} videos`}
        </Text>
        <View className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <View
            className="h-full rounded-full bg-brand-600"
            style={{ width: `${Math.min(100, tile.progress?.completion_percentage ?? 0)}%` }}
          />
        </View>
        <Text className={`mt-3 self-start rounded-full px-2.5 py-1 text-[11px] font-bold ${style.badge}`}>
          {style.label}
        </Text>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", session!.user.id],
    queryFn: () => getMyProfile(session!.user.id),
  });
  const challenge = useQuery({
    queryKey: ["challenge-home", profile.data?.id],
    queryFn: () => getChallengeHome(profile.data!.id),
    enabled: Boolean(profile.data?.id),
  });
  const studentId = profile.data?.id;
  const refetchProfile = profile.refetch;
  const refetchChallenge = challenge.refetch;

  const refresh = useCallback(async () => {
    try {
      if (studentId) await flushPendingProgress(studentId);
    } catch {
      // A storage/network retry must never prevent fresh server data loading.
    }
    await Promise.all([refetchProfile(), refetchChallenge()]);
  }, [refetchChallenge, refetchProfile, studentId]);

  useFocusEffect(useCallback(() => {
    if (!studentId) return;
    void flushPendingProgress(studentId).then(() => {
      void queryClient.invalidateQueries({ queryKey: ["challenge-home"] });
    });
  }, [queryClient, studentId]));

  useFocusEffect(useCallback(() => {
    if (!studentId) return;
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    const channel = supabase
      .channel(`mobile-daily-progress-${studentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "daily_progress", filter: `student_id=eq.${studentId}` },
        (payload) => {
          const row = payload.new as DailyProgress & { student_id?: string };
          if (row.student_id && row.student_id !== studentId) return;
          queryClient.setQueryData<Awaited<ReturnType<typeof getChallengeHome>>>(
            ["challenge-home", studentId],
            (current) => current ? {
              ...current,
              dailyProgress: [
                ...current.dailyProgress.filter((item) => item.challenge_day_id !== row.challenge_day_id),
                row,
              ],
            } : current,
          );
        },
      )
      .subscribe();
    return () => {
      appState.remove();
      void supabase.removeChannel(channel);
    };
  }, [queryClient, refresh, studentId]));

  const tiles = useMemo(() => {
    if (!challenge.data) return [];
    return buildDayTiles({
      totalDays: challenge.data.settings.total_days,
      days: challenge.data.days,
      dailyProgress: challenge.data.dailyProgress,
      timezone: challenge.data.settings.timezone,
    });
  }, [challenge.data]);

  if (profile.isLoading || (challenge.isLoading && !challenge.data)) {
    return (
      <CenteredState
        title="Loading your challenge"
        detail="Synchronizing lessons and progress across your devices."
        action={<ActivityIndicator color="#0F766E" size="large" />}
      />
    );
  }

  if (!profile.data) {
    return (
      <CenteredState
        title="Your profile could not be loaded"
        detail="Check your connection and try again."
        action={<PrimaryButton loading={profile.isFetching} onPress={() => void profile.refetch()}>Retry</PrimaryButton>}
      />
    );
  }

  if (!challenge.data) {
    return (
      <CenteredState
        title="Your challenge could not be loaded"
        detail="Your saved progress is safe. Reconnect and try again."
        action={<PrimaryButton loading={challenge.isFetching} onPress={() => void refresh()}>Retry</PrimaryButton>}
      />
    );
  }

  const firstName = profile.data.full_name.trim().split(/\s+/)[0];
  const completedDays = tiles.filter((tile) => tile.state === "completed").length;
  const availableDays = tiles.filter((tile) => tile.state !== "locked").length;
  const totalCompletedVideos = challenge.data.dailyProgress.reduce((sum, day) => sum + day.videos_completed, 0);

  return (
    <FlatList
      className="flex-1 bg-slate-50"
      data={tiles}
      keyExtractor={(item) => String(item.dayNumber)}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 58, paddingBottom: 110, gap: 12 }}
      refreshControl={
        <RefreshControl refreshing={profile.isRefetching || challenge.isRefetching} onRefresh={() => void refresh()} tintColor="#0F766E" />
      }
      renderItem={({ item }) => <DayCard tile={item} />}
      ListHeaderComponent={
        <View className="mb-5">
          <View className="mb-4">
            <BrandLogo compact />
          </View>
          <Text className="text-sm font-bold uppercase tracking-[3px] text-brand-700">
            {challenge.data.settings.organization_name}
          </Text>
          <Text className="mt-3 text-3xl font-black text-slate-950">Welcome, {firstName}</Text>
          <Text className="mt-2 text-base text-slate-600">Pick up exactly where you stopped on any device.</Text>

          {profile.isRefetchError || challenge.isRefetchError ? (
            <View className="mt-5"><Notice>Showing saved content while the latest update reconnects.</Notice></View>
          ) : null}

          <View className="mt-7 overflow-hidden rounded-[28px] bg-brand-900 p-6">
            <Text className="text-sm font-bold uppercase tracking-widest text-brand-100">
              {challenge.data.settings.program_name}
            </Text>
            <View className="mt-4 flex-row items-end justify-between">
              <View>
                <Text className="text-4xl font-black text-white">{completedDays}/{challenge.data.settings.total_days}</Text>
                <Text className="mt-1 text-sm text-brand-100">learning days completed</Text>
              </View>
              <Text className="text-2xl font-black text-white">
                {Math.round((completedDays / Math.max(1, challenge.data.settings.total_days)) * 100)}%
              </Text>
            </View>
            <View className="mt-5 h-2 overflow-hidden rounded-full bg-brand-700">
              <View className="h-full rounded-full bg-white" style={{ width: `${(completedDays / Math.max(1, challenge.data.settings.total_days)) * 100}%` }} />
            </View>
          </View>

          <View className="mt-4 flex-row flex-wrap gap-3">
            <StatCard label="Open days" value={`${availableDays}`} detail="Published and released" />
            <StatCard label="Videos done" value={`${totalCompletedVideos}`} detail="Confirmed by the server" />
            <StatCard
              label="School"
              value={profile.data.school?.code ?? "—"}
              detail={
                profile.data.school
                  ? [profile.data.school.name, profile.data.school.block_name]
                      .filter(Boolean)
                      .join(" · ")
                  : "Not linked"
              }
            />
            <StatCard label="Class" value={profile.data.class_name ?? "—"} detail={profile.data.section ? `Section ${profile.data.section}` : "Not provided"} />
          </View>

          {availableDays === 0 ? (
            <View className="mt-5"><Notice>Your first learning day will appear as soon as an administrator publishes it.</Notice></View>
          ) : null}
          <Text className="mb-1 mt-7 text-xl font-black text-slate-950">100-day roadmap</Text>
          <Text className="text-sm text-slate-500">Published lessons unlock according to their release date.</Text>
        </View>
      }
    />
  );
}
