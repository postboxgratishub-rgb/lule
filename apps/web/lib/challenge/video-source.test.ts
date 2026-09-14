import { describe, expect, it } from "vitest";

import { googleDriveFileId, resolveVideoSource } from "@/lib/challenge/video-source";

describe("video source abstraction", () => {
  it("extracts and converts common Google Drive links for in-player loading", () => {
    const shareUrl = "https://drive.google.com/file/d/abc_DEF-123/view?usp=sharing";
    expect(googleDriveFileId(shareUrl)).toBe("abc_DEF-123");
    expect(
      resolveVideoSource({
        video_source_type: "external_url",
        video_url: shareUrl,
        playback_id: null,
      }).url,
    ).toBe("https://drive.google.com/uc?export=download&id=abc_DEF-123");
  });

  it("keeps provider-specific playback details behind one resolver", () => {
    expect(
      resolveVideoSource({
        video_source_type: "mux",
        video_url: null,
        playback_id: "mux-playback-id",
      }),
    ).toMatchObject({
      provider: "mux",
      url: "https://stream.mux.com/mux-playback-id.m3u8",
      mimeType: "application/vnd.apple.mpegurl",
    });

    expect(
      resolveVideoSource({
        video_source_type: "cloudflare_stream",
        video_url: null,
        playback_id: "customer-code/video-id",
      }),
    ).toMatchObject({
      provider: "cloudflare_stream",
      url: "https://customer-customer-code.cloudflarestream.com/video-id/manifest/video.m3u8",
    });
  });

  it("rejects executable and malformed external URLs", () => {
    expect(
      resolveVideoSource({
        video_source_type: "external_url",
        video_url: "javascript:alert(1)",
        playback_id: null,
      }),
    ).toMatchObject({ url: null });
  });
});
