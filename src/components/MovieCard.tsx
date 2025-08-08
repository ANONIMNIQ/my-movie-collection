import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { TmdbMovieSummary } from "@/data/movies";
import { Skeleton } from "@/components/ui/skeleton";
import { IMAGE_BASE_URL } from "@/lib/tmdb";

interface MovieCardProps {
  movie: TmdbMovieSummary;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}w500${movie.poster_path}`
    : "/placeholder.svg"; // Fallback to a local placeholder if no poster

  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";

  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col bg-card">
        <CardHeader className="p-0 relative">
          <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
            {movie.poster_path === null ? ( // Show skeleton if poster_path is explicitly null
              <Skeleton className="w-full h-full" />
            ) : (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                // Use placeholder on error if image fails to load
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
            )}
          </div>
        </CardHeader>
        <div className="p-4 flex flex-col flex-grow">
          <CardTitle className="text-base font-bold line-clamp-2 flex-grow">
            {movie.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{releaseYear}</p>
        </div>
      </Card>
    </Link>
  );
};