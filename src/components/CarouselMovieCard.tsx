import { Link } from "react-router-dom";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { getTmdbPosterUrl } from "@/utils/tmdbUtils";

interface CarouselMovieCardProps {
  movie: Movie;
}

export const CarouselMovieCard = ({ movie }: CarouselMovieCardProps) => {
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);

  const posterUrl = movie.poster_url && movie.poster_url !== '/placeholder.svg'
    ? movie.poster_url
    : getTmdbPosterUrl(tmdbMovie?.poster_path);

  return (
    <Link to={`/movie/${movie.id}`} className="block relative aspect-video w-full overflow-hidden rounded-lg group">
      {isLoading ? (
        <Skeleton className="w-full h-full" />
      ) : (
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white text-lg font-bold tracking-tight line-clamp-2">{movie.title}</h3>
        <p className="text-white/80 text-sm">{movie.year}</p>
      </div>
    </Link>
  );
};