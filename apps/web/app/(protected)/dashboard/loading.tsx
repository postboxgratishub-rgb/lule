import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8" aria-label="Loading student dashboard" role="status">
      <div className="rounded-3xl bg-ink p-8">
        <Skeleton className="h-6 w-36 bg-white/15" />
        <Skeleton className="mt-6 h-10 w-2/3 bg-white/15" />
        <Skeleton className="mt-4 h-5 w-4/5 bg-white/15" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="rounded-2xl border bg-white p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-4 h-4 w-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
