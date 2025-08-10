import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, Youtube, Play } from "lucide-react";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import PersonalRating from "@/components/PersonalRating";
import { useSession } from "@/contexts/SessionContext";
import { useQuery } from "@tanstack/react-query";
import MovieDetailSkeleton from "@/components/MovieDetailSkeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user?.id;

  // Fetch main movie data using useQuery
  const { data: movie, isLoading: isLoadingMovie, isError: isErrorMovie, error: movieError } = useQuery<Movie, Error>({
    queryKey: ["movie", id],
    queryFn: async () => {
      if (!id) throw new Error("Movie ID is missing.");
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching movie details from Supabase:", error);
        throw new Error("Failed to load movie details from database.");
      }
      return data as Movie;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: tmdbMovie, isLoading: isLoadingTmdb, error: tmdbError } = useTmdbMovie(
    movie?.title ?? "",
    movie?.year ?? "",
  );

  // Fetch admin's personal rating for this movie (visible to all)
  const { data: adminPersonalRatingData, isLoading: isLoadingAdminPersonalRating, error: adminRatingError } = useQuery({
    queryKey: ['admin_user_rating', id, ADMIN_USER_ID],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', ADMIN_USER_ID)
        .eq('movie_id', id)
        .single();
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching admin's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch current user's personal rating (for interactive rating if logged in)
  const { data: currentUserPersonalRatingData, isLoading: isLoadingCurrentUserPersonalRating, error: userRatingError } = useQuery({
    queryKey: ['current_user_rating', id, userId],
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
    enabled: !!userId && !!id,
    staleTime: 1000 * 60 * 5,
  });

  // Combine all loading states
  const overallLoading = isLoadingMovie || isLoadingAdminPersonalRating || isLoadingCurrentUserPersonalRating || isLoadingTmdb;

  // Log data after loading to debug potential empty states
  if (!overallLoading) {
    console.log("MovieDetail: Data Loaded.");
    console.log("Supabase Movie Data:", movie);
    console.log("TMDb Movie Data:", tmdbMovie);
    if (isErrorMovie) console.error("Supabase Movie Error:", movieError);
    if (tmdbError) console.error("TMDb Fetch Error:", tmdbError);
    if (adminRatingError) console.error("Admin Rating Error:", adminRatingError);
    if (userRatingError) console.error("User Rating Error:", userRatingError);
  }

  if (overallLoading) {
    return <MovieDetailSkeleton />;
  }

  // Check for movie data more robustly
  if (isErrorMovie || !movie || !movie.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Movie not found</h1>
          <p className="text-xl text-muted-foreground mb-4">
            {movieError?.message || "The movie you are looking for does not exist or an unexpected error occurred."}
          </p>
          <Link to="/" className="text-primary hover:underline">
            Back to collection
          </Link>
        </div>
      </div>
    );
  }

  // Prioritize Supabase data, fallback to TMDb if Supabase data is empty/placeholder
  const backdropUrl = tmdbMovie?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null; // Corrected URL
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
      {/* Backdrop Image with Overlay */}
      {backdropUrl && (
        <div
          className="absolute inset-x-0 top-0 h-[60vh] bg-cover bg-center" // Changed to top-only with fixed height
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          {/* Dark overlay to make text readable */}
          <div className="absolute inset-0 bg-black opacity-70"></div>
          {/* Gradient overlay for bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:pt-[40vh] md:pb-12"> {/* Adjusted padding-top */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Collection
        </Link>
        
        <div className="max-w-3xl"> {/* Constrain content width */}
          {logoUrl ? (
            <img src={logoUrl} alt={`${movie.title} logo`} className="max-h-28 md:max-h-40 mb-4 object-contain" />
          ) : (
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              {movie.title}
            </h1>
          )}
          
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-lg text-muted-foreground mb-6">
            <span>{movie.rating}</span>
            <span>{movie.runtime} min</span>
            <span>{movie.year}</span>
            {/* Add 4K UHD if applicable, for now just a placeholder */}
            {/* <span>4K UHD</span> */}
          </div>

          {trailerUrl && (
            <a href={trailerUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="mb-8">
                <Play className="mr-2 h-5 w-5" /> Watch Trailer
              </Button>
            </a>
          )}

          <p className="text-lg text-muted-foreground mb-8">
            {synopsis || "No synopsis available."}
          </p>

          <Separator className="my-8 bg-muted-foreground/30" />

          <h2 className="text-2xl font-semibold mb-4">Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-lg">
            <div>
              <p className="font-semibold">Genres</p>
              <p className="text-muted-foreground">{genresToDisplay.join(", ") || "N/A"}</p>
            </div>
            <div>
              <p className="font-semibold">Community Rating</p>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Star className="text-yellow-400" size={18} />
                <span>{movie.community_rating?.toFixed(1) ?? "N/A"}</span>
              </div>
            </div>
            <div>
              <p className="font-semibold">My Rating</p>
              <PersonalRating movieId={movie.id} initialRating={adminPersonalRatingData} readOnly={true} />
              {adminPersonalRatingData === null && <span className="text-lg text-muted-foreground ml-1">N/A</span>}
            </div>
            {userId && userId !== ADMIN_USER_ID && (
              <div>
                <p className="font-semibold">Your Rating</p>
                <PersonalRating movieId={movie.id} initialRating={currentUserPersonalRatingData} />
              </div>
            )}
            <div>
              <p className="font-semibold">Director</p>
              <p className="text-muted-foreground">{director || "N/A"}</p>
            </div>
            <div>
              <p className="font-semibold">Cast</p>
              <p className="text-muted-foreground">{cast || "N/A"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;