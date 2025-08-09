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

  // Added px-10 to create horizontal space for the first and last cards to expand into
  const carouselContentClasses = cn(
    "-ml-4 transition-transform duration-300 ease-out py-12 px-10"
  );

  return (
    <section className="mb-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6">
          {title}
        </h2>
        
        <div className="relative group">
          <Carousel
            opts={{
              align: "start",
              slidesToScroll: 5.6,
            }}
            className="w-full"
            setApi={setApi}
          >
            <CarouselContent className={carouselContentClasses}>
              {movies.map((movie) => {
                return (
                  <CarouselItem
                    key={movie.id}
                    className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                  >
                    <MovieCard
                      movie={movie}
                      selectedMovieIds={selectedMovieIds}
                      onSelectMovie={onSelectMovie}
                    />
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            
            {/* Navigation Arrows */}
            {canScrollPrev && (
              <CarouselPrevious className="absolute -left-4 top-1/2 -translate-y-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
            )}
            {canScrollNext && (
              <CarouselNext className="absolute -right-4 top-1/2 -translate-y-1/2 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/80 hover:bg-background rounded-full h-10 w-10 flex items-center justify-center" />
            )}
          </Carousel>
          
          {/* Gradient Overlays for blur effect */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none"></div>
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};