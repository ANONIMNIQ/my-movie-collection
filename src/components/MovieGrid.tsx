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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {movies.map((movie) => {
        const [isHovered, setIsHovered] = React.useState(false);
        return (
          <div
            key={movie.id}
            className={`relative transition-all duration-300 ease-in-out overflow-visible
              ${isHovered ? "scale-115 z-30" : "scale-100 z-10"}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <MovieCard
              movie={movie}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={onSelectMovie}
              isHoveredProp={isHovered} // Pass hover state as prop
            />
          </div>
        );
      })}
    </div>
  );
};