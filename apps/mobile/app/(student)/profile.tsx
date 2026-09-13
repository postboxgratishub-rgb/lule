import { useQueryClient, useQuery } from "@tanstack/react-query";
import { Alert, ScrollView, Text, View } from "react-native";
import { Notice, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { getMyProfile } from "@/services/profile";

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <View className="border-b border-slate-100 py-4"><Text className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</Text><Text className="mt-1 text-base font-semibold text-slate-900">{value || "Not provided"}</Text></View>;
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile", session!.user.id], queryFn: () => getMyProfile(session!.user.id) });
  async function logout() {
    try { await signOut(); queryClient.clear(); } catch (error) { Alert.alert("Could not sign out", error instanceof Error ? error.message : "Please retry."); }
  }
  return <ScrollView className="flex-1 bg-slate-50" contentContainerClassName="px-5 pb-10 pt-16"><View className="mx-auto w-full max-w-2xl"><Text className="text-3xl font-black text-slate-950">Student profile</Text><Text className="mt-2 text-slate-600">This identity is shared by the mobile app and website.</Text>{profile.isError ? <View className="mt-5"><Notice tone="error">We couldn’t load your profile.</Notice></View> : null}<View className="mt-7 rounded-3xl bg-white px-6 py-2 shadow-sm"><Detail label="Full name" value={profile.data?.full_name} /><Detail label="Email" value={profile.data?.email} /><Detail label="Phone" value={profile.data?.phone} /><Detail label="School" value={profile.data?.school?.name} /><Detail label="Class and section" value={[profile.data?.class_name, profile.data?.section].filter(Boolean).join(" · ")} /><Detail label="Roll number" value={profile.data?.roll_number} /><Detail label="Date of birth" value={profile.data?.date_of_birth} /></View><View className="mt-6"><PrimaryButton onPress={() => void logout()}>Sign out</PrimaryButton></View></View></ScrollView>;
}
