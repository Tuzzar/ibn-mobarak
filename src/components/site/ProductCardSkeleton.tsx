import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col h-full rounded-xl md:rounded-3xl bg-card border border-border/60 overflow-hidden">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="flex flex-col flex-1 p-3 md:p-5 gap-2 md:gap-3">
        <Skeleton className="h-4 md:h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <div className="mt-auto pt-1 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-1.5 md:gap-2">
          <Skeleton className="h-7 md:h-9 flex-1 rounded-full" />
          <Skeleton className="h-7 md:h-9 flex-1 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-7">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
