import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="px-5 py-14 text-center">
      <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-slate-100 text-ink-500">
        <Inbox className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-bold text-ink-950">{title}</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-6 text-ink-500">
        {description}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
