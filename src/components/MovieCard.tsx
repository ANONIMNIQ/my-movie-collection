import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, Play, Youtube, Info } from "lucide-react";
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
import React from "react";

interface MovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>;
  onSelectMovie: (id: string, isSelected: boolean) => void;
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";

export const MovieCard = ({ movie, selectedMovieIds, onSelectMovie }: MovieCardProps) => {
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = React.useState(false);

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

  return (
    <div
      className={`relative h-full flex flex-col transition-all duration-300 ease-in-out overflow-visible
        ${isHovered ? "scale-125 z-30" : "scale-100 z-10"}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className="h-full flex flex-col bg-card overflow-visible">
        {isAdmin && (
          <div className="absolute top-2 left-2 z-40">
            <Checkbox
              checked={selectedMovieIds.has(movie.id)}
              onCheckedChange={(checked) => onSelectMovie(movie.id, !!checked)}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
          </div>
        )}
        
        <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
          {isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : (
            <img
              src={posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.src = '/placeholder.svg')}
            />
          )}
        </div>

        {/* Hover Overlay */}
        {isHovered && (
          <div className="absolute inset-0 flex flex-col transition-opacity duration-300 z-20 rounded-lg overflow-hidden">
            {/* Top section: Backdrop and Logo */}
            <div
              className="relative h-2/3 w-full bg-cover bg-center flex items-center justify-center p-2"
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

            {/* Bottom section: Movie Info and Buttons */}
            <div className="h-1/3 w-full bg-black flex flex-col justify-between p-3 text-white">
              <div>
                <h3 className="text-lg font-bold line-clamp-1">
                  {movie.title}
                </h3>
                <p className="text-xs text-gray-300 line-clamp-2 mb-1">
                  {movie.synopsis || tmdbMovie?.overview || "No synopsis available."}
                </p>
                <div className="text-xs text-gray-400">
                  <p>{movie.runtime ? `${movie.runtime} min` : "N/A min"} | {movie.year}</p>
                  <div className="flex items-center mt-1">
                    <Star className="text-yellow-400 h-3 w-3 mr-1" />
                    <span>My Rating: {typeof adminPersonalRatingData === 'number' ? adminPersonalRatingData.toFixed(1) : "N/A"}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-2">
                <Link to={`/movie/${movie.id}`}>
                  <Button variant="secondary" className="w-full justify-center gap-2 text-sm h-8">
                    <Info className="h-4 w-4" /> Info
                  </Button>
                </Link>
                {trailerUrl && (
                  <a href={trailerUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-center gap-2 text-sm h-8">
                      <Youtube className="h-4 w-4" /> Trailer
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="absolute top-2 right-2 flex gap-2 z-40">
            <Link to={`/edit-movie/${movie.id}`}>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
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
      </Card>
    </div>
  );
};