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

interface MobileMovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";

export const MobileMovieCard = ({ movie, selectedMovieIds, onSelectMovie }: MobileMovieCardProps) => {
  const navigate = useNavigate();
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isClicked, setIsClicked] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

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

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
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

    setTimeout(() => {
      navigate(`/movie/${movie.id}`);
      document.body.style.overflow = '';
    }, 1000); // Total animation duration
  };

  // Render function for the card content (used by both original and animating card)
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
      {isAdmin && (
        <div className={`absolute top-2 right-2 flex gap-2 z-40 ${isAnimatingClone ? 'opacity-0' : ''}`}>
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
        className="relative h-40 w-full bg-cover bg-center flex items-center justify-center p-2"
        style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none', backgroundColor: 'black' }}
      >
        {isLoading && <Skeleton className="w-full h-full" />}
        {backdropUrl && <div className="absolute inset-0 bg-black opacity-50"></div>}
        {logoUrl && !isLoading && (
          <img
            src={logoUrl}
            alt={`${movie.title} logo`}
            className="max-h-24 max-w-full object-contain z-10"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}
        {!backdropUrl && !logoUrl && !isLoading && (
          <h3 className="text-xl font-bold text-white text-center z-10">{movie.title}</h3>
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
                  duration: 1.0, // Slower enlargement and color transition
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
                    duration: 0.5, // Slower fade out
                    delay: 0.5,    // Start fading after 0.5s of enlargement
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