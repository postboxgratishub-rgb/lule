import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type Href, router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { CenteredState, Notice, PrimaryButton } from "@/components/ui";
import { isReleased } from "@/lib/challenge-state";
import { useAuth } from "@/lib/auth-context";
import { formatPlayerTime } from "@/lib/playback-math";
import { supabase } from "@/lib/supabase";
import { getDayContent, type LearningVideo, type VideoProgress } from "@/services/learning";
import { getMyProfile } from "@/services/profile";

function LessonCard({
  dayNumber,
  video,
  progress,
}: {
  dayNumber: number;
  video: LearningVideo;
  progress: VideoProgress | null;
}) {
  const completed = progress?.completed ?? false;
  const active = !completed && (progress?.watched_seconds ?? 0) > 0;
  const state = completed ? "Completed" : active ? "Continue watching" : "Not started";
  const progressPercent = Math.min(100, progress?.completion_percentage ?? 0);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Video ${video.video_number}, ${video.title}, ${state}`}
      onPress={() => router.push(`/days/${dayNumber}/videos/${video.video_number}` as Href)}
      className="mb-3 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm active:opacity-70"
    >
      <View className="flex-row items-start gap-4">
        <View className={`h-12 w-12 items-center justify-center rounded-2xl ${completed ? "bg-emerald-100" : active ? "bg-amber-100" : "bg-teal-50"}`}>
          <Text className={`text-base font-black ${completed ? "text-emerald-700" : active ? "text-amber-700" : "text-brand-700"}`}>
            {completed ? "✓" : video.video_number}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-xs font-black uppercase tracking-[1.5px] text-brand-700">Video {video.video_number}</Text>
          <Text className="mt-1 text-lg font-extrabold leading-6 text-slate-950">{video.title}</Text>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs font-semibold text-slate-500">{formatPlayerTime(video.duration_seconds)}</Text>
            <Text className={`text-xs font-bold ${completed ? "text-emerald-700" : active ? "text-amber-700" : "text-slate-500"}`}>{state}</Text>
          </View>
          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <View className={`h-full rounded-full ${completed ? "bg-emerald-500" : "bg-brand-600"}`} style={{ width: `${progressPercent}%` }} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function DayScreen() {
  const params = useLocalSearchParams<{ dayNumber: string }>();
  const dayNumber = Number(params.dayNumber);
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["profile", session!.user.id],
    queryFn: () => getMyProfile(session!.user.id),
  });
  const content = useQuery({
    queryKey: ["day-content", dayNumber, profile.data?.id],
    queryFn: () => getDayContent(dayNumber, profile.data!.id),
    enabled: Number.isInteger(dayNumber) && dayNumber > 0 && Boolean(profile.data?.id),
  });
  const studentId = profile.data?.id;
  const refetchContent = content.refetch;

  useFocusEffect(useCallback(() => {
    if (!studentId) return;
    void refetchContent();
    const channel = supabase
      .channel(`mobile-day-progress-${studentId}-${dayNumber}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "video_progress", filter: `student_id=eq.${studentId}` },
        (payload) => {
          const row = payload.new as VideoProgress & { student_id?: string };
          if (row.student_id && row.student_id !== studentId) return;
          queryClient.setQueryData<Awaited<ReturnType<typeof getDayContent>>>(
            ["day-content", dayNumber, studentId],
            (current) => {
              if (!current?.videos.some((video) => video.id === row.video_id)) return current;
              return {
                ...current,
                progress: [
                  ...current.progress.filter((item) => item.video_id !== row.video_id),
                  row,
                ],
              };
            },
          );
        },
      )
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [dayNumber, queryClient, refetchContent, studentId]));

  const progressByVideo = useMemo(
    () => new Map((content.data?.progress ?? []).map((progress) => [progress.video_id, progress])),
    [content.data?.progress],
  );

  if (!Number.isInteger(dayNumber) || dayNumber < 1 || dayNumber > 100) {
    return <CenteredState title="Invalid learning day" detail="Return to your roadmap and choose a day from the list." action={<PrimaryButton onPress={() => router.replace("/dashboard")}>Back to roadmap</PrimaryButton>} />;
  }

  if (profile.isLoading || content.isLoading) {
    return <CenteredState title={`Loading Day ${dayNumber}`} detail="Retrieving the latest lessons and progress." action={<ActivityIndicator color="#0F766E" size="large" />} />;
  }

  if (!profile.data || !content.data) {
    return <CenteredState title="This day is unavailable" detail="It may not be published yet, or your connection was interrupted." action={<PrimaryButton loading={content.isFetching} onPress={() => void content.refetch()}>Try again</PrimaryButton>} />;
  }

  if (!isReleased(content.data.day, content.data.settings.timezone)) {
    return <CenteredState title={`Day ${dayNumber} is locked`} detail={content.data.day.release_date ? `This day releases on ${content.data.day.release_date}.` : "An administrator has not released this learning day yet."} action={<PrimaryButton onPress={() => router.back()}>Back to roadmap</PrimaryButton>} />;
  }

  const completed = content.data.progress.filter((progress) => progress.completed).length;
  const total = content.data.settings.videos_per_day;
  const percent = Math.round((completed / Math.max(1, total)) * 100);

  return (
    <FlatList
      className="flex-1 bg-slate-50"
      data={content.data.videos}
      keyExtractor={(video) => video.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 54, paddingBottom: 80 }}
      refreshControl={<RefreshControl refreshing={content.isRefetching} onRefresh={() => void content.refetch()} tintColor="#0F766E" />}
      renderItem={({ item }) => <LessonCard dayNumber={dayNumber} video={item} progress={progressByVideo.get(item.id) ?? null} />}
      ListHeaderComponent={
        <View className="mb-7">
          <Pressable accessibilityRole="button" onPress={() => router.back()} className="mb-6 self-start rounded-full bg-white px-4 py-2 active:opacity-70">
            <Text className="font-bold text-brand-800">← Roadmap</Text>
          </Pressable>
          <Text className="text-sm font-black uppercase tracking-[3px] text-brand-700">Day {dayNumber}</Text>
          <Text className="mt-3 text-3xl font-black leading-9 text-slate-950">{content.data.day.title}</Text>
          {profile.isRefetchError || content.isRefetchError ? (
            <View className="mt-4"><Notice>Showing saved lessons while the latest progress reconnects.</Notice></View>
          ) : null}
          {content.data.day.description ? <Text className="mt-3 text-base leading-6 text-slate-600">{content.data.day.description}</Text> : null}
          <View className="mt-6 rounded-3xl bg-brand-900 p-5">
            <View className="flex-row items-end justify-between">
              <View>
                <Text className="text-3xl font-black text-white">{completed} / {total}</Text>
                <Text className="mt-1 text-sm text-brand-100">videos completed</Text>
              </View>
              <Text className="text-xl font-black text-white">{percent}%</Text>
            </View>
            <View className="mt-4 h-2 overflow-hidden rounded-full bg-brand-700"><View className="h-full rounded-full bg-white" style={{ width: `${percent}%` }} /></View>
          </View>
          <Text className="mt-7 text-xl font-black text-slate-950">Today’s lessons</Text>
          <Text className="mt-1 text-sm text-slate-500">Watch at least {content.data.settings.video_completion_threshold}% before marking a video complete.</Text>
        </View>
      }
      ListEmptyComponent={
        <View className="rounded-3xl border border-dashed border-slate-300 bg-white p-7"><Text className="text-center font-bold text-slate-800">No published videos yet</Text><Text className="mt-2 text-center text-sm leading-5 text-slate-500">The day is open, but its lessons are still being prepared.</Text></View>
      }
    />
  );
}
