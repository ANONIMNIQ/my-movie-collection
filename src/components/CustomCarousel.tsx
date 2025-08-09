import React, { useRef, useState, useEffect } from 'react';
import { Movie } from '@/data/movies';
import { MovieCard } from './MovieCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomCarouselProps {
  title: string;
  movies: Movie[];
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const CustomCarousel: React.FC<CustomCarouselProps> = ({ title, movies, selectedMovieIds, onSelectMovie }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  if (movies.length === 0) {
    return null;
  }

  const checkForScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkForScrollability();
      container.addEventListener('scroll', checkForScrollability);
      window.addEventListener('resize', checkForScrollability);
      return () => {
        container.removeEventListener('scroll', checkForScrollability);
        window.removeEventListener('resize', checkForScrollability);
      };
    }
  }, [movies]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <section className="mb-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">{title}</h2>
        <div className="relative group">
          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-background/80 hover:bg-background transition-opacity",
              "opacity-0 group-hover:opacity-100",
              !canScrollLeft && "opacity-0 group-hover:opacity-0 cursor-not-allowed"
            )}
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto space-x-4 py-12 scrollbar-hide -mx-4 px-4"
          >
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className={cn(
                  "flex-shrink-0 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6",
                  index === 0 && "ml-4", // Add margin to the first item
                  index === movies.length - 1 && "mr-4" // Add margin to the last item
                )}
              >
                <MovieCard
                  movie={movie}
                  selectedMovieIds={selectedMovieIds}
                  onSelectMovie={onSelectMovie}
                />
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 z-40 h-10 w-10 rounded-full bg-background/80 hover:bg-background transition-opacity",
              "opacity-0 group-hover:opacity-100",
              !canScrollRight && "opacity-0 group-hover:opacity-0 cursor-not-allowed"
            )}
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </section>
  );
};