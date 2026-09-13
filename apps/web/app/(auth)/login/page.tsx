import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Student sign in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const rawMessage = Array.isArray(params.message)
    ? params.message[0]
    : params.message;

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in with your student account to continue your 100-day journey."
    >
      <LoginForm
        nextPath={safeRedirectPath(rawNext)}
        initialMessage={rawMessage}
      />
    </AuthCard>
  );
}
