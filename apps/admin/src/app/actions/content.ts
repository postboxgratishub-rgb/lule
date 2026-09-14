"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertAdmin } from "@/lib/auth";
import {
  getDayPublicationReadiness,
  moveOrderedVideoIds,
  VIDEO_SLOTS_PER_DAY,
} from "@/lib/content";
import { createClient } from "@/lib/supabase/server";
import {
  challengeDayFormSchema,
  videoFormSchema,
  zodFieldErrors,
} from "@/lib/validation";
import type { ActionState, Video } from "@/types";

const UUID_SCHEMA = z.uuid();

function contentPaths(dayId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/content");
  if (dayId) revalidatePath(`/content/${dayId}`);
}

function challengeDayInput(formData: FormData) {
  return {
    id: formData.get("id"),
    day_number: formData.get("day_number"),
    title: formData.get("title"),
    description: formData.get("description"),
    release_date: formData.get("release_date"),
  };
}

function databaseMutationError(
  error: { code?: string },
  entity: "day" | "video",
): ActionState {
  if (error.code === "23505") {
    return entity === "day"
      ? {
          status: "error",
          message: "That day number already exists.",
          fieldErrors: { day_number: ["Choose an unused day number."] },
        }
      : {
          status: "error",
          message: "One or more video slots are already in use.",
        };
  }

  return {
    status: "error",
    message: `The ${entity} could not be saved. Please try again.`,
  };
}

export async function saveChallengeDayAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = challengeDayFormSchema.safeParse(challengeDayInput(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "Check the highlighted day fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  await assertAdmin();
  const supabase = await createClient();
  const { id, ...values } = parsed.data;
  let entityId = id;

  if (id) {
    const { data: existing, error: readError } = await supabase
      .from("challenge_days")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (readError || !existing) {
      return { status: "error", message: "This challenge day no longer exists." };
    }

    const { error } = await supabase
      .from("challenge_days")
      .update(values)
      .eq("id", id);
    if (error) return databaseMutationError(error, "day");
  } else {
    const { data, error } = await supabase
      .from("challenge_days")
      .insert(values)
      .select("id")
      .single();
    if (error) return databaseMutationError(error, "day");
    entityId = data.id;
  }

  contentPaths(entityId);
  if (!id && entityId) redirect(`/content/${entityId}?created=1`);

  return { status: "success", message: "Challenge day details updated." };
}

export async function setChallengeDayPublishedAction(
  dayId: string,
  publish: boolean,
): Promise<ActionState> {
  const parsedId = UUID_SCHEMA.safeParse(dayId);
  if (!parsedId.success) {
    return { status: "error", message: "Invalid challenge day." };
  }

  await assertAdmin();
  const supabase = await createClient();
  const { data, error: readError } = await supabase
    .from("challenge_days")
    .select("id, release_date, is_published, videos(video_number, is_published)")
    .eq("id", parsedId.data)
    .maybeSingle();

  if (readError || !data) {
    return { status: "error", message: "This challenge day no longer exists." };
  }

  if (publish) {
    const videos = Array.isArray(data.videos)
      ? (data.videos as Pick<Video, "video_number" | "is_published">[])
      : [];
    const readiness = getDayPublicationReadiness(data.release_date, videos);
    if (!readiness.ready) {
      return {
        status: "error",
        message:
          "Add a release date and publish all 10 video slots before publishing the day.",
      };
    }
  }

  const { error } = await supabase
    .from("challenge_days")
    .update({ is_published: publish })
    .eq("id", parsedId.data);
  if (error) return databaseMutationError(error, "day");

  contentPaths(parsedId.data);
  return {
    status: "success",
    message: publish ? "Challenge day published." : "Challenge day unpublished.",
  };
}

const VIDEO_FIELDS = [
  "title",
  "description",
  "duration_seconds",
  "thumbnail_url",
  "video_source_type",
  "video_url",
  "playback_id",
  "is_published",
] as const;

function videoFormKey(videoNumber: number, field: string) {
  return `video_${videoNumber}_${field}`;
}

function videoSlotInput(formData: FormData, dayId: string, videoNumber: number) {
  return {
    challenge_day_id: dayId,
    video_number: videoNumber,
    title: formData.get(videoFormKey(videoNumber, "title")),
    description: formData.get(videoFormKey(videoNumber, "description")),
    duration_seconds: formData.get(videoFormKey(videoNumber, "duration_seconds")),
    thumbnail_url: formData.get(videoFormKey(videoNumber, "thumbnail_url")),
    video_source_type: formData.get(
      videoFormKey(videoNumber, "video_source_type"),
    ),
    video_url: formData.get(videoFormKey(videoNumber, "video_url")),
    playback_id: formData.get(videoFormKey(videoNumber, "playback_id")),
    is_published: formData.get(videoFormKey(videoNumber, "is_published")),
  };
}

function slotHasContent(input: ReturnType<typeof videoSlotInput>) {
  return VIDEO_FIELDS.some((field) => {
    if (field === "video_source_type") return false;
    const value = input[field];
    return value != null && String(value).trim() !== "";
  });
}

export async function saveVideoSlotsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsedDayId = UUID_SCHEMA.safeParse(formData.get("challenge_day_id"));
  if (!parsedDayId.success) {
    return { status: "error", message: "Invalid challenge day." };
  }

  const videos: Array<Omit<Video, "id" | "created_at" | "updated_at">> = [];
  const fieldErrors: Record<string, string[]> = {};

  for (let videoNumber = 1; videoNumber <= VIDEO_SLOTS_PER_DAY; videoNumber += 1) {
    const input = videoSlotInput(formData, parsedDayId.data, videoNumber);
    if (!slotHasContent(input)) continue;

    const parsed = videoFormSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "title");
        const key = videoFormKey(videoNumber, field);
        fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
      }
      continue;
    }

    const video = parsed.data;
    videos.push({
      challenge_day_id: video.challenge_day_id,
      video_number: video.video_number,
      title: video.title,
      description: video.description,
      duration_seconds: video.duration_seconds,
      thumbnail_url: video.thumbnail_url,
      video_source_type: video.video_source_type,
      video_url: video.video_url,
      playback_id: video.playback_id,
      is_published: video.is_published,
    });
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Check the highlighted video fields and try again.",
      fieldErrors,
    };
  }

  if (videos.length === 0) {
    return {
      status: "error",
      message: "Enter at least one video before saving.",
    };
  }

  await assertAdmin();
  const supabase = await createClient();
  const { data: day, error: dayError } = await supabase
    .from("challenge_days")
    .select("id, is_published")
    .eq("id", parsedDayId.data)
    .maybeSingle();

  if (dayError || !day) {
    return { status: "error", message: "This challenge day no longer exists." };
  }

  if (
    day.is_published &&
    (videos.length !== VIDEO_SLOTS_PER_DAY || videos.some((video) => !video.is_published))
  ) {
    return {
      status: "error",
      message: "Unpublish the challenge day before removing or unpublishing a video.",
    };
  }

  // A database RPC keeps the entire 10-slot save atomic. The slot uniqueness
  // constraint is deferrable for safe reordering, so it cannot be used as a
  // PostgREST ON CONFLICT arbiter.
  const payload = videos.map((video) => ({
    video_number: video.video_number,
    title: video.title,
    description: video.description,
    duration_seconds: video.duration_seconds,
    thumbnail_url: video.thumbnail_url,
    video_source_type: video.video_source_type,
    video_url: video.video_url,
    playback_id: video.playback_id,
    is_published: video.is_published,
  }));
  const { error } = await supabase.rpc("upsert_day_videos", {
    p_challenge_day_id: parsedDayId.data,
    p_videos: payload,
  });
  if (error) return databaseMutationError(error, "video");

  contentPaths(parsedDayId.data);
  return {
    status: "success",
    message: `${videos.length} video slot${videos.length === 1 ? "" : "s"} saved.`,
  };
}

async function getVideoAndDay(videoId: string) {
  const parsedId = UUID_SCHEMA.safeParse(videoId);
  if (!parsedId.success) return { error: "Invalid video." } as const;

  const supabase = await createClient();
  const { data: video, error } = await supabase
    .from("videos")
    .select("id, challenge_day_id, video_number, is_published")
    .eq("id", parsedId.data)
    .maybeSingle();
  if (error || !video) return { error: "This video no longer exists." } as const;

  const { data: day, error: dayError } = await supabase
    .from("challenge_days")
    .select("id, is_published")
    .eq("id", video.challenge_day_id)
    .maybeSingle();
  if (dayError || !day) {
    return { error: "The video's challenge day no longer exists." } as const;
  }

  return { supabase, video, day } as const;
}

export async function setVideoPublishedAction(
  videoId: string,
  publish: boolean,
): Promise<ActionState> {
  await assertAdmin();
  const result = await getVideoAndDay(videoId);
  if ("error" in result) return { status: "error", message: result.error };

  if (!publish && result.day.is_published) {
    return {
      status: "error",
      message: "Unpublish the challenge day before unpublishing one of its videos.",
    };
  }

  const { error } = await result.supabase
    .from("videos")
    .update({ is_published: publish })
    .eq("id", result.video.id);
  if (error) return databaseMutationError(error, "video");

  contentPaths(result.video.challenge_day_id);
  return {
    status: "success",
    message: publish ? "Video published." : "Video unpublished.",
  };
}

export async function deleteVideoAction(videoId: string): Promise<ActionState> {
  await assertAdmin();
  const result = await getVideoAndDay(videoId);
  if ("error" in result) return { status: "error", message: result.error };

  if (result.day.is_published) {
    return {
      status: "error",
      message: "Unpublish the challenge day before deleting a video.",
    };
  }

  const { error } = await result.supabase
    .from("videos")
    .delete()
    .eq("id", result.video.id);
  if (error) {
    return {
      status: "error",
      message: "This video could not be deleted. It may already have progress records.",
    };
  }

  contentPaths(result.video.challenge_day_id);
  return { status: "success", message: "Video deleted." };
}

export async function moveVideoAction(
  videoId: string,
  direction: "up" | "down",
): Promise<ActionState> {
  if (direction !== "up" && direction !== "down") {
    return { status: "error", message: "Invalid reorder direction." };
  }

  await assertAdmin();
  const result = await getVideoAndDay(videoId);
  if ("error" in result) return { status: "error", message: result.error };

  if (result.day.is_published) {
    return {
      status: "error",
      message: "Unpublish the challenge day before reordering videos.",
    };
  }

  const { data, error: readError } = await result.supabase
    .from("videos")
    .select("id, video_number")
    .eq("challenge_day_id", result.video.challenge_day_id)
    .order("video_number");
  if (readError || !data) {
    return { status: "error", message: "Could not load the video order." };
  }

  const orderedIds = moveOrderedVideoIds(
    data as Pick<Video, "id" | "video_number">[],
    result.video.id,
    direction,
  );
  if (orderedIds.every((id, index) => id === data[index]?.id)) {
    return { status: "success", message: "Video is already at that boundary." };
  }

  const { error } = await result.supabase.rpc("reorder_day_videos", {
    p_challenge_day_id: result.video.challenge_day_id,
    p_ordered_video_ids: orderedIds,
  });
  if (error) {
    return { status: "error", message: "The video order could not be updated." };
  }

  contentPaths(result.video.challenge_day_id);
  return { status: "success", message: "Video order updated." };
}
