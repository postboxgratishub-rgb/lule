import type { ZodError } from "zod";

export type FieldErrors = Record<string, string | undefined>;

export function zodFieldErrors(error: ZodError): FieldErrors {
  const flattened = error.flatten().fieldErrors;

  return Object.fromEntries(
    Object.entries(flattened).map(([field, messages]) => [field, messages?.[0]]),
  );
}
