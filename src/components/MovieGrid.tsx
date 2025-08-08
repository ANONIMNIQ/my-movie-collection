import { Movie } from "@/data/movies";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: Movie[];
  selectedMovieIds: Set<string>; // New prop
  onSelectMovie: (id: string, isSelected: boolean) => void; // New prop
}

export const MovieGrid = ({ movies, selectedMovieIds, onSelectMovie }: MovieGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isSelected={selectedMovieIds.has(movie.id)}
          onSelect={onSelectMovie}
        />
      ))}
    </div>
  );
};