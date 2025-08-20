import React, { useState, useRef, useEffect } from 'react';
import { MobileMovieCard } from './MobileMovieCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie } from '@/data/movies';

interface LazyMobileMovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const LazyMobileMovieCard: React.FC<LazyMobileMovieCardProps> = (props) => {
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
    <div ref={cardRef} className="relative h-full">
      {isRendered ? (
        <MobileMovieCard {...props} shouldPrefetch={shouldPrefetch} />
      ) : (
        <Skeleton className="w-full h-80 rounded-lg" />
      )}
    </div>
  );
};