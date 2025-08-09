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
import { cn } from '@/lib/utils'; // Import cn for conditional classes

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
    api.on("resize", onSelect); // Update on resize to re-evaluate scroll positions
    onSelect(); // Initial check

    return () => {
      api.off("select", onSelect);
      api.off("resize", onSelect);
    };
  }, [api]);

  // Determine dynamic transform for the CarouselContent to shift it at edges
  const carouselContentOffsetClass = React.useMemo(() => {
    if (!canScrollPrev && movies.length > 0) { // At the very beginning
      return "translate-x-[96px]"; // Increased shift right for more space
    } else if (!canScrollNext && movies.length > 0) { // At the very end
      return "-translate-x-[96px]"; // Increased shift left for more space
    } else { // In the middle
      return "translate-x-0"; // No shift
    }
  }, [canScrollPrev, canScrollNext, movies.length]);


  return (
    <section className="mb-12 relative group">
      <h2 className="text-3xl font-bold mb-6 px-4 md:px-0">
        {title}
      </h2>
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full overflow-visible px-16" // Keep px-16 for overall padding
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
        {canScrollPrev && (
          <CarouselPrevious className="absolute -left-12 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
        )}
        {canScrollNext && (
          <CarouselNext className="absolute -right-12 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
        )}

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