import { TmdbMovieSummary } from "@/data/movies";
import { MovieCard } from "./MovieCard";

interface MovieGridProps {
  movies: TmdbMovieSummary[];
}

export const MovieGrid = ({ movies }: MovieGridProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
};