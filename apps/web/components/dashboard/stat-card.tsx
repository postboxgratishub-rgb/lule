import type { ReactNode } from "react";

export function StatCard({
  eyebrow,
  value,
  detail,
  icon,
}: {
  eyebrow: string;
  value: string;
  detail: string;
  icon: ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {eyebrow}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg text-brand-700">
          {icon}
        </span>
      </div>
      <p className="mt-3 text-sm leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
