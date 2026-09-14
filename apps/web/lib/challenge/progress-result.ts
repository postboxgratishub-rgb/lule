import { z } from "zod";

import type { ProgressRpcResult } from "@/lib/challenge/types";

const nullableTimestamp = z.string().nullable().optional().transform((value) => value ?? null);

const dailyProgressSchema = z
  .object({
    challenge_day_id: z.string(),
    videos_completed: z.coerce.number().nonnegative(),
    videos_total: z.coerce.number().nonnegative(),
    watch_time_seconds: z.coerce.number().nonnegative(),
    completion_percentage: z.coerce.number().nonnegative(),
    completed: z.boolean(),
  })
  .nullable()
  .optional()
  .transform((value) => value ?? null);

const progressResultSchema = z.object({
  video_id: z.string(),
  watched_seconds: z.coerce.number().nonnegative(),
  last_position_seconds: z.coerce.number().nonnegative(),
  completion_percentage: z.coerce.number().nonnegative(),
  completion_threshold: z.coerce.number().positive(),
  eligible_to_complete: z.boolean(),
  completed: z.boolean(),
  first_started_at: nullableTimestamp,
  last_watched_at: nullableTimestamp,
  completed_at: nullableTimestamp,
  total_sessions: z.coerce.number().int().nonnegative(),
  accepted_delta_seconds: z.coerce.number().nonnegative().optional(),
  daily_progress: dailyProgressSchema,
});

export function parseProgressRpcResult(value: unknown): ProgressRpcResult {
  const result = progressResultSchema.safeParse(value);
  if (!result.success) {
    throw new Error("The progress service returned an unexpected response.");
  }
  return result.data;
}
