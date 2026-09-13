import type { ComponentProps, PropsWithChildren, ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

export function Field({ label, error, ...props }: ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-slate-700">{label}</Text>
      <TextInput
        className={`min-h-14 rounded-2xl border bg-white px-4 text-base text-slate-950 ${error ? "border-red-400" : "border-slate-200"}`}
        placeholderTextColor="#94A3B8"
        {...props}
      />
      {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ children, loading = false, disabled = false, onPress }: PropsWithChildren<{ loading?: boolean; disabled?: boolean; onPress: () => void }>) {
  const inactive = loading || disabled;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={inactive}
      onPress={onPress}
      className={`min-h-14 items-center justify-center rounded-2xl px-5 ${inactive ? "bg-slate-300" : "bg-brand-700 active:bg-brand-900"}`}
    >
      {loading ? <ActivityIndicator color="white" /> : <Text className="text-base font-bold text-white">{children}</Text>}
    </Pressable>
  );
}

export function Notice({ tone = "info", children }: PropsWithChildren<{ tone?: "info" | "error" | "success" }>) {
  const style = tone === "error" ? "border-red-200 bg-red-50 text-red-800" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-teal-200 bg-teal-50 text-teal-900";
  return (
    <View className={`rounded-2xl border p-4 ${style}`}>
      <Text className={style.split(" ").find((item) => item.startsWith("text-"))}>{children}</Text>
    </View>
  );
}

export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <View className="min-w-[47%] flex-1 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
      <Text className="mt-2 text-3xl font-extrabold text-slate-950">{value}</Text>
      <Text className="mt-1 text-xs text-slate-500">{detail}</Text>
    </View>
  );
}

export function CenteredState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50 px-8">
      <View className="w-full max-w-md rounded-3xl bg-white p-7 shadow-sm">
        <Text className="text-center text-xl font-bold text-slate-950">{title}</Text>
        <Text className="mt-2 text-center leading-6 text-slate-600">{detail}</Text>
        {action ? <View className="mt-5">{action}</View> : null}
      </View>
    </View>
  );
}
