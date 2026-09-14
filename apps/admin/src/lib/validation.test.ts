import { describe, expect, it } from "vitest";

import {
  challengeDayFormSchema,
  schoolFormSchema,
  studentProfileFormSchema,
  videoFormSchema,
} from "@/lib/validation";

describe("school input validation", () => {
  it("normalizes the unique school code and empty optional values", () => {
    const parsed = schoolFormSchema.parse({
      id: null,
      name: "  Greenwood Public School ",
      code: " gps-01 ",
      address: "",
      city: " Bengaluru ",
      state: "Karnataka",
      contact_name: "",
      contact_phone: "",
    });

    expect(parsed.name).toBe("Greenwood Public School");
    expect(parsed.id).toBeUndefined();
    expect(parsed.code).toBe("GPS-01");
    expect(parsed.address).toBeNull();
    expect(parsed.city).toBe("Bengaluru");
  });

  it("rejects filter syntax in a school code", () => {
    expect(
      schoolFormSchema.safeParse({
        name: "Valid School",
        code: "ABC,or(id.eq.1)",
        address: "",
        city: "",
        state: "",
        contact_name: "",
        contact_phone: "",
      }).success,
    ).toBe(false);
  });

  it.each(["-GPS", "_GPS"])(
    "rejects a code that starts with a separator: %s",
    (code) => {
      expect(
        schoolFormSchema.safeParse({
          name: "Valid School",
          code,
          address: "",
          city: "",
          state: "",
          contact_name: "",
          contact_phone: "",
        }).success,
      ).toBe(false);
    },
  );
});

describe("student profile validation", () => {
  const base = {
    id: "4ca26876-8a9b-4fc1-9b68-b679395bc303",
    full_name: "Student One",
    phone: "",
    school_id: "",
    class_name: "10",
    section: "A",
    roll_number: "10-A-01",
  };

  it("accepts a past date and normalizes an unassigned school", () => {
    const parsed = studentProfileFormSchema.parse({
      ...base,
      date_of_birth: "2010-05-21",
    });
    expect(parsed.school_id).toBeNull();
    expect(parsed.date_of_birth).toBe("2010-05-21");
  });

  it("rejects a future date of birth", () => {
    expect(
      studentProfileFormSchema.safeParse({
        ...base,
        date_of_birth: "2999-01-01",
      }).success,
    ).toBe(false);
  });
});

describe("challenge content validation", () => {
  it("accepts a draft day without a release date", () => {
    const parsed = challengeDayFormSchema.parse({
      id: "",
      day_number: "23",
      title: " Foundations ",
      description: "",
      release_date: "",
    });

    expect(parsed.day_number).toBe(23);
    expect(parsed.title).toBe("Foundations");
    expect(parsed.release_date).toBeNull();
  });

  it.each([0, 101, 1.5])("rejects invalid day number %s", (dayNumber) => {
    expect(
      challengeDayFormSchema.safeParse({
        day_number: dayNumber,
        title: "A valid title",
        description: "",
        release_date: "",
      }).success,
    ).toBe(false);
  });

  const baseVideo = {
    challenge_day_id: "4ca26876-8a9b-4fc1-9b68-b679395bc303",
    video_number: "1",
    title: "Introduction",
    description: "",
    duration_seconds: "900",
    thumbnail_url: "",
    playback_id: "",
    is_published: "on",
  };

  it("requires a URL for an external source", () => {
    const result = videoFormSchema.safeParse({
      ...baseVideo,
      video_source_type: "external_url",
      video_url: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "video_url")).toBe(
        true,
      );
    }
  });

  it.each(["cloudflare_stream", "mux"])(
    "requires a playback ID for %s",
    (video_source_type) => {
      expect(
        videoFormSchema.safeParse({
          ...baseVideo,
          video_source_type,
          video_url: "",
        }).success,
      ).toBe(false);
    },
  );

  it("accepts a valid external video and normalizes optional fields", () => {
    const parsed = videoFormSchema.parse({
      ...baseVideo,
      video_source_type: "external_url",
      video_url: "https://example.com/video.mp4",
    });
    expect(parsed.duration_seconds).toBe(900);
    expect(parsed.description).toBeNull();
    expect(parsed.is_published).toBe(true);
  });

  it("rejects malformed URLs and durations beyond the database limit", () => {
    expect(
      videoFormSchema.safeParse({
        ...baseVideo,
        duration_seconds: "43201",
        video_source_type: "external_url",
        video_url: "https://not a url",
      }).success,
    ).toBe(false);
  });
});
