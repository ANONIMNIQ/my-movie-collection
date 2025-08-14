import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LetterFilterCarouselProps {
  letters: string[];
  onSelect: (letter: string) => void;
  activeLetter: string;
  className?: string;
}

const LetterFilterCarousel: React.FC<LetterFilterCarouselProps> = ({ letters, onSelect, activeLetter, className }) => {
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
    emblaApi.on('resize', onSelectCallback);
    onSelectCallback();
    return () => {
      emblaApi.off('select', onSelectCallback);
      emblaApi.off('reInit', onSelectCallback);
      emblaApi.off('resize', onSelectCallback);
    };
  }, [emblaApi, onSelectCallback]);

  if (letters.length <= 1) {
    return null;
  }

  return (
    <div className={cn("flex items-center", className)}> {/* Removed flex-grow from here */}
      {/* Left arrow button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "flex-shrink-0 h-6 w-6 text-gray-500 hover:text-gray-700 transition-opacity",
          !canScrollPrev && "opacity-0 pointer-events-none"
        )}
        onClick={scrollPrev}
        disabled={!canScrollPrev}
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Left gradient overlay */}
      <div className={cn(
        "flex-shrink-0 h-full w-8 bg-gradient-to-r from-black/10 to-transparent pointer-events-none transition-opacity duration-300", // Adjusted gradient color and width
        !canScrollPrev && "opacity-0"
      )} />

      <div className="embla flex-grow min-w-0 overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex gap-0.5 py-2">
          {letters.map((letter) => (
            <div key={letter} className="embla__slide flex-shrink-0">
              <Button
                variant="ghost"
                className={cn(
                  "px-2 py-1 text-sm transition-colors duration-200",
                  "bg-transparent border-none text-gray-600 hover:text-gray-800",
                  activeLetter === letter && "font-bold text-black"
                )}
                onClick={() => onSelect(letter)}
              >
                {letter}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Right gradient overlay */}
      <div className={cn(
        "flex-shrink-0 h-full w-8 bg-gradient-to-l from-black/10 to-transparent pointer-events-none transition-opacity duration-300", // Adjusted gradient color and width
        !canScrollNext && "opacity-0"
      )} />
      {/* Right arrow button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "flex-shrink-0 h-6 w-6 text-gray-500 hover:text-gray-700 transition-opacity",
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