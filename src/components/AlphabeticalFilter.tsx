import React, { useMemo, useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Movie } from '@/data/movies';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AlphabeticalFilterProps {
  movies: Movie[];
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
}

const AlphabeticalFilter: React.FC<AlphabeticalFilterProps> = ({ movies, selectedLetter, onSelectLetter }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', dragFree: true });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const letters = useMemo(() => {
    const firstLetters = new Set<string>();
    movies.forEach(movie => {
      if (movie.title && /^[a-zA-Z]/.test(movie.title)) { // Only include letters
        firstLetters.add(movie.title[0].toUpperCase());
      }
    });
    return Array.from(firstLetters).sort();
  }, [movies]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      if (emblaApi) {
        emblaApi.off('select', onSelect);
        emblaApi.off('reInit', onSelect);
      }
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  if (letters.length < 2) { // Don't show filter if there's only one or zero letters
    return null;
  }

  return (
    <div className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl group">
      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex items-center gap-2">
          <Button
            variant={selectedLetter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectLetter(null)}
            className={cn(
              "embla__slide flex-shrink-0 rounded-full",
              selectedLetter === null
                ? "bg-black text-white"
                : "bg-white text-black border-gray-300 hover:bg-gray-200"
            )}
          >
            All
          </Button>
          {letters.map(letter => (
            <Button
              key={letter}
              variant={selectedLetter === letter ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectLetter(letter)}
              className={cn(
                "embla__slide flex-shrink-0 rounded-full w-9 h-9 p-0",
                selectedLetter === letter
                  ? "bg-black text-white"
                  : "bg-white text-black border-gray-300 hover:bg-gray-200"
              )}
            >
              {letter}
            </Button>
          ))}
        </div>
      </div>
      <div className={cn("absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-gray-200 to-transparent z-10 pointer-events-none transition-opacity", canScrollPrev ? "opacity-100" : "opacity-0")} />
      <div className={cn("absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-gray-200 to-transparent z-10 pointer-events-none transition-opacity", canScrollNext ? "opacity-100" : "opacity-0")} />
      {canScrollPrev && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md text-black opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      )}
      {canScrollNext && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 h-8 w-8 rounded-full bg-white/80 hover:bg-white shadow-md text-black opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={scrollNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default AlphabeticalFilter;