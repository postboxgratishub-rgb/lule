import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

function pageHref(
  pathname: string,
  page: number,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  if (page > 1) params.set("page", String(page));
  const suffix = params.toString();
  return suffix ? `${pathname}?${suffix}` : pathname;
}

export function Pagination({
  pathname,
  page,
  totalPages,
  query = {},
}: {
  pathname: string;
  page: number;
  totalPages: number;
  query?: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-4"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link href={pageHref(pathname, page - 1, query)} className="button-secondary">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <span className="button-secondary pointer-events-none opacity-40">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </span>
      )}
      <p className="text-xs font-semibold text-ink-500">
        Page <span className="text-ink-950">{page}</span> of {totalPages}
      </p>
      {page < totalPages ? (
        <Link href={pageHref(pathname, page + 1, query)} className="button-secondary">
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className="button-secondary pointer-events-none opacity-40">
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
