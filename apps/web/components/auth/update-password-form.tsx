"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { readableAuthError } from "@/components/auth/auth-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";
import { updatePasswordSchema } from "@/lib/validation/auth";
import {
  type FieldErrors,
  zodFieldErrors,
} from "@/lib/validation/errors";

export function UpdatePasswordForm() {
  const [pending, setPending] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const parsed = updatePasswordSchema.safeParse({
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
    });

    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    setPending(true);
    try {
      const { error: updateError } = await createClient().auth.updateUser({
        password: parsed.data.password,
      });
      if (updateError) {
        setError(readableAuthError(updateError.message));
        return;
      }
      setUpdated(true);
    } catch (caught) {
      setError(
        readableAuthError(
          caught instanceof Error
            ? caught.message
            : "Unable to update your password.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  if (updated) {
    return (
      <div className="space-y-5">
        <Alert title="Password updated" variant="success">
          Your new password is active. You can continue to your dashboard.
        </Alert>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Continue to dashboard
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {error ? <Alert variant="error">{error}</Alert> : null}
      <FormField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        hint="At least 8 characters, including a letter and a number."
        error={fieldErrors.password}
        required
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={fieldErrors.confirmPassword}
        required
      />
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? <Spinner label="Updating password…" /> : "Update password"}
      </Button>
    </form>
  );
}
