import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, Trash2 } from "lucide-react";
import { useTmdbMovieDetails } from "@/hooks/useTmdbMovieDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { IMAGE_BASE_URL } from "@/lib/tmdb";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies"; // Import the Supabase Movie type
import { Button } from "@/components/ui/button";
import { useDeleteMovie } from "@/hooks/useUserMovies";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MovieDetail = () => {
  const { id: movieIdParam } = useParams<{ id: string }>();
  const movieId = parseInt(movieIdParam || '', 10);
  const [supabaseMovie, setSupabaseMovie] = useState<Movie | null>(null);
  const [isLoadingSupabaseMovie, setIsLoadingSupabaseMovie] = useState(true);
  const deleteMovieMutation = useDeleteMovie();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSupabaseMovie = async () => {
      setIsLoadingSupabaseMovie(true);
      if (isNaN(movieId)) {
        setSupabaseMovie(null);
        setIsLoadingSupabaseMovie(false);
        return;
      }
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", movieId)
        .single();

      if (error) {
        console.error("Error fetching Supabase movie:", error);
        setSupabaseMovie(null);
      } else {
        setSupabaseMovie(data as Movie);
      }
      setIsLoadingSupabaseMovie(false);
    };

    fetchSupabaseMovie();
  }, [movieId]);

  const { data: tmdbMovie, isLoading: isLoadingTmdb, isError: isTmdbError } = useTmdbMovieDetails(
    supabaseMovie?.tmdb_id || 0 // Only fetch TMDb details if supabaseMovie and its tmdb_id exist
  );

  const handleDelete = async () => {
    if (supabaseMovie) {
      try {
        await deleteMovieMutation.mutateAsync(supabaseMovie.id);
        toast.success(`"${supabaseMovie.title}" removed from your list.`);
        navigate("/"); // Redirect to home after deletion
      } catch (error: any) {
        toast.error(`Failed to delete movie: ${error.message || "Unknown error"}`);
      }
    }
  };

  if (isLoadingSupabaseMovie || isLoadingTmdb) {
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

  if (!supabaseMovie || isTmdbError) {
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

  // Use TMDb data if available, otherwise fallback to Supabase title
  const displayTitle = tmdbMovie?.title || supabaseMovie.title;
  const posterUrl = tmdbMovie?.poster_path
    ? `${IMAGE_BASE_URL}w780${tmdbMovie.poster_path}`
    : "/placeholder.svg";
  const releaseYear = tmdbMovie?.release_date ? tmdbMovie.release_date.substring(0, 4) : "N/A";
  const communityRating = tmdbMovie?.vote_average ? tmdbMovie.vote_average.toFixed(1) : 'N/A';
  const runtime = tmdbMovie?.runtime ? `${tmdbMovie.runtime} min` : 'N/A';
  const genres = tmdbMovie?.genres?.map(g => g.name) || [];
  const cast = tmdbMovie?.credits?.cast?.slice(0, 10).map((c) => c.name).join(", ") || "N/A";
  const director = tmdbMovie?.credits?.crew?.find((c) => c.job === "Director")?.name || "N/A";
  const synopsis = tmdbMovie?.overview || "No synopsis available.";

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Collection
          </Link>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMovieMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            {deleteMovieMutation.isPending ? "Removing..." : "Remove from List"}
          </Button>
        </div>
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <img
              src={posterUrl}
              alt={displayTitle}
              className="w-full h-auto rounded-lg shadow-lg aspect-[2/3] object-cover"
              onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
            />
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-xl text-muted-foreground mt-2">{releaseYear}</p>
            <div className="flex items-center flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400" size={20} />
                <span className="font-bold text-lg">
                  {communityRating}
                </span>
              </div>
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