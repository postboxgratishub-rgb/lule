"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { readableAuthError } from "@/components/auth/auth-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { loginSchema } from "@/lib/validation/auth";
import {
  type FieldErrors,
  zodFieldErrors,
} from "@/lib/validation/errors";

export function LoginForm({
  nextPath,
  initialMessage,
}: {
  nextPath: string;
  initialMessage?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const parsed = loginSchema.safeParse({
      email: form.get("email"),
      password: form.get("password"),
    });

    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });

      if (signInError) {
        setError(readableAuthError(signInError.message));
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(
        readableAuthError(
          caught instanceof Error ? caught.message : "Unable to sign in.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {initialMessage ? <Alert>{initialMessage}</Alert> : null}
      {error ? <Alert variant="error">{error}</Alert> : null}

      <FormField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="student@example.com"
        error={fieldErrors.email}
        required
      />

      <div>
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          error={fieldErrors.password}
          required
        />
        <div className="mt-2 text-right">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? <Spinner label="Signing in…" /> : "Sign in"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        New to the challenge?{" "}
        <Link
          href="/register"
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
