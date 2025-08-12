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
import { useQueryClient, useQuery } from "@tanstack/react-query"; // Import useQuery
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
import HeroSlider from "@/components/HeroSlider"; // Import HeroSlider

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";
const BATCH_SIZE = 50;

// Define new variants for header content
const headerTextRevealVariants = {
  hidden: { opacity: 0, y: 20 }, // Changed y to -20 for top-to-bottom
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }, // Reduced duration
};

const headerContentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1, // Reduced stagger
      delayChildren: 0.05, // Reduced delay
    },
  },
};

const Index = () => {
  const { session, loading: sessionLoading } = useSession();
  const [visibleCount, setVisibleCount] = useState(18);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAndFilter, setSortAndFilter] = useState("title-asc");
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // State to control when main content animations start
  const [pageLoaded, setPageLoaded] = useState(false);
  // New state to control header shrinking
  const [headerShrunk, setHeaderShrunk] = useState(false);
  const [isPageReadyForInteraction, setIsPageReadyForInteraction] = useState(false);

  const isAdmin = session?.user?.id === ADMIN_USER_ID;

  // Fetch all movies using useQuery
  const { data: allMovies, isLoading: loadingAllMovies, isError: isErrorAllMovies, error: errorAllMovies } = useQuery<Movie[], Error>({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true })
        .limit(5000);

      if (error) {
        throw new Error(error.message);
      }
      return data as Movie[];
    },
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: false, // Do not retry on error, handle it directly
  });

  // Fetch admin's perfect-rated movies for the hero slider
  const { data: adminPerfectRatedMovies, isLoading: loadingAdminRatings } = useQuery<Movie[], Error>({
    queryKey: ["adminPerfectRatedMovies"],
    queryFn: async () => {
      if (!ADMIN_USER_ID) return []; // Ensure ADMIN_USER_ID is defined

      const { data: ratings, error: ratingsError } = await supabase
        .from('user_ratings')
        .select('movie_id')
        .eq('user_id', ADMIN_USER_ID)
        .eq('rating', 10);

      if (ratingsError) {
        console.error("Error fetching admin's perfect ratings:", ratingsError);
        return [];
      }

      const perfectMovieIds = ratings.map(r => r.movie_id);

      if (perfectMovieIds.length === 0) return [];

      const { data: moviesData, error: moviesError } = await supabase
        .from('movies')
        .select('*')
        .in('id', perfectMovieIds);

      if (moviesError) {
        console.error("Error fetching perfect rated movies:", moviesError);
        return [];
      }
      return moviesData as Movie[];
    },
    enabled: !sessionLoading, // Only fetch once session is loaded
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
    retry: false,
  });

  // Randomly select 5-6 perfect-rated movies for the hero slider
  const heroSliderMovies = useMemo(() => {
    if (!adminPerfectRatedMovies || adminPerfectRatedMovies.length === 0) return [];
    
    const shuffled = [...adminPerfectRatedMovies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(shuffled.length, 6)); // Get up to 6 random movies
  }, [adminPerfectRatedMovies]);


  useEffect(() => {
    // Reset all animation states on mount
    setHeaderShrunk(false);
    setPageLoaded(false);

    // Start the first part of the header animation after a short delay
    const pageLoadTimer = setTimeout(() => {
      setPageLoaded(true);
    }, 800);

    const interactionTimer = setTimeout(() => {
      setIsPageReadyForInteraction(true);
    }, 2500); // Lock interaction for 2.5 seconds

    return () => {
      clearTimeout(pageLoadTimer);
      clearTimeout(interactionTimer);
    };
  }, []);

  useEffect(() => {
    // This effect triggers the shrink animation after the initial header content has been visible for a while.
    if (pageLoaded && !headerShrunk) {
      const shrinkTimer = setTimeout(() => {
        setHeaderShrunk(true);
      }, 800); // Wait 0.8 seconds before shrinking
      return () => clearTimeout(shrinkTimer);
    }
  }, [pageLoaded, headerShrunk]);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    allMovies?.forEach((movie) => { // Use optional chaining for allMovies
      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((genre) => {
          if (genre) genres.add(genre);
        });
      }
    });
    return Array.from(genres).sort();
  }, [allMovies]);

  const allCountries = useMemo(() => {
    const countries = new Set<string>();
    allMovies?.forEach((movie) => { // Use optional chaining for allMovies
      if (Array.isArray(movie.origin_country)) {
        movie.origin_country.forEach((country) => {
          if (country) countries.add(country);
        });
      }
    });
    return Array.from(countries).sort();
  }, [allMovies]);

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...(allMovies || [])]; // Ensure allMovies is an array

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
          result.sort((a, b) => b.year.localeCompare(b.year));
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
  }, [allMovies, searchQuery, sortAndFilter, allGenres, allCountries]);

  const categorizedMovies = useMemo(() => {
    const newMovies: Movie[] = [];
    const dramaMovies: Movie[] = [];
    const thrillerMovies: Movie[] = [];
    const scifiMovies: Movie[] = [];
    const horrorMovies: Movie[] = [];

    const currentYear = new Date().getFullYear().toString();

    (allMovies || []).forEach((movie) => { // Ensure allMovies is an array
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
    });

    return { newMovies, dramaMovies, thrillerMovies, scifiMovies, horrorMovies };
  }, [allMovies]);

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

  // Dynamically calculate shrunken header height for perfect fit
  const shrunkenHeaderHeight = isMobile ? 48 : 72;
  const shrunkenHeaderPaddingY = '0.5rem';

  // Header variants for height and padding animation
  const headerVariants = {
    full: {
      minHeight: "200px",
      paddingTop: "2rem",
      paddingBottom: "2rem",
      transition: { duration: 0.5, ease: "easeOut" }
    },
    shrunk: {
      minHeight: `${shrunkenHeaderHeight}px`,
      paddingTop: shrunkenHeaderPaddingY,
      paddingBottom: shrunkenHeaderPaddingY,
      transition: { duration: 0.5, ease: "easeOut" }
    },
  };

  // Title variants (for font size within the shrinking header)
  const titleShrinkVariants = {
    full: { fontSize: isMobile ? "2.25rem" : "3rem", transition: { duration: 0.5, ease: "easeOut" } },
    shrunk: { fontSize: isMobile ? "1.25rem" : "2rem", transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Other header content variants (description, counter, buttons)
  const fadeOutShrinkVariants = {
    full: { opacity: 1, height: "auto", marginTop: "1.5rem", marginBottom: "1.5rem", transition: { duration: 0.3, ease: "easeOut" } },
    shrunk: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.3, ease: "easeOut" }, transitionEnd: { display: "none" } },
  };

  // Main content wrapper variants for padding to align with shrinking header
  const mainContentAlignmentVariants = {
    full: { 
      paddingTop: isMobile ? "200px" : "0px", 
      transition: { duration: 0.5, ease: "easeOut" } 
    },
    shrunk: { 
      paddingTop: `${shrunkenHeaderHeight}px`, 
      transition: { duration: 0.5, ease: "easeOut" } 
    },
  };

  // Variants for content sections (fade in and slight slide up)
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  const mainContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <>
      {!isPageReadyForInteraction && (
        <div className="fixed inset-0 z-[100] bg-transparent" />
      )}
      <motion.div
        className={cn(
          "min-h-screen w-full overflow-x-hidden",
          !isMobile && "bg-background text-foreground",
        )}
        initial={isMobile ? { backgroundColor: "hsl(var(--background))" } : {}}
        animate={isMobile && headerShrunk ? { backgroundColor: "rgb(255,255,255)" } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.header
          className={cn(
            "w-full text-center z-50 fixed top-0 left-0 right-0",
            "transition-colors duration-500 ease-out",
            headerShrunk
              ? isMobile
                ? "bg-background/80 backdrop-blur-lg shadow-md"
                : "bg-white/80 backdrop-blur-lg shadow-md"
              : "bg-white shadow-md"
          )}
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        >
          <motion.div
            initial="full"
            animate={headerShrunk ? "shrunk" : "full"}
            variants={headerVariants}
            className="h-full flex flex-col justify-center"
          >
            <div className="container mx-auto px-4 h-full">
              <div className="relative flex items-center justify-center h-full">
                {/* Centered content block */}
                <motion.div
                  className="text-center"
                  initial="hidden"
                  animate={pageLoaded ? "visible" : "hidden"}
                  variants={headerContentContainerVariants}
                >
                  <motion.h1
                    className={cn(
                      "text-4xl md:text-5xl font-bold tracking-tight",
                      isMobile && headerShrunk ? "text-foreground" : "text-headerTitle"
                    )}
                    animate={headerShrunk ? "shrunk" : "full"}
                    variants={titleShrinkVariants}
                  >
                    Georgi's Movie Collection
                  </motion.h1>

                  {/* Fading content */}
                  <motion.div
                    className="overflow-hidden"
                    animate={headerShrunk ? "shrunk" : "full"}
                    variants={fadeOutShrinkVariants}
                  >
                    <p
                      className={cn(
                        "mt-2 text-lg",
                        isMobile && headerShrunk ? "text-muted-foreground" : "text-headerDescription"
                      )}
                    >
                      A minimalist collection of cinematic gems.
                    </p>
                    <div className="mt-6">
                      <MovieCounter 
                        key={isMobile ? 'mobile' : 'desktop'}
                        count={filteredAndSortedMovies.length} 
                        numberColor={isMobile && headerShrunk ? "white" : "#0F0F0F"}
                        labelColor={isMobile && headerShrunk ? "text-muted-foreground" : "text-headerDescription"}
                      />
                    </div>
                    {/* Mobile Buttons - fade out */}
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 md:hidden">
                      {session && (
                        <>
                          <Link to="/add-movie">
                            <Button className="bg-black text-white hover:bg-gray-800">Add New Movie</Button>
                          </Link>
                          {isAdmin && (
                            <Link to="/import-movies">
                              <Button variant="secondary">Import Movies (CSV)</Button>
                            </Link>
                          )}
                          <Link to="/import-ratings">
                            <Button variant="outline" className="bg-transparent text-black border-black hover:bg-gray-200 hover:text-black">Import My Ratings</Button>
                          </Link>
                          <Button variant="outline" onClick={handleLogout} className="bg-transparent text-black border-black hover:bg-gray-200 hover:text-black">
                            Logout
                          </Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </motion.div>

                {/* Absolutely positioned desktop buttons */}
                <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-2">
                  {session && (
                    <>
                      <Link to="/add-movie">
                        <Button className="bg-black text-white hover:bg-gray-800">Add New Movie</Button>
                      </Link>
                      {isAdmin && (
                        <Link to="/import-movies">
                          <Button variant="outline" className="bg-transparent border-black text-black hover:bg-gray-200 hover:text-black">Import Movies</Button>
                        </Link>
                      )}
                      <Link to="/import-ratings">
                        <Button variant="outline" className="bg-transparent border-black text-black hover:bg-gray-200 hover:text-black">Import Ratings</Button>
                      </Link>
                      <Button variant="outline" onClick={handleLogout} className="bg-transparent border-black text-black hover:bg-gray-200 hover:text-black">
                        Logout
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.header>

        <motion.div
          initial="full"
          animate={headerShrunk ? "shrunk" : "full"}
          variants={mainContentAlignmentVariants}
        >
          <main>
            {!isMobile && heroSliderMovies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={headerShrunk ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <HeroSlider movies={heroSliderMovies} adminUserId={ADMIN_USER_ID} />
              </motion.div>
            )}

            <motion.div
              className="hidden md:block pt-8"
              initial="hidden"
              animate={headerShrunk ? "visible" : "hidden"}
              variants={mainContainerVariants}
            >
              {loadingAllMovies ? (
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
                      isMobile={isMobile}
                      pageLoaded={pageLoaded}
                    />
                  </motion.div>
                  {categorizedMovies.dramaMovies.length > 0 && (
                    <motion.div variants={contentVariants}>
                      <CustomCarousel
                        title="Drama"
                        movies={categorizedMovies.dramaMovies}
                        selectedMovieIds={selectedMovieIds}
                        onSelectMovie={handleSelectMovie}
                        isMobile={isMobile}
                        pageLoaded={pageLoaded}
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
                        isMobile={isMobile}
                        pageLoaded={pageLoaded}
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
                        isMobile={isMobile}
                        pageLoaded={pageLoaded}
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
                        isMobile={isMobile}
                        pageLoaded={pageLoaded}
                      />
                    </motion.div>
                  )}
                </>
              )}

              <motion.div variants={contentVariants} className="px-4 overflow-x-visible md:bg-gray-200 md:text-black">
                {!loadingAllMovies && (
                  <>
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 px-6 pt-8">
                      <h2 className="text-3xl font-bold ml-3">All Movies</h2>
                      <div className="flex w-full sm:w-auto items-center gap-2">
                        <Input
                          type="text"
                          placeholder="Search movies..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full sm:w-auto bg-white text-black border-gray-300"
                        />
                        <Select value={sortAndFilter} onValueChange={setSortAndFilter}>
                          <SelectTrigger className="w-[220px] bg-white text-black border-gray-300">
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

                    {isAdmin && (
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
                  </>
                )}

                {loadingAllMovies ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {Array.from({ length: 18 }).map((_, index) => (
                      <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />
                    ))}
                  </div>
                ) : isErrorAllMovies ? (
                  <div className="text-center text-destructive">{errorAllMovies?.message || "Failed to load movies."}</div>
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
                {visibleCount < filteredAndSortedMovies.length && (
                  <motion.div variants={contentVariants} className="text-center mt-12 pb-12">
                    <Button onClick={handleLoadMore} size="lg" className="bg-black text-white hover:bg-gray-800">
                      Load More
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>

            <motion.div
              className="md:hidden px-4 pt-8"
              initial="hidden"
              animate={headerShrunk ? "visible" : "hidden"}
              variants={mainContainerVariants}
            >
              <motion.div variants={contentVariants} className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <motion.h2
                  className="text-3xl font-bold"
                  initial={{ color: "rgb(255,255,255)" }}
                  animate={{ color: isMobile && headerShrunk ? "rgb(0,0,0)" : "rgb(255,255,255)" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                >
                  All Movies
                </motion.h2>
                <Input
                  type="text"
                  placeholder="Search movies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </motion.div>
              
              {isAdmin && !loadingAllMovies && (
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
                {loadingAllMovies ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="w-full h-80 rounded-lg" />
                  ))
                ) : isErrorAllMovies ? (
                  <div className="text-center text-destructive">{errorAllMovies?.message || "Failed to load movies."}</div>
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
              {visibleCount < filteredAndSortedMovies.length && (
                <motion.div variants={contentVariants} className="text-center mt-12 pb-12">
                  <Button onClick={handleLoadMore} size="lg" className="bg-black text-white hover:bg-gray-800">
                    Load More
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </main>
        </motion.div>
        <motion.footer
          className="py-8"
          initial="hidden"
          animate={headerShrunk ? "visible" : "hidden"}
          variants={contentVariants}
        >
          <MadeWithDyad />
        </motion.footer>
      </motion.div>
    </>
  );
};

export default Index;