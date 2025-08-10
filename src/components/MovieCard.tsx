import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, Youtube, Info } from "lucide-react";
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
import { getTmdbPosterUrl } from "@/utils/tmdbUtils";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from 'react-dom';
import { fetchFromTmdb } from "@/lib/tmdb";

interface MovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
  showSynopsis?: boolean; // New prop
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";
const HOVER_SCALE_FACTOR = 1.25; // Corresponds to scale-125 in Tailwind

export const MovieCard = ({ movie, selectedMovieIds, onSelectMovie, showSynopsis = true }: MovieCardProps) => {
  const navigate = useNavigate();
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);
  const { session } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const [isClicked, setIsClicked] = useState(false);
  const [isForcedHover, setIsForcedHover] = useState(false); // New state to force hover styles
  const cardRef = useRef<HTMLDivElement>(null);
  const [initialRect, setInitialRect] = useState<DOMRect | null>(null); // Stores the calculated hovered rect

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
        console.error("Error fetching admin's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });

  const posterUrl = movie.poster_url && movie.poster_url !== '/placeholder.svg'
    ? movie.poster_url
    : getTmdbPosterUrl(tmdbMovie?.poster_path);

  const isAdmin = session?.user?.id === ADMIN_USER_ID;

  const handleDelete = async () => {
    const { error } = await supabase.from("movies").delete().eq("id", movie.id);

    if (error) {
      console.error("Error deleting movie:", error);
      showError("Failed to delete movie: " + error.message);
    } else {
      showSuccess("Movie deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["movies"] });
    }
  };

  const trailer = tmdbMovie?.videos?.results?.find(
    (video: any) => video.type === "Trailer" && video.site === "YouTube"
  );
  const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

  const backdropUrl = tmdbMovie?.backdrop_path ? `https://image.tmdb.org/t/p/w780${tmdbMovie.backdrop_path}` : null;
  const movieLogo = tmdbMovie?.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie?.images?.logos?.[0];
  const logoUrl = movieLogo ? `https://image.tmdb.org/t/p/w500${movieLogo.file_path}` : null;

  const handleCardClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Do not navigate if the click came from any interactive element.
    if (target.closest('button, a, [role="checkbox"]')) {
      return;
    }
    e.preventDefault();

    if (cardRef.current) {
      // 1. Force the hover state visually *instantly*
      setIsForcedHover(true);

      // 2. Wait for the browser to render the forced hover state
      //    This requestAnimationFrame ensures the DOM has updated with the new scale
      requestAnimationFrame(() => {
        if (cardRef.current) {
          // 3. Get the actual bounding rect of the now-scaled card
          const rect = cardRef.current.getBoundingClientRect();
          setInitialRect(rect);
          setIsClicked(true); // Trigger the animation
        }
      });
    }

    document.body.style.overflow = 'hidden';

    const movieId = movie.id;

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
        queryKey: ["tmdb", movie.title, movie.year],
        queryFn: async () => {
            let searchResults = await fetchFromTmdb("/search/movie", {
                query: movie.title,
                primary_release_year: movie.year,
            });
            if (!searchResults || searchResults.results.length === 0) {
                searchResults = await fetchFromTmdb("/search/movie", { query: movie.title });
            }
            if (!searchResults || searchResults.results.length === 0) {
                return null;
            }
            const movieSummary = searchResults.results[0];
            const details = await fetchFromTmdb(`/movie/${movieSummary.id}`, {
                append_to_response: "credits,release_dates,images,videos",
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
      // Reset isForcedHover after navigation to ensure card returns to normal state
      setIsForcedHover(false);
    }, 800); // Match animation duration
  };

  const renderCardContent = (isAnimatingClone = false) => (
    <>
      {isAdmin && (
        <div className={`absolute top-2 left-2 z-40 ${isAnimatingClone ? 'opacity-0' : ''}`}>
          <Checkbox
            checked={selectedMovieIds.has(movie.id)}
            onCheckedChange={(checked) => onSelectMovie(movie.id, !!checked)}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-white"
          />
        </div>
      )}

      <div className="aspect-[2/3] w-full bg-muted">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
            loading="lazy"
          />
        )}
      </div>

      {/* Hover Overlay */}
      <div
        className={cn(
          "absolute inset-0 flex flex-col transition-opacity duration-300 z-20 rounded-none pointer-events-none",
          isAnimatingClone ? "opacity-0" : (isForcedHover ? "opacity-100" : "opacity-0 group-hover/slide:opacity-100") // Hide overlay on animating clone, or force visible
        )}
      >
        {/* Top part of overlay (backdrop) */}
        <div
          className="relative h-[45%] w-full bg-cover bg-center flex items-center justify-center p-2"
          style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none', backgroundColor: backdropUrl ? 'transparent' : 'black' }}
        >
          {backdropUrl && <div className="absolute inset-0 bg-black opacity-50"></div>}
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${movie.title} logo`}
              className="max-h-full max-w-full object-contain z-10"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          {!backdropUrl && !logoUrl && (
            <h3 className="text-lg font-bold text-white text-center z-10">{movie.title}</h3>
          )}
        </div>

        {/* Bottom part of overlay (info and buttons) */}
        <div className="h-[55%] w-full bg-black flex flex-col justify-between p-3 text-white pointer-events-auto">
          <div className="mb-1">
            <Button variant="ghost" size="icon" className="h-auto w-auto p-0" onClick={() => navigate(`/movie/${movie.id}`)}>
              <Info size={16} className="text-white cursor-pointer hover:text-gray-300 transition-colors" />
            </Button>
          </div>
          <h3 className="text-lg font-bold line-clamp-1">
            {movie.title}
          </h3>
          {showSynopsis && (
            <p className="hidden md:line-clamp-1 lg:line-clamp-2 text-xs text-gray-300 mb-1">
              {movie.synopsis || tmdbMovie?.overview || "No synopsis available."}
            </p>
          )}
          <div className="text-xs text-gray-400">
            <p>{movie.runtime ? `${movie.runtime} min` : "N/A min"} | {movie.year}</p>
            <div className="hidden sm:flex items-center mt-1">
              <Star className="text-yellow-400 h-3 w-3 mr-1" />
              <span>Georgi's Rating: {typeof adminPersonalRatingData === 'number' ? adminPersonalRatingData.toFixed(1) : "N/A"}</span>
            </div>
          </div>
          <div className="hidden md:flex flex-row gap-1 mt-2">
            {trailerUrl && (
              <Button asChild variant="outline" className="flex-1 w-full justify-center gap-1 text-xs h-7 px-2">
                <a href={trailerUrl} target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-3 w-3" /> Trailer
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Buttons */}
      {isAdmin && (
        <div className={`absolute top-2 right-2 flex gap-2 z-40 ${isAnimatingClone ? 'opacity-0' : ''}`}>
          <Button 
            variant="secondary" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => navigate(`/edit-movie/${movie.id}`)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                size="icon" 
                className="h-8 w-8"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  movie "{movie.title}" from your collection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Original card in the grid/list */}
      <div className="relative h-full group-hover/slide:z-30">
        <Card 
          ref={cardRef}
          className={cn(
            "h-full flex flex-col bg-card border-none rounded-none shadow-lg overflow-hidden cursor-pointer",
            // Apply transition only for shadow, not transform, when not forced hover
            !isForcedHover && "transition-shadow duration-300 ease-in-out",
            isForcedHover ? "scale-125 shadow-glow" : "group-hover/slide:scale-125 group-hover/slide:shadow-glow", // Apply forced hover or normal hover
            isClicked ? 'invisible' : 'visible' // Hide original when animating
          )}
          onClick={handleCardClick}
        >
          {renderCardContent(false)}
        </Card>
      </div>

      {/* Animating overlay card, rendered via portal to ensure it's on top */}
      {createPortal(
        <AnimatePresence>
          {isClicked && initialRect && (
            <motion.div
              key={movie.id}
              initial={{
                top: initialRect.top,
                left: initialRect.left,
                width: initialRect.width,
                height: initialRect.height,
                borderRadius: "0px",
                backgroundColor: "rgb(0,0,0)",
                position: "fixed",
                zIndex: 100,
                overflow: 'hidden',
              }}
              animate={{
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "hsl(0 0% 8.2%)",
                borderRadius: "0px",
                transition: {
                  duration: 0.8,
                  ease: "easeInOut",
                },
              }}
              exit={{
                opacity: 0,
                transition: { duration: 0.2 }
              }}
              className="text-white shadow-2xl"
            >
              <motion.div
                initial={{ opacity: 1 }}
                animate={{
                  opacity: 0,
                  transition: {
                    duration: 0.4,
                    delay: 0.4,
                    ease: "easeOut"
                  },
                }}
                className="w-full h-full"
              >
                {renderCardContent(true)}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};