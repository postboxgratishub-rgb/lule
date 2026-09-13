import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { safeNextPath } from "@/lib/authorization";

export const metadata: Metadata = { title: "Sign in" };

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const requestedNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const notice =
    error === "not_authorized"
      ? "Your account is signed in, but it is not authorized for this admin portal."
      : error === "recovery_failed"
        ? "That recovery link is invalid or expired. Request a new one."
        : null;

  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
          Sign in to your dashboard
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Manage schools and student records from one secure workspace.
        </p>
      </div>
      {notice && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900" role="alert">
          {notice}
        </div>
      )}
      <LoginForm next={safeNextPath(requestedNext)} />
    </>
  );
}
