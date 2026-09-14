import { z } from "zod";

import { todayInIndia } from "@/lib/format";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().trim().max(max).nullable(),
  );

const optionalHttpUrl = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z
      .string()
      .trim()
      .max(max, `Use a URL shorter than ${max.toLocaleString("en-IN")} characters.`)
      .url("Enter a valid URL.")
      .regex(/^https?:\/\//i, "Enter a full http:// or https:// URL.")
      .nullable(),
  );

const optionalUuid = z.preprocess(
  (value) =>
    value == null || (typeof value === "string" && value.trim() === "")
      ? undefined
      : value,
  z.uuid().optional(),
);

const formCheckbox = z.preprocess(
  (value) =>
    value === true || value === "true" || value === "on" || value === "1",
  z.boolean(),
);

export const schoolFormSchema = z.object({
  id: optionalUuid,
  name: z.string().trim().min(2, "Enter the school name.").max(200),
  code: z
    .string()
    .trim()
    .min(2, "Use at least 2 characters.")
    .max(32)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
      "Start with a letter or number, then use letters, numbers, hyphens, or underscores.",
    )
    .transform((value) => value.toUpperCase()),
  address: optionalText(500),
  city: optionalText(100),
  state: optionalText(100),
  contact_name: optionalText(150),
  contact_phone: optionalText(30),
});

export const challengeDayFormSchema = z.object({
  id: optionalUuid,
  day_number: z.coerce
    .number("Enter a day number.")
    .int("Day number must be a whole number.")
    .min(1, "Day number must be at least 1.")
    .max(100, "Day number cannot be greater than 100."),
  title: z.string().trim().min(2, "Enter the day title.").max(200),
  description: optionalText(10000),
  release_date: z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? null : value),
    z.string().date("Enter a valid release date.").nullable(),
  ),
});

export const videoSourceTypes = [
  "external_url",
  "cloudflare_stream",
  "mux",
] as const;

export const videoFormSchema = z
  .object({
    id: optionalUuid,
    challenge_day_id: z.uuid("Choose a valid challenge day."),
    video_number: z.coerce
      .number("Enter a video number.")
      .int("Video number must be a whole number.")
      .min(1, "Video number must be at least 1.")
      .max(10, "Video number cannot be greater than 10."),
    title: z.string().trim().min(2, "Enter the video title.").max(250),
    description: optionalText(10000),
    duration_seconds: z.coerce
      .number("Enter the duration in seconds.")
      .int("Duration must use whole seconds.")
      .min(1, "Duration must be at least 1 second.")
      .max(43200, "Duration cannot be longer than 12 hours."),
    thumbnail_url: optionalHttpUrl(4096),
    video_source_type: z.enum(videoSourceTypes, {
      message: "Choose a supported video source.",
    }),
    video_url: optionalHttpUrl(8192),
    playback_id: z.preprocess(
      (value) => (typeof value === "string" && value.trim() === "" ? null : value),
      z
        .string()
        .trim()
        .max(512)
        .regex(
          /^[A-Za-z0-9._/-]+$/,
          "Playback ID can contain letters, numbers, dots, slashes, hyphens, and underscores.",
        )
        .nullable(),
    ),
    is_published: formCheckbox,
  })
  .superRefine((video, context) => {
    if (video.video_source_type === "external_url" && !video.video_url) {
      context.addIssue({
        code: "custom",
        path: ["video_url"],
        message: "Enter the external video URL.",
      });
    }

    if (
      (video.video_source_type === "cloudflare_stream" ||
        video.video_source_type === "mux") &&
      !video.playback_id
    ) {
      context.addIssue({
        code: "custom",
        path: ["playback_id"],
        message: "Enter the provider playback ID.",
      });
    }
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

export function zodPathErrors(error: z.ZodError) {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!path) continue;
    fields[path] = [...(fields[path] ?? []), issue.message];
  }

  return fields;
}
