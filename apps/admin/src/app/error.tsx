"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="panel max-w-lg p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <AlertTriangle aria-hidden="true" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-ink-950">Something went wrong</h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          The dashboard couldn’t load this view. Your data was not changed.
        </p>
        <button className="button-primary mt-6" onClick={reset} type="button">
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}
