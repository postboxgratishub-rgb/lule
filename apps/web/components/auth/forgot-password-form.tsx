"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { readableAuthError } from "@/components/auth/auth-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import {
  type FieldErrors,
  zodFieldErrors,
} from "@/lib/validation/errors";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const parsed = forgotPasswordSchema.safeParse({ email: form.get("email") });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setPending(true);
    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/update-password");
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(
        parsed.data.email,
        { redirectTo: callbackUrl.toString() },
      );

      if (resetError) {
        setError(readableAuthError(resetError.message));
        return;
      }

      setSent(true);
    } catch (caught) {
      setError(
        readableAuthError(
          caught instanceof Error
            ? caught.message
            : "Unable to request a reset link.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-5">
        <Alert title="Check your email" variant="success">
          If an account exists for that address, a secure password-reset link is
          on its way.
        </Alert>
        <Link
          href="/login"
          className="block text-center text-sm font-semibold text-brand-600 hover:underline"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField
        label="Email address"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="student@example.com"
        error={fieldErrors.email}
        required
      />
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? <Spinner label="Sending link…" /> : "Send reset link"}
      </Button>
      <Link
        href="/login"
        className="block text-center text-sm font-semibold text-slate-600 hover:text-ink hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
