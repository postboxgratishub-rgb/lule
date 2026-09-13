import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-brand-600 disabled:bg-brand-300",
  secondary:
    "border border-slate-200 bg-white text-ink hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-brand-600",
  quiet:
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-ink focus-visible:outline-brand-600",
  danger:
    "bg-rose-50 text-rose-700 hover:bg-rose-100 focus-visible:outline-rose-600",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
): string {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-65",
    variants[variant],
    className,
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ className, variant = "primary", type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        className={buttonClassName(variant, className)}
        {...props}
      />
    );
  },
);
