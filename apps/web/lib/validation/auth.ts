import { z } from "zod";

const todayIso = () => new Date().toISOString().slice(0, 10);

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use no more than 72 characters.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

const phoneSchema = z
  .string()
  .trim()
  .min(7, "Enter a valid mobile number.")
  .max(20, "Enter a valid mobile number.")
  .refine(
    (value) => /^\+?[0-9 ()-]{7,20}$/.test(value),
    "Use only digits and common phone symbols.",
  )
  .refine((value) => {
    const digitCount = value.replace(/\D/g, "").length;
    return digitCount >= 7 && digitCount <= 15;
  }, "Enter a mobile number with 7 to 15 digits.");

function isValidDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() + 1 === Number(month) &&
    parsed.getUTCDate() === Number(day)
  );
}

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
});

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export const registrationSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter the student's full name.")
      .max(100, "Name is too long."),
    email: z.string().trim().email("Enter a valid email address."),
    phone: phoneSchema,
    schoolId: z.string().uuid("Select a school."),
    className: z
      .string()
      .trim()
      .min(1, "Enter a class or grade.")
      .max(30, "Class is too long."),
    section: z
      .string()
      .trim()
      .min(1, "Enter a section.")
      .max(20, "Section is too long."),
    rollNumber: z
      .string()
      .trim()
      .min(1, "Enter a roll number.")
      .max(30, "Roll number is too long."),
    dateOfBirth: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.")
      .refine(isValidDateOnly, "Enter a valid date of birth.")
      .refine((date) => date >= "1900-01-01", "Enter a valid date of birth.")
      .refine(
        (date) => date <= todayIso(),
        "Date of birth cannot be in the future.",
      ),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((value, context) => {
    if (value.password !== value.confirmPassword) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

export type RegistrationValues = z.infer<typeof registrationSchema>;

export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}
