"use client";

import { useActionState } from "react";

import { updatePasswordAction } from "@/app/actions/auth";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { INITIAL_ACTION_STATE } from "@/types";

export function UpdatePasswordForm() {
  const [state, action] = useActionState(updatePasswordAction, INITIAL_ACTION_STATE);

  return (
    <form action={action} className="space-y-5" noValidate>
      <ActionMessage state={state} />
      <div>
        <label className="field-label" htmlFor="password">
          New password
        </label>
        <input
          className="field-input"
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby="password-hint password-error"
          required
        />
        <p className="mt-1.5 text-xs leading-5 text-ink-500" id="password-hint">
          At least 12 characters, with upper and lowercase letters and a number.
        </p>
        {state.fieldErrors?.password?.[0] && (
          <p className="field-error" id="password-error">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>
      <div>
        <label className="field-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          className="field-input"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-describedby={
            state.fieldErrors?.confirmPassword ? "confirm-password-error" : undefined
          }
          required
        />
        {state.fieldErrors?.confirmPassword?.[0] && (
          <p className="field-error" id="confirm-password-error">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        )}
      </div>
      <SubmitButton pendingLabel="Updating…">Update password</SubmitButton>
    </form>
  );
}
