import { z } from "zod";

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must contain at least 8 characters")
  .max(72, "Password cannot exceed 72 characters")
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number");

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registrationSchema = z.object({
  fullName: requiredText("Full name"),
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "Enter a valid mobile number"),
  password: passwordSchema,
  schoolId: z.string().uuid("Select a school"),
  className: requiredText("Class", 40),
  section: requiredText("Section", 20),
  rollNumber: requiredText("Roll number", 40),
  dateOfBirth: z
    .string()
    .date("Enter a valid date of birth")
    .refine((date) => new Date(`${date}T00:00:00Z`) < new Date(), "Date of birth must be in the past"),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const schoolSchema = z.object({
  name: requiredText("School name"),
  code: z.string().trim().min(2).max(30).regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, - or _").transform((value) => value.toUpperCase()),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(80).optional().or(z.literal("")),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactPhone: z.string().trim().regex(/^\+?[0-9]{10,15}$/).optional().or(z.literal("")),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;
export type SchoolInput = z.infer<typeof schoolSchema>;
