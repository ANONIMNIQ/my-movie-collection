import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft } from "lucide-react";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import PersonalRating from "@/components/PersonalRating"; // Import PersonalRating
import { useSession } from "@/contexts/SessionContext";
import { useQuery } from "@tanstack/react-query";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user?.id; // Keep userId for conditional interactive rating

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [errorMovie, setErrorMovie] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      setLoadingMovie(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching movie details:", error);
        setErrorMovie("Failed to load movie details.");
        setLoadingMovie(false);
      } else {
        setMovie(data as Movie);
        setLoadingMovie(false);
      }
    };

    if (id) {
      fetchMovie();
    }
  }, [id]);

  const { data: tmdbMovie, isLoading: isLoadingTmdb } = useTmdbMovie(
    movie?.title ?? "",
    movie?.year ?? "",
  );

  // Fetch admin's personal rating for this movie (visible to all)
  const { data: adminPersonalRatingData, isLoading: isLoadingAdminPersonalRating } = useQuery({
    queryKey: ['admin_user_rating', id, ADMIN_USER_ID], // Use a distinct query key
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', ADMIN_USER_ID) // Always fetch for admin user
        .eq('movie_id', id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching admin's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!id, // Only enable if movie ID is available
    staleTime: 1000 * 60 * 5, // Cache personal rating for 5 minutes
  });

  // Fetch current user's personal rating (for interactive rating if logged in)
  const { data: currentUserPersonalRatingData, isLoading: isLoadingCurrentUserPersonalRating } = useQuery({
    queryKey: ['current_user_rating', id, userId], // Use a distinct query key
    queryFn: async () => {
      if (!userId || !id) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('movie_id', id)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching current user's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!userId && !!id, // Only enable if user is logged in and movie ID is available
    staleTime: 1000 * 60 * 5,
  });


  if (loadingMovie || isLoadingAdminPersonalRating || isLoadingCurrentUserPersonalRating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-64 h-96 rounded-lg" />
      </div>
    );
  }

  if (errorMovie || !movie) {
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
    : movie.poster_url;
  const synopsis = tmdbMovie?.overview || movie.synopsis;
  const cast =
    tmdbMovie?.credits?.cast
      ?.slice(0, 10)
      .map((c: any) => c.name)
      .join(", ") || movie.movie_cast.join(", ");
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
            {isLoadingTmdb ? (
              <Skeleton className="w-full aspect-[2/3] rounded-lg" />
            ) : (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-auto rounded-lg shadow-lg aspect-[2/3] object-cover"
                onError={(e) => (e.currentTarget.src = movie.poster_url)}
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
                  {movie.community_rating?.toFixed(1) ?? "N/A"}
                </span>
              </div>
              <Badge variant="outline">{movie.rating}</Badge>
              <span className="text-muted-foreground">{movie.runtime} min</span>
            </div>
            {/* Always show admin's rating */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-lg font-semibold">My Rating:</span>
              <PersonalRating movieId={movie.id} initialRating={adminPersonalRatingData} readOnly={true} />
              {adminPersonalRatingData === null && <span className="text-lg text-muted-foreground ml-1">N/A</span>}
            </div>
            {/* Show interactive rating for current user if logged in and not admin */}
            {userId && userId !== ADMIN_USER_ID && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-semibold">Your Rating:</span>
                <PersonalRating movieId={movie.id} initialRating={currentUserPersonalRatingData} />
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Synopsis</h2>
              {isLoadingTmdb ? (
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
               {isLoadingTmdb ? (
                <Skeleton className="h-4 w-1/2 mt-2" />
              ) : (
              <p className="mt-2 text-lg text-muted-foreground">{director}</p>
              )}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Cast</h2>
               {isLoadingTmdb ? (
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