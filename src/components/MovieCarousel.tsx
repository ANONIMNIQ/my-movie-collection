import React from 'react';
import { Movie } from '@/data/movies';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import { MovieCard } from './MovieCard';
import { cn } from '@/lib/utils';

interface MovieCarouselProps {
  title: string;
  movies: Movie[];
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const MovieCarousel: React.FC<MovieCarouselProps> = ({ title, movies, selectedMovieIds, onSelectMovie }) => {
  if (movies.length === 0) {
    return null;
  }

  const [api, setApi] = React.useState<ReturnType<typeof useCarousel>[0] | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!api) {
      return;
    }

    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    api.on("select", onSelect);
    api.on("resize", onSelect);
    onSelect();

    return () => {
      api.off("select", onSelect);
      api.off("resize", onSelect);
    };
  }, [api]);

  const carouselContentOffsetClass = React.useMemo(() => {
    // This offset is to prevent the first/last card from being cut on hover
    // A card scales to 1.25, so 25% of its width (e.g., 180px * 0.25 = 45px) needs to be accounted for on each side.
    // 45px * 2 = 90px. Using 96px for a bit of buffer.
    const offset = 96; 
    if (!canScrollPrev && movies.length > 0) {
      return `translate-x-[${offset}px]`; 
    } else if (!canScrollNext && movies.length > 0) {
      return `-translate-x-[${offset}px]`;
    } else {
      return "translate-x-0";
    }
  }, [canScrollPrev, canScrollNext, movies.length]);


  return (
    <section className="mb-12 relative group"> {/* Removed px-24 */}
      <h2 className="text-3xl font-bold mb-6 container mx-auto px-4"> {/* Title aligned with main content */}
        {title}
      </h2>
      
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full overflow-visible container mx-auto px-4" // Added container mx-auto px-4 here
        viewportClassName="overflow-visible" 
        setApi={setApi}
      >
        <CarouselContent className={cn("-ml-4 overflow-visible py-12 transition-transform duration-300 ease-out", carouselContentOffsetClass)}>
          {movies.map((movie) => {
            return (
              <CarouselItem
                key={movie.id}
                className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 relative overflow-visible"
              >
                <div className="p-1">
                  <MovieCard
                    movie={movie}
                    selectedMovieIds={selectedMovieIds}
                    onSelectMovie={onSelectMovie}
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {/* Buttons positioned relative to the Carousel, which now has px-4 */}
        {canScrollPrev && (
          <CarouselPrevious className="absolute -left-8 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
        )}
        {canScrollNext && (
          <CarouselNext className="absolute -right-8 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
        )}

        {/* Gradient overlays moved inside Carousel and adjusted to match its padding */}
        {canScrollPrev && (
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none"></div>
        )}
        {canScrollNext && (
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none"></div>
        )}
      </Carousel>
    </section>
  );
};