import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate
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
import React, { useState, useEffect } from "react";
import YouTubePlayerBackground from "@/components/YouTubePlayerBackground";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate(); // Initialize useNavigate
  const { session } = useSession();
  const userId = session?.user?.id;
  const [showTrailer, setShowTrailer] = useState(false);

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Find YouTube trailer
  const trailer = tmdbMovie?.videos?.results?.find(
    (video: any) => video.type === "Trailer" && video.site === "YouTube"
  );
  const trailerKey = trailer ? trailer.key : null;

  // Timer to switch from backdrop to trailer
  useEffect(() => {
    if (trailerKey) {
      const timer = setTimeout(() => {
        setShowTrailer(true);
      }, 10000); // 10 seconds

      return () => clearTimeout(timer); // Cleanup on unmount
    }
  }, [trailerKey]);

  // Combine all loading states
  const overallLoading = isLoadingMovie || isLoadingAdminPersonalRating || isLoadingCurrentUserPersonalRating || isLoadingTmdb;

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
          <Button onClick={() => navigate('/')} className="text-primary hover:underline"> {/* Changed to Button */}
            Back to collection
          </Button>
        </div>
      </div>
    );
  }

  // Prioritize Supabase data, fallback to TMDb if Supabase data is empty/placeholder
  const backdropUrl = tmdbMovie?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const synopsis = movie.synopsis || tmdbMovie?.overview || "";
  
  // Safely access genres and movie_cast, providing empty array if null
  const genresToDisplay = movie.genres || [];
  const castToDisplay = movie.movie_cast || [];

  const cast = castToDisplay.length > 0
    ? castToDisplay.join(", ")
    : (tmdbMovie?.credits?.cast?.slice(0, 10).map((c: any) => c.name).join(", ") || "");
  
  const director = movie.director || tmdbMovie?.credits?.crew?.find((c: any) => c.job === "Director")?.name || "";
  
  const originCountry = Array.isArray(movie.origin_country) && movie.origin_country.length > 0
    ? movie.origin_country.join(', ')
    : (tmdbMovie?.production_countries?.map((c: any) => c.name).join(', ') || "");

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Backdrop Image or Video with Overlay */}
      {showTrailer && trailerKey ? (
        <YouTubePlayerBackground videoId={trailerKey} />
      ) : backdropUrl ? (
        <div
          className="absolute inset-x-0 top-0 h-[60vh] overflow-hidden"
        >
          <img
            src={backdropUrl}
            alt={`${movie.title} backdrop`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black opacity-50"></div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
      ) : (
        <div className="absolute inset-x-0 top-0 h-[60vh] bg-gray-900">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-8 md:pt-[60vh] md:pb-12">
        <Button
          onClick={() => navigate('/')} {/* Changed to navigate('/') */}
          variant="ghost"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Collection
        </Button>
        
        <div className="max-w-3xl">
          {tmdbMovie?.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie?.images?.logos?.[0] ? (
            <img src={`https://image.tmdb.org/t/p/w500${(tmdbMovie.images.logos.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie.images.logos[0]).file_path}`} alt={`${movie.title} logo`} className="max-h-28 md:max-h-40 mb-4 object-contain" />
          ) : (
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
              {movie.title}
            </h1>
          )}
          
          <div className="flex items-center flex-wrap gap-x-4 gap-y-2 text-lg text-muted-foreground mb-6">
            <span>{movie.rating}</span>
            <span>{movie.runtime} min</span>
            <span>{movie.year}</span>
          </div>

          {trailerKey && (
            <a href={`https://www.youtube.com/watch?v=${trailerKey}`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="mb-8">
                <Youtube className="mr-2 h-5 w-5" /> Open Trailer in YouTube
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
              <p className="font-semibold">Georgi's Rating</p>
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
              <p className="font-semibold">Origin Country</p>
              <p className="text-muted-foreground">{originCountry || "N/A"}</p>
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