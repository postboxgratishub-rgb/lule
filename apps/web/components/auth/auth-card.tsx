import type { ReactNode } from "react";

import { Brand } from "@/components/brand";

export function AuthCard({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white/95 p-6 shadow-card backdrop-blur sm:p-8">
      <div className="mb-8 lg:hidden">
        <Brand />
      </div>
      <div className="mb-7">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
          Student portal
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
