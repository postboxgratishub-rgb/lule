import Link from "next/link";

import { Brand } from "@/components/brand";
import { buttonClassName } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4 py-12">
      <div className="text-center">
        <div className="flex justify-center">
          <Brand />
        </div>
        <p className="mt-10 text-sm font-bold uppercase tracking-[0.22em] text-brand-600">
          Error 404
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-ink">
          This page is not on the lesson plan.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          The address may be incorrect, or this part of the learning experience has
          not been published yet.
        </p>
        <Link href="/" className={buttonClassName("primary", "mt-7")}>
          Return home
        </Link>
      </div>
    </main>
  );
}
