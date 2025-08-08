import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/data/movies";
import { useTmdbMovie } from "@/hooks/useTmdbMovie";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star } from "lucide-react";
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
import PersonalRating from "./PersonalRating"; // Import PersonalRating

interface MovieCardProps {
  movie: Movie;
  isSelected: boolean;
  onSelect: (id: string, isSelected: boolean) => void;
}

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

export const MovieCard = ({ movie, isSelected, onSelect }: MovieCardProps) => {
  const { data: tmdbMovie, isLoading } = useTmdbMovie(movie.title, movie.year);
  const { session } = useSession();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;

  // Fetch personal rating for this movie
  const { data: personalRatingData } = useQuery({
    queryKey: ['user_rating', movie.id, userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('movie_id', movie.id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache personal rating for 5 minutes
  });

  const posterUrl = tmdbMovie?.poster_path
    ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
    : movie.poster_url;

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

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col bg-card relative">
      {isAdmin && (
        <div className="absolute top-2 left-2 z-20">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(movie.id, !!checked)}
            className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
        </div>
      )}
      <Link to={`/movie/${movie.id}`} className="block group">
        <CardHeader className="p-0 relative">
          <div className="aspect-[2/3] w-full overflow-hidden bg-muted">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => (e.currentTarget.src = movie.poster_url)}
              />
            )}
          </div>
        </CardHeader>
        <div className="p-4 flex flex-col flex-grow">
          <CardTitle className="text-base font-bold line-clamp-2 flex-grow">
            {movie.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{movie.year}</p>
          {userId && (
            <div className="mt-2 flex items-center">
              <span className="text-sm text-muted-foreground mr-1">Your Rating:</span>
              <PersonalRating movieId={movie.id} initialRating={personalRatingData} readOnly={true} />
              {personalRatingData === null && <span className="text-sm text-muted-foreground ml-1">N/A</span>}
            </div>
          )}
        </div>
      </Link>
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-2 z-10">
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