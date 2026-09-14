import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button";

export function LockedDay({ dayNumber }: { dayNumber: number }) {
  return (
    <div className="mx-auto max-w-2xl py-12 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-slate-100 text-2xl">
        <span aria-hidden="true">🔒</span>
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        Day {dayNumber}
      </p>
      <h1 className="mt-2 text-3xl font-bold text-ink">This day is still locked</h1>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
        It will open automatically after an administrator publishes it and its
        release date arrives. Unpublished lesson details remain private.
      </p>
      <Alert title="Nothing is wrong with your account" variant="info">
        You can continue any other available day while you wait.
      </Alert>
      <Link href="/challenge" className={buttonClassName("primary", "mt-6")}>
        Back to all days
      </Link>
    </div>
  );
}
