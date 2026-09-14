export type VideoSourceType = "external_url" | "cloudflare_stream" | "mux";

export type VideoSourceRecord = {
  video_source_type: VideoSourceType;
  video_url: string | null;
  playback_id: string | null;
};

const DRIVE_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:[^#]*&)?id=([a-zA-Z0-9_-]+)/,
];

export function googleDriveFileId(value: string): string | null {
  for (const pattern of DRIVE_PATTERNS) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  try {
    const url = new URL(value);
    if (url.hostname === "drive.google.com") return url.searchParams.get("id");
  } catch {
    return null;
  }

  return null;
}

function validHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export function resolveVideoUri(video: VideoSourceRecord): string | null {
  const directUrl = video.video_url?.trim();
  const playbackId = video.playback_id?.trim();

  if (video.video_source_type === "mux") {
    if (directUrl) return validHttpUrl(directUrl);
    return playbackId
      ? `https://stream.mux.com/${encodeURIComponent(playbackId)}.m3u8`
      : null;
  }

  if (video.video_source_type === "cloudflare_stream") {
    if (directUrl) return validHttpUrl(directUrl);
    if (!playbackId) return null;
    if (/^https?:\/\//i.test(playbackId)) return validHttpUrl(playbackId);
    const parts = playbackId.split("/").filter(Boolean);
    if (parts.length === 2) {
      return `https://customer-${encodeURIComponent(parts[0])}.cloudflarestream.com/${encodeURIComponent(parts[1])}/manifest/video.m3u8`;
    }
    return `https://videodelivery.net/${encodeURIComponent(playbackId)}/manifest/video.m3u8`;
  }

  if (!directUrl) return null;
  const driveId = googleDriveFileId(directUrl);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveId)}`;
  }

  return validHttpUrl(directUrl);
}
