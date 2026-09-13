"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction } from "@/app/actions/auth";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { INITIAL_ACTION_STATE } from "@/types";

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [state, action] = useActionState(loginAction, INITIAL_ACTION_STATE);

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <ActionMessage state={state} />
      <div>
        <label className="field-label" htmlFor="email">
          Email address
        </label>
        <input
          className="field-input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          placeholder="admin@example.org"
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          required
        />
        {state.fieldErrors?.email?.[0] && (
          <p className="field-error" id="email-error">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-4">
          <label className="block text-sm font-semibold text-ink-900" htmlFor="password">
            Password
          </label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-brand-700 hover:text-brand-900 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          className="field-input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-describedby={state.fieldErrors?.password ? "password-error" : undefined}
          required
        />
        {state.fieldErrors?.password?.[0] && (
          <p className="field-error" id="password-error">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>
      <SubmitButton pendingLabel="Signing in…">Sign in securely</SubmitButton>
    </form>
  );
}
