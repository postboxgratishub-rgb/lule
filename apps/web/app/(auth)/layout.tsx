import type { ReactNode } from "react";

import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas lg:grid lg:grid-cols-[0.82fr_1.18fr]">
      <aside className="relative hidden overflow-hidden bg-ink px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(99,102,241,0.42),transparent_34%),radial-gradient(circle_at_90%_90%,rgba(251,146,60,0.26),transparent_33%)]" />
        <div className="relative">
          <Brand inverse />
        </div>
        <div className="relative max-w-lg">
          <div className="mb-8 flex gap-2" aria-hidden="true">
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  index < 4 ? "bg-indigo-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <blockquote className="text-3xl font-bold leading-tight tracking-tight">
            “Small daily progress becomes a remarkable journey.”
          </blockquote>
          <p className="mt-5 max-w-md text-sm leading-6 text-slate-300">
            One account keeps every student connected to their school and ready
            for the complete 100-day program.
          </p>
        </div>
        <p className="relative text-xs text-slate-400">
          Securely powered by Supabase Authentication
        </p>
      </aside>

      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-8 lg:py-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_95%_5%,rgba(224,231,255,0.9),transparent_28%),radial-gradient(circle_at_0%_100%,rgba(254,215,170,0.45),transparent_32%)]" />
        <div className="relative flex w-full justify-center">{children}</div>
      </section>
    </main>
  );
}
