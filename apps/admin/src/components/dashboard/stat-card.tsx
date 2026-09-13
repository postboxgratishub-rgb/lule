import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <article className="panel flex min-h-36 items-start justify-between gap-5 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-ink-500">{label}</p>
        <p className="mt-2 text-3xl font-extrabold tracking-tight text-ink-950">{value}</p>
        <p className="mt-2 text-xs leading-5 text-ink-500">{hint}</p>
      </div>
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon className="size-5" aria-hidden="true" />
      </span>
    </article>
  );
}
