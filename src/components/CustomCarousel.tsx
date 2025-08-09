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
      setCanScrollLeft(scrollLeft > 5); // Add a small buffer
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5); // Add a small buffer
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
      const scrollAmount = clientWidth * 0.9; // Scroll by 90% of the visible width
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
      </div>
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white transition-opacity",
            "opacity-0 group-hover:opacity-100",
            !canScrollLeft && "hidden"
          )}
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto space-x-4 scrollbar-hide px-4 md:px-8 lg:px-12 py-4 snap-x snap-mandatory scroll-smooth scroll-pl-4 md:scroll-pl-8 lg:scroll-pl-12"
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="flex-shrink-0 w-[40vw] sm:w-[28vw] md:w-[22vw] lg:w-[18vw] xl:w-[13.5vw] snap-start"
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
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white transition-opacity",
            "opacity-0 group-hover:opacity-100",
            !canScrollRight && "hidden"
          )}
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>
    </section>
  );
};