"use client";

import { Save } from "lucide-react";
import { useActionState } from "react";

import { updateStudentProfileAction } from "@/app/actions/students";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import { todayInIndia } from "@/lib/format";
import type { ProfileWithSchool } from "@/types";
import { INITIAL_ACTION_STATE } from "@/types";

interface SchoolOption {
  id: string;
  name: string;
  code: string;
}

export function StudentProfileForm({
  student,
  schools,
}: {
  student: ProfileWithSchool;
  schools: SchoolOption[];
}) {
  const [state, action] = useActionState(
    updateStudentProfileAction,
    INITIAL_ACTION_STATE,
  );
  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="id" value={student.id} />
      <ActionMessage state={state} />
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="full-name">
            Full name <span className="text-red-600">*</span>
          </label>
          <input
            className="field-input"
            id="full-name"
            name="full_name"
            defaultValue={student.full_name}
            aria-describedby={errorFor("full_name") ? "full-name-error" : undefined}
            required
          />
          {errorFor("full_name") && (
            <p className="field-error" id="full-name-error">
              {errorFor("full_name")}
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="student-phone">
            Mobile number
          </label>
          <input
            className="field-input"
            id="student-phone"
            name="phone"
            type="tel"
            defaultValue={student.phone ?? ""}
          />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="school-id">
          School
        </label>
        <select
          className="field-input"
          id="school-id"
          name="school_id"
          defaultValue={student.school_id ?? ""}
        >
          <option value="">Not assigned</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name} ({school.code})
            </option>
          ))}
        </select>
        {errorFor("school_id") && <p className="field-error">{errorFor("school_id")}</p>}
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="class-name">
            Class
          </label>
          <input
            className="field-input"
            id="class-name"
            name="class_name"
            defaultValue={student.class_name ?? ""}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="section">
            Section
          </label>
          <input
            className="field-input"
            id="section"
            name="section"
            defaultValue={student.section ?? ""}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="roll-number">
            Roll number
          </label>
          <input
            className="field-input"
            id="roll-number"
            name="roll_number"
            defaultValue={student.roll_number ?? ""}
          />
        </div>
      </div>
      <div className="max-w-xs">
        <label className="field-label" htmlFor="date-of-birth">
          Date of birth
        </label>
        <input
          className="field-input"
          id="date-of-birth"
          name="date_of_birth"
          type="date"
          max={todayInIndia()}
          defaultValue={student.date_of_birth ?? ""}
        />
        {errorFor("date_of_birth") && (
          <p className="field-error">{errorFor("date_of_birth")}</p>
        )}
      </div>
      <div className="flex justify-end border-t border-slate-100 pt-5">
        <SubmitButton className="button-primary w-full sm:w-auto" pendingLabel="Saving…">
          <Save className="size-4" aria-hidden="true" />
          Save student
        </SubmitButton>
      </div>
    </form>
  );
}
