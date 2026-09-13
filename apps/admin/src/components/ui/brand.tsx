import Link from "next/link";
import { BookOpenCheck } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-3 rounded-lg text-ink-950"
      aria-label="100 Days admin home"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-700 text-white shadow-sm">
        <BookOpenCheck aria-hidden="true" size={21} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-extrabold tracking-tight">100 Days</span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            Admin console
          </span>
        </span>
      )}
    </Link>
  );
}
