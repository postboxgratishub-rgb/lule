"use client";

import { ChevronDown, Film, Save } from "lucide-react";
import { useActionState } from "react";

import { saveVideoSlotsAction } from "@/app/actions/content";
import { VideoActions } from "@/components/content/video-actions";
import { ActionMessage } from "@/components/ui/action-message";
import { SubmitButton } from "@/components/ui/submit-button";
import {
  formatVideoDuration,
  VIDEO_SLOTS_PER_DAY,
  videoSourceLabel,
} from "@/lib/content";
import type { ChallengeDay, Video, VideoSourceType } from "@/types";
import { INITIAL_ACTION_STATE } from "@/types";

const SOURCE_OPTIONS: VideoSourceType[] = [
  "external_url",
  "cloudflare_stream",
  "mux",
];

function fieldName(videoNumber: number, name: string) {
  return `video_${videoNumber}_${name}`;
}

function VideoSlotEditor({
  day,
  video,
  videoNumber,
  errorFor,
  first,
  last,
}: {
  day: ChallengeDay;
  video?: Video;
  videoNumber: number;
  errorFor: (name: string) => string | undefined;
  first: boolean;
  last: boolean;
}) {
  const id = (name: string) => `slot-${videoNumber}-${name}`;
  const error = (name: string) => errorFor(fieldName(videoNumber, name));
  const describedBy = (name: string, help?: boolean) =>
    error(name) ? `${id(name)}-error` : help ? `${id(name)}-help` : undefined;

  return (
    <details
      className="group rounded-2xl border border-slate-200 bg-white open:shadow-sm"
      open={!video}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 marker:hidden sm:px-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-950 text-xs font-extrabold text-white">
          {videoNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-bold text-ink-950">
            {video?.title ?? `Add video ${videoNumber}`}
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-500">
            {video
              ? `${videoSourceLabel(video.video_source_type)} · ${formatVideoDuration(
                  video.duration_seconds,
                )}`
              : "Empty slot"}
          </span>
        </span>
        {video && (
          <span
            className={`hidden rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${
              video.is_published
                ? "bg-brand-50 text-brand-800"
                : "bg-amber-50 text-amber-800"
            }`}
          >
            {video.is_published ? "Published" : "Draft"}
          </span>
        )}
        <ChevronDown
          className="size-4 shrink-0 text-slate-400 transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="border-t border-slate-100 px-4 py-5 sm:px-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_220px]">
          <div>
            <label className="field-label" htmlFor={id("title")}>
              Video title <span className="text-red-600">*</span>
            </label>
            <input
              className="field-input"
              id={id("title")}
              name={fieldName(videoNumber, "title")}
              defaultValue={video?.title ?? ""}
              maxLength={250}
              placeholder={`Video ${videoNumber} title`}
              aria-invalid={error("title") ? true : undefined}
              aria-describedby={describedBy("title")}
            />
            {error("title") && (
              <p className="field-error" id={`${id("title")}-error`}>
                {error("title")}
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor={id("duration_seconds")}>
              Duration (seconds) <span className="text-red-600">*</span>
            </label>
            <input
              className="field-input"
              id={id("duration_seconds")}
              name={fieldName(videoNumber, "duration_seconds")}
              type="number"
              min={1}
              max={43200}
              step={1}
              defaultValue={video?.duration_seconds ?? ""}
              placeholder="900"
              inputMode="numeric"
              aria-invalid={error("duration_seconds") ? true : undefined}
              aria-describedby={describedBy("duration_seconds")}
            />
            {error("duration_seconds") && (
              <p className="field-error" id={`${id("duration_seconds")}-error`}>
                {error("duration_seconds")}
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor={id("video_source_type")}>
              Video source <span className="text-red-600">*</span>
            </label>
            <select
              className="field-input"
              id={id("video_source_type")}
              name={fieldName(videoNumber, "video_source_type")}
              defaultValue={video?.video_source_type ?? "external_url"}
              aria-invalid={error("video_source_type") ? true : undefined}
              aria-describedby={describedBy("video_source_type")}
            >
              {SOURCE_OPTIONS.map((source) => (
                <option key={source} value={source}>
                  {videoSourceLabel(source)}
                </option>
              ))}
            </select>
            {error("video_source_type") && (
              <p className="field-error" id={`${id("video_source_type")}-error`}>
                {error("video_source_type")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <label className="field-label" htmlFor={id("video_url")}>
              Video URL
            </label>
            <input
              className="field-input"
              id={id("video_url")}
              name={fieldName(videoNumber, "video_url")}
              type="url"
              inputMode="url"
              defaultValue={video?.video_url ?? ""}
              maxLength={8192}
              placeholder="https://drive.google.com/…"
              aria-invalid={error("video_url") ? true : undefined}
              aria-describedby={describedBy("video_url", true)}
            />
            {error("video_url") ? (
              <p className="field-error" id={`${id("video_url")}-error`}>
                {error("video_url")}
              </p>
            ) : (
              <p className="mt-1.5 text-xs leading-5 text-ink-500" id={`${id("video_url")}-help`}>
                Required for External URL. A direct or embeddable HTTPS URL works best.
              </p>
            )}
          </div>

          <div>
            <label className="field-label" htmlFor={id("playback_id")}>
              Provider playback ID
            </label>
            <input
              className="field-input font-mono"
              id={id("playback_id")}
              name={fieldName(videoNumber, "playback_id")}
              defaultValue={video?.playback_id ?? ""}
              maxLength={512}
              placeholder="Required for Cloudflare Stream or Mux"
              aria-invalid={error("playback_id") ? true : undefined}
              aria-describedby={describedBy("playback_id", true)}
            />
            {error("playback_id") ? (
              <p className="field-error" id={`${id("playback_id")}-error`}>
                {error("playback_id")}
              </p>
            ) : (
              <p className="mt-1.5 text-xs leading-5 text-ink-500" id={`${id("playback_id")}-help`}>
                Leave empty when using an external URL.
              </p>
            )}
          </div>
        </div>

        <div className="mt-5">
          <label className="field-label" htmlFor={id("thumbnail_url")}>
            Thumbnail URL
          </label>
          <input
            className="field-input"
            id={id("thumbnail_url")}
            name={fieldName(videoNumber, "thumbnail_url")}
            type="url"
            inputMode="url"
            defaultValue={video?.thumbnail_url ?? ""}
            maxLength={4096}
            placeholder="https://example.com/thumbnail.jpg"
            aria-invalid={error("thumbnail_url") ? true : undefined}
            aria-describedby={describedBy("thumbnail_url")}
          />
          {error("thumbnail_url") && (
            <p className="field-error" id={`${id("thumbnail_url")}-error`}>
              {error("thumbnail_url")}
            </p>
          )}
        </div>

        <div className="mt-5">
          <label className="field-label" htmlFor={id("description")}>
            Description
          </label>
          <textarea
            className="field-input min-h-24 resize-y"
            id={id("description")}
            name={fieldName(videoNumber, "description")}
            defaultValue={video?.description ?? ""}
            maxLength={10000}
            placeholder="A short lesson summary"
            aria-invalid={error("description") ? true : undefined}
            aria-describedby={describedBy("description")}
          />
          {error("description") && (
            <p className="field-error" id={`${id("description")}-error`}>
              {error("description")}
            </p>
          )}
        </div>

        <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-ink-900">
          <input
            className="size-4 accent-brand-700"
            name={fieldName(videoNumber, "is_published")}
            type="checkbox"
            defaultChecked={video?.is_published ?? false}
          />
          Publish this video for students
        </label>

        {video && (
          <VideoActions
            video={video}
            dayPublished={day.is_published}
            first={first}
            last={last}
          />
        )}
      </div>
    </details>
  );
}

export function BulkVideoForm({
  day,
  videos,
}: {
  day: ChallengeDay;
  videos: Video[];
}) {
  const [state, action] = useActionState(
    saveVideoSlotsAction,
    INITIAL_ACTION_STATE,
  );
  const sortedVideos = [...videos].sort(
    (left, right) => left.video_number - right.video_number,
  );
  const existingBySlot = new Map(
    sortedVideos.map((video) => [video.video_number, video]),
  );
  const errorFor = (name: string) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} noValidate>
      <input type="hidden" name="challenge_day_id" value={day.id} />
      <div className="mb-5">
        <ActionMessage state={state} />
      </div>

      <div className="mb-5 flex flex-col justify-between gap-3 rounded-2xl border border-brand-100 bg-brand-50/70 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-700 shadow-sm">
            <Film className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-bold text-brand-900">10-slot bulk editor</p>
            <p className="mt-1 text-xs leading-5 text-brand-900">
              Open any slot, enter its details, then save every filled slot in one step.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-brand-800 shadow-sm">
          {videos.length} / {VIDEO_SLOTS_PER_DAY} saved
        </span>
      </div>

      <div className="space-y-3">
        {Array.from({ length: VIDEO_SLOTS_PER_DAY }, (_, index) => {
          const videoNumber = index + 1;
          const video = existingBySlot.get(videoNumber);
          const existingIndex = video
            ? sortedVideos.findIndex((candidate) => candidate.id === video.id)
            : -1;

          return (
            <VideoSlotEditor
              key={`${videoNumber}-${video?.id ?? "empty"}-${video?.updated_at ?? ""}`}
              day={day}
              video={video}
              videoNumber={videoNumber}
              errorFor={errorFor}
              first={existingIndex === 0}
              last={existingIndex === sortedVideos.length - 1}
            />
          );
        })}
      </div>

      <div className="sticky bottom-4 z-10 mt-5 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-panel backdrop-blur sm:flex-row sm:px-4">
        <p className="text-xs leading-5 text-ink-500">
          Empty slots are ignored. Saving does not delete existing videos.
        </p>
        <SubmitButton
          className="button-primary w-full shrink-0 sm:w-auto"
          pendingLabel="Saving video slots…"
        >
          <Save className="size-4" aria-hidden="true" />
          Save all filled slots
        </SubmitButton>
      </div>
    </form>
  );
}
