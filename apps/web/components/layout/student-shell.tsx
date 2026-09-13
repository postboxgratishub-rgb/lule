import type { ReactNode } from "react";

import { logoutAction } from "@/app/auth-actions";
import { Brand } from "@/components/brand";
import { StudentNav } from "@/components/layout/student-nav";
import { buttonClassName } from "@/components/ui/button";
import { initials } from "@/lib/profile";

export function StudentShell({
  children,
  name,
  email,
}: {
  children: ReactNode;
  name: string | null;
  email: string | null;
}) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Brand />

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <StudentNav />
            <div className="hidden h-8 w-px bg-slate-200 md:block" />
            <div className="hidden items-center gap-3 md:flex">
              <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-100 to-orange-100 text-xs font-black text-brand-700">
                {initials(name ?? email)}
              </span>
              <div className="hidden max-w-36 lg:block">
                <p className="truncate text-sm font-semibold text-ink">
                  {name ?? "Student"}
                </p>
                <p className="truncate text-xs text-slate-500">{email}</p>
              </div>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className={buttonClassName("quiet", "min-h-10 px-3")}
                aria-label="Sign out"
              >
                <span className="hidden sm:inline">Sign out</span>
                <span className="sm:hidden" aria-hidden="true">
                  ↪
                </span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
      <footer className="mx-auto max-w-7xl px-4 pb-8 pt-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
        Times are shown in India Standard Time · Your account is securely synced by
        Supabase
      </footer>
    </div>
  );
}
