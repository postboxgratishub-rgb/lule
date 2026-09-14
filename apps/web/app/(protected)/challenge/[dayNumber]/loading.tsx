import { Skeleton } from "@/components/ui/skeleton";

export default function DayLoading() {
  return (
    <div className="space-y-7" aria-label="Loading challenge day" aria-busy="true">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-64 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-64 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
