import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, Youtube } from "lucide-react";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import PersonalRating from "@/components/PersonalRating";
import { useSession } from "@/contexts/SessionContext";
import { useQuery } from "@tanstack/react-query";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user?.id;

  // Fetch main movie data using useQuery
  const { data: movie, isLoading: isLoadingMovie, isError: isErrorMovie } = useQuery<Movie, Error>({
    queryKey: ["movie", id],
    queryFn: async () => {
      if (!id) throw new Error("Movie ID is missing.");
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching movie details:", error);
        throw new Error("Failed to load movie details.");
      }
      return data as Movie;
    },
    enabled: !!id, // Only run this query if id is available
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: false, // Do not retry on error, handle it directly
  });

  const { data: tmdbMovie, isLoading: isLoadingTmdb } = useTmdbMovie(
    movie?.title ?? "",
    movie?.year ?? "",
  );

  // Fetch admin's personal rating for this movie (visible to all)
  const { data: adminPersonalRatingData, isLoading: isLoadingAdminPersonalRating } = useQuery({
    queryKey: ['admin_user_rating', id, ADMIN_USER_ID],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', ADMIN_USER_ID)
        .eq('movie_id', id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching admin's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch current user's personal rating (for interactive rating if logged in)
  const { data: currentUserPersonalRatingData, isLoading: isLoadingCurrentUserPersonalRating } = useQuery({
    queryKey: ['current_user_rating', id, userId],
    queryFn: async () => {
      if (!userId || !id) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('movie_id', id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching current user's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!userId && !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Combine all loading states
  const overallLoading = isLoadingMovie || isLoadingAdminPersonalRating || isLoadingCurrentUserPersonalRating;

  if (overallLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Skeleton className="w-64 h-96 rounded-lg" />
      </div>
    );
  }

  if (isErrorMovie || !movie) {
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

  // Prioritize Supabase data, fallback to TMDb if Supabase data is empty/placeholder
  const posterUrl = movie.poster_url && movie.poster_url !== '/placeholder.svg'
    ? movie.poster_url
    : (tmdbMovie?.poster_path ? `https://image.tmdb.org/t/p/w780${tmdbMovie.poster_path}` : '/placeholder.svg');
  
  const synopsis = movie.synopsis || tmdbMovie?.overview || "";
  
  // Safely access genres and movie_cast, providing empty array if null
  const genresToDisplay = movie.genres || [];
  const castToDisplay = movie.movie_cast || [];

  const cast = castToDisplay.length > 0
    ? castToDisplay.join(", ")
    : (tmdbMovie?.credits?.cast?.slice(0, 10).map((c: any) => c.name).join(", ") || "");
  
  const director = movie.director || tmdbMovie?.credits?.crew?.find((c: any) => c.job === "Director")?.name || "";

  // Find movie logo
  const movieLogo = tmdbMovie?.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie?.images?.logos?.[0];
  const logoUrl = movieLogo ? `https://image.tmdb.org/t/p/w500${movieLogo.file_path}` : null;

  // Find YouTube trailer
  const trailer = tmdbMovie?.videos?.results?.find(
    (video: any) => video.type === "Trailer" && video.site === "YouTube"
  );
  const trailerUrl = trailer ? `https://www.youtube.com/embed/${trailer.key}` : null;

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Backdrop Image */}
      {tmdbMovie?.backdrop_path && (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 md:opacity-20"
          style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path})` }}
        ></div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
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
                onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
              />
            )}
          </div>
          <div className="md:col-span-2">
            {logoUrl && !isLoadingTmdb ? (
              <img src={logoUrl} alt={`${movie.title} logo`} className="max-h-24 md:max-h-32 mb-4 object-contain" />
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {movie.title}
              </h1>
            )}
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
              {genresToDisplay.map((genre) => (
                <Badge key={genre} variant="secondary">
                  {genre}
                </Badge>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Synopsis</h2>
               {isLoadingTmdb && !synopsis ? (
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
               {isLoadingTmdb && !director ? (
                <Skeleton className="h-4 w-1/2 mt-2" />
              ) : (
              <p className="mt-2 text-lg text-muted-foreground">{director}</p>
              )}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Cast</h2>
               {isLoadingTmdb && !cast ? (
                 <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : (
              <p className="mt-2 text-lg text-muted-foreground">{cast}</p>
              )}
            </div>
            {trailerUrl && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                  <Youtube size={24} className="text-red-500" /> Trailer
                </h2>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                    src={trailerUrl}
                    title={`${movie.title} Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;