import { Movie } from "@/data/movies";
import { LazyMovieCard } from "./LazyMovieCard";
import React from "react";
import { cn } from "@/lib/utils";

interface MovieGridProps {
  movies: Movie[];
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const MovieGrid = ({ movies, selectedMovieIds, onSelectMovie }: MovieGridProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-12 px-6">
      {movies.map((movie) => {
        return (
          <div
            key={movie.id}
            // On small screens (below sm breakpoint), limit the card's base width
            // and center it, so that when it scales on hover, it stays within view.
            // On sm and larger screens, it will revert to grid's default sizing.
            className={cn(
              "relative overflow-visible group/slide",
              "max-w-[280px] mx-auto sm:max-w-none sm:mx-0"
            )}
          >
            <LazyMovieCard
              movie={movie}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={onSelectMovie}
              showSynopsis={false} // Explicitly hide synopsis for grid cards
            />
          </div>
        );
      })}
    </div>
  );
};