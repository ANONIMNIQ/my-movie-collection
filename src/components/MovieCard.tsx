import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, Youtube, Info, Loader2 } from "lucide-react";
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
import { motion } from "framer-motion";
import { fetchFromTmdb } from "@/lib/tmdb";

interface MovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
  showSynopsis?: boolean;
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";

export const MovieCard = ({ movie, selectedMovieIds, onSelectMovie, showSynopsis = true }: MovieCardProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);
  const { session } = useSession();
  const userId = session?.user?.id;
  const [isPrefetching, setIsPrefetching] = useState(false);

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

  const handleInteraction = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input[type="checkbox"]')) {
      return;
    }
    e.preventDefault();
    setIsPrefetching(true);

    try {
      const prefetchPromises = [
        queryClient.prefetchQuery({
          queryKey: ["movie", movie.id],
          queryFn: async () => {
            const { data, error } = await supabase.from("movies").select("*").eq("id", movie.id).single();
            if (error) throw new Error("Failed to prefetch movie details.");
            return data;
          },
        }),
        queryClient.prefetchQuery({
          queryKey: ["tmdb", movie.title, movie.year],
          queryFn: async () => {
            let searchResults = await fetchFromTmdb("/search/movie", { query: movie.title, primary_release_year: movie.year });
            if (!searchResults || searchResults.results.length === 0) {
              searchResults = await fetchFromTmdb("/search/movie", { query: movie.title });
            }
            if (!searchResults || searchResults.results.length === 0) return null;
            const movieSummary = searchResults.results[0];
            return await fetchFromTmdb(`/movie/${movieSummary.id}`, { append_to_response: "credits,release_dates,images,videos" });
          },
        }),
        queryClient.prefetchQuery({
          queryKey: ['admin_user_rating', movie.id, ADMIN_USER_ID],
          queryFn: async () => {
            const { data, error } = await supabase.from('user_ratings').select('rating').eq('user_id', ADMIN_USER_ID).eq('movie_id', movie.id).single();
            return (error || !data) ? null : data.rating;
          },
        }),
      ];

      if (userId) {
        prefetchPromises.push(
          queryClient.prefetchQuery({
            queryKey: ['current_user_rating', movie.id, userId],
            queryFn: async () => {
              const { data, error } = await supabase.from('user_ratings').select('rating').eq('user_id', userId).eq('movie_id', movie.id).single();
              return (error || !data) ? null : data.rating;
            },
          })
        );
      }

      await Promise.all(prefetchPromises);
    } catch (error) {
      console.error("Prefetching failed, navigating anyway:", error);
    } finally {
      navigate(`/movie/${movie.id}`);
    }
  };

  return (
    <div onClick={handleCardClick} className="relative h-full group-hover/slide:z-30 block cursor-pointer">
      <motion.div
        className={cn(
          "h-full flex flex-col bg-card border-none rounded-none shadow-lg overflow-hidden cursor-pointer",
          "transition-all duration-300 ease-in-out transform-gpu group-hover/slide:scale-125 group-hover/slide:shadow-glow"
        )}
      >
        {isAdmin && (
          <div className="absolute top-2 left-2 z-40" onClick={handleInteraction}>
            <Checkbox
              checked={selectedMovieIds.has(movie.id)}
              onCheckedChange={(checked) => onSelectMovie(movie.id, !!checked)}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
          </div>
        )}

        <motion.div
          layoutId={`movie-poster-${movie.id}`}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="relative aspect-[2/3] w-full bg-muted"
        >
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
            onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
            loading="lazy"
          />
          {isLoading && <Skeleton className="absolute inset-0 w-full h-full" />}
        </motion.div>

        <div
          className="absolute inset-0 flex flex-col transition-opacity duration-300 z-20 rounded-none opacity-0 group-hover/slide:opacity-100 pointer-events-none"
        >
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
          <div className="h-[55%] w-full bg-black flex flex-col justify-between p-3 text-white pointer-events-auto">
            <div className="mb-1" onClick={handleInteraction}>
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
            <div className="hidden md:flex flex-row gap-1 mt-2" onClick={handleInteraction}>
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

        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2 z-40" onClick={handleInteraction}>
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

        {isPrefetching && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-none">
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>
        )}
      </motion.div>
    </div>
  );
};