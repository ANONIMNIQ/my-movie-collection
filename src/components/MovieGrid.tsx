import { Movie } from "@/data/movies";
import { MovieCard } from "./MovieCard";
import React from "react"; // Import React for useState and event handlers

interface MovieGridProps {
  movies: Movie[];
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

export const MovieGrid = ({ movies, selectedMovieIds, onSelectMovie }: MovieGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-12">
      {movies.map((movie) => {
        return (
          <div
            key={movie.id}
            className="relative overflow-visible group/slide"
          >
            <MovieCard
              movie={movie}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={onSelectMovie}
            />
          </div>
        );
      })}
    </div>
  );
};