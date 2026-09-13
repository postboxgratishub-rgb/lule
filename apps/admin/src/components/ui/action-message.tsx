import { AlertCircle, CheckCircle2 } from "lucide-react";

import type { ActionState } from "@/types";

export function ActionMessage({ state }: { state: ActionState }) {
  if (!state.message || state.status === "idle") return null;

  const success = state.status === "success";
  return (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${
        success
          ? "border-brand-200 bg-brand-50 text-brand-900"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      role={success ? "status" : "alert"}
      aria-live="polite"
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      ) : (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <span>{state.message}</span>
    </div>
  );
}
