"use client";

import { useEffect } from "react";

import { Brand } from "@/components/brand";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-card sm:p-9">
        <div className="flex justify-center">
          <Brand />
        </div>
        <div className="mx-auto mt-8 grid size-14 place-items-center rounded-2xl bg-rose-100 text-xl text-rose-700">
          !
        </div>
        <h1 className="mt-5 text-2xl font-bold text-ink">We hit a roadblock</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Your data has not been changed. Check your connection and try loading
          this page again.
        </p>
        <Button className="mt-6 w-full" onClick={reset}>
          Try again
        </Button>
        {error.digest ? (
          <p className="mt-4 text-xs text-slate-400">Reference: {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
