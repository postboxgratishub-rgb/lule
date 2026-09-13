import { ShieldCheck } from "lucide-react";

import { Brand } from "@/components/ui/brand";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-brand-100/70 to-transparent"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <div className="mb-7 flex justify-center">
          <Brand />
        </div>
        <section className="panel overflow-hidden p-6 sm:p-8">{children}</section>
        <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-ink-500">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Authorized administrators only
        </p>
      </div>
    </main>
  );
}
