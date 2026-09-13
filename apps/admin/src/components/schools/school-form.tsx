"use client";

import { Save } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { saveSchoolAction } from "@/app/actions/schools";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import type { School } from "@/types";
import { INITIAL_ACTION_STATE } from "@/types";

export function SchoolForm({ school }: { school?: School }) {
  const [state, action] = useActionState(saveSchoolAction, INITIAL_ACTION_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success" && !school) formRef.current?.reset();
  }, [school, state.status]);

  const fieldError = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form ref={formRef} action={action} className="space-y-5" noValidate>
      {school && <input type="hidden" name="id" value={school.id} />}
      <ActionMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <label className="field-label" htmlFor="school-name">
            School name <span className="text-red-600">*</span>
          </label>
          <input
            className="field-input"
            id="school-name"
            name="name"
            defaultValue={school?.name}
            placeholder="Greenwood Public School"
            maxLength={200}
            aria-invalid={fieldError("name") ? true : undefined}
            aria-describedby={fieldError("name") ? "school-name-error" : undefined}
            required
          />
          {fieldError("name") && (
            <p className="field-error" id="school-name-error">
              {fieldError("name")}
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="school-code">
            School code <span className="text-red-600">*</span>
          </label>
          <input
            className="field-input uppercase"
            id="school-code"
            name="code"
            defaultValue={school?.code}
            placeholder="GPS-01"
            autoCapitalize="characters"
            maxLength={32}
            aria-invalid={fieldError("code") ? true : undefined}
            aria-describedby={fieldError("code") ? "school-code-error" : undefined}
            required
          />
          {fieldError("code") && (
            <p className="field-error" id="school-code-error">
              {fieldError("code")}
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="school-address">
          Address
        </label>
        <textarea
          className="field-input min-h-24 resize-y"
          id="school-address"
          name="address"
          defaultValue={school?.address ?? ""}
          placeholder="Street and locality"
          maxLength={500}
          aria-invalid={fieldError("address") ? true : undefined}
          aria-describedby={fieldError("address") ? "school-address-error" : undefined}
        />
        {fieldError("address") && (
          <p className="field-error" id="school-address-error">
            {fieldError("address")}
          </p>
        )}
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="school-city">
            City
          </label>
          <input
            className="field-input"
            id="school-city"
            name="city"
            defaultValue={school?.city ?? ""}
            maxLength={100}
            aria-invalid={fieldError("city") ? true : undefined}
            aria-describedby={fieldError("city") ? "school-city-error" : undefined}
          />
          {fieldError("city") && (
            <p className="field-error" id="school-city-error">
              {fieldError("city")}
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="school-state">
            State
          </label>
          <input
            className="field-input"
            id="school-state"
            name="state"
            defaultValue={school?.state ?? ""}
            maxLength={100}
            aria-invalid={fieldError("state") ? true : undefined}
            aria-describedby={fieldError("state") ? "school-state-error" : undefined}
          />
          {fieldError("state") && (
            <p className="field-error" id="school-state-error">
              {fieldError("state")}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="contact-name">
            Contact person
          </label>
          <input
            className="field-input"
            id="contact-name"
            name="contact_name"
            defaultValue={school?.contact_name ?? ""}
            maxLength={150}
            aria-invalid={fieldError("contact_name") ? true : undefined}
            aria-describedby={
              fieldError("contact_name") ? "contact-name-error" : undefined
            }
          />
          {fieldError("contact_name") && (
            <p className="field-error" id="contact-name-error">
              {fieldError("contact_name")}
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="contact-phone">
            Contact phone
          </label>
          <input
            className="field-input"
            id="contact-phone"
            name="contact_phone"
            type="tel"
            defaultValue={school?.contact_phone ?? ""}
            maxLength={30}
            aria-invalid={fieldError("contact_phone") ? true : undefined}
            aria-describedby={
              fieldError("contact_phone") ? "contact-phone-error" : undefined
            }
          />
          {fieldError("contact_phone") && (
            <p className="field-error" id="contact-phone-error">
              {fieldError("contact_phone")}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <SubmitButton
          className="button-primary w-full sm:w-auto"
          pendingLabel={school ? "Updating…" : "Creating…"}
        >
          <Save className="size-4" aria-hidden="true" />
          {school ? "Save changes" : "Create school"}
        </SubmitButton>
      </div>
    </form>
  );
}
