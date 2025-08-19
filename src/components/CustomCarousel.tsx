import React, { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Movie } from '@/data/movies';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { LazyMovieCard } from './LazyMovieCard';
import { motion } from 'framer-motion';
import { CalendarAltIcon, HeartBreakIcon, BinocularIcon, UfoIcon, GhostIcon, TrophyIcon } from '@/components/icons';

interface CustomCarouselProps {
  title: string;
  movies: Movie[];
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
  isMobile: boolean;
  pageLoaded: boolean;
}

const titleIcons: { [key: string]: React.FC<React.SVGProps<SVGSVGElement>> } = {
  "New Movies": CalendarAltIcon,
  "The best thought provoking / mind-bending movies in my collection": TrophyIcon, // Updated key
  "Drama": HeartBreakIcon,
  "Thriller": BinocularIcon,
  "Sci-Fi": UfoIcon,
  "Horror": GhostIcon,
};

export const CustomCarousel: React.FC<CustomCarouselProps> = ({ title, movies, selectedMovieIds, onSelectMovie, isMobile, pageLoaded }) => {
  const isMobileHook = useIsMobile();
  const slidesToScroll = isMobileHook ? 2 : 5;
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'center',
    loop: false,
    slidesToScroll: slidesToScroll,
  });

  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [isOverflowVisible, setIsOverflowVisible] = useState(false);
  const leaveTimeout = useRef<number | null>(null);

  const scrollPrev = useCallback(() => { if (emblaApi) emblaApi.scrollPrev(); }, [emblaApi]);
  const scrollNext = useCallback(() => { if (emblaApi) emblaApi.scrollNext(); }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const rootNode = emblaApi.rootNode();
    const addScrollingClass = () => rootNode.classList.add('is-scrolling');
    const removeScrollingClass = () => rootNode.classList.remove('is-scrolling');

    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    emblaApi.on('scroll', addScrollingClass);
    emblaApi.on('settle', removeScrollingClass);

    return () => {
      if (emblaApi) {
        emblaApi.off('select', onSelect);
        emblaApi.off('reInit', onSelect);
        emblaApi.off('scroll', addScrollingClass);
        emblaApi.off('settle', removeScrollingClass);
      }
    };
  }, [emblaApi, onSelect]);

  const handleSlideMouseEnter = () => {
    if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
    setIsOverflowVisible(true);
  };

  const handleSlideMouseLeave = () => {
    leaveTimeout.current = window.setTimeout(() => setIsOverflowVisible(false), 100);
  };

  if (movies.length === 0) return null;

  const IconComponent = titleIcons[title];

  return (
    <section className="mb-12 relative z-30">
      <div className="px-10">
        <motion.h2
          className="text-3xl font-bold flex items-center"
          initial={isMobile ? { color: "rgb(255,255,255)" } : {}}
          animate={isMobile && pageLoaded ? { color: "rgb(0,0,0)" } : {}}
          transition={{ duration: 0.8, ease: "easeOut", delay: 1.5 }}
        >
          {!isMobileHook && IconComponent && (
            <div className="bg-white rounded-full p-2 flex items-center justify-center mr-2 w-10 h-10">
              <IconComponent className="w-6 h-6 text-black" />
            </div>
          )}
          {title}
        </motion.h2>
      </div>
      <div className="relative z-10 mt-[-2rem]">
        <div className="relative group/carousel">
          <div className={cn("absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none transition-opacity", canScrollPrev ? "opacity-100" : "opacity-0")} />
          <Button variant="ghost" size="icon" className={cn("absolute left-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/60 hover:bg-black/75 text-white backdrop-blur-sm shadow-md transition-opacity", "opacity-0 group-hover/carousel:opacity-100", !canScrollPrev && "invisible")} onClick={scrollPrev} disabled={!canScrollPrev}>
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <div className={cn("embla px-12", isOverflowVisible && "!overflow-visible")} ref={emblaRef}>
            <div className="embla__container flex gap-4 py-12">
              {movies.map((movie) => (
                <div key={movie.id} className="embla__slide relative aspect-[2/3] group/slide w-[45vw] sm:w-[32vw] md:w-[22vw] lg:w-[18vw] xl:w-[15.5vw] 2xl:w-[15vw]" onMouseEnter={handleSlideMouseEnter} onMouseLeave={handleSlideMouseLeave}>
                  <LazyMovieCard movie={movie} selectedMovieIds={selectedMovieIds} onSelectMovie={onSelectMovie} showSynopsis={true} />
                </div>
              ))}
            </div>
          </div>
          <Button variant="ghost" size="icon" className={cn("absolute right-2 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/60 hover:bg-black/75 text-white backdrop-blur-sm shadow-md transition-opacity", "opacity-0 group-hover/carousel:opacity-100", !canScrollNext && "invisible")} onClick={scrollNext} disabled={!canScrollNext}>
            <ChevronRight className="h-8 w-8" />
          </Button>
          <div className={cn("absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none transition-opacity", canScrollNext ? "opacity-100" : "opacity-0")} />
        </div>
      </div>
    </section>
  );
};