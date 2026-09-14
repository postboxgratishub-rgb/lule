import { describe, expect, it } from "vitest";

import { googleDriveFileId, resolveVideoUri } from "./video-source";

describe("mobile video source resolver", () => {
  it("keeps ordinary HTTPS media inside the player", () => {
    expect(resolveVideoUri({
      video_source_type: "external_url",
      video_url: "https://cdn.example.com/lesson.mp4",
      playback_id: null,
    })).toBe("https://cdn.example.com/lesson.mp4");
  });

  it("normalizes a Google Drive share link for native playback", () => {
    expect(googleDriveFileId("https://drive.google.com/file/d/abc_123/view?usp=sharing")).toBe("abc_123");
    expect(resolveVideoUri({
      video_source_type: "external_url",
      video_url: "https://drive.google.com/file/d/abc_123/view?usp=sharing",
      playback_id: null,
    })).toBe("https://drive.google.com/uc?export=download&id=abc_123");
  });

  it("builds a Mux HLS URL and rejects unsafe schemes", () => {
    expect(resolveVideoUri({
      video_source_type: "mux",
      video_url: null,
      playback_id: "mux-id",
    })).toBe("https://stream.mux.com/mux-id.m3u8");
    expect(resolveVideoUri({
      video_source_type: "external_url",
      video_url: "javascript:alert(1)",
      playback_id: null,
    })).toBeNull();
  });

  it("builds Cloudflare HLS manifests from both locator formats", () => {
    expect(resolveVideoUri({
      video_source_type: "cloudflare_stream",
      video_url: null,
      playback_id: "customer-code/video-id",
    })).toBe("https://customer-customer-code.cloudflarestream.com/video-id/manifest/video.m3u8");
    expect(resolveVideoUri({
      video_source_type: "cloudflare_stream",
      video_url: null,
      playback_id: "video-id",
    })).toBe("https://videodelivery.net/video-id/manifest/video.m3u8");
  });
});
