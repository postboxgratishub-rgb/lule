"use client";

import { CalendarDays, Save } from "lucide-react";
import { useActionState } from "react";

import { saveChallengeDayAction } from "@/app/actions/content";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { ChallengeDay } from "@/types";
import { INITIAL_ACTION_STATE } from "@/types";

export function ChallengeDayForm({ day }: { day?: ChallengeDay }) {
  const [state, action] = useActionState(
    saveChallengeDayAction,
    INITIAL_ACTION_STATE,
  );
  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];
  const prefix = day ? `day-${day.id}` : "new-day";

  return (
    <form action={action} className="space-y-5" noValidate>
      {day && <input type="hidden" name="id" value={day.id} />}
      <ActionMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
        <div>
          <label className="field-label" htmlFor={`${prefix}-number`}>
            Day number <span className="text-red-600">*</span>
          </label>
          <input
            className="field-input"
            id={`${prefix}-number`}
            name="day_number"
            type="number"
            min={1}
            max={100}
            step={1}
            defaultValue={day?.day_number}
            placeholder="1"
            aria-invalid={fieldError("day_number") ? true : undefined}
            aria-describedby={
              fieldError("day_number") ? `${prefix}-number-error` : undefined
            }
            required
          />
          {fieldError("day_number") && (
            <p className="field-error" id={`${prefix}-number-error`}>
              {fieldError("day_number")}
            </p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={`${prefix}-title`}>
            Title <span className="text-red-600">*</span>
          </label>
          <input
            className="field-input"
            id={`${prefix}-title`}
            name="title"
            defaultValue={day?.title}
            maxLength={200}
            placeholder="Getting started with the challenge"
            aria-invalid={fieldError("title") ? true : undefined}
            aria-describedby={
              fieldError("title") ? `${prefix}-title-error` : undefined
            }
            required
          />
          {fieldError("title") && (
            <p className="field-error" id={`${prefix}-title-error`}>
              {fieldError("title")}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor={`${prefix}-description`}>
          Description
        </label>
        <textarea
          className="field-input min-h-28 resize-y"
          id={`${prefix}-description`}
          name="description"
          defaultValue={day?.description ?? ""}
          maxLength={10000}
          placeholder="What students will learn on this day"
          aria-invalid={fieldError("description") ? true : undefined}
          aria-describedby={
            fieldError("description") ? `${prefix}-description-error` : undefined
          }
        />
        {fieldError("description") && (
          <p className="field-error" id={`${prefix}-description-error`}>
            {fieldError("description")}
          </p>
        )}
      </div>

      <div className="max-w-xs">
        <label className="field-label" htmlFor={`${prefix}-release-date`}>
          Release date
        </label>
        <input
          className="field-input"
          id={`${prefix}-release-date`}
          name="release_date"
          type="date"
          defaultValue={day?.release_date ?? ""}
          aria-invalid={fieldError("release_date") ? true : undefined}
          aria-describedby={
            fieldError("release_date")
              ? `${prefix}-release-date-error`
              : `${prefix}-release-date-help`
          }
        />
        {fieldError("release_date") ? (
          <p className="field-error" id={`${prefix}-release-date-error`}>
            {fieldError("release_date")}
          </p>
        ) : (
          <p className="mt-1.5 text-xs leading-5 text-ink-500" id={`${prefix}-release-date-help`}>
            Required before this day can be published.
          </p>
        )}
      </div>

      <div className="flex justify-end border-t border-slate-100 pt-5">
        <SubmitButton
          className="button-primary w-full sm:w-auto"
          pendingLabel={day ? "Saving day…" : "Creating day…"}
        >
          {day ? (
            <Save className="size-4" aria-hidden="true" />
          ) : (
            <CalendarDays className="size-4" aria-hidden="true" />
          )}
          {day ? "Save day details" : "Create and add videos"}
        </SubmitButton>
      </div>
    </form>
  );
}
