import { Skeleton } from "@/components/ui/skeleton";

export default function ChallengeLoading() {
  return (
    <div className="space-y-8" aria-label="Loading challenge days" aria-busy="true">
      <Skeleton className="h-72 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
