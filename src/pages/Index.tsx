import { useState, useEffect, useMemo } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input"; // Import Input for search bar
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox for select all
import { Trash2 } from "lucide-react"; // Import Trash2 icon
import { showSuccess, showError } from "@/utils/toast"; // Import toast utilities
import { useQueryClient } from "@tanstack/react-query"; // Import useQueryClient for cache invalidation
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

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const Index = () => {
  const { session, loading: sessionLoading } = useSession();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(18);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set()); // State for selected movie IDs
  const queryClient = useQueryClient(); // Initialize query client

  const isAdmin = session?.user?.id === ADMIN_USER_ID;

  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true })
        .limit(5000); // Increased limit to fetch more movies

      if (error) {
        console.error("Error fetching movies:", error);
        setError("Failed to load movies.");
        setLoadingMovies(false);
      } else {
        setMovies(data as Movie[]);
        setLoadingMovies(false);
      }
    };

    fetchMovies();
  }, []);

  // Filter movies based on search query
  const filteredMovies = useMemo(() => {
    if (!searchQuery) {
      return movies;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    return movies.filter(
      (movie) =>
        movie.title.toLowerCase().includes(lowerCaseQuery) ||
        movie.director.toLowerCase().includes(lowerCaseQuery) ||
        movie.genres.some((genre) => genre.toLowerCase().includes(lowerCaseQuery)) ||
        movie.movie_cast.some((actor) => actor.toLowerCase().includes(lowerCaseQuery)) ||
        movie.year.includes(lowerCaseQuery)
    );
  }, [movies, searchQuery]);

  const moviesToShow = filteredMovies.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 18);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSelectMovie = (id: string, isSelected: boolean) => {
    setSelectedMovieIds((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredMovieIds = new Set(filteredMovies.map((movie) => movie.id));
      setSelectedMovieIds(allFilteredMovieIds);
    } else {
      setSelectedMovieIds(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMovieIds.size === 0) {
      showError("No movies selected for deletion.");
      return;
    }

    const idsToDelete = Array.from(selectedMovieIds);
    const { error: deleteError } = await supabase
      .from("movies")
      .delete()
      .in("id", idsToDelete);

    if (deleteError) {
      console.error("Error deleting movies:", deleteError);
      showError("Failed to delete selected movies: " + deleteError.message);
    } else {
      showSuccess(`Successfully deleted ${idsToDelete.length} movies!`);
      setSelectedMovieIds(new Set()); // Clear selection
      queryClient.invalidateQueries({ queryKey: ["movies"] }); // Invalidate cache to refetch movie list
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            My Movie Collection
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            A minimalist collection of cinematic gems.
          </p>
          <p className="text-muted-foreground text-md mt-1">
            Total movies: {filteredMovies.length}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4">
            {sessionLoading ? (
              <Skeleton className="w-32 h-10" />
            ) : session ? (
              <>
                <Link to="/add-movie">
                  <Button>Add New Movie</Button>
                </Link>
                {isAdmin && (
                  <Link to="/import-movies">
                    <Button variant="secondary">Import Movies (CSV)</Button>
                  </Link>
                )}
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </header>

        {/* Search Bar */}
        <div className="mb-8 max-w-xl mx-auto">
          <Input
            type="text"
            placeholder="Search movies by title, director, genre, or cast..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Admin Bulk Actions */}
        {isAdmin && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={selectedMovieIds.size === filteredMovies.length && filteredMovies.length > 0}
                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                disabled={filteredMovies.length === 0}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select All ({selectedMovieIds.size} selected)
              </label>
            </div>
            {selectedMovieIds.size > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete Selected ({selectedMovieIds.size})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete{" "}
                      <span className="font-bold">{selectedMovieIds.size}</span> selected movies
                      from your collection.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkDelete}>
                      Delete All
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}

        {loadingMovies ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center text-muted-foreground text-lg">
            No movies found matching your search.
          </div>
        ) : (
          <MovieGrid
            movies={moviesToShow}
            // Pass selection props to MovieGrid, which will pass them to MovieCard
            selectedMovieIds={selectedMovieIds}
            onSelectMovie={handleSelectMovie}
          />
        )}
        {visibleCount < filteredMovies.length && (
          <div className="text-center mt-12">
            <Button onClick={handleLoadMore} size="lg">
              Load More
            </Button>
          </div>
        )}
      </main>
      <footer className="py-8">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;