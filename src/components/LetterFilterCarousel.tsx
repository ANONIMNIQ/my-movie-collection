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

  if (letters.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center flex-grow"> {/* Removed max-w-[calc(100%-200px)] */}
      {/* Left arrow button and gradient */}
      <div className="relative flex-shrink-0 w-8 h-full">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-r from-gray-200 to-transparent pointer-events-none transition-opacity duration-300",
          !canScrollPrev && "opacity-0"
        )} />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 transition-colors duration-300",
            canScrollPrev ? "text-gray-500 hover:text-gray-700" : "text-gray-400 cursor-not-allowed"
          )}
          onClick={scrollPrev}
          disabled={!canScrollPrev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="embla flex-grow overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex gap-0.5 py-2">
          {letters.map((letter) => (
            <div key={letter} className="embla__slide flex-shrink-0">
              <Button
                variant="ghost"
                className={cn(
                  "px-2 py-1 text-sm transition-colors duration-200",
                  "bg-transparent border-none text-gray-600 hover:text-gray-800", // Subtle hover
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

      {/* Right arrow button and gradient */}
      <div className="relative flex-shrink-0 w-8 h-full">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-l from-gray-200 to-transparent pointer-events-none transition-opacity duration-300",
          !canScrollNext && "opacity-0"
        )} />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6 transition-colors duration-300",
            canScrollNext ? "text-gray-500 hover:text-gray-700" : "text-gray-400 cursor-not-allowed"
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