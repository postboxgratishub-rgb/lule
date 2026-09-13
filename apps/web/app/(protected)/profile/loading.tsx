import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-5xl space-y-6" role="status">
      <Skeleton className="h-9 w-52" />
      <div className="overflow-hidden rounded-3xl border bg-white">
        <div className="bg-ink p-8">
          <Skeleton className="size-20 bg-white/15" />
        </div>
        <div className="grid gap-3 p-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <Skeleton key={index} className="h-20" />
          ))}
        </div>
      </div>
      <span className="sr-only">Loading profile…</span>
    </div>
  );
}
