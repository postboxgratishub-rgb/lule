import { z } from "zod";

import { todayInIndia } from "@/lib/format";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable(),
  );

export const schoolFormSchema = z.object({
  id: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.uuid().optional(),
  ),
  name: z.string().trim().min(2, "Enter the school name.").max(200),
  code: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(32)
    .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores only.")
    .transform((value) => value.toUpperCase()),
  address: optionalText(500),
  city: optionalText(100),
  state: optionalText(100),
  contact_name: optionalText(150),
  contact_phone: optionalText(30),
});

export const studentProfileFormSchema = z.object({
  id: z.uuid(),
  full_name: z.string().trim().min(2, "Enter the student's name.").max(150),
  phone: optionalText(30),
  school_id: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.uuid().nullable(),
  ),
  class_name: optionalText(50),
  section: optionalText(30),
  roll_number: optionalText(50),
  date_of_birth: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .date("Enter a valid date.")
      .refine((value) => value <= todayInIndia(), {
        message: "Date of birth cannot be in the future.",
      })
      .nullable(),
  ),
});

export function zodFieldErrors(error: z.ZodError) {
  return Object.fromEntries(
    Object.entries(z.flattenError(error).fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}
