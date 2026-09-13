import { LogOut, ShieldCheck } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Navigation } from "@/components/dashboard/navigation";
import { Brand } from "@/components/ui/brand";
import { initials } from "@/lib/format";
import type { AdminIdentity } from "@/types";

export function AdminShell({
  admin,
  children,
}: {
  admin: AdminIdentity;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] border-r border-slate-200 bg-white/95 px-4 py-5 backdrop-blur lg:flex lg:flex-col">
        <div className="px-2">
          <Brand />
        </div>
        <div className="mt-9 flex-1">
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
          <Navigation />
        </div>
        <div className="border-t border-slate-200 pt-4">
          <div className="mb-3 flex min-w-0 items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-900 text-xs font-bold text-white">
              {initials(admin.fullName)}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold text-ink-950">
                {admin.fullName}
              </span>
              <span className="mt-0.5 block truncate text-xs text-ink-500">
                {admin.email}
              </span>
            </span>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-ink-500 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="size-[18px]" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0 lg:col-start-2">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Brand />
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-ink-900 text-xs font-bold text-white">
                {initials(admin.fullName)}
              </span>
              <form action={logoutAction}>
                <button
                  className="grid size-10 place-items-center rounded-xl text-ink-500 hover:bg-slate-100"
                  type="submit"
                  aria-label="Sign out"
                >
                  <LogOut className="size-5" aria-hidden="true" />
                </button>
              </form>
            </div>
          </div>
          <div className="overflow-x-auto border-t border-slate-100 py-2">
            <Navigation mobile />
          </div>
        </header>

        <div className="mx-auto min-h-screen w-full max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-10">
          <div className="mb-7 hidden items-center justify-end gap-2 text-xs font-semibold text-ink-500 lg:flex">
            <ShieldCheck className="size-4 text-brand-600" aria-hidden="true" />
            Secure admin session
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
