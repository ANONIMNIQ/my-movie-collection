import React, { useState, useRef, useEffect } from 'react';
import { MovieCard } from './MovieCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Movie } from '@/data/movies';

interface LazyMovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const LazyMovieCard: React.FC<LazyMovieCardProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '200px' } // Start loading when the card is 200px away from the viewport
    );

    const currentRef = cardRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div ref={cardRef} className="h-full w-full">
      {isVisible ? (
        <MovieCard {...props} />
      ) : (
        <Skeleton className="aspect-[2/3] w-full h-full rounded-none" />
      )}
    </div>
  );
};