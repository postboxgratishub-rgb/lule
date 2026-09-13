import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";

import { cn } from "@/lib/cn";

type SharedProps = {
  label: string;
  error?: string;
  hint?: string;
};

const controlClassName =
  "min-h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] text-ink shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export const FormField = forwardRef<
  HTMLInputElement,
  SharedProps & InputHTMLAttributes<HTMLInputElement>
>(function FormField(
  { label, error, hint, id, className, required, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  const descriptionId = `${inputId}-description`;

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={cn(
          controlClassName,
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
          className,
        )}
        {...props}
      />
      {error || hint ? (
        <span
          id={descriptionId}
          className={cn(
            "mt-1.5 block text-xs leading-5",
            error ? "text-rose-600" : "text-slate-500",
          )}
        >
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
});

export const SelectField = forwardRef<
  HTMLSelectElement,
  SharedProps & SelectHTMLAttributes<HTMLSelectElement>
>(function SelectField(
  { label, error, hint, id, className, required, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  const descriptionId = `${selectId}-description`;

  return (
    <label className="block" htmlFor={selectId}>
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required ? <span className="ml-1 text-rose-500">*</span> : null}
      </span>
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? descriptionId : undefined}
        className={cn(
          controlClassName,
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error || hint ? (
        <span
          id={descriptionId}
          className={cn(
            "mt-1.5 block text-xs leading-5",
            error ? "text-rose-600" : "text-slate-500",
          )}
        >
          {error ?? hint}
        </span>
      ) : null}
    </label>
  );
});
