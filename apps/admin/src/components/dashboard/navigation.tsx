"use client";

import { LayoutDashboard, School, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/schools", label: "Schools", icon: School },
  { href: "/students", label: "Students", icon: UsersRound },
];

export function Navigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={
        mobile
          ? "flex min-w-max items-center gap-1 px-4"
          : "flex flex-col gap-1.5"
      }
      aria-label="Admin navigation"
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              active
                ? "bg-brand-50 text-brand-800"
                : "text-ink-500 hover:bg-slate-100 hover:text-ink-950"
            } ${mobile ? "whitespace-nowrap" : ""}`}
          >
            <Icon className="size-[18px]" strokeWidth={2} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
