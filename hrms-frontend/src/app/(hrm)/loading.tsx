import { Skeleton } from "@/src/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-5 p-6" aria-busy="true" aria-label="Loading page">
      <Skeleton className="h-8 w-56" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}
