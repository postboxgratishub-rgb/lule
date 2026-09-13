import { useQuery } from "@tanstack/react-query";
import { registrationSchema } from "@100-days/validation";
import * as Linking from "expo-linking";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Field, Notice, PrimaryButton } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { getSchools } from "@/services/profile";

type Form = {
  fullName: string; email: string; phone: string; password: string; schoolId: string;
  className: string; section: string; rollNumber: string; dateOfBirth: string;
};

const initialForm: Form = { fullName: "", email: "", phone: "", password: "", schoolId: "", className: "", section: "", rollNumber: "", dateOfBirth: "" };

export default function RegisterScreen() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const schools = useQuery({ queryKey: ["schools", "public"], queryFn: getSchools });
  const canSubmit = useMemo(() => Object.values(form).every((value) => value.trim().length > 0) && form.password.length >= 8, [form]);
  const update = (key: keyof Form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    const validated = registrationSchema.safeParse(form);
    if (!validated.success) {
      setError(validated.error.issues[0]?.message ?? "Check your registration details.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: validated.data.email,
        password: validated.data.password,
        options: {
          emailRedirectTo: Linking.createURL("/login"),
          data: {
            full_name: validated.data.fullName,
            phone: validated.data.phone,
            school_id: validated.data.schoolId,
            class_name: validated.data.className,
            section: validated.data.section,
            roll_number: validated.data.rollNumber,
            date_of_birth: validated.data.dateOfBirth,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.session) {
        router.replace("/dashboard");
      } else {
        setSuccess(true);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn’t create your account. Check your connection and retry.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <View className="flex-1 justify-center bg-slate-50 px-6"><Notice tone="success">Account created. Check your email to confirm it, then sign in.</Notice><View className="mt-6"><Link href="/login" className="text-center text-lg font-bold text-brand-700">Back to sign in</Link></View></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-slate-50">
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-6 py-12">
        <View className="mx-auto w-full max-w-md gap-5">
          <View><Text className="text-3xl font-black text-slate-950">Join the challenge</Text><Text className="mt-2 leading-6 text-slate-600">Your progress will stay synchronized across mobile and web.</Text></View>
          {error ? <Notice tone="error">{error}</Notice> : null}
          <Field label="Full name" value={form.fullName} onChangeText={update("fullName")} autoComplete="name" />
          <Field label="Email" value={form.email} onChangeText={update("email")} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
          <Field label="Mobile number" value={form.phone} onChangeText={update("phone")} keyboardType="phone-pad" autoComplete="tel" placeholder="+919876543210" />
          <Field label="Password" value={form.password} onChangeText={update("password")} secureTextEntry autoComplete="new-password" placeholder="8+ characters, upper/lowercase and number" />
          <View className="gap-2">
            <Text className="text-sm font-semibold text-slate-700">School</Text>
            {schools.isLoading ? <Text className="text-slate-500">Loading schools…</Text> : schools.isError ? <Notice tone="error">Could not load schools. Check your connection and retry.</Notice> : schools.data?.length ? (
              <View className="gap-2">{schools.data.map((school) => <Pressable key={school.id} onPress={() => update("schoolId")(school.id)} className={`rounded-2xl border p-4 ${form.schoolId === school.id ? "border-brand-700 bg-brand-50" : "border-slate-200 bg-white"}`}><Text className="font-bold text-slate-900">{school.name}</Text><Text className="mt-1 text-sm text-slate-500">{school.code}{school.city ? ` · ${school.city}` : ""}</Text></Pressable>)}</View>
            ) : <Notice>No schools are available yet. Ask an administrator to add your school.</Notice>}
          </View>
          <View className="flex-row gap-3"><View className="flex-1"><Field label="Class" value={form.className} onChangeText={update("className")} /></View><View className="flex-1"><Field label="Section" value={form.section} onChangeText={update("section")} /></View></View>
          <Field label="Roll number" value={form.rollNumber} onChangeText={update("rollNumber")} />
          <Field label="Date of birth" value={form.dateOfBirth} onChangeText={update("dateOfBirth")} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          <PrimaryButton onPress={() => void submit()} loading={loading} disabled={!canSubmit}>Create student account</PrimaryButton>
          <Text className="text-center text-slate-600">Already registered? <Link href="/login" className="font-bold text-brand-700">Sign in</Link></Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
