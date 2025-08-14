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
  gradientFromColor: string; // New prop for dynamic gradient start color (e.g., "from-gray-200")
}

const LetterFilterCarousel: React.FC<LetterFilterCarouselProps> = ({ letters, onSelect, activeLetter, className, gradientFromColor }) => {
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
    <div className={cn("flex items-center relative", className)}>
      {/* Left arrow and gradient container */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-12 z-10 flex items-center justify-center transition-opacity duration-300",
        !canScrollPrev && "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "absolute inset-0",
          `${gradientFromColor}/90 to-transparent` // Use the prop directly for gradient start color
        )} />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-6 w-6 text-gray-800 hover:text-gray-900 transition-colors duration-300", // Changed text color
            !canScrollPrev && "text-gray-300 cursor-not-allowed" // Changed disabled text color
          )}
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

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

      {/* Right arrow and gradient container */}
      <div className={cn(
        "absolute right-0 top-0 bottom-0 w-12 z-10 flex items-center justify-center transition-opacity duration-300",
        !canScrollNext && "opacity-0 pointer-events-none"
      )}>
        <div className={cn(
          "absolute inset-0",
          `${gradientFromColor}/90 to-transparent` // Use the prop directly for gradient start color
        )} />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative h-6 w-6 text-gray-800 hover:text-gray-900 transition-colors duration-300", // Changed text color
            !canScrollNext && "text-gray-300 cursor-not-allowed" // Changed disabled text color
          )}
          onClick={scrollNext}
          disabled={!canScrollNext}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default LetterFilterCarousel;