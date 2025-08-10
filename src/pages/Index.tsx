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
import MovieCounter from "@/components/MovieCounter";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";
const BATCH_SIZE = 50;

const Index = () => {
  const { session, loading: sessionLoading } = useSession();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(18);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAndFilter, setSortAndFilter] = useState("title-asc");
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();

  const isAdmin = session?.user?.id === ADMIN_USER_ID;

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

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach((movie) => {
      movie.genres.forEach((genre) => genres.add(genre));
    });
    return Array.from(genres).sort();
  }, [movies]);

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    // 1. Filter by search query
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(lowerCaseQuery) ||
          movie.director.toLowerCase().includes(lowerCaseQuery) ||
          movie.genres.some((genre) => genre.toLowerCase().includes(lowerCaseQuery)) ||
          movie.movie_cast.some((actor) => actor.toLowerCase().includes(lowerCaseQuery)) ||
          movie.year.includes(lowerCaseQuery)
      );
    }

    // 2. Filter by genre or sort
    if (allGenres.includes(sortAndFilter)) {
      result = result.filter((movie) => movie.genres.includes(sortAndFilter));
      // Default sort by title when filtering by genre
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      switch (sortAndFilter) {
        case "title-asc":
          result.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "title-desc":
          result.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case "year-desc":
          result.sort((a, b) => b.year.localeCompare(a.year));
          break;
        case "year-asc":
          result.sort((a, b) => a.year.localeCompare(b.year));
          break;
        default:
          result.sort((a, b) => a.title.localeCompare(b.title));
          break;
      }
    }

    return result;
  }, [movies, searchQuery, sortAndFilter, allGenres]);

  const categorizedMovies = useMemo(() => {
    const newMovies: Movie[] = [];
    const dramaMovies: Movie[] = [];
    const thrillerMovies: Movie[] = [];
    const scifiMovies: Movie[] = [];
    const horrorMovies: Movie[] = [];

    const currentYear = new Date().getFullYear().toString();

    for (const movie of movies) {
      if (movie.year === currentYear) {
        newMovies.push(movie);
      }
      if (movie.genres.includes("Drama")) {
        dramaMovies.push(movie);
      }
      if (movie.genres.includes("Thriller")) {
        thrillerMovies.push(movie);
      }
      if (movie.genres.includes("Sci-Fi") || movie.genres.includes("Science Fiction")) {
        scifiMovies.push(movie);
      }
      if (movie.genres.includes("Horror")) {
        horrorMovies.push(movie);
      }
    }

    return { newMovies, dramaMovies, thrillerMovies, scifiMovies, horrorMovies };
  }, [movies]);

  const moviesToShow = filteredAndSortedMovies.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 18);
  };

  const handleLogout = async () => {
    console.log("Attempting to log out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        showError("Logout failed: " + error.message);
      } else {
        console.log("Logout successful.");
        showSuccess("You have been logged out.");
        // Invalidate all queries to clear cached data for the logged-out user
        queryClient.invalidateQueries();
      }
    } catch (err: any) {
      console.error("Unexpected error during logout:", err);
      showError("An unexpected error occurred during logout: " + err.message);
    }
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
      const allFilteredMovieIds = new Set(filteredAndSortedMovies.map((movie) => movie.id));
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
      <header className="w-full text-center bg-white py-8 shadow-md z-50">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-headerTitle">
            Georgi's Movie Collection
          </h1>
          <p className="text-headerDescription mt-2 text-lg">
            A minimalist collection of cinematic gems.
          </p>
          <div className="mt-6">
            <MovieCounter 
              count={filteredAndSortedMovies.length} 
              numberColor="#0F0F0F"
              labelColor="text-headerDescription"
            />
          </div>
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
        </div>
      </header>

      <main className="pt-0">
        <div className="pt-8">
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
              movies={categorizedMovies.newMovies}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={handleSelectMovie}
            />
          )}

          {!loadingMovies && categorizedMovies.dramaMovies.length > 0 && (
            <CustomCarousel
              title="Drama"
              movies={categorizedMovies.dramaMovies}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={handleSelectMovie}
            />
          )}
          {!loadingMovies && categorizedMovies.thrillerMovies.length > 0 && (
            <CustomCarousel
              title="Thriller"
              movies={categorizedMovies.thrillerMovies}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={handleSelectMovie}
            />
          )}
          {!loadingMovies && categorizedMovies.scifiMovies.length > 0 && (
            <CustomCarousel
              title="Sci-Fi"
              movies={categorizedMovies.scifiMovies}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={handleSelectMovie}
            />
          )}
          {!loadingMovies && categorizedMovies.horrorMovies.length > 0 && (
            <CustomCarousel
              title="Horror"
              movies={categorizedMovies.horrorMovies}
              selectedMovieIds={selectedMovieIds}
              onSelectMovie={handleSelectMovie}
            />
          )}

          <div className="container mx-auto px-4 overflow-x-visible"> {/* Added overflow-x-visible */}
            {!loadingMovies && filteredAndSortedMovies.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <h2 className="text-3xl font-bold">All Movies</h2>
                <div className="flex w-full sm:w-auto items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Search movies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-auto"
                  />
                  <div className="hidden md:block">
                    <Select value={sortAndFilter} onValueChange={setSortAndFilter}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Sort & Filter" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Sort by</SelectLabel>
                          <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                          <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                          <SelectItem value="year-desc">Release Date (Newest)</SelectItem>
                          <SelectItem value="year-asc">Release Date (Oldest)</SelectItem>
                        </SelectGroup>
                        {allGenres.length > 0 && <Separator className="my-1" />}
                        <SelectGroup>
                          <SelectLabel>Filter by Genre</SelectLabel>
                          {allGenres.map((genre) => (
                            <SelectItem key={genre} value={genre}>
                              {genre}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    disabled={filteredAndSortedMovies.length === 0 || isDeleting}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                {Array.from({ length: 18 }).map((_, index) => (
                  <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center text-destructive">{error}</div>
            ) : filteredAndSortedMovies.length === 0 ? (
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
            {visibleCount < filteredAndSortedMovies.length && (
              <div className="text-center mt-12">
                <Button onClick={handleLoadMore} size="lg">
                  Load More
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="py-8">
        <MadeWithDyad />
      </footer>
    </div>
  );
};

export default Index;