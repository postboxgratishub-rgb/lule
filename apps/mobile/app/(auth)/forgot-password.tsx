import * as Linking from "expo-linking";
import { Link } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { BrandLogo } from "@/components/brand-logo";
import { Field, Notice, PrimaryButton } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true); setError(null); setMessage(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: Linking.createURL("/update-password") });
    setLoading(false);
    if (resetError) setError(resetError.message);
    else setMessage("If an account exists for that address, a reset link is on its way.");
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-center bg-slate-50 px-6"><View className="mx-auto w-full max-w-md gap-5"><View className="items-center"><BrandLogo compact /></View><Text className="text-3xl font-black text-slate-950">Reset password</Text><Text className="leading-6 text-slate-600">We’ll send a secure recovery link to your email.</Text>{message ? <Notice tone="success">{message}</Notice> : null}{error ? <Notice tone="error">{error}</Notice> : null}<Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><PrimaryButton onPress={() => void submit()} loading={loading} disabled={!email}>Send recovery link</PrimaryButton><Link href="/login" className="text-center font-bold text-brand-700">Back to sign in</Link></View></KeyboardAvoidingView>;
}
