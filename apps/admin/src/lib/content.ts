import type { Video, VideoSourceType } from "@/types";

export const VIDEO_SLOTS_PER_DAY = 10;

export function videoSourceLabel(source: VideoSourceType) {
  switch (source) {
    case "external_url":
      return "External URL";
    case "cloudflare_stream":
      return "Cloudflare Stream";
    case "mux":
      return "Mux";
  }
}

export function formatVideoDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function getDayPublicationReadiness(
  releaseDate: string | null,
  videos: Pick<Video, "video_number" | "is_published">[],
) {
  const validSlots = new Set(
    videos
      .map((video) => video.video_number)
      .filter((number) => number >= 1 && number <= VIDEO_SLOTS_PER_DAY),
  );
  const publishedSlots = new Set(
    videos
      .filter((video) => video.is_published)
      .map((video) => video.video_number)
      .filter((number) => number >= 1 && number <= VIDEO_SLOTS_PER_DAY),
  );

  return {
    hasReleaseDate: Boolean(releaseDate),
    videoCount: validSlots.size,
    publishedVideoCount: publishedSlots.size,
    ready:
      Boolean(releaseDate) &&
      validSlots.size === VIDEO_SLOTS_PER_DAY &&
      publishedSlots.size === VIDEO_SLOTS_PER_DAY,
  };
}

export function moveOrderedVideoIds(
  videos: Pick<Video, "id" | "video_number">[],
  videoId: string,
  direction: "up" | "down",
) {
  const ids = [...videos]
    .sort((left, right) => left.video_number - right.video_number)
    .map((video) => video.id);
  const currentIndex = ids.indexOf(videoId);
  if (currentIndex < 0) return ids;

  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= ids.length) return ids;

  [ids[currentIndex], ids[targetIndex]] = [ids[targetIndex], ids[currentIndex]];
  return ids;
}
