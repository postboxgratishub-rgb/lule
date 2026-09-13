"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { safeNextPath } from "@/lib/authorization";
import { getAdminBaseUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/types";

const emailSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
});

const loginSchema = emailSchema.extend({
  password: z.string().min(1, "Enter your password."),
});

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(12, "Use at least 12 characters.")
      .regex(/[a-z]/, "Include a lowercase letter.")
      .regex(/[A-Z]/, "Include an uppercase letter.")
      .regex(/\d/, "Include a number."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

function validationState(error: z.ZodError): ActionState {
  const fieldErrors = Object.fromEntries(
    Object.entries(z.flattenError(error).fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );

  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors,
  };
}

export async function loginAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: "The email or password is incorrect.",
    };
  }

  const { data: isAdmin, error: roleError } = await supabase.rpc("is_admin");
  if (roleError || isAdmin !== true) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "This account does not have administrator access.",
    };
  }

  redirect(safeNextPath(String(formData.get("next") ?? "")));
}

export async function requestPasswordResetAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getAdminBaseUrl()}/auth/callback?next=/update-password`,
  });

  // The same response is intentional: it prevents account enumeration.
  return {
    status: "success",
    message:
      "If an administrator account exists for that address, a reset link is on its way.",
  };
}

export async function updatePasswordAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return validationState(parsed.error);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "This recovery link has expired. Request a new one.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return {
      status: "error",
      message: "We could not update the password. Request a new recovery link.",
    };
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (isAdmin !== true) {
    await supabase.auth.signOut();
    redirect("/login?error=not_authorized");
  }

  redirect("/dashboard?passwordUpdated=1");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
