"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/challenge", label: "Challenge", icon: "▶" },
  { href: "/profile", label: "Profile", icon: "◎" },
];

export function StudentNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Student navigation" className="flex items-center gap-1">
      {links.map((link) => {
        const active =
          pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500 sm:px-3 lg:px-4",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-slate-500 hover:bg-slate-50 hover:text-ink",
            )}
          >
            <span className="text-base" aria-hidden="true">
              {link.icon}
            </span>
            <span className="hidden lg:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
