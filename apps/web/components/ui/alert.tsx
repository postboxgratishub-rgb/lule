import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type AlertVariant = "error" | "success" | "info";

const variants: Record<AlertVariant, string> = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function Alert({
  children,
  title,
  variant = "info",
}: {
  children: ReactNode;
  title?: string;
  variant?: AlertVariant;
}) {
  return (
    <div
      className={cn("rounded-xl border px-4 py-3 text-sm", variants[variant])}
      role={variant === "error" ? "alert" : "status"}
    >
      {title ? <p className="mb-0.5 font-semibold">{title}</p> : null}
      <div className="leading-6">{children}</div>
    </div>
  );
}
