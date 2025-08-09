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

  // Determine dynamic padding for the CarouselContent to allow hover expansion
  const carouselContentPaddingClasses = React.useMemo(() => {
    const hoverBuffer = "pl-8 pr-8"; // Extra padding for hover effect (e.g., 32px)
    let classes = "-ml-8 overflow-visible py-12"; // Base classes, -ml-8 to compensate for pl-8 on CarouselItem

    if (!canScrollPrev) { // At the very beginning, add extra left padding
      classes = cn(classes, "pl-8");
    } else if (!canScrollNext) { // At the very end, add extra right padding
      classes = cn(classes, "pr-8");
    }
    // No specific class for "middle" as it defaults to the base -ml-8 and no extra pl/pr

    return classes;
  }, [canScrollPrev, canScrollNext]);


  return (
    <section className="px-4 mb-12 relative group transition-all duration-300 ease-in-out">
      <h2 className="text-3xl font-bold mb-6">
        {title}
      </h2>
      <Carousel
        opts={{
          align: "start",
        }}
        className="w-full overflow-visible"
        setApi={setApi}
      >
        <CarouselContent className={carouselContentPaddingClasses}>
          {movies.map((movie) => {
            return (
              <CarouselItem
                key={movie.id}
                className="pl-8 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 relative overflow-visible"
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
          <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
        )}
        {canScrollNext && (
          <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
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