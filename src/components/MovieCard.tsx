import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const { data: tmdbMovie, isLoading, isError } = useTmdbMovie(movie.title, movie.year);

  const posterUrl = tmdbMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
    : movie.poster_url; // Changed to movie.poster_url

  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col bg-card">
        <CardHeader className="p-0 relative">
          <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                // Use placeholder on error
                onError={(e) => (e.currentTarget.src = movie.poster_url)} // Changed to movie.poster_url
              />
            )}
          </div>
        </CardHeader>
        <div className="p-4 flex flex-col flex-grow">
          <CardTitle className="text-base font-bold line-clamp-2 flex-grow">
            {movie.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{movie.year}</p>
        </div>
      </Card>
    </Link>
  );
};