"use client";

import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";
import { useState, useTransition } from "react";

import {
  deleteVideoAction,
  moveVideoAction,
  setVideoPublishedAction,
} from "@/app/actions/content";
import type { Video } from "@/types";

export function VideoActions({
  video,
  dayPublished,
  first,
  last,
}: {
  video: Video;
  dayPublished: boolean;
  first: boolean;
  last: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<{
    status: "success" | "error";
    text: string;
  }>();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ status: string; message?: string }>) {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.message) {
        setMessage({
          status: result.status === "error" ? "error" : "success",
          text: result.message,
        });
      }
      if (result.status !== "error") setConfirmingDelete(false);
    });
  }

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {message && (
        <p
          className={`mb-3 rounded-lg px-3 py-2 text-xs ${
            message.status === "error"
              ? "bg-red-50 text-red-800"
              : "bg-brand-50 text-brand-900"
          }`}
          role={message.status === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="button-secondary min-h-9 px-2.5 py-1.5 text-xs"
          disabled={pending || dayPublished || first}
          title={dayPublished ? "Unpublish the day before reordering" : "Move up"}
          onClick={() => run(() => moveVideoAction(video.id, "up"))}
        >
          <ArrowUp className="size-3.5" aria-hidden="true" />
          Up
        </button>
        <button
          type="button"
          className="button-secondary min-h-9 px-2.5 py-1.5 text-xs"
          disabled={pending || dayPublished || last}
          title={dayPublished ? "Unpublish the day before reordering" : "Move down"}
          onClick={() => run(() => moveVideoAction(video.id, "down"))}
        >
          <ArrowDown className="size-3.5" aria-hidden="true" />
          Down
        </button>
        <button
          type="button"
          className="button-secondary min-h-9 px-2.5 py-1.5 text-xs"
          disabled={pending || (dayPublished && video.is_published)}
          title={
            dayPublished && video.is_published
              ? "Unpublish the day before unpublishing this video"
              : undefined
          }
          onClick={() =>
            run(() => setVideoPublishedAction(video.id, !video.is_published))
          }
        >
          {pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : video.is_published ? (
            <EyeOff className="size-3.5" aria-hidden="true" />
          ) : (
            <Eye className="size-3.5" aria-hidden="true" />
          )}
          {video.is_published ? "Unpublish video" : "Publish video"}
        </button>

        {confirmingDelete ? (
          <>
            <button
              type="button"
              className="button-danger min-h-9 px-2.5 py-1.5 text-xs"
              disabled={pending || dayPublished}
              onClick={() => run(() => deleteVideoAction(video.id))}
            >
              {pending ? (
                <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
              Confirm delete
            </button>
            <button
              type="button"
              className="button-secondary min-h-9 px-2.5 py-1.5 text-xs"
              disabled={pending}
              onClick={() => setConfirmingDelete(false)}
            >
              <X className="size-3.5" aria-hidden="true" />
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            className="ml-auto inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-bold text-red-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending || dayPublished}
            title={dayPublished ? "Unpublish the day before deleting a video" : undefined}
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
