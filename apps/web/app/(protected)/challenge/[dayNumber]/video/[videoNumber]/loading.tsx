import { Skeleton } from "@/components/ui/skeleton";

export default function VideoLoading() {
  return (
    <div className="space-y-6" aria-label="Loading video" aria-busy="true">
      <Skeleton className="h-7 w-60" />
      <Skeleton className="aspect-video rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}
