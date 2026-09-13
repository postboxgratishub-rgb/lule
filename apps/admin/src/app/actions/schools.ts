"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { schoolFormSchema, zodFieldErrors } from "@/lib/validation";
import type { ActionState } from "@/types";

function schoolInput(formData: FormData) {
  return {
    id: formData.get("id"),
    name: formData.get("name"),
    code: formData.get("code"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    contact_name: formData.get("contact_name"),
    contact_phone: formData.get("contact_phone"),
  };
}

function mutationError(error: { code?: string; message?: string }): ActionState {
  if (error.code === "23505") {
    return {
      status: "error",
      message: "That school code is already in use.",
      fieldErrors: { code: ["Choose a unique school code."] },
    };
  }

  return {
    status: "error",
    message: "The school could not be saved. Please try again.",
  };
}

export async function saveSchoolAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = schoolFormSchema.safeParse(schoolInput(formData));
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
  let entityId = id;

  if (id) {
    const { data: existing, error: readError } = await supabase
      .from("schools")
      .select("name, code, address, city, state, contact_name, contact_phone")
      .eq("id", id)
      .maybeSingle();

    if (readError || !existing) {
      return { status: "error", message: "This school no longer exists." };
    }
    const { error } = await supabase.from("schools").update(values).eq("id", id);
    if (error) return mutationError(error);
  } else {
    const { data, error } = await supabase
      .from("schools")
      .insert(values)
      .select("id")
      .single();
    if (error) return mutationError(error);
    entityId = data.id;
  }

  revalidatePath("/dashboard");
  revalidatePath("/schools");
  if (entityId) revalidatePath(`/schools/${entityId}/edit`);

  return {
    status: "success",
    message: id ? "School details updated." : "School created successfully.",
  };
}

export async function deleteSchoolAction(id: string): Promise<ActionState> {
  const parsedId = schoolFormSchema.shape.id.safeParse(id);
  if (!parsedId.success || !parsedId.data) {
    return { status: "error", message: "Invalid school record." };
  }

  await assertAdmin();
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("school_id", parsedId.data)
    .eq("role", "student");

  if (countError) {
    return { status: "error", message: "Could not verify school membership." };
  }
  if ((count ?? 0) > 0) {
    return {
      status: "error",
      message: `Reassign ${count} student${count === 1 ? "" : "s"} before deleting this school.`,
    };
  }

  const { error } = await supabase.from("schools").delete().eq("id", parsedId.data);

  if (error) {
    return {
      status: "error",
      message: "The school could not be deleted. It may still have linked records.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/schools");
  return { status: "success", message: "School deleted." };
}
