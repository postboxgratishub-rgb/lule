import Link from "next/link";

import { cn } from "@/lib/cn";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
      aria-label="100 Days Learning home"
    >
      <span className="relative grid size-10 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-black text-white shadow-lg shadow-indigo-950/15">
        100
        <span className="absolute -right-2 -top-2 size-5 rounded-full bg-amber-300/90" />
      </span>
      <span
        className={cn(
          "leading-tight",
          inverse ? "text-white" : "text-ink",
        )}
      >
        <span className="block text-sm font-extrabold tracking-tight">
          100 Days
        </span>
        <span
          className={cn(
            "block text-[11px] font-medium tracking-wide",
            inverse ? "text-indigo-200" : "text-slate-500",
          )}
        >
          LEARN. GROW. REPEAT.
        </span>
      </span>
    </Link>
  );
}
