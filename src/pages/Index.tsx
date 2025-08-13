import { useState, useEffect, useMemo, useRef } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import HeroSlider from "@/components/HeroSlider";
import DynamicMovieCountHeader from "@/components/DynamicMovieCountHeader";
import { Movie } from "@/data/movies";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";
const BATCH_SIZE = 50;

const headerTextRevealVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const headerContentContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
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
  const allMoviesSectionRef = useRef<HTMLDivElement>(null);
  const prevSearchQueryRef = useRef<string>('');
  const prevSortAndFilterRef = useRef<string>(sortAndFilter);

  const [pageLoaded, setPageLoaded] = useState(false);
  const [headerShrunk, setHeaderShrunk] = useState(false);
  const [isPageReadyForInteraction, setIsPageReadyForInteraction] = useState(false);
  const [isHeaderDark, setIsHeaderDark] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isAllMoviesSectionVisible, setIsAllMoviesSectionVisible] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [isLoadMoreVisible, setIsLoadMoreVisible] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  const isAdmin = session?.user?.id === ADMIN_USER_ID;

  const { data: allMovies, isLoading: loadingAllMovies, isError: isErrorAllMovies, error: errorAllMovies } = useQuery<Movie[], Error>({
    queryKey: ["movies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true })
        .limit(5000);
      if (error) throw new Error(error.message);
      return data as Movie[];
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const { data: adminPerfectRatedMovies, isLoading: loadingAdminRatings } = useQuery<Movie[], Error>({
    queryKey: ["adminPerfectRatedMovies"],
    queryFn: async () => {
      if (!ADMIN_USER_ID) return [];
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
    enabled: !sessionLoading,
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const heroSliderMovies = useMemo(() => {
    if (!adminPerfectRatedMovies || adminPerfectRatedMovies.length === 0) return [];
    const shuffled = [...adminPerfectRatedMovies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(shuffled.length, 6));
  }, [adminPerfectRatedMovies]);

  useEffect(() => {
    setHeaderShrunk(false);
    setPageLoaded(false);
    const pageLoadTimer = setTimeout(() => setPageLoaded(true), 800);
    const interactionTimer = setTimeout(() => setIsPageReadyForInteraction(true), 2500);
    return () => {
      clearTimeout(pageLoadTimer);
      clearTimeout(interactionTimer);
    };
  }, []);

  useEffect(() => {
    if (pageLoaded && !headerShrunk) {
      const shrinkTimer = setTimeout(() => setHeaderShrunk(true), 800);
      return () => clearTimeout(shrinkTimer);
    }
  }, [pageLoaded, headerShrunk]);

  const shrunkenHeaderHeight = isMobile ? 48 : 72;

  useEffect(() => {
    if (isMobile) {
      setIsAllMoviesSectionVisible(false);
      setIsHeaderDark(false);
      return;
    }

    const allMoviesVisibleObserver = new IntersectionObserver(
      ([entry]) => setIsAllMoviesSectionVisible(entry.isIntersecting),
      { threshold: 0.01 }
    );

    const headerDarkObserver = new IntersectionObserver(
      ([entry]) => {
        if (headerShrunk) {
          setIsHeaderDark(entry.isIntersecting);
        } else {
          setIsHeaderDark(false);
        }
      },
      { rootMargin: `-${shrunkenHeaderHeight}px 0px -90% 0px`, threshold: 0 }
    );

    const currentRef = allMoviesSectionRef.current;
    if (currentRef) {
      allMoviesVisibleObserver.observe(currentRef);
      headerDarkObserver.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        allMoviesVisibleObserver.unobserve(currentRef);
        headerDarkObserver.unobserve(currentRef);
      }
    };
  }, [isMobile, headerShrunk, shrunkenHeaderHeight]);

  useEffect(() => {
    const prevSearchQuery = prevSearchQueryRef.current;
    const prevSortAndFilter = prevSortAndFilterRef.current;

    const searchInitiated = !prevSearchQuery && searchQuery;
    const filterChanged = sortAndFilter !== prevSortAndFilter;

    if ((searchInitiated || filterChanged) && allMoviesSectionRef.current) {
      const headerOffset = shrunkenHeaderHeight + 24; // 24px padding
      const elementPosition = allMoviesSectionRef.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    prevSearchQueryRef.current = searchQuery;
    prevSortAndFilterRef.current = sortAndFilter;
  }, [searchQuery, sortAndFilter, shrunkenHeaderHeight]);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    allMovies?.forEach((movie) => {
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
    allMovies?.forEach((movie) => {
      if (Array.isArray(movie.origin_country)) {
        movie.origin_country.forEach((country) => {
          if (country) countries.add(country);
        });
      }
    });
    return Array.from(countries).sort();
  }, [allMovies]);

  const filteredAndSortedMovies = useMemo(() => {
    let result = [...(allMovies || [])];
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
        case "title-asc": result.sort((a, b) => a.title.localeCompare(b.title)); break;
        case "title-desc": result.sort((a, b) => b.title.localeCompare(a.title)); break;
        case "year-desc": result.sort((a, b) => b.year.localeCompare(a.year)); break;
        case "year-asc": result.sort((a, b) => a.year.localeCompare(b.year)); break;
        default: result.sort((a, b) => a.title.localeCompare(b.title)); break;
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
    (allMovies || []).forEach((movie) => {
      if (movie.year === currentYear) newMovies.push(movie);
      if (movie.genres.includes("Drama")) dramaMovies.push(movie);
      if (movie.genres.includes("Thriller")) thrillerMovies.push(movie);
      if (movie.genres.includes("Sci-Fi") || movie.genres.includes("Science Fiction")) scifiMovies.push(movie);
      if (movie.genres.includes("Horror")) horrorMovies.push(movie);
    });
    return { newMovies, dramaMovies, thrillerMovies, scifiMovies, horrorMovies };
  }, [allMovies]);

  const moviesToShow = filteredAndSortedMovies.slice(0, visibleCount);

  useEffect(() => {
    // Observer for the "Load More" button
    const loadMoreObserver = new IntersectionObserver(([entry]) => {
      setIsLoadMoreVisible(entry.isIntersecting);
    }, { threshold: 0 }); // Trigger when any part of the button is visible

    // Observer for the footer (for the search bar's slide-up)
    const footerObserver = new IntersectionObserver(([entry]) => {
      setIsFooterVisible(entry.isIntersecting);
    }, { threshold: 0 }); // Trigger when any part of the footer is visible

    const currentLoadMoreRef = loadMoreRef.current;
    const currentFooterRef = footerRef.current;

    if (currentLoadMoreRef) loadMoreObserver.observe(currentLoadMoreRef);
    if (currentFooterRef) footerObserver.observe(currentFooterRef);

    return () => {
      if (currentLoadMoreRef) loadMoreObserver.unobserve(currentLoadMoreRef);
      if (currentFooterRef) footerObserver.unobserve(currentFooterRef);
    };
  }, [moviesToShow.length]); // Re-run when moviesToShow changes (i.e., load more is added/removed)

  // The search bar should move up if the "Load More" button is visible OR if the footer is visible.
  // This ensures it's always above the interactive elements at the bottom.
  const shouldMoveSearchUp = isLoadMoreVisible || isFooterVisible;

  const handleLoadMore = () => setVisibleCount((prev) => prev + 18);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) showError("Logout failed: " + error.message);
    else {
      showSuccess("You have been logged out.");
      queryClient.invalidateQueries();
    }
  };

  const handleSelectMovie = (id: string, isSelected: boolean) => {
    setSelectedMovieIds((prev) => {
      const newSelection = new Set(prev);
      if (isSelected) newSelection.add(id);
      else newSelection.delete(id);
      return newSelection;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedMovieIds(new Set(filteredAndSortedMovies.map((m) => m.id)));
    else setSelectedMovieIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedMovieIds.size === 0) {
      showError("No movies selected for deletion.");
      return;
    }
    setIsDeleting(true);
    const idsToDelete = Array.from(selectedMovieIds);
    let successfulDeletions = 0, failedDeletions = 0;
    const errors: string[] = [];
    for (let i = 0; i < idsToDelete.length; i += BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + BATCH_SIZE);
      const { error: deleteError } = await supabase.from("movies").delete().in("id", batch);
      if (deleteError) {
        errors.push(deleteError.message);
        failedDeletions += batch.length;
      } else successfulDeletions += batch.length;
    }
    if (successfulDeletions > 0) showSuccess(`Successfully deleted ${successfulDeletions} movies.`);
    if (failedDeletions > 0) showError(`Failed to delete ${failedDeletions} movies. Errors: ${errors.join("; ")}`);
    setSelectedMovieIds(new Set());
    queryClient.invalidateQueries({ queryKey: ["movies"] });
    setIsDeleting(false);
  };

  const shrunkenHeaderPaddingY = '0.5rem';
  const headerVariants = {
    full: { minHeight: "200px", paddingTop: "2rem", paddingBottom: "2rem", transition: { duration: 0.5, ease: "easeOut" } },
    shrunk: { minHeight: `${shrunkenHeaderHeight}px`, paddingTop: shrunkenHeaderPaddingY, paddingBottom: shrunkenHeaderPaddingY, transition: { duration: 0.5, ease: "easeOut" } },
  };
  const titleShrinkVariants = {
    full: { fontSize: isMobile ? "2.25rem" : "3rem", transition: { duration: 0.5, ease: "easeOut" } },
    shrunk: { fontSize: isMobile ? "1.25rem" : "2rem", transition: { duration: 0.5, ease: "easeOut" } },
  };
  const fadeOutShrinkVariants = {
    full: { opacity: 1, height: "auto", marginTop: "1.5rem", marginBottom: "1.5rem", transition: { duration: 0.3, ease: "easeOut" } },
    shrunk: { opacity: 0, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.3, ease: "easeOut" }, transitionEnd: { display: "none" } },
  };
  const mainContentAlignmentVariants = {
    full: { paddingTop: isMobile ? "200px" : "0px", transition: { duration: 0.5, ease: "easeOut" } },
    shrunk: { paddingTop: isMobile ? `${shrunkenHeaderHeight}px` : "0px", transition: { duration: 0.5, ease: "easeOut" } },
  };
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };
  const desktopMainContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 1.2 } },
  };
  const mobileMainContainerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
  };

  return (
    <>
      {!isPageReadyForInteraction && <div className="fixed inset-0 z-[100] bg-transparent" />}
      <motion.div
        className={cn(
          "min-h-screen w-full overflow-x-hidden",
          !isMobile && "bg-background text-foreground",
          isFilterOpen && "pointer-events-none"
        )}
        initial={isMobile ? { backgroundColor: "hsl(var(--background))" } : {}}
        animate={isMobile && headerShrunk ? { backgroundColor: "rgb(255,255,255)" } : {}}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {(!isMobile && (isAllMoviesSectionVisible || searchQuery)) && (
            <motion.div
              key="floating-search-bar"
              className={cn(
                "fixed bottom-6 w-full z-50 flex justify-center", // Added flex justify-center for centering
                isFilterOpen && "pointer-events-auto"
              )}
              initial={{ opacity: 0, y: 100 }}
              animate={{
                opacity: 1,
                y: shouldMoveSearchUp ? -80 : 0, // Adjusted slide up distance
              }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-xl rounded-full p-2 shadow-2xl border border-white/10 mx-auto w-fit"> {/* mx-auto w-fit ensures centering */}
                <Input
                  type="text"
                  placeholder="Search movies, actors, directors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-[300px] bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-gray-400 pl-4"
                />
                <Select value={sortAndFilter} onValueChange={setSortAndFilter} onOpenChange={setIsFilterOpen}>
                  <SelectTrigger className="w-[220px] bg-transparent border-none text-white focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Sort & Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/30 backdrop-blur-xl border-white/10 text-white">
                    <SelectGroup>
                      <SelectLabel className="text-gray-400">Sort by</SelectLabel>
                      <SelectItem value="title-asc" className="focus:bg-white/20 focus:text-white">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc" className="focus:bg-white/20 focus:text-white">Title (Z-A)</SelectItem>
                      <SelectItem value="year-desc" className="focus:bg-white/20 focus:text-white">Release Date (Newest)</SelectItem>
                      <SelectItem value="year-asc" className="focus:bg-white/20 focus:text-white">Release Date (Oldest)</SelectItem>
                    </SelectGroup>
                    {allGenres.length > 0 && (
                      <>
                        <Separator className="my-1 bg-white/20" />
                        <SelectGroup>
                          <SelectLabel className="text-gray-400">Filter by Genre</SelectLabel>
                          {allGenres.map((genre) => (
                            <SelectItem key={genre} value={genre} className="focus:bg-white/20 focus:text-white">{genre}</SelectItem>
                          ))}
                        </SelectGroup>
                      </>
                    )}
                    {allCountries.length > 0 && (
                      <>
                        <Separator className="my-1 bg-white/20" />
                        <SelectGroup>
                          <SelectLabel className="text-gray-400">Filter by Country</SelectLabel>
                          {allCountries.map((country) => (
                            <SelectItem key={country} value={country} className="focus:bg-white/20 focus:text-white">{country}</SelectItem>
                          ))}
                        </SelectGroup>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.header
          className={cn(
            "w-full text-center z-30 fixed top-0 left-0 right-0",
            "transition-colors duration-500 ease-out",
            headerShrunk
              ? isMobile
                ? "bg-background/80 backdrop-blur-md shadow-md"
                : isHeaderDark
                  ? "bg-background/80 backdrop-blur-md shadow-md"
                  : "bg-white/80 backdrop-blur-md shadow-md"
              : "bg-white backdrop-blur-md shadow-md"
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
                <motion.div
                  className="text-center"
                  initial="hidden"
                  animate={pageLoaded ? "visible" : "hidden"}
                  variants={headerContentContainerVariants}
                >
                  <motion.h1
                    className={cn(
                      "text-4xl md:text-5xl font-bold tracking-tight",
                      (isMobile && headerShrunk) || (!isMobile && headerShrunk && isHeaderDark)
                        ? "text-foreground"
                        : "text-headerTitle"
                    )}
                    animate={headerShrunk ? "shrunk" : "full"}
                    variants={titleShrinkVariants}
                  >
                    Georgi's Movie Collection
                  </motion.h1>
                  <motion.div
                    className="overflow-hidden"
                    animate={headerShrunk ? "shrunk" : "full"}
                    variants={fadeOutShrinkVariants}
                  >
                    <p className={cn("mt-2 text-lg", isMobile && headerShrunk ? "text-muted-foreground" : "text-headerDescription")}>
                      A minimalist collection of cinematic gems.
                    </p>
                    <div className="mt-6">
                      <MovieCounter
                        key={isMobile ? 'mobile' : 'desktop'}
                        count={filteredAndSortedMovies.length}
                        numberColor={isMobile && headerShrunk ? "white" : "#0F0F0F"}
                        labelColor={isMobile && headerShrunk ? "text-muted-foreground" : "text-headerDescription"}
                        animateOnLoad={pageLoaded}
                      />
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center items-center gap-4 md:hidden">
                      {session && (
                        <>
                          <Link to="/add-movie"><Button className="bg-black text-white hover:bg-gray-800">Add New Movie</Button></Link>
                          {isAdmin && <Link to="/import-movies"><Button variant="secondary">Import Movies (CSV)</Button></Link>}
                          <Link to="/import-ratings"><Button variant="outline" className="bg-transparent text-black border-black hover:bg-gray-200 hover:text-black">Import My Ratings</Button></Link>
                          <Button variant="outline" onClick={handleLogout} className="bg-transparent text-black border-black hover:bg-gray-200 hover:text-black">Logout</Button>
                        </>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
                <div className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 items-center gap-2">
                  {session && (
                    <>
                      <Link to="/add-movie">
                        <Button className={cn(headerShrunk && isHeaderDark ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-black text-white hover:bg-gray-800")}>Add New Movie</Button>
                      </Link>
                      {isAdmin && (
                        <Link to="/import-movies">
                          <Button variant="outline" className={cn(headerShrunk && isHeaderDark ? "border-primary text-primary hover:bg-accent hover:text-accent-foreground" : "bg-transparent border-black text-black hover:bg-gray-200 hover:text-black")}>Import Movies</Button>
                        </Link>
                      )}
                      <Link to="/import-ratings">
                        <Button variant="outline" className={cn(headerShrunk && isHeaderDark ? "border-primary text-primary hover:bg-accent hover:text-accent-foreground" : "bg-transparent border-black text-black hover:bg-gray-200 hover:text-black")}>Import Ratings</Button>
                      </Link>
                      <Button variant="outline" onClick={handleLogout} className={cn(headerShrunk && isHeaderDark ? "border-primary text-primary hover:bg-accent hover:text-accent-foreground" : "bg-transparent border-black text-black hover:bg-gray-200 hover:text-black")}>Logout</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.header>
        <motion.div initial="full" animate={headerShrunk ? "shrunk" : "full"} variants={mainContentAlignmentVariants}>
          <main>
            {!isMobile && heroSliderMovies.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }} // Start from hidden and slightly below
                animate={pageLoaded ? { opacity: 1, y: 0 } : {}} // Animate to visible and original position when pageLoaded is true
                transition={{ duration: 0.5, ease: "easeOut", delay: 1.4 }}
              >
                <HeroSlider movies={heroSliderMovies} adminUserId={ADMIN_USER_ID} />
              </motion.div>
            )}
            <motion.div className="hidden md:block pt-8" initial="hidden" animate={pageLoaded ? "visible" : "hidden"} variants={desktopMainContainerVariants}>
              {loadingAllMovies ? (
                <motion.div variants={contentVariants} className="container mx-auto px-4 mb-12">
                  <h2 className="text-3xl font-bold mb-4">New Movies</h2>
                  <div className="flex overflow-hidden gap-4">
                    {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="aspect-[2/3] w-1/6 flex-shrink-0 rounded-lg" />)}
                  </div>
                </motion.div>
              ) : (
                <>
                  <motion.div variants={contentVariants}><CustomCarousel title="New Movies" movies={categorizedMovies.newMovies} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>
                  {categorizedMovies.dramaMovies.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Drama" movies={categorizedMovies.dramaMovies} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies.thrillerMovies.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Thriller" movies={categorizedMovies.thrillerMovies} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies.scifiMovies.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Sci-Fi" movies={categorizedMovies.scifiMovies} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies.horrorMovies.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Horror" movies={categorizedMovies.horrorMovies} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                </>
              )}
              <motion.div ref={allMoviesSectionRef} variants={contentVariants} className="px-4 overflow-x-visible md:bg-gray-200 md:text-black">
                {!loadingAllMovies && (
                  <>
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 px-6 pt-8">
                      <DynamicMovieCountHeader count={filteredAndSortedMovies.length} searchQuery={searchQuery} sortAndFilter={sortAndFilter} allGenres={allGenres} allCountries={allCountries} />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center justify-between mb-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="select-all" checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0} onCheckedChange={(checked) => handleSelectAll(!!checked)} disabled={filteredAndSortedMovies.length === 0 || isDeleting} />
                          <label htmlFor="select-all" className="text-sm font-medium">Select All ({selectedMovieIds.size} selected)</label>
                        </div>
                        {selectedMovieIds.size > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="destructive" className="gap-2" disabled={isDeleting}><Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete Selected (${selectedMovieIds.size})`}</Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <span className="font-bold">{selectedMovieIds.size}</span> selected movies.</AlertDialogDescription></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete All"}</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </>
                )}
                {loadingAllMovies ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{Array.from({ length: 18 }).map((_, index) => <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />)}</div>
                ) : isErrorAllMovies ? (
                  <div className="text-center text-destructive">{errorAllMovies?.message || "Failed to load movies."}</div>
                ) : filteredAndSortedMovies.length === 0 ? (
                  <div className="text-center text-muted-foreground text-lg py-16">No movies found matching your search.</div>
                ) : (
                  <MovieGrid movies={moviesToShow} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} />
                )}
                {visibleCount < filteredAndSortedMovies.length && (
                  <motion.div ref={loadMoreRef} variants={contentVariants} className="text-center mt-12 pb-12">
                    <Button onClick={handleLoadMore} size="lg" className="bg-black text-white hover:bg-gray-800">Load More</Button>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
            <motion.div className="md:hidden px-4 pt-8" initial="hidden" animate={headerShrunk ? "visible" : "hidden"} variants={mobileMainContainerVariants}>
              <motion.div variants={contentVariants} className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <motion.h2 className="text-3xl font-bold" initial={{ color: "rgb(255,255,255)" }} animate={{ color: isMobile && headerShrunk ? "rgb(0,0,0)" : "rgb(255,255,255)" }} transition={{ duration: 0.6, ease: "easeOut" }}>{searchQuery ? "Found Movies" : "All Movies"}</motion.h2>
                <Input type="text" placeholder="Search movies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full sm:w-auto" />
              </motion.div>
              {searchQuery && <motion.div variants={contentVariants} className="mb-4"><MovieCounter count={filteredAndSortedMovies.length} numberColor={"#0F0F0F"} labelColor={"hidden"} animateOnLoad={pageLoaded} /></motion.div>}
              {isAdmin && !loadingAllMovies && (
                <motion.div variants={contentVariants} className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="select-all-mobile" checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0} onCheckedChange={(checked) => handleSelectAll(!!checked)} disabled={filteredAndSortedMovies.length === 0 || isDeleting} />
                    <label htmlFor="select-all-mobile" className="text-sm font-medium">Select All ({selectedMovieIds.size} selected)</label>
                  </div>
                  {selectedMovieIds.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="gap-2" disabled={isDeleting}><Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete (${selectedMovieIds.size})`}</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <span className="font-bold">{selectedMovieIds.size}</span> selected movies.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting}>{isDeleting ? "Deleting..." : "Delete All"}</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </motion.div>
              )}
              <div className="flex flex-col gap-4">
                {loadingAllMovies ? (
                  Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="w-full h-80 rounded-lg" />)
                ) : isErrorAllMovies ? (
                  <div className="text-center text-destructive">{errorAllMovies?.message || "Failed to load movies."}</div>
                ) : filteredAndSortedMovies.length === 0 ? (
                  <div className="text-center text-gray-500 text-lg py-16">No movies found matching your search.</div>
                ) : (
                  moviesToShow.map(movie => <motion.div key={movie.id} variants={contentVariants}><MobileMovieCard movie={movie} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} /></motion.div>)
                )}
              </div>
              {visibleCount < filteredAndSortedMovies.length && (
                <motion.div ref={loadMoreRef} variants={contentVariants} className="text-center mt-12 pb-12">
                  <Button onClick={handleLoadMore} size="lg" className="bg-black text-white hover:bg-gray-800">Load More</Button>
                </motion.div>
              )}
            </motion.div>
          </main>
        </motion.div>
        <motion.footer ref={footerRef} className="py-8" initial="hidden" animate={headerShrunk ? "visible" : "hidden"} variants={contentVariants}>
          <MadeWithDyad />
        </motion.footer>
      </motion.div>
    </>
  );
};

export default Index;