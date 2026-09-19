"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { readableAuthError } from "@/components/auth/auth-error-message";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, SelectField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";
import {
  groupSchoolsByBlock,
  type SchoolDirectoryOption,
} from "@/lib/schools";
import { createClient } from "@/lib/supabase/client";
import {
  normalizePhone,
  registrationSchema,
} from "@/lib/validation/auth";
import {
  type FieldErrors,
  zodFieldErrors,
} from "@/lib/validation/errors";

type SchoolState =
  | { status: "loading"; schools: SchoolDirectoryOption[]; message: null }
  | { status: "ready"; schools: SchoolDirectoryOption[]; message: null }
  | { status: "error"; schools: SchoolDirectoryOption[]; message: string };

export function RegisterForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [reloadSchools, setReloadSchools] = useState(0);
  const [schoolState, setSchoolState] = useState<SchoolState>({
    status: "loading",
    schools: [],
    message: null,
  });

  useEffect(() => {
    let isCurrent = true;

    async function loadSchools() {
      setSchoolState({ status: "loading", schools: [], message: null });
      try {
        const supabase = createClient();
        const { data, error: schoolsError } = await supabase
          .from("schools")
          .select("id,name,code,block_name,city,state")
          .order("block_name", { ascending: true, nullsFirst: false })
          .order("name", { ascending: true });

        if (schoolsError) throw schoolsError;
        if (!isCurrent) return;
        setSchoolState({
          status: "ready",
          schools: data ?? [],
          message: null,
        });
      } catch (caught) {
        if (!isCurrent) return;
        setSchoolState({
          status: "error",
          schools: [],
          message:
            caught instanceof Error
              ? readableAuthError(caught.message)
              : "Schools could not be loaded.",
        });
      }
    }

    void loadSchools();
    return () => {
      isCurrent = false;
    };
  }, [reloadSchools]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const parsed = registrationSchema.safeParse({
      fullName: form.get("fullName"),
      email: form.get("email"),
      phone: form.get("phone"),
      schoolId: form.get("schoolId"),
      className: form.get("className"),
      section: form.get("section"),
      rollNumber: form.get("rollNumber"),
      dateOfBirth: form.get("dateOfBirth"),
      password: form.get("password"),
      confirmPassword: form.get("confirmPassword"),
    });

    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }

    if (schoolState.status !== "ready") {
      setError("Wait for the school list to load, then try again.");
      return;
    }

    if (!schoolState.schools.some((school) => school.id === parsed.data.schoolId)) {
      setFieldErrors({ schoolId: "Select a school from the current list." });
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", "/dashboard");

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          data: {
            full_name: parsed.data.fullName,
            phone: normalizePhone(parsed.data.phone),
            school_id: parsed.data.schoolId,
            class_name: parsed.data.className,
            section: parsed.data.section,
            roll_number: parsed.data.rollNumber,
            date_of_birth: parsed.data.dateOfBirth,
          },
        },
      });

      if (signUpError) {
        setError(readableAuthError(signUpError.message));
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessEmail(parsed.data.email);
    } catch (caught) {
      setError(
        readableAuthError(
          caught instanceof Error
            ? caught.message
            : "Unable to create your account.",
        ),
      );
    } finally {
      setPending(false);
    }
  }

  if (successEmail) {
    return (
      <div className="space-y-5">
        <Alert title="Check your inbox" variant="success">
          We sent an account confirmation link to <strong>{successEmail}</strong>.
          Open it on this device to finish signing in.
        </Alert>
        <p className="text-sm leading-6 text-slate-600">
          The message can take a few minutes. Check spam or promotions if it does
          not appear.
        </p>
        <Link
          href="/login"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {error ? <Alert variant="error">{error}</Alert> : null}

      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          Your details
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField
              label="Full name"
              name="fullName"
              autoComplete="name"
              placeholder="Student's full name"
              error={fieldErrors.fullName}
              required
            />
          </div>
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
          <FormField
            label="Mobile number"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+91 98765 43210"
            error={fieldErrors.phone}
            required
          />
          <FormField
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            autoComplete="bday"
            max={new Date().toISOString().slice(0, 10)}
            error={fieldErrors.dateOfBirth}
            required
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          School details
        </legend>

        {schoolState.status === "error" ? (
          <Alert title="School list unavailable" variant="error">
            <p>{schoolState.message}</p>
            <button
              type="button"
              className="mt-2 font-semibold underline underline-offset-2"
              onClick={() => setReloadSchools((value) => value + 1)}
            >
              Try loading schools again
            </button>
          </Alert>
        ) : null}

        {schoolState.status === "ready" && schoolState.schools.length === 0 ? (
          <Alert title="No schools available">
            Registration will open after an administrator adds a school. Please
            check back later.
          </Alert>
        ) : null}

        <SelectField
          label="School"
          name="schoolId"
          defaultValue=""
          disabled={
            schoolState.status !== "ready" || schoolState.schools.length === 0
          }
          error={fieldErrors.schoolId}
          hint={
            schoolState.status === "loading"
              ? "Loading schools from the learning platform…"
              : undefined
          }
          required
        >
          <option value="" disabled>
            {schoolState.status === "loading"
              ? "Loading schools…"
              : "Select your school"}
          </option>
          {groupSchoolsByBlock(schoolState.schools).map((group) => (
            <optgroup key={group.blockName} label={group.blockName}>
              {group.schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                  {school.city ? ` · ${school.city}` : ""}
                </option>
              ))}
            </optgroup>
          ))}
        </SelectField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="Class / grade"
            name="className"
            autoComplete="off"
            placeholder="e.g. 8"
            error={fieldErrors.className}
            required
          />
          <FormField
            label="Section"
            name="section"
            autoComplete="off"
            placeholder="e.g. A"
            error={fieldErrors.section}
            required
          />
          <FormField
            label="Roll number"
            name="rollNumber"
            autoComplete="off"
            placeholder="e.g. 24"
            error={fieldErrors.rollNumber}
            required
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-500">
          Secure your account
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters, including a letter and a number."
            error={fieldErrors.password}
            required
          />
          <FormField
            label="Confirm password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            error={fieldErrors.confirmPassword}
            required
          />
        </div>
      </fieldset>

      <Button
        className="w-full"
        type="submit"
        disabled={
          pending ||
          schoolState.status !== "ready" ||
          schoolState.schools.length === 0
        }
      >
        {pending ? <Spinner label="Creating account…" /> : "Create student account"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Already registered?{" "}
        <Link
          href="/login"
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
