import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Field, Notice, PrimaryButton } from "@/components/ui";
import { supabase } from "@/lib/supabase";

export default function UpdatePasswordScreen() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirmation) return setError("Passwords do not match.");
    setLoading(true); setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) setError(updateError.message);
    else router.replace("/dashboard");
  }

  return <View className="flex-1 justify-center bg-slate-50 px-6"><View className="mx-auto w-full max-w-md gap-5"><Text className="text-3xl font-black text-slate-950">Choose a new password</Text>{error ? <Notice tone="error">{error}</Notice> : null}<Field label="New password" secureTextEntry value={password} onChangeText={setPassword} /><Field label="Confirm password" secureTextEntry value={confirmation} onChangeText={setConfirmation} /><PrimaryButton onPress={() => void submit()} loading={loading}>Update password</PrimaryButton></View></View>;
}
