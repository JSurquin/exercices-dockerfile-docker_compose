'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function GiveawayCardSkeleton() {
  return (
    <Card
      aria-hidden
      className="flex h-[380px] flex-col overflow-hidden border-white/10 bg-card/80 py-0"
    >
      <CardContent className="flex h-full flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <div className="mt-auto pt-1">
          <Skeleton className="h-9 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function GiveawayHeroSkeleton() {
  return (
    <Card
      aria-hidden
      className="mb-6 overflow-hidden border-white/10 bg-card/80 py-0 lg:mb-8"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="mb-4 flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
          <Skeleton className="min-h-[180px] w-full rounded-xl sm:min-h-[200px]" />
          <div className="flex flex-col gap-4">
            <Skeleton className="h-7 w-3/4" />
            <div className="flex gap-3">
              <Skeleton className="h-14 w-14" />
              <Skeleton className="h-14 w-14" />
              <Skeleton className="h-14 w-14" />
              <Skeleton className="h-14 w-14" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
              <Skeleton className="h-14 rounded-lg" />
            </div>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GiveawayGridSkeleton({
  count = 6,
  className,
  label,
}: {
  count?: number;
  className?: string;
  label?: string;
}) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }, (_, index) => (
        <GiveawayCardSkeleton key={index} />
      ))}
    </div>
  );
}
