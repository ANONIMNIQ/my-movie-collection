import { useState, useEffect, useMemo } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useQueryClient } from "@tanstack/react-query";
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
import { CustomCarousel } from "@/components/CustomCarousel";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";
const BATCH_SIZE = 50;

const Index = () => {
  const { session, loading: sessionLoading } = useSession();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(18);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = session?.user?.id === ADMIN_USER_ID;
  const currentYear = new Date().getFullYear().toString();

  useEffect(() => {
    const fetchMovies = async () => {
      setLoadingMovies(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true })
        .limit(5000);

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

  const newMovies = useMemo(() => {
    return movies.filter(movie => movie.year === currentYear);
  }, [movies, currentYear]);

  const dramaMovies = useMemo(() => {
    return movies.filter(movie => movie.genres.includes("Drama"));
  }, [movies]);

  const thrillerMovies = useMemo(() => {
    return movies.filter(movie => movie.genres.includes("Thriller"));
  }, [movies]);

  const scifiMovies = useMemo(() => {
    return movies.filter(movie => movie.genres.includes("Sci-Fi"));
  }, [movies]);

  const horrorMovies = useMemo(() => {
    return movies.filter(movie => movie.genres.includes("Horror"));
  }, [movies]);

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

    setIsDeleting(true);
    const idsToDelete = Array.from(selectedMovieIds);
    let successfulDeletions = 0;
    let failedDeletions = 0;
    const errors: string[] = [];

    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase
        .from("movies")
        .delete()
        .in("id", batch);

      if (deleteError) {
        console.error("Error deleting batch:", deleteError);
        errors.push(deleteError.message);
        failedDeletions += batch.length;
      } else {
        successfulDeletions += batch.length;
      }
    }

    if (successfulDeletions > 0) {
      showSuccess(`Successfully deleted ${successfulDeletions} movies.`);
    }
    if (failedDeletions > 0) {
      showError(`Failed to delete ${failedDeletions} movies. Errors: ${errors.join("; ")}`);
    }
    
    setSelectedMovieIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["movies"] });
    setIsDeleting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground w-full overflow-x-hidden">
      <main className="py-8">
        <header className="container mx-auto px-4 text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Georgi's Movie Collection
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
                <Link to="/import-ratings">
                  <Button variant="outline">Import My Ratings</Button>
                </Link>
                <Button variant="outline" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            ) : (
              <></>
            )}
          </div>
        </header>

        {loadingMovies ? (
          <div className="container mx-auto px-4 mb-12">
            <h2 className="text-3xl font-bold mb-4">New Movies</h2>
            <div className="flex overflow-hidden gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="aspect-[2/3] w-1/6 flex-shrink-0 rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <CustomCarousel
            title="New Movies"
            movies={newMovies}
            selectedMovieIds={selectedMovieIds}
            onSelectMovie={handleSelectMovie}
          />
        )}

        {!loadingMovies && dramaMovies.length > 0 && (
          <CustomCarousel
            title="Drama"
            movies={dramaMovies}
            selectedMovieIds={selectedMovieIds}
            onSelectMovie={handleSelectMovie}
          />
        )}
        {!loadingMovies && thrillerMovies.length > 0 && (
          <CustomCarousel
            title="Thriller"
            movies={thrillerMovies}
            selectedMovieIds={selectedMovieIds}
            onSelectMovie={handleSelectMovie}
          />
        )}
        {!loadingMovies && scifiMovies.length > 0 && (
          <CustomCarousel
            title="Sci-Fi"
            movies={scifiMovies}
            selectedMovieIds={selectedMovieIds}
            onSelectMovie={handleSelectMovie}
          />
        )}
        {!loadingMovies && horrorMovies.length > 0 && (
          <CustomCarousel
            title="Horror"
            movies={horrorMovies}
            selectedMovieIds={selectedMovieIds}
            onSelectMovie={handleSelectMovie}
          />
        )}

        <div className="container mx-auto px-4">
          {!loadingMovies && filteredMovies.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <h2 className="text-3xl font-bold">All Movies</h2>
              <div className="w-full sm:w-auto sm:max-w-xs">
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={selectedMovieIds.size === filteredMovies.length && filteredMovies.length > 0}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                  disabled={filteredMovies.length === 0 || isDeleting}
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
                    <Button variant="destructive" className="gap-2" disabled={isDeleting}>
                      <Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete Selected (${selectedMovieIds.size})`}
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
                      <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete All"}
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
        </div>
      </main>
      <footer className="py-8">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;