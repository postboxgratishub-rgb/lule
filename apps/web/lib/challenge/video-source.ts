import type { Video, VideoSourceType } from "@/lib/database.types";

export type ResolvedVideoSource = {
  url: string | null;
  provider: VideoSourceType;
  mimeType?: string;
  error?: string;
};

function safeHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export function googleDriveFileId(value: string): string | null {
  const url = safeHttpUrl(value);
  if (!url || !/(^|\.)drive\.google\.com$/i.test(url.hostname)) return null;

  const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
  const id = pathMatch?.[1] ?? url.searchParams.get("id");
  return id && /^[A-Za-z0-9_-]+$/.test(id) ? id : null;
}

export function normalizeExternalVideoUrl(value: string): string | null {
  const url = safeHttpUrl(value);
  if (!url) return null;

  const driveId = googleDriveFileId(value);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  }

  return url.toString();
}

function resolvePlaybackId(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return safeHttpUrl(trimmed)?.toString() ?? trimmed;
}

export function resolveVideoSource(
  video: Pick<Video, "video_source_type" | "video_url" | "playback_id">,
): ResolvedVideoSource {
  const explicitUrl = video.video_url
    ? normalizeExternalVideoUrl(video.video_url)
    : null;

  if (video.video_source_type === "external_url") {
    return explicitUrl
      ? { provider: "external_url", url: explicitUrl }
      : {
          provider: "external_url",
          url: null,
          error: "This video does not have a valid HTTPS media URL.",
        };
  }

  if (explicitUrl) {
    return { provider: video.video_source_type, url: explicitUrl };
  }

  const playbackId = resolvePlaybackId(video.playback_id);
  if (!playbackId) {
    return {
      provider: video.video_source_type,
      url: null,
      error: "This video provider has no playback ID or media URL.",
    };
  }

  if (safeHttpUrl(playbackId)) {
    return { provider: video.video_source_type, url: playbackId };
  }

  if (video.video_source_type === "mux") {
    return {
      provider: "mux",
      url: `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8`,
      mimeType: "application/vnd.apple.mpegurl",
    };
  }

  const cloudflareParts = playbackId.split("/").filter(Boolean);
  if (cloudflareParts.length === 2) {
    const [customerCode, videoId] = cloudflareParts;
    return {
      provider: "cloudflare_stream",
      url: `https://customer-${encodeURIComponent(customerCode)}.cloudflarestream.com/${encodeURIComponent(videoId)}/manifest/video.m3u8`,
      mimeType: "application/vnd.apple.mpegurl",
    };
  }

  return {
    provider: "cloudflare_stream",
    url: `https://videodelivery.net/${encodeURIComponent(playbackId)}/manifest/video.m3u8`,
    mimeType: "application/vnd.apple.mpegurl",
  };
}
