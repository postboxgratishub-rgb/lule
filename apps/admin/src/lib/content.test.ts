import { describe, expect, it } from "vitest";

import {
  formatVideoDuration,
  getDayPublicationReadiness,
  moveOrderedVideoIds,
  videoSourceLabel,
} from "@/lib/content";

describe("content helpers", () => {
  it("requires a release date and ten published slots before day publication", () => {
    const videos = Array.from({ length: 10 }, (_, index) => ({
      video_number: index + 1,
      is_published: true,
    }));

    expect(getDayPublicationReadiness(null, videos).ready).toBe(false);
    expect(getDayPublicationReadiness("2026-09-14", videos).ready).toBe(true);
    expect(
      getDayPublicationReadiness("2026-09-14", [
        ...videos.slice(0, 9),
        { video_number: 10, is_published: false },
      ]).ready,
    ).toBe(false);
  });

  it("does not count duplicate video slots as a complete day", () => {
    const videos = Array.from({ length: 10 }, () => ({
      video_number: 1,
      is_published: true,
    }));
    expect(getDayPublicationReadiness("2026-09-14", videos).videoCount).toBe(1);
  });

  it("moves ordered video ids by one slot without crossing a boundary", () => {
    const videos = [
      { id: "two", video_number: 2 },
      { id: "one", video_number: 1 },
      { id: "three", video_number: 3 },
    ];
    expect(moveOrderedVideoIds(videos, "two", "up")).toEqual([
      "two",
      "one",
      "three",
    ]);
    expect(moveOrderedVideoIds(videos, "one", "up")).toEqual([
      "one",
      "two",
      "three",
    ]);
  });

  it("formats player duration and provider labels for the UI", () => {
    expect(formatVideoDuration(754)).toBe("12:34");
    expect(formatVideoDuration(3674)).toBe("1:01:14");
    expect(videoSourceLabel("cloudflare_stream")).toBe("Cloudflare Stream");
  });
});
