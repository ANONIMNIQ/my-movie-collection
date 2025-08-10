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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { MobileMovieCard } from "@/components/MobileMovieCard";
import { motion } from "framer-motion"; // Import motion

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
  const isMobile = useIsMobile();

  // Animation state
  const [introComplete, setIntroComplete] = useState(false);

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
      } else {
        setMovies(data as Movie[]);
      }
      setLoadingMovies(false);
    };

    fetchMovies();
  }, []);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movies.forEach((movie) => {
      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((genre) => {
          if (genre) genres.add(genre);
        });
      }
    });
    return Array.from(genres).sort();
  }, [movies]);

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    movies.forEach((movie) => {
      if (Array.isArray(movie.origin_country)) {
        movie.origin_country.forEach((country) => {
          if (country) countries.add(country);
        });
      }
    });
    return Array.from(countries).sort();
  }, [movies]);

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...movies];

    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(
        (movie) =>
          movie.title.toLowerCase().includes(lowerCaseQuery) ||
          (movie.director && movie.director.toLowerCase().includes(lowerCaseQuery)) ||
          (Array.isArray(movie.genres) && movie.genres.some((genre) => genre.toLowerCase().includes(lowerCaseQuery))) ||
          (Array.isArray(movie.movie_cast) && movie.movie_cast.some((actor) => actor.toLowerCase().includes(lowerCaseQuery))) ||
          movie.year.includes(lowerCaseQuery)
      );
    }

    if (allGenres.includes(sortAndFilter)) {
      result = result.filter((movie) => movie.genres.includes(sortAndFilter));
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (allCountries.includes(sortAndFilter)) {
      result = result.filter((movie) => movie.origin_country && movie.origin_country.includes(sortAndFilter));
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
  }, [movies, searchQuery, sortAndFilter, allGenres, allCountries]);

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
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Logout failed: " + error.message);
    } else {
      showSuccess("You have been logged out.");
      queryClient.invalidateQueries();
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

  // Animation variants
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const headerVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 1, ease: "easeOut" } },
  };

  const introOverlayVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 0, transition: { delay: 2, duration: 1 } }, // Fade out after 2s, takes 1s
  };

  return (
    <motion.div
      initial={{ backgroundColor: 'hsl(var(--background))' }}
      animate={isMobile && introComplete ? { backgroundColor: 'white' } : {}}
      transition={{ duration: 1.5, delay: 2.8 }} // Start mobile color transition after intro overlay fades
      className={cn("min-h-screen w-full overflow-x-hidden", isMobile && introComplete ? "text-black" : "text-foreground")}
    >
      {/* Intro Overlay - covers the screen initially */}
      {!introComplete && (
        <motion.div
          className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center" // Increased z-index
          initial="hidden"
          animate="visible"
          variants={introOverlayVariants}
          onAnimationComplete={() => setIntroComplete(true)}
          style={{ pointerEvents: introComplete ? 'none' : 'auto' }} // Disable pointer events after animation
        >
          <motion.h1
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Georgi's Movie Collection
          </motion.h1>
          <motion.p
            className="mt-2 text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            A minimalist collection of cinematic gems.
          </motion.p>
        </motion.div>
      )}

      {/* Main Content - hidden until intro is complete */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={introComplete ? { opacity: 1 } : {}}
        transition={{ delay: 2.8, duration: 0.5 }} // Appear after intro overlay fades
      >
        <motion.header
          className={cn("w-full text-center py-8 shadow-md z-50", isMobile && introComplete ? "bg-white" : "bg-background")}
          initial="hidden"
          animate={introComplete ? "visible" : "hidden"}
          variants={headerVariants}
        >
          <div className="container mx-auto px-4">
            <h1 className={cn("text-4xl md:text-5xl font-bold tracking-tight", isMobile && introComplete ? "text-headerTitle" : "text-foreground")}>
              Georgi's Movie Collection
            </h1>
            <p className={cn("mt-2 text-lg", isMobile && introComplete ? "text-headerDescription" : "text-muted-foreground")}>
              A minimalist collection of cinematic gems.
            </p>
            <div className="mt-6">
              <MovieCounter 
                key={isMobile ? 'mobile' : 'desktop'}
                count={filteredAndSortedMovies.length} 
                numberColor={isMobile && introComplete ? "#0F0F0F" : "white"}
                labelColor={isMobile && introComplete ? "text-headerDescription" : "text-muted-foreground"}
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
        </motion.header>

        <motion.main
          className="pt-0"
          initial="hidden"
          animate={introComplete ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
                delayChildren: 0.5, // Delay for children to start animating after main appears
              },
            },
          }}
        >
          {/* Desktop View */}
          <div className="hidden md:block pt-8">
            {loadingMovies ? (
              <motion.div variants={contentVariants} className="container mx-auto px-4 mb-12">
                <h2 className="text-3xl font-bold mb-4">New Movies</h2>
                <div className="flex overflow-hidden gap-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="aspect-[2/3] w-1/6 flex-shrink-0 rounded-lg" />
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                <motion.div variants={contentVariants}>
                  <CustomCarousel
                    title="New Movies"
                    movies={categorizedMovies.newMovies}
                    selectedMovieIds={selectedMovieIds}
                    onSelectMovie={handleSelectMovie}
                  />
                </motion.div>
                {categorizedMovies.dramaMovies.length > 0 && (
                  <motion.div variants={contentVariants}>
                    <CustomCarousel
                      title="Drama"
                      movies={categorizedMovies.dramaMovies}
                      selectedMovieIds={selectedMovieIds}
                      onSelectMovie={handleSelectMovie}
                    />
                  </motion.div>
                )}
                {categorizedMovies.thrillerMovies.length > 0 && (
                  <motion.div variants={contentVariants}>
                    <CustomCarousel
                      title="Thriller"
                      movies={categorizedMovies.thrillerMovies}
                      selectedMovieIds={selectedMovieIds}
                      onSelectMovie={handleSelectMovie}
                    />
                  </motion.div>
                )}
                {categorizedMovies.scifiMovies.length > 0 && (
                  <motion.div variants={contentVariants}>
                    <CustomCarousel
                      title="Sci-Fi"
                      movies={categorizedMovies.scifiMovies}
                      selectedMovieIds={selectedMovieIds}
                      onSelectMovie={handleSelectMovie}
                    />
                  </motion.div>
                )}
                {categorizedMovies.horrorMovies.length > 0 && (
                  <motion.div variants={contentVariants}>
                    <CustomCarousel
                      title="Horror"
                      movies={categorizedMovies.horrorMovies}
                      selectedMovieIds={selectedMovieIds}
                      onSelectMovie={handleSelectMovie}
                    />
                  </motion.div>
                )}
              </>
            )}

            <motion.div variants={contentVariants} className="px-4 overflow-x-visible">
              {!loadingMovies && (
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 px-6">
                  <h2 className="text-3xl font-bold ml-3">All Movies</h2>
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Search movies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-auto"
                    />
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
                            <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                          ))}
                        </SelectGroup>
                        {allCountries.length > 0 && <Separator className="my-1" />}
                        <SelectGroup>
                          <SelectLabel>Filter by Country</SelectLabel>
                          {allCountries.map((country) => (
                            <SelectItem key={country} value={country}>{country}</SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {isAdmin && !loadingMovies && (
                <div className="flex items-center justify-between mb-4 px-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      disabled={filteredAndSortedMovies.length === 0 || isDeleting}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
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
                            <span className="font-bold">{selectedMovieIds.size}</span> selected movies.
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
                <div className="text-center text-muted-foreground text-lg py-16">
                  No movies found matching your search.
                </div>
              ) : (
                <MovieGrid
                  movies={moviesToShow}
                  selectedMovieIds={selectedMovieIds}
                  onSelectMovie={handleSelectMovie}
                />
              )}
            </motion.div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden pt-8 px-4">
            <motion.div variants={contentVariants} className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
              <h2 className="text-3xl font-bold">All Movies</h2>
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-auto"
              />
            </motion.div>
            
            {isAdmin && !loadingMovies && (
                <motion.div variants={contentVariants} className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all-mobile"
                      checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      disabled={filteredAndSortedMovies.length === 0 || isDeleting}
                    />
                    <label htmlFor="select-all-mobile" className="text-sm font-medium">
                      Select All ({selectedMovieIds.size} selected)
                    </label>
                  </div>
                  {selectedMovieIds.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="gap-2" disabled={isDeleting}>
                          <Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete (${selectedMovieIds.size})`}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{" "}
                            <span className="font-bold">{selectedMovieIds.size}</span> selected movies.
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
                </motion.div>
              )}

            <div className="flex flex-col gap-4">
              {loadingMovies ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="w-full h-80 rounded-lg" />
                ))
              ) : error ? (
                <div className="text-center text-destructive">{error}</div>
              ) : filteredAndSortedMovies.length === 0 ? (
                <div className="text-center text-gray-500 text-lg py-16">
                  No movies found matching your search.
                </div>
              ) : (
                moviesToShow.map(movie => (
                  <motion.div key={movie.id} variants={contentVariants}>
                    <MobileMovieCard 
                      movie={movie}
                      selectedMovieIds={selectedMovieIds}
                      onSelectMovie={handleSelectMovie}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {visibleCount < filteredAndSortedMovies.length && (
            <motion.div variants={contentVariants} className="text-center mt-12">
              <Button onClick={handleLoadMore} size="lg" className="bg-black text-white hover:bg-gray-800">
                Load More
              </Button>
            </motion.div>
          )}
        </motion.main>
        <motion.footer
          className="py-8"
          initial="hidden"
          animate={introComplete ? "visible" : "hidden"}
          variants={contentVariants}
        >
          <MadeWithDyad />
        </motion.footer>
      </motion.div>
    </motion.div>
  );
};

export default Index;