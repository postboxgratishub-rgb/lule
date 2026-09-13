"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { studentProfileFormSchema, zodFieldErrors } from "@/lib/validation";
import type { ActionState } from "@/types";

export async function updateStudentProfileAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = studentProfileFormSchema.safeParse({
    id: formData.get("id"),
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    school_id: formData.get("school_id"),
    class_name: formData.get("class_name"),
    section: formData.get("section"),
    roll_number: formData.get("roll_number"),
    date_of_birth: formData.get("date_of_birth"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  await assertAdmin();
  const supabase = await createClient();
  const { id, ...values } = parsed.data;
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select(
      "full_name, phone, school_id, class_name, section, roll_number, date_of_birth",
    )
    .eq("id", id)
    .eq("role", "student")
    .maybeSingle();

  if (readError || !existing) {
    return { status: "error", message: "This student profile no longer exists." };
  }

  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", id)
    .eq("role", "student");

  if (error) {
    return {
      status: "error",
      message: "The student profile could not be updated. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { status: "success", message: "Student profile updated." };
}
