import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, Info } from "lucide-react";
import { useSession } from "@/contexts/SessionContext";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';
import { fetchFromTmdb } from "@/lib/tmdb"; // Import fetchFromTmdb
import { cn } from "@/lib/utils"; // Import cn utility
import { getTmdbPosterUrl } from "@/utils/tmdbUtils"; // Import getTmdbPosterUrl

interface MobileMovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
  shouldPrefetch?: boolean; // New prop for prefetching
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";

export const MobileMovieCard = ({ movie, selectedMovieIds, onSelectMovie, shouldPrefetch = false }: MobileMovieCardProps) => {
  const navigate = useNavigate();
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.id, movie.title, movie.year, movie.tmdb_id, shouldPrefetch); // Pass shouldPrefetch
  const { session } = useSession();
  const queryClient = useQueryClient(); // Get query client
  const [isClicked, setIsClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const [isImageLoading, setIsImageLoading] = useState(true); // True initially for the main poster
  const [hasImageError, setHasImageError] = useState(false); // False initially for the main poster

  const { data: adminPersonalRatingData } = useQuery({
    queryKey: ['admin_user_rating', movie.id, ADMIN_USER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', ADMIN_USER_ID)
        .eq('movie_id', movie.id)
        .single();
      if (error && error.code !== 'PGRST116') {
        return null;
      }
      return data?.rating ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const finalPosterUrl = movie.poster_url && movie.poster_url !== '/placeholder.svg'
    ? movie.poster_url
    : getTmdbPosterUrl(tmdbMovie?.poster_path);

  // Reset loading/error states when movie or finalPosterUrl changes
  useEffect(() => {
    setIsImageLoading(true);
    setHasImageError(false);
  }, [movie.id, finalPosterUrl]);

  const isAdmin = session?.user?.id === ADMIN_USER_ID;

  const handleDelete = async () => {
    const { error } = await supabase.from("movies").delete().eq("id", movie.id);
    if (error) {
      showError("Failed to delete movie: " + error.message);
    } else {
      showSuccess("Movie deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    }
  };

  const backdropUrl = tmdbMovie?.backdrop_path ? `https://image.tmdb.org/t/p/w780${tmdbMovie.backdrop_path}` : null;
  const movieLogo = tmdbMovie?.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie?.images?.logos?.[0];
  const logoUrl = movieLogo ? `https://image.tmdb.org/t/p/w500${movieLogo.file_path}` : null;

  const handleCardClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, [role="checkbox"]')) {
      return;
    }
    e.preventDefault();
    
    if (cardRef.current) {
      const currentRect = cardRef.current.getBoundingClientRect();
      setRect(currentRect);
    }
    
    document.body.style.overflow = 'hidden';
    setIsClicked(true);

    const movieId = movie.id;
    const userId = session?.user?.id;

    // Prefetch main movie data from Supabase
    queryClient.prefetchQuery({
        queryKey: ["movie", movieId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("movies")
                .select("*")
                .eq("id", movieId)
                .single();
            if (error) throw error;
            return data as Movie;
        },
    });

    // Prefetch TMDb data
    queryClient.prefetchQuery({
        queryKey: ["tmdb", movie.id], // Use movie.id for TMDb prefetch
        queryFn: async () => {
            let tmdbIdToFetch = movie.tmdb_id;
            if (!tmdbIdToFetch) {
              let searchResults = await fetchFromTmdb("/search/movie", {
                  query: movie.title,
                  primary_release_year: movie.year,
              });
              if (!searchResults || searchResults.results.length === 0) {
                  searchResults = await fetchFromTmdb("/search/movie", { query: movie.title });
              }
              if (searchResults && searchResults.results.length > 0) {
                  tmdbIdToFetch = String(searchResults.results[0].id);
              }
            }
            if (!tmdbIdToFetch) {
                return null;
            }
            const details = await fetchFromTmdb(`/movie/${tmdbIdToFetch}`, {
                append_to_response: "credits,release_dates,images,videos,watch/providers",
            });
            return details;
        },
    });

    // Prefetch admin's personal rating
    queryClient.prefetchQuery({
        queryKey: ['admin_user_rating', movieId, ADMIN_USER_ID],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('user_ratings')
                .select('rating')
                .eq('user_id', ADMIN_USER_ID)
                .eq('movie_id', movieId)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            return data?.rating ?? null;
        },
    });

    // Prefetch current user's personal rating (if logged in)
    if (userId) {
        queryClient.prefetchQuery({
            queryKey: ['current_user_rating', movieId, userId],
            queryFn: async () => {
                const { data, error } = await supabase
                    .from('user_ratings')
                    .select('rating')
                    .eq('user_id', userId)
                    .eq('movie_id', movieId)
                    .single();
                if (error && error.code !== 'PGRST116') throw error;
                return data?.rating ?? null;
            },
        });
    }

    setTimeout(() => {
      navigate(`/movie/${movie.id}`);
      document.body.style.overflow = '';
    }, 800); // Updated timeout to match new animation duration
  };

  // Render function for the card content (used by both original and animating card)
  const renderCardContent = (isAnimatingClone = false) => (
    <>
      {isAdmin && (
        <div className={`absolute top-2 left-2 z-25 ${isAnimatingClone ? 'opacity-0' : ''}`}> {/* Changed z-index to z-25 */}
          <Checkbox
            checked={selectedMovieIds.has(movie.id)}
            onCheckedChange={(checked) => onSelectMovie(movie.id, !!checked)}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white"
          />
        </div>
      )}
      {isAdmin && (
        <div className={`absolute top-2 right-2 flex gap-2 z-25 ${isAnimatingClone ? 'opacity-0' : ''}`}> {/* Changed z-index to z-25 */}
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => navigate(`/edit-movie/${movie.id}`)}>
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="icon" className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the movie "{movie.title}" from your collection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div
        className="relative h-40 w-full bg-cover bg-center flex items-center justify-center overflow-hidden" // Increased height for prominence
        style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none', backgroundColor: 'black' }}
      >
        {/* Skeleton or themed fallback */}
        {(isImageLoading || hasImageError || !finalPosterUrl) && (
          <div className="absolute inset-0 w-full h-full bg-gray-900 flex items-center justify-center text-gray-400 text-xs p-2 text-center">
            {hasImageError || !finalPosterUrl ? "No Poster Available" : <Skeleton className="w-full h-full" />}
          </div>
        )}

        {/* Actual image, only rendered if a URL exists and no explicit error */}
        {finalPosterUrl && (
          <img
            src={finalPosterUrl}
            alt={movie.title}
            className={cn(
              "max-h-24 max-w-full object-contain z-10 transition-opacity duration-500",
              isImageLoading ? "opacity-0" : "opacity-100"
            )}
            onLoad={() => {
              setIsImageLoading(false);
              setHasImageError(false);
            }}
            onError={(e) => {
              console.error(`Failed to load image for ${movie.title}: ${e.currentTarget.src}`);
              setIsImageLoading(false);
              setHasImageError(true);
            }}
          />
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold line-clamp-1 mb-2">{movie.title}</h3>
            <Button variant="ghost" size="icon" className="h-auto w-auto p-0 -mt-1" onClick={() => navigate(`/movie/${movie.id}`)}>
                <Info size={20} className="text-white hover:text-gray-300" />
            </Button>
        </div>
        <p className="text-sm text-gray-300 line-clamp-3 mb-3">
          {movie.synopsis || tmdbMovie?.overview || "No synopsis available."}
        </p>
        <div className="flex justify-between items-center text-sm text-gray-400">
          <div>
            <p>{movie.runtime ? `${movie.runtime} min` : "N/A min"} | {movie.year}</p>
            <div className="flex items-center mt-1">
              <Star className="text-yellow-400 h-4 w-4 mr-1" />
              <span>Georgi's Rating: {typeof adminPersonalRatingData === 'number' ? adminPersonalRatingData.toFixed(1) : "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Original card in the grid/list */}
      <div
        ref={cardRef}
        className="w-full bg-black text-white overflow-hidden shadow-2xl cursor-pointer"
        onClick={handleCardClick}
        style={{ visibility: isClicked ? 'hidden' : 'visible' }} // Hide original when animating
      >
        {renderCardContent()}
      </div>

      {/* Animating overlay card, rendered via portal to ensure it's on top */}
      {createPortal(
        <AnimatePresence>
          {isClicked && rect && (
            <motion.div
              key={movie.id} // Added key for stability
              initial={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                borderRadius: "0px",
                backgroundColor: "rgb(0,0,0)", // Initial background color
                position: "fixed",
                zIndex: 100,
                overflow: 'hidden', // Hide overflow during animation
              }}
              animate={{
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "hsl(0 0% 8.2%)", // Target background color
                borderRadius: "0px",
                transition: {
                  duration: 0.8, // Intermediate speed for enlargement and color transition
                  ease: "easeInOut",
                },
              }}
              exit={{
                opacity: 0, // Fade out if somehow unmounted before navigation
                transition: { duration: 0.2 }
              }}
              className="text-white shadow-2xl" // Apply base styles
            >
              <motion.div
                initial={{ opacity: 1 }}
                animate={{
                  opacity: 0,
                  transition: {
                    duration: 0.4, // Intermediate speed for fade out
                    delay: 0.4,    // Intermediate delay for fade out
                    ease: "easeOut"
                  },
                }}
                className="w-full h-full"
              >
                {renderCardContent(true)} {/* Pass true to hide interactive elements */}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body // Portal target
      )}
    </>
  );
};