"use client";

import { EyeOff, Globe2, LoaderCircle } from "lucide-react";
import { useState, useTransition } from "react";

import { setChallengeDayPublishedAction } from "@/app/actions/content";

export function DayPublishButton({
  dayId,
  published,
}: {
  dayId: string;
  published: boolean;
}) {
  const [message, setMessage] = useState<{
    status: "success" | "error";
    text: string;
  }>();
  const [pending, startTransition] = useTransition();

  function togglePublication() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await setChallengeDayPublishedAction(dayId, !published);
      if (result.message) {
        setMessage({ status: result.status === "error" ? "error" : "success", text: result.message });
      }
    });
  }

  return (
    <div>
      <button
        type="button"
        className={published ? "button-danger w-full" : "button-primary w-full"}
        disabled={pending}
        onClick={togglePublication}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : published ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Globe2 className="size-4" aria-hidden="true" />
        )}
        {pending ? "Updating…" : published ? "Unpublish day" : "Publish day"}
      </button>
      {message && (
        <p
          className={`mt-3 rounded-xl border px-3 py-2.5 text-xs font-medium leading-5 ${
            message.status === "success"
              ? "border-brand-200 bg-brand-50 text-brand-900"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
          role={message.status === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
