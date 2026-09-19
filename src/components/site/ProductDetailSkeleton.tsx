import { Skeleton } from "@/components/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-16 pb-32 md:pb-16">
      <Skeleton className="h-4 w-28 mb-6 md:mb-8" />
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
          <div className="flex md:flex-col gap-2 md:gap-3 md:w-20">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-16 md:w-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="flex-1 aspect-square rounded-3xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 md:h-12 w-3/4" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3 pt-4">
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
