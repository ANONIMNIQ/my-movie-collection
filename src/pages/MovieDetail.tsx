import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft } from "lucide-react";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies"; // Import the updated Movie interface

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();

  const { data: movie, isLoading: isMovieLoading, isError: isMovieError } = useQuery({
    queryKey: ["movie", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Movie;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const { data: tmdbMovie, isLoading: isTmdbLoading } = useTmdbMovie(
    movie?.title ?? "",
    movie?.year ?? "",
  );

  if (isMovieLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading movie details...</p>
      </div>
    );
  }

  if (isMovieError || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Movie not found</h1>
          <Link to="/" className="text-primary hover:underline">
            Back to collection
          </Link>
        </div>
      </div>
    );
  }

  const posterUrl = tmdbMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w780${tmdbMovie.poster_path}`
    : movie.posterUrl;
  const synopsis = tmdbMovie?.overview || movie.synopsis;
  const cast =
    tmdbMovie?.credits?.cast
      ?.slice(0, 10)
      .map((c: any) => c.name)
      .join(", ") || movie.movie_cast.join(", "); // Changed to movie.movie_cast
  const director =
    tmdbMovie?.credits?.crew?.find((c: any) => c.job === "Director")?.name ||
    movie.director;

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
            {isTmdbLoading ? (
              <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            ) : (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-auto rounded-lg shadow-lg aspect-[2/3] object-cover"
                onError={(e) => (e.currentTarget.src = movie.posterUrl)}
              />
            )}
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {movie.title}
            </h1>
            <p className="text-xl text-muted-foreground mt-2">{movie.year}</p>
            <div className="flex items-center flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400" size={20} />
                <span className="font-bold text-lg">
                  {movie.communityRating.toFixed(1)}
                </span>
              </div>
              <Badge variant="outline">{movie.rating}</Badge>
              <span className="text-muted-foreground">{movie.runtime} min</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Synopsis</h2>
              {isTmdbLoading ? (
                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : (
                <p className="mt-2 text-lg text-muted-foreground">{synopsis}</p>
              )}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Director</h2>
               {isTmdbLoading ? (
                <Skeleton className="h-4 w-1/2 mt-2" />
              ) : (
              <p className="mt-2 text-lg text-muted-foreground">{director}</p>
              )}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Cast</h2>
               {isTmdbLoading ? (
                 <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
              <p className="mt-2 text-lg text-muted-foreground">{cast}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;