"use client";

import { useActionState } from "react";

import { requestPasswordResetAction } from "@/app/actions/auth";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { INITIAL_ACTION_STATE } from "@/types";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(
    requestPasswordResetAction,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <ActionMessage state={state} />
      <div>
        <label className="field-label" htmlFor="email">
          Administrator email
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
      <SubmitButton pendingLabel="Sending…">Send recovery link</SubmitButton>
    </form>
  );
}
