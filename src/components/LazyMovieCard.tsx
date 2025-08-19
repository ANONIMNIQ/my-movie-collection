import React, { useState, useRef, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie } from '@/data/movies';

interface LazyMovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
  showSynopsis?: boolean;
}

export const LazyMovieCard: React.FC<LazyMovieCardProps> = (props) => {
  const [isRendered, setIsRendered] = useState(false);
  const [shouldPrefetch, setShouldPrefetch] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const renderObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRendered(true);
            renderObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' } // Render when 200px away
    );

    const prefetchObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldPrefetch(true);
            prefetchObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '500px' } // Prefetch when 500px away
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      renderObserver.observe(currentRef);
      prefetchObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        renderObserver.unobserve(currentRef);
        prefetchObserver.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className="absolute inset-0">
      {isRendered ? (
        <MovieCard {...props} shouldPrefetch={shouldPrefetch} />
      ) : (
        <Skeleton className="aspect-[2/3] w-full h-full rounded-none" />
      )}
    </div>
  );
};