import Link from "next/link";

import { Brand } from "@/components/brand";
import { buttonClassName } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-canvas">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(circle_at_15%_10%,rgba(224,231,255,0.95),transparent_36%),radial-gradient(circle_at_85%_5%,rgba(254,215,170,0.7),transparent_28%)]" />
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <Brand />
        <div className="flex items-center gap-2">
          <Link href="/login" className={buttonClassName("quiet")}>
            Sign in
          </Link>
          <Link
            href="/register"
            className={buttonClassName("primary", "hidden sm:inline-flex")}
          >
            Join the challenge
          </Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:pt-28">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-brand-700 shadow-sm">
            <span className="size-2 rounded-full bg-emerald-500" />
            One purposeful step each day
          </span>
          <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[1.04] tracking-[-0.045em] text-ink sm:text-6xl lg:text-7xl">
            Build a learning habit that lasts.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
            A guided 100-day educational challenge that keeps your school,
            profile, and—when lessons launch—learning progress connected across
            web and mobile.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className={buttonClassName(
                "primary",
                "min-h-[3.25rem] px-6 text-base shadow-lg shadow-indigo-600/20",
              )}
            >
              Create student account
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/login"
              className={buttonClassName(
                "secondary",
                "min-h-[3.25rem] px-6 text-base",
              )}
            >
              Continue learning
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            Use the same secure student account on every supported device.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute -inset-6 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-brand-100 to-orange-100" />
          <div className="relative rounded-[2rem] border border-white bg-white/90 p-6 shadow-card backdrop-blur sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Your journey
                </p>
                <h2 className="mt-1 text-2xl font-bold text-ink">100 bright days</h2>
              </div>
              <div className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-2xl">
                <span aria-hidden="true">☀️</span>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-10 gap-2" aria-hidden="true">
              {Array.from({ length: 30 }, (_, index) => (
                <span
                  key={index}
                  className={`aspect-square rounded-md ${
                    index < 7
                      ? "bg-brand-500"
                      : index < 10
                        ? "bg-indigo-200"
                        : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
            <div className="mt-8 space-y-3">
              {[
                "A secure student profile",
                "Your school and class in one place",
                "Cross-device learning progress in upcoming phases",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <span
                    className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      index < 2
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    {index < 2 ? "✓" : "→"}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
