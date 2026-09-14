import { clampPercentage } from "@/lib/challenge/logic";
import { cn } from "@/lib/cn";

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number;
  label: string;
  className?: string;
}) {
  const safeValue = clampPercentage(value);

  return (
    <div
      className={cn("h-2 overflow-hidden rounded-full bg-slate-100", className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safeValue)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-[width] duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
