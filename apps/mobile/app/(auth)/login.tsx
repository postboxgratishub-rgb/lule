import { Link, Redirect, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { Field, Notice, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

export default function LoginScreen() {
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session) return <Redirect href="/dashboard" />;

  async function submit() {
    setLoading(true);
    setError(null);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("auth_user_id", data.user.id).single();
    setLoading(false);
    router.replace(profile?.role === "student" ? "/dashboard" : "/unauthorized");
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-slate-50">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="flex-grow justify-center px-6 py-12">
        <View className="mx-auto w-full max-w-md">
          <View className="mb-9">
            <Text className="text-sm font-bold uppercase tracking-[3px] text-brand-700">100 days</Text>
            <Text className="mt-3 text-4xl font-black tracking-tight text-slate-950">Welcome back</Text>
            <Text className="mt-3 text-base leading-6 text-slate-600">Sign in to continue your learning journey on any device.</Text>
          </View>
          <View className="gap-5 rounded-3xl bg-white p-6 shadow-sm">
            {error ? <Notice tone="error">{error}</Notice> : null}
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="student@example.com" />
            <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" placeholder="Your password" />
            <View className="items-end"><Link href="/forgot-password" className="font-semibold text-brand-700">Forgot password?</Link></View>
            <PrimaryButton onPress={() => void submit()} loading={loading} disabled={!email || !password}>Sign in</PrimaryButton>
          </View>
          <Text className="mt-7 text-center text-slate-600">New to the challenge? <Link href="/register" className="font-bold text-brand-700">Create account</Link></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
