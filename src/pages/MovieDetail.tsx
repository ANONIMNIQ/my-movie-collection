import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft, Youtube, Play, ExternalLink } from "lucide-react";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import PersonalRating from "@/components/PersonalRating";
import { useSession } from "@/contexts/SessionContext";
import { useQuery } from "@tanstack/react-query";
import MovieDetailSkeleton from "@/components/MovieDetailSkeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import React, { useState, useEffect, useRef } from "react";
import YouTubePlayerBackground from "@/components/YouTubePlayerBackground";
import { motion, AnimatePresence } from "framer-motion";
import WatchProviders from "@/components/WatchProviders";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } => "@/lib/utils";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";

const textRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useSession();
  const userId = session?.user?.id;
  const [showTrailer, setShowTrailer] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isBackLinkVisible, setIsBackLinkVisible] = useState(true);
  const backLinkRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const { data: tmdbMovie, isLoading: isLoadingTmdb } = useTmdbMovie(
    id || "",
    movie?.title ?? "",
    movie?.year ?? "",
    movie?.tmdb_id
  );

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
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching admin's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

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
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching current user's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!userId && !!id,
    staleTime: 1000 * 60 * 5,
  });

  const trailer = tmdbMovie?.videos?.results?.find(
    (video: any) => video.type === "Trailer" && video.site === "YouTube"
  );
  const trailerKey = trailer ? trailer.key : null;
  const imdbId = tmdbMovie?.imdb_id;
  const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : null;

  useEffect(() => {
    if (trailerKey) {
      const timer = setTimeout(() => setShowTrailer(true), 10000);
      return () => clearTimeout(timer);
    }
  }, [trailerKey]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBackLinkVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const currentRef = backLinkRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  const handleBackClick = () => {
    setIsExiting(true);
  };

  const overallLoading = isLoadingMovie || isLoadingAdminPersonalRating || isLoadingCurrentUserPersonalRating || isLoadingTmdb;

  if (overallLoading) {
    return <MovieDetailSkeleton />;
  }

  if (isErrorMovie || !movie || !movie.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Movie not found</h1>
          <p className="text-xl text-muted-foreground mb-4">
            {movieError?.message || "The movie you are looking for does not exist or an unexpected error occurred."}
          </p>
          <Button onClick={() => navigate('/')} className="text-primary hover:underline">
            Back to collection
          </Button>
        </div>
      </div>
    );
  }

  const backdropUrl = tmdbMovie?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const synopsis = movie.synopsis || tmdbMovie?.overview || "";
  const genresToDisplay = movie.genres || [];
  const castToDisplay = movie.movie_cast || [];
  const cast = castToDisplay.length > 0
    ? castToDisplay.join(", ")
    : (tmdbMovie?.credits?.cast?.slice(0, 10).map((c: any) => c.name).join(", ") || "");
  const originCountry = Array.isArray(movie.origin_country) && movie.origin_country.length > 0
    ? movie.origin_country.join(', ')
    : (tmdbMovie?.production_countries?.map((c: any) => c.name).join(', ') || "");

  const getCrewMembers = (job: string | string[]) => {
    const jobs = Array.isArray(job) ? job : [job];
    const members = tmdbMovie?.credits?.crew
      ?.filter((c: any) => jobs.includes(c.job))
      ?.map((p: any) => p.name);
    return members ? [...new Set(members)].join(", ") : "";
  };

  const directors = getCrewMembers("Director") || movie.director;
  const writers = getCrewMembers(["Screenplay", "Writer", "Story"]);
  const editors = getCrewMembers("Editor");
  const musicComposers = getCrewMembers("Original Music Composer");
  const cinematographers = getCrewMembers("Director of Photography");

  return (
    <AnimatePresence onExitComplete={() => navigate('/')}>
      {!isExiting && (
        <motion.div
          className="relative min-h-screen bg-background text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence>
            {!isBackLinkVisible && (
              <motion.button
                onClick={handleBackClick}
                className={cn(
                  "fixed top-4 left-4 z-50 inline-flex items-center rounded-full bg-white/20 backdrop-blur-md text-primary shadow-lg hover:bg-white/30",
                  isMobile ? "h-10 w-10 justify-center p-0" : "gap-2 px-4 py-2"
                )}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <ArrowLeft size={isMobile ? 20 : 16} />
                {!isMobile && "Back"}
              </motion.button>
            )}
          </AnimatePresence>

          <div className="absolute inset-x-0 top-0 h-[60vh] overflow-hidden">
            {showTrailer && trailerKey ? (
              <YouTubePlayerBackground videoId={trailerKey} />
            ) : backdropUrl ? (
              <>
                <img
                  src={backdropUrl}
                  alt={`${movie.title} backdrop`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black opacity-50"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gray-900"></div>
            )}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>

          <div className="relative z-10 container mx-auto px-4 py-8 md:pt-[60vh] md:pb-12">
            <motion.button
              ref={backLinkRef}
              onClick={handleBackClick}
              className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
              initial="hidden"
              animate="visible"
              variants={textRevealVariants}
            >
              <ArrowLeft size={16} />
              Back to Collection
            </motion.button>
            
            {tmdbMovie?.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie?.images?.logos?.[0] ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${(tmdbMovie.images.logos.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie.images.logos[0]).file_path}`}
                alt={`${movie.title} logo`}
                className="max-h-28 md:max-h-40 mb-4 object-contain"
              />
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
                {movie.title}
              </h1>
            )}
            
            <motion.div
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="max-w-3xl"
            >
              <motion.div
                variants={textRevealVariants}
                className="flex items-center flex-wrap gap-x-4 gap-y-2 text-lg text-muted-foreground mb-6"
              >
                <span>{movie.rating}</span>
                <span>{movie.runtime} min</span>
                <span>{movie.year}</span>
              </motion.div>

              <motion.div variants={textRevealVariants} className="flex flex-wrap gap-4 mb-8">
                {trailerKey && (
                  <a
                    href={`https://www.youtube.com/watch?v=${trailerKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg">
                      <Youtube className="mr-2 h-5 w-5" /> Open Trailer in YouTube
                    </Button>
                  </a>
                )}
                {imdbUrl && (
                  <a
                    href={imdbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="lg" variant="outline">
                      <ExternalLink className="mr-2 h-5 w-5" /> Open on IMDb
                    </Button>
                  </a>
                )}
              </motion.div>

              <motion.p
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="text-lg text-muted-foreground mb-8"
              >
                {(synopsis || "No synopsis available.")
                  .split(/(?<=[.!?])\s+/)
                  .filter(Boolean)
                  .map((sentence, index) => (
                    <motion.span
                      key={index}
                      variants={textRevealVariants}
                      className="block"
                    >
                      {sentence}
                    </motion.span>
                  ))}
              </motion.p>

              <motion.div variants={textRevealVariants}>
                <Separator className="my-8 bg-muted-foreground/30" />
              </motion.div>

              <motion.h2 variants={textRevealVariants} className="text-2xl font-semibold mb-4">Details</motion.h2>
              
              <motion.div
                variants={containerVariants}
                className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-lg"
              >
                <motion.div variants={textRevealVariants}>
                  <p className="font-semibold">Genres</p>
                  <p className="text-muted-foreground">{genresToDisplay.join(", ") || "N/A"}</p>
                </motion.div>
                <motion.div variants={textRevealVariants}>
                  <p className="font-semibold">Community Rating</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Star className="text-yellow-400" size={18} />
                    <span>{movie.community_rating?.toFixed(1) ?? "N/A"}</span>
                  </div>
                </motion.div>
                <motion.div variants={textRevealVariants}>
                  <p className="font-semibold">Georgi's Rating</p>
                  <PersonalRating movieId={movie.id} initialRating={adminPersonalRatingData} readOnly={true} />
                  {adminPersonalRatingData === null && <span className="text-lg text-muted-foreground ml-1">N/A</span>}
                </motion.div>
                {userId && userId !== ADMIN_USER_ID && (
                  <motion.div variants={textRevealVariants}>
                    <p className="font-semibold">Your Rating</p>
                    <PersonalRating movieId={movie.id} initialRating={currentUserPersonalRatingData} />
                  </motion.div>
                )}
                {directors && (
                  <motion.div variants={textRevealVariants}>
                    <p className="font-semibold">Director</p>
                    <p className="text-muted-foreground">{directors}</p>
                  </motion.div>
                )}
                {writers && (
                  <motion.div variants={textRevealVariants}>
                    <p className="font-semibold">Writer</p>
                    <p className="text-muted-foreground">{writers}</p>
                  </motion.div>
                )}
                {editors && (
                  <motion.div variants={textRevealVariants}>
                    <p className="font-semibold">Editor</p>
                    <p className="text-muted-foreground">{editors}</p>
                  </motion.div>
                )}
                {musicComposers && (
                  <motion.div variants={textRevealVariants}>
                    <p className="font-semibold">Music</p>
                    <p className="text-muted-foreground">{musicComposers}</p>
                  </motion.div>
                )}
                {cinematographers && (
                  <motion.div variants={textRevealVariants}>
                    <p className="font-semibold">Cinematography</p>
                    <p className="text-muted-foreground">{cinematographers}</p>
                  </motion.div>
                )}
                <motion.div variants={textRevealVariants}>
                  <p className="font-semibold">Origin Country</p>
                  <p className="text-muted-foreground">{originCountry || "N/A"}</p>
                </motion.div>
                <motion.div variants={textRevealVariants}>
                  <p className="font-semibold">Cast</p>
                  <p className="text-muted-foreground">{cast || "N/A"}</p>
                </motion.div>
              </motion.div>

              <motion.div variants={textRevealVariants}>
                {tmdbMovie?.['watch/providers']?.results && (
                  <WatchProviders providers={tmdbMovie['watch/providers'].results} />
                )}
              </motion.div>

            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MovieDetail;