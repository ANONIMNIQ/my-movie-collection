import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LetterFilterCarouselProps {
  letters: string[];
  onSelect: (letter: string) => void;
  activeLetter: string;
}

const LetterFilterCarousel: React.FC<LetterFilterCarouselProps> = ({ letters, onSelect, activeLetter }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: false,
    slidesToScroll: 1,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);

  const onSelectCallback = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelectCallback);
    emblaApi.on('reInit', onSelectCallback);
    onSelectCallback(); // Initial check
    return () => {
      emblaApi.off('select', onSelectCallback);
      emblaApi.off('reInit', onSelectCallback);
    };
  }, [emblaApi, onSelectCallback]);

  if (letters.length <= 1) { // Don't show if only "All" or no letters
    return null;
  }

  return (
    <div className="relative flex items-center w-full max-w-[calc(100%-200px)]"> {/* Adjusted max-width */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 text-gray-500 hover:text-gray-700 transition-opacity",
          !canScrollPrev && "opacity-0 pointer-events-none"
        )}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      <div className="embla flex-grow overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex gap-0.5 py-2"> {/* Reduced gap */}
          {letters.map((letter) => (
            <div key={letter} className="embla__slide flex-shrink-0">
              <Button
                variant="ghost"
                className={cn(
                  "px-2 py-1 text-sm transition-colors", // Smaller padding
                  "bg-transparent border-none text-gray-600 hover:text-black", // Simple styling
                  activeLetter === letter && "font-bold text-black" // Active state: bold and black
                )}
                onClick={() => onSelect(letter)}
              >
                {letter}
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-0 top-1/2 -translate-y-1/2 z-10 h-6 w-6 text-gray-500 hover:text-gray-700 transition-opacity",
          !canScrollNext && "opacity-0 pointer-events-none"
        )}
        onClick={scrollNext}
        disabled={!canScrollNext}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default LetterFilterCarousel;