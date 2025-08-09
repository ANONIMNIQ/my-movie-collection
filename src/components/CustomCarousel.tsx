import React, { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Movie } from '@/data/movies';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LazyMovieCard } from './LazyMovieCard';

interface CustomCarouselProps {
  title: string;
  movies: Movie[];
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const CustomCarousel: React.FC<CustomCarouselProps> = ({ title, movies, selectedMovieIds, onSelectMovie }) => {
  const isMobile = useIsMobile();
  const slidesToScroll = isMobile ? 2 : 5;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    slidesToScroll: slidesToScroll,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  // Removed isOverflowVisible state and related handlers as they were causing issues with carousel behavior
  // const [isOverflowVisible, setIsOverflowVisible] = useState(false);
  // const leaveTimeout = useRef<number | null>(null);

  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  // Removed handleSlideMouseEnter and handleSlideMouseLeave

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

  if (movies.length === 0) return null;

  return (
    <section className="mb-12 relative">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>
      <div className="relative z-10 mt-[-2rem]">
        <div className="relative group/carousel">
          <div className={cn("absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none transition-opacity", canScrollPrev ? "opacity-100" : "opacity-0")} />
          <Button variant="ghost" size="icon" className={cn("absolute left-2 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white transition-opacity", "opacity-0 group-hover/carousel:opacity-100", !canScrollPrev && "invisible")} onClick={scrollPrev} disabled={!canScrollPrev}>
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <div className="embla px-12" ref={emblaRef}> {/* Removed isOverflowVisible conditional class */}
            <div className="embla__container flex gap-4 py-12">
              {movies.map((movie) => (
                <div key={movie.id} className="embla__slide group/slide w-[45vw] sm:w-[32vw] md:w-[22vw] lg:w-[18vw] xl:w-[15.5vw] 2xl:w-[15vw]"> {/* Removed onMouseEnter/onMouseLeave */}
                  <LazyMovieCard movie={movie} selectedMovieIds={selectedMovieIds} onSelectMovie={onSelectMovie} />
                </div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" className={cn("absolute right-2 top-1/2 -translate-y-1/2 z-40 h-12 w-12 rounded-full bg-black/50 hover:bg-black/75 text-white transition-opacity", "opacity-0 group-hover/carousel:opacity-100", !canScrollNext && "invisible")} onClick={scrollNext} disabled={!canScrollNext}>
            <ChevronRight className="h-8 w-8" />
          </Button>
          <div className={cn("absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none transition-opacity", canScrollNext ? "opacity-100" : "opacity-0")} />
        </div>
      </div>
    </section>
  );
};