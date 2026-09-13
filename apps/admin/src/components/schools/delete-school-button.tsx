"use client";

import { LoaderCircle, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteSchoolAction } from "@/app/actions/schools";

export function DeleteSchoolButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string>();
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const result = await deleteSchoolAction(id);
      if (result.status === "success") {
        router.refresh();
        setConfirming(false);
        return;
      }
      setMessage(result.message);
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:underline"
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Delete
      </button>
    );
  }

  return (
    <div className="min-w-60 rounded-xl border border-red-200 bg-red-50 p-3 text-left shadow-lg">
      <p className="text-xs font-semibold leading-5 text-red-900">
        Delete {name}? This cannot be undone.
      </p>
      {message && <p className="mt-1.5 text-xs text-red-700">{message}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="button-danger min-h-8 px-2.5 py-1 text-xs"
          disabled={pending}
          onClick={remove}
        >
          {pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3.5" aria-hidden="true" />
          )}
          Confirm
        </button>
        <button
          type="button"
          className="button-secondary min-h-8 px-2.5 py-1 text-xs"
          disabled={pending}
          onClick={() => {
            setConfirming(false);
            setMessage(undefined);
          }}
        >
          <X className="size-3.5" aria-hidden="true" />
          Cancel
        </button>
      </div>
    </div>
  );
}
