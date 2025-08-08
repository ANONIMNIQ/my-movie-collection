import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft } from "lucide-react";
import { useTmdbMovieDetails } from "@/hooks/useTmdbMovieDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { IMAGE_BASE_URL } from "@/lib/tmdb";

const MovieDetail = () => {
  const { tmdbId: tmdbIdParam } = useParams<{ tmdbId: string }>();
  const tmdbId = parseInt(tmdbIdParam || '', 10);

  const { data: movie, isLoading, isError } = useTmdbMovieDetails(tmdbId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12">
        <div className="container mx-auto px-4">
          <Skeleton className="h-6 w-48 mb-8" />
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="md:col-span-1">
              <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            </div>
            <div className="md:col-span-2">
              <Skeleton className="h-10 w-3/4 mb-2" />
              <Skeleton className="h-6 w-1/4 mb-4" />
              <div className="flex items-center flex-wrap gap-4 mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="mt-8 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="mt-8 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="mt-8 space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Movie not found or error loading details</h1>
          <Link to="/" className="text-primary hover:underline">
            Back to collection
          </Link>
        </div>
      </div>
    );
  }

  const posterUrl = movie.poster_path
    ? `${IMAGE_BASE_URL}w780${movie.poster_path}`
    : "/placeholder.svg";
  const releaseYear = movie.release_date ? movie.release_date.substring(0, 4) : "N/A";
  const communityRating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
  const runtime = movie.runtime ? `${movie.runtime} min` : 'N/A';
  const genres = movie.genres?.map(g => g.name) || [];
  const cast = movie.credits?.cast?.slice(0, 10).map((c) => c.name).join(", ") || "N/A";
  const director = movie.credits?.crew?.find((c) => c.job === "Director")?.name || "N/A";
  const synopsis = movie.overview || "No synopsis available.";

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Collection
        </Link>
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-auto rounded-lg shadow-lg aspect-[2/3] object-cover"
              onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
            />
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {movie.title}
            </h1>
            <p className="text-xl text-muted-foreground mt-2">{releaseYear}</p>
            <div className="flex items-center flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400" size={20} />
                <span className="font-bold text-lg">
                  {communityRating}
                </span>
              </div>
              {/* TMDb doesn't have a direct 'rating' like PG/R in summary, so we'll omit this for now or find an alternative */}
              <span className="text-muted-foreground">{runtime}</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Synopsis</h2>
              <p className="mt-2 text-lg text-muted-foreground">{synopsis}</p>
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Director</h2>
              <p className="mt-2 text-lg text-muted-foreground">{director}</p>
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Cast</h2>
              <p className="mt-2 text-lg text-muted-foreground">{cast}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;