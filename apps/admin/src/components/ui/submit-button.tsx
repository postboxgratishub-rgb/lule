"use client";

import { LoaderCircle } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className = "button-primary w-full",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : children}
    </button>
  );
}
