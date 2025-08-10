import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MovieDetailSkeleton: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Backdrop Skeleton */}
      <div className="absolute inset-x-0 top-0 h-[60vh] bg-gray-900 opacity-50 md:opacity-70 overflow-hidden"> {/* Added overflow-hidden */}
        <Skeleton className="w-full h-full" /> {/* Skeleton for the covering element */}
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:pt-[60vh] md:pb-12">
        {/* Back button skeleton */}
        <Skeleton className="h-6 w-32 mb-8" />

        {/* Title/Logo Skeleton */}
        <Skeleton className="h-12 w-3/4 md:w-1/2 lg:w-1/3 mb-4" />

        {/* Metadata Skeleton */}
        <div className="flex items-center flex-wrap gap-4">
          <Skeleton className="h-6 w-24" /> {/* Rating */}
          <Skeleton className="h-6 w-20" /> {/* Runtime */}
          <Skeleton className="h-6 w-16" /> {/* Year */}
        </div>

        {/* Watch Trailer Button Skeleton */}
        <Skeleton className="h-12 w-48 mt-6" />

        {/* Synopsis Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-32 mb-4" /> {/* Synopsis heading */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>

        {/* Genres Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-24 mb-4" /> {/* Genres heading */}
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>

        {/* Georgi's Rating Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-28 mb-4" /> {/* Georgi's Rating heading */}
          <Skeleton className="h-6 w-40" /> {/* Stars */}
        </div>

        {/* Director Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-28 mb-4" /> {/* Director heading */}
          <Skeleton className="h-6 w-1/3" />
        </div>

        {/* Cast Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-20 mb-4" /> {/* Cast heading */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        {/* Trailer Section Skeleton */}
        <div className="mt-8">
          <Skeleton className="h-8 w-28 mb-4" /> {/* Trailer heading */}
          <Skeleton className="w-full aspect-video rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default MovieDetailSkeleton;