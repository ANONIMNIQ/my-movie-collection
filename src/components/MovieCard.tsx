import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, Play, Youtube } from "lucide-react"; // Added Play and Youtube icons
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
import React from "react"; // Import React for useState

interface MovieCardProps {
  movie: Movie;
  selectedMovieIds: Set<string>; // New prop
  onSelectMovie: (id: string, isSelected: boolean) => void; // New prop
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

export const MovieCard = ({ movie, selectedMovieIds, onSelectMovie }: MovieCardProps) => {
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);
  const { session } = useSession();
  const queryClient = useQueryClient();
  const [isHovered, setIsHovered] = React.useState(false); // State for hover effect

  // Fetch admin's personal rating for this movie, visible to all
  const { data: adminPersonalRatingData } = useQuery({
    queryKey: ['admin_user_rating', movie.id, ADMIN_USER_ID], // Use a distinct query key
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', ADMIN_USER_ID) // Always fetch for admin user
        .eq('movie_id', movie.id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching admin's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    staleTime: 1000 * 60 * 5, // Cache personal rating for 5 minutes
  });

  // Prioritize movie.poster_url from Supabase, fallback to TMDb if movie.poster_url is placeholder
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
      queryClient.invalidateQueries({ queryKey: ["movies"] }); // Invalidate cache to refetch movie list
    }
  };

  // Get trailer URL from TMDb data
  const trailer = tmdbMovie?.videos?.results?.find(
    (video: any) => video.type === "Trailer" && video.site === "YouTube"
  );
  const trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col bg-card relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isAdmin && (
        <div className="absolute top-2 left-2 z-20">
          <Checkbox
            checked={selectedMovieIds.has(movie.id)}
            onCheckedChange={(checked) => onSelectMovie(movie.id, !!checked)}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
      )}
      <Link to={`/movie/${movie.id}`} className="block">
        <CardHeader className="p-0 relative">
          <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => (e.currentTarget.src = '/placeholder.svg')} // Fallback to generic placeholder on image error
              />
            )}
          </div>
        </CardHeader>
      </Link>

      {/* Default Info (always visible) */}
      <div className="p-4 flex flex-col flex-grow">
        <CardTitle className="text-base font-bold line-clamp-2 flex-grow">
          {movie.title}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">{movie.year}</p>
        <div className="mt-2 flex items-center">
          <span className="text-sm text-muted-foreground mr-1">My Rating:</span>
          <span className="text-sm font-medium">
            {typeof adminPersonalRatingData === 'number' ? adminPersonalRatingData.toFixed(1) : "N/A"}
          </span>
        </div>
      </div>

      {/* Hover Overlay */}
      {isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-end p-4 transition-opacity duration-300 z-10">
          <h3 className="text-lg font-bold text-white line-clamp-2 mb-2">
            {movie.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-3 mb-2">
            {movie.synopsis || tmdbMovie?.overview || "No synopsis available."}
          </p>
          <p className="text-xs text-gray-400 mb-4">
            {movie.runtime ? `${movie.runtime} min` : "N/A min"}
          </p>
          <div className="flex flex-col gap-2">
            <Link to={`/movie/${movie.id}`}>
              <Button variant="secondary" className="w-full justify-center gap-2">
                <Play className="h-4 w-4" /> Watch
              </Button>
            </Link>
            {trailerUrl && (
              <a href={trailerUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full justify-center gap-2">
                  <Youtube className="h-4 w-4" /> Trailer
                </Button>
              </a>
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 z-20"> {/* Increased z-index to ensure visibility */}
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
  );
};