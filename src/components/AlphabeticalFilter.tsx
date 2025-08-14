import React, { useMemo, useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Movie } from '@/data/movies';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile'; // Import the hook

interface AlphabeticalFilterProps {
  movies: Movie[];
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
}

const AlphabeticalFilter: React.FC<AlphabeticalFilterProps> = ({ movies, selectedLetter, onSelectLetter }) => {
  const isMobileHook = useIsMobile(); // Use the hook here

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: isMobileHook ? 'start' : 'end', // Align to start on mobile, end on desktop
    dragFree: true
  });
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
    <div className="flex items-center justify-center w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-4xl 2xl:max-w-5xl">
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 flex-shrink-0 text-gray-400 hover:text-black hover:bg-transparent transition-opacity",
          canScrollPrev ? "opacity-100" : "opacity-0" // Removed 'invisible'
        )}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="relative flex-grow overflow-hidden">
        <div className="embla" ref={emblaRef}>
          {/* Removed conditional justify-content here as Embla's 'align' option handles it */}
          <div className="embla__container flex items-center gap-4 px-2">
            <button
              onClick={() => onSelectLetter(null)}
              className={cn(
                "embla__slide flex-shrink-0 text-base font-medium transition-colors",
                selectedLetter === null
                  ? "text-black"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              All
            </button>
            {letters.map(letter => (
              <button
                key={letter}
                onClick={() => onSelectLetter(letter)}
                className={cn(
                  "embla__slide flex-shrink-0 text-base font-medium transition-colors",
                  selectedLetter === letter
                    ? "text-black"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        </div>
        {/* Gradients still have pointer-events-none, which is correct */}
        <div className={cn("absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-200 to-transparent z-10 pointer-events-none transition-opacity", canScrollPrev ? "opacity-100" : "opacity-0")} />
        <div className={cn("absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-200 to-transparent z-10 pointer-events-none transition-opacity", canScrollNext ? "opacity-100" : "opacity-0")} />
      </div>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 flex-shrink-0 text-gray-400 hover:text-black hover:bg-transparent transition-opacity",
          canScrollNext ? "opacity-100" : "opacity-0" // Removed 'invisible'
        )}
        onClick={scrollNext}
        disabled={!canScrollNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default AlphabeticalFilter;