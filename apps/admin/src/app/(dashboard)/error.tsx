"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="panel px-6 py-14 text-center">
      <AlertTriangle className="mx-auto size-9 text-amber-600" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-bold text-ink-950">Couldn’t load this view</h2>
      <p className="mt-2 text-sm text-ink-500">
        Check the connection and Supabase configuration, then try again.
      </p>
      <button type="button" className="button-primary mt-6" onClick={reset}>
        <RotateCcw className="size-4" aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}
