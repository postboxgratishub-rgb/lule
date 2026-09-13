import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/lib/auth-context";

export default function IndexScreen() {
  const { session, isLoading } = useAuth();
  if (isLoading) {
    return <View className="flex-1 items-center justify-center bg-slate-50"><ActivityIndicator color="#0F766E" size="large" /></View>;
  }
  return <Redirect href={session ? "/dashboard" : "/login"} />;
}
