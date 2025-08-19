import React, { useState, useEffect, useMemo, useRef } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/contexts/SessionContext";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Loader2 } from "lucide-react"; // Import Loader2 icon
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
import FloatingAllMoviesHeader from "@/components/FloatingAllMoviesHeader";
import { Movie } from "@/data/movies";
import AlphabeticalFilter from "@/components/AlphabeticalFilter";
import { MovieReelIcon, CannesIcon, TiffIcon, BerlinaleIcon, VeniceIcon, SundanceIcon, OscarIcon } from "@/components/icons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db";
const BATCH_SIZE = 18;

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

// Hardcoded lists for initial migration - defined as constants at the top
const initialOscarWinnersTitles = new Set([
  "Parasite", "Everything Everywhere All at Once", "American Beauty", "No Country for Old Men", "Birdman or (The Unexpected Virtue of Ignorance)", "Spotlight", "Green Book", "La La Land", "Manchester by the Sea", "Whiplash", "Argo", "Slumdog Millionaire", "The Social Network", "The Imitation Game", "12 Years a Slave", "Roma", "Marriage Story", "Nomadland", "The Power of the Dog", "Belfast", "Women Talking", "American Fiction", "Poor Things", "Anatomy of a Fall", "Oppenheimer", "The Holdovers", "The Zone of Interest", "Forrest Gump", "Gladiator", "The Dark Knight", "The Departed", "Fargo", "Alien", "Adaptation.", "The Abyss", "2001: A Space Odyssey", "Arrival", "Atonement", "Back to the Future", "Barry Lyndon", "Boyhood", "Bridge of Spies", "Call Me by Your Name", "Chinatown", "Close Encounters of the Third Kind", "Coco", "The Deer Hunter", "Departures", "Dog Day Afternoon", "Dunkirk", "Ex Machina", "Finding Nemo", "Get Out", "Dead Poets Society", "Crouching Tiger, Hidden Dragon"
]);

const initialMindBendingTitles = new Set([
  "Primer", "Coherence", "Triangle", "The Prestige", "Memento", "Shutter Island", "Arrival", "Blade Runner 2049", "Ex Machina", "Annihilation", "Source Code", "Donnie Darko", "Eternal Sunshine of the Spotless Mind", "Being John Malkovich", "Synecdoche, New York", "Adaptation.", "Fight Club", "The Matrix", "Inception", "Paprika", "Perfect Blue", "A Scanner Darkly", "Waking Life", "Pi", "The Fountain", "Cloud Atlas", "Mr. Nobody", "Gattaca", "Moon", "District 9", "Children of Men", "Her", "Under the Skin", "Upstream Color", "Another Earth", "I Origins", "The Man from Earth", "Predestination", "Looper", "12 Monkeys", "Dark City", "The Thirteenth Floor", "eXistenZ", "Videodrome", "Jacob's Ladder", "Mulholland Drive", "Lost Highway", "Inland Empire", "Eraserhead", "Persona", "Stalker", "Solaris", "2001: A Space Odyssey", "Brazil", "Naked Lunch", "The Game", "Oldboy", "The Handmaiden", "A Tale of Two Sisters", "The Others", "The Sixth Sense", "Identity", "The Machinist", "Black Swan", "The Skin I Live In", "Enemy", "Nocturnal Animals", "Gone Girl", "Prisoners", "Zodiac", "Se7en", "The Silence of the Lambs", "Get Out", "Us", "Hereditary", "Midsommar", "The Lighthouse", "The Witch", "It Comes at Night", "A Ghost Story", "I'm Thinking of Ending Things", "The Killing of a Sacred Deer", "Dogtooth", "The Lobster", "The Favourite", "Sorry to Bother You", "Swiss Army Man", "The Art of Self-Defense", "Vivarium", "The Platform", "Cube", "Circle", "Exam", "Timecrimes", "Sound of My Voice", "The Invitation", "The Gift", "Goodnight Mommy", "The Lodge", "Honeymoon", "Creep", "The One I Love", "Safety Not Guaranteed", "Palm Springs", "About Time", "Ruby Sparks", "The Truman Show", "Stranger than Fiction", "Groundhog Day", "Edge of Tomorrow", "Everything Everywhere All at Once"
]);

const initialMysteryThrillerTitles = new Set([
  "Memento", "Vanilla Sky", "Psycho", "Identity", "The Prestige", "Babel", "Magnolia", "Mr. Brooks", "Black Book", "The Air I Breathe", "A Beautiful Mind", "The Orphanage", "21", "From Hell", "Donnie Darko", "Bully", "Silent Hill", "Children of Men", "The Life Before Her Eyes", "Unknown", "Pan's Labyrinth", "Oldboy", "Thesis", "Videodrome", "Pulp Fiction", "Reservoir Dogs", "11:14", "Running Scared", "The Others", "Hard Candy", "Audition", "Ichi the Killer", "Memories of Murder", "Shutter Island", "Inception", "Mr. Nobody", "The Life of David Gale", "The Green Mile", "Black Swan", "No Country for Old Men", "Mystic River", "Source Code", "The Skin I Live In", "Timecrimes", "Triangle", "The Thirteenth Floor", "The Girl with the Dragon Tattoo", "Cypher", "The Aura", "Blind", "Joint Security Area", "The Devil's Backbone", "Exam", "Stalker", "One Hour Photo", "Mulholland Drive", "Fight Club", "Cloud Atlas", "Sleep Tight", "The Hidden Face", "The Body", "The Island", "The Assassination of Richard Nixon", "Run Lola Run", "Trance", "The Hunt", "You're Next", "Sucker Punch", "U Turn", "Snowpiercer", "The 7th Floor", "The Best Offer", "February 29", "Spiral", "Sound of My Voice", "The Great Hypnotist"
]);

const initialCannesSelectionTitles = new Set([
  "Apocalypse Now", "Burning", "Dancer in the Dark", "The Cook, the Thief, His Wife & Her Lover", "Amélie", "Oldboy", "The Handmaiden", "Capernaum", "Parasite", "Anatomy of a Fall", "Pulp Fiction", "Taxi Driver", "The Piano", "Fahrenheit 451", "The Tree of Life", "Blue Is the Warmest Colour", "Titane", "Triangle of Sadness", "Shoplifters", "The Square", "Winter Sleep", "The Class", "4 Months, 3 Weeks and 2 Days", "The Wind That Shakes the Barley", "The Son's Room", "Rosetta", "The White Ribbon", "Uncle Boonmee Who Can Recall His Past Lives", "The Best Intentions", "Barton Fink", "Wild at Heart", "Sex, Lies, and Videotape", "Under the Sun of Satan", "Yol", "Missing", "Kagemusha", "All That Jazz", "The Tin Drum", "The Conversation", "Scarecrow", "The Hireling", "The Go-Between", "The French Connection", "MASH", "If....", "The Umbrellas of Cherbourg", "The Leopard", "Viridiana", "The Cranes Are Flying", "The Silent World", "Marty", "Rome, Open City", "The Third Man", "The Red Shoes", "The Wages of Fear", "The Seventh Seal", "Hiroshima Mon Amour", "La Dolce Vita", "L'Avventura", "Belle de Jour", "Blow-Up", "Z", "Easy Rider", "Midnight Cowboy", "The Conformist", "Death in Venice", "A Clockwork Orange", "Deliverance", "Last Tango in Paris", "Amarcord", "Nashville", "All the President's Men", "Network", "Coming Home", "The Deer Hunter", "Apocalypse Now", "All That Jazz", "Kagemusha", "Man of Iron", "Missing", "Yol", "The Ballad of Narayama", "Paris, Texas", "When Father Was Away on Business", "The Mission", "Under the Sun of Satan", "Pelle the Conqueror", "Sex, Lies, and Videotape", "Wild at Heart", "Barton Fink", "The Best Intentions", "Farewell My Concubine", "The Piano", "Pulp Fiction", "Underground", "Secrets & Lies", "The Eel", "Taste of Cherry", "Eternity and a Day", "Rosetta", "Dancer in the Dark", "The Son's Room", "The Piano Teacher", "The Man Without a Past", "Elephant", "Fahrenheit 9/11", "L'Enfant", "The Child", "The Wind That Shakes a Barley", "4 Months, 3 Weeks and 2 Days", "The Class", "The White Ribbon", "Uncle Boonmee Who Can Recall His Past Lives", "The Tree of Life", "Amour", "Blue Is the Warmest Colour", "Winter Sleep", "Dheepan", "I, Daniel Blake", "The Square", "Shoplifters", "Parasite", "Titane", "Triangle of Sadness", "Anatomy of a Fall"
]);

const initialTiffSelectionTitles = new Set([
  "Everything Everywhere All at Once", "Arrival", "Prisoners", "Blade Runner 2049", "Room", "Whiplash", "Silver Linings Playbook", "Jojo Rabbit", "Nomadland", "Three Billboards Outside Ebbing, Missouri", "Green Book", "Parasite", "The Master", "Incendies", "12 Years a Slave", "La La Land", "Manchester by the Sea", "Spotlight", "The Imitation Game", "Argo", "Slumdog Millionaire", "American Beauty", "Amelie", "City of God", "Eternal Sunshine of the Spotless Mind", "No Country for Old Men", "There Will Be Blood", "The Social Network", "Birdman or (The Unexpected Virtue of Ignorance)", "The Shape of Water", "Roma", "Marriage Story", "Nomadland", "The Power of the Dog", "Belfast", "The Fabelmans", "Women Talking", "American Fiction", "Past Lives", "Poor Things", "Anatomy of a Fall", "Oppenheimer", "Killers of the Flower Moon", "Maestro", "The Holdovers", "Spider-Man: Across the Spider-Verse", "Godzilla Minus One", "Perfect Days", "Fallen Leaves", "The Zone of Interest", "All of Us Strangers", "Anatomy of a Fall", "Poor Things", "Past Lives", "The Holdovers", "American Fiction", "Oppenheimer", "Killers of the Flower Moon", "Maestro", "Spider-Man: Across the Spider-Verse", "Godzilla Minus One", "Perfect Days", "Fallen Leaves", "The Zone of Interest", "All of Us Strangers", "Anatomy of a Fall", "Poor Things", "Past Lives", "The Holdovers", "American Fiction", "Oppenheimer", "Killers of the Flower Moon", "Maestro", "Spider-Man: Across the Spider-Verse", "Godzilla Minus One", "Perfect Days", "Fallen Leaves", "The Zone of Interest", "All of Us Strangers"
]);

const initialBerlinaleSelectionTitles = new Set([
  "Another Round", "Boyhood", "Capernaum", "Dog Day Afternoon", "First Reformed", "Frances Ha", "God's Own Country", "The Babadook", "The Banshees of Inisherin", "The Big Lebowski", "The French Dispatch"
]);

const initialVeniceSelectionTitles = new Set([
  "Atonement", "Children of Men", "Dunkirk", "Ex Machina", "The Conversation", "The Deer Hunter", "The Departed", "The Cook, the Thief, His Wife & Her Lover", "Dancer in the Dark", "Burning"
]);

const initialSundanceSelectionTitles = new Set([
  "Eighth Grade", "Call Me by Your Name", "Get Out", "Blindspotting", "Booksmart", "Bad Education", "Coherence", "The One I Love", "Safety Not Guaranteed", "Palm Springs", "Ruby Sparks"
]);

const Index = () => {
  const { session, loading: sessionLoading } = useSession();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAndFilter, setSortAndFilter] = useState("title-asc");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [isManagingCarousels, setIsManagingCarousels] = useState(false); // New state for carousel management loading
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const allMoviesSectionRef = useRef<HTMLDivElement>(null);
  const allMoviesTitleContainerRef = useRef<HTMLDivElement>(null);
  const prevSearchQueryRef = useRef<string>('');
  const prevSortAndFilterRef = useRef<string>(sortAndFilter);

  const [pageLoaded, setPageLoaded] = useState(false);
  const [headerShrunk, setHeaderShrunk] = useState(false);
  const [isPageReadyForInteraction, setIsPageReadyForInteraction] = useState(false);
  const [isHeaderDark, setIsHeaderDark] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [isTitleScrolledPastTop, setIsTitleScrolledPastTop] = useState(false);
  const [isAllMoviesSectionInView, setIsAllMoviesSectionInView] = useState(false);
  const [isFloatingAllMoviesHeaderVisible, setIsFloatingAllMoviesHeaderVisible] = useState(false);

  const heroSliderRef = useRef<HTMLDivElement>(null);
  const [isHeroSliderInView, setIsHeroSliderInView] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const [isLoadMoreTriggerVisible, setIsLoadMoreTriggerVisible] = useState(false);
  const [isFooterVisible, setIsFooter] = useState(false);

  const [showNewCarouselDialog, setShowNewCarouselDialog] = useState(false);
  const [newCarouselName, setNewCarouselName] = useState("");

  // State for search bar visibility and position
  const [shouldShowSearchBar, setShouldShowSearchBar] = useState(false);
  const [shouldMoveSearchUp, setShouldMoveSearchUp] = useState(false);

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

  const { data: adminCarouselEntries, isLoading: isLoadingAdminCarouselEntries } = useQuery<{ movie_id: string; collection_name: string; type: string }[], Error>({
    queryKey: ["adminCarouselEntries", ADMIN_USER_ID],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('carousel_collections')
        .select('movie_id, collection_name, type')
        .eq('user_id', ADMIN_USER_ID);
      if (error) throw error;
      return data;
    },
    enabled: !!ADMIN_USER_ID,
    staleTime: 1000 * 60 * 5,
  });

  const { data: adminGroupedCarousels, isLoading: isLoadingAdminGroupedCarousels } = useQuery<Record<string, Movie[]>, Error>({
    queryKey: ["adminGroupedCarousels", adminCarouselEntries, allMovies], // Depend on allMovies to get full movie data
    queryFn: async () => {
      if (!adminCarouselEntries || adminCarouselEntries.length === 0 || !allMovies) return {};

      const groupedMovies: Record<string, Movie[]> = {};
      adminCarouselEntries.forEach(entry => {
        const movie = allMovies.find(m => m.id === entry.movie_id);
        if (movie) {
          if (!groupedMovies[entry.collection_name]) {
            groupedMovies[entry.collection_name] = [];
          }
          groupedMovies[entry.collection_name].push(movie as Movie);
        }
      });
      // Sort movies within each carousel by title
      for (const key in groupedMovies) {
        groupedMovies[key].sort((a, b) => a.title.localeCompare(b.title));
      }
      return groupedMovies;
    },
    enabled: !!adminCarouselEntries && adminCarouselEntries.length > 0 && !!allMovies,
    staleTime: 1000 * 60 * 5,
  });

  const customCarouselNames = useMemo(() => {
    const entries = adminCarouselEntries || []; // Ensure entries is always an array
    const names = Array.from(new Set(entries.filter((entry: any) => entry.type === 'custom').map(entry => entry.collection_name)));
    return names.sort();
  }, [adminCarouselEntries]);

  const predefinedCarouselNames = useMemo(() => {
    const entries = adminCarouselEntries || []; // Ensure entries is always an array
    const names = Array.from(new Set(entries.filter((entry: any) => entry.type === 'predefined').map(entry => entry.collection_name)));
    return names.sort();
  }, [adminCarouselEntries]);

  const heroSliderMovies = useMemo(() => {
    if (!adminPerfectRatedMovies || adminPerfectRatedMovies.length === 0) return [];
    const shuffled = [...adminPerfectRatedMovies].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(shuffled.length, 6));
  }, [adminPerfectRatedMovies]);

  // One-time migration effect
  useEffect(() => {
    const migratePredefinedCarousels = async () => {
      if (!isAdmin || !allMovies || allMovies.length === 0) return;

      const { data: existingPredefinedEntries, error } = await supabase
        .from('carousel_collections')
        .select('collection_name')
        .eq('user_id', ADMIN_USER_ID)
        .eq('type', 'predefined')
        .limit(1); // Just check if any predefined entry exists

      if (error) {
        console.error("Error checking for existing predefined carousels:", error);
        return;
      }

      if (existingPredefinedEntries && existingPredefinedEntries.length > 0) {
        console.log("Predefined carousels already migrated.");
        return; // Already migrated, do nothing
      }

      console.log("Migrating predefined carousels...");
      const predefinedCarouselsToMigrate = [
        { name: "Oscar winners", titles: initialOscarWinnersTitles },
        { name: "The best thought provoking / mind-bending movies in my collection", titles: initialMindBendingTitles },
        { name: "The best mystery / psychological thrillers in my collection", titles: initialMysteryThrillerTitles },
        { name: "Cannes selection", titles: initialCannesSelectionTitles },
        { name: "TIFF selection", titles: initialTiffSelectionTitles },
        { name: "Berlinale selection", titles: initialBerlinaleSelectionTitles },
        { name: "Venice selection", titles: initialVeniceSelectionTitles },
        { name: "Sundance selection", titles: initialSundanceSelectionTitles },
      ];

      const inserts: { user_id: string; movie_id: string; collection_name: string; type: string }[] = [];
      predefinedCarouselsToMigrate.forEach(carousel => {
        carousel.titles.forEach(title => {
          const movie = allMovies.find(m => m.title === title);
          if (movie) {
            inserts.push({
              user_id: ADMIN_USER_ID,
              movie_id: movie.id,
              collection_name: carousel.name,
              type: 'predefined',
            });
          }
        });
      });

      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from('carousel_collections').insert(inserts);
        if (insertError) {
          console.error("Error migrating predefined carousels:", insertError);
          showError("Failed to migrate some predefined carousel data.");
        } else {
          console.log("Predefined carousels migrated successfully.");
          queryClient.invalidateQueries({ queryKey: ["adminCarouselEntries"] });
          queryClient.invalidateQueries({ queryKey: ["adminGroupedCarousels"] });
        }
      }
    };

    if (!sessionLoading && isAdmin && allMovies && allMovies.length > 0) {
      migratePredefinedCarousels();
    }
  }, [sessionLoading, isAdmin, allMovies, initialOscarWinnersTitles, initialMindBendingTitles, initialMysteryThrillerTitles, initialCannesSelectionTitles, initialTiffSelectionTitles, initialBerlinaleSelectionTitles, initialVeniceSelectionTitles, initialSundanceSelectionTitles, queryClient]);


  const categorizedMovies = useMemo(() => {
    if (!allMovies) {
      return {
        newMovies: [],
        "Drama": [],
        "Thriller": [],
        "Sci-Fi": [],
        "Horror": [],
      };
    }
  
    const newMovies: Movie[] = [];
    const currentYear = new Date().getFullYear().toString();
    allMovies.forEach((movie) => {
      if (movie.year === currentYear) newMovies.push(movie);
    });

    // Always create genre carousels for public view
    const dramaMovies = allMovies.filter(m => m.genres.includes('Drama')).sort((a, b) => a.title.localeCompare(b.title));
    const thrillerMovies = allMovies.filter(m => m.genres.includes('Thriller')).sort((a, b) => a.title.localeCompare(b.title));
    const sciFiMovies = allMovies.filter(m => m.genres.includes('Sci-Fi')).sort((a, b) => a.title.localeCompare(b.title));
    const horrorMovies = allMovies.filter(m => m.genres.includes('Horror')).sort((a, b) => a.title.localeCompare(b.title));

    const baseCarousels = {
      newMovies,
      "Drama": dramaMovies,
      "Thriller": thrillerMovies,
      "Sci-Fi": sciFiMovies,
      "Horror": horrorMovies,
    };

    // Add admin-specific carousels if data is available
    if (adminCarouselEntries && adminGroupedCarousels) {
      const predefinedCarousels: Record<string, Movie[]> = {};
      const customCarousels: Record<string, Movie[]> = {};
      
      const collectionTypes = new Map<string, string>();
      adminCarouselEntries.forEach(entry => {
        collectionTypes.set(entry.collection_name, entry.type);
      });
    
      for (const collectionName in adminGroupedCarousels) {
        if (Object.prototype.hasOwnProperty.call(adminGroupedCarousels, collectionName)) {
          const type = collectionTypes.get(collectionName);
          if (type === 'predefined') {
            predefinedCarousels[collectionName] = adminGroupedCarousels[collectionName];
          } else if (type === 'custom') {
            customCarousels[collectionName] = adminGroupedCarousels[collectionName];
          }
        }
      }
      
      return {
        ...baseCarousels,
        ...predefinedCarousels,
        ...customCarousels,
      };
    }

    return baseCarousels;
  }, [allMovies, adminGroupedCarousels, adminCarouselEntries]);

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

  const baseFilteredMovies = useMemo(() => {
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

  const filteredAndSortedMovies = useMemo(() => {
    if (!selectedLetter) {
      return baseFilteredMovies;
    }
    return baseFilteredMovies.filter(movie => movie.title.toUpperCase().startsWith(selectedLetter));
  }, [baseFilteredMovies, selectedLetter]);

  const moviesToShow = filteredAndSortedMovies.slice(0, visibleCount);

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

  // Effect to disable scrolling until the page is ready for interaction
  useEffect(() => {
    if (!isPageReadyForInteraction) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = '';
    }
    // Cleanup function to ensure scrolling is re-enabled if the component unmounts
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [isPageReadyForInteraction]);

  useEffect(() => {
    if (pageLoaded && !headerShrunk) {
      const shrinkTimer = setTimeout(() => setHeaderShrunk(true), 800);
      return () => clearTimeout(shrinkTimer);
    }
  }, [pageLoaded, headerShrunk]);

  const shrunkenHeaderHeight = isMobile ? 36 : 50; // Keep these values for overall height

  useEffect(() => {
    if (isMobile) {
      setIsHeaderDark(false);
      setIsFloatingAllMoviesHeaderVisible(false);
      setIsTitleScrolledPastTop(false);
      setIsAllMoviesSectionInView(false);
      setIsHeroSliderInView(false);
      setShouldShowSearchBar(false); // Ensure mobile search bar is off
      setShouldMoveSearchUp(false); // Ensure mobile search bar is off
      return;
    }

    const currentAllMoviesSectionRef = allMoviesSectionRef.current;
    const currentAllMoviesTitleContainerRef = allMoviesTitleContainerRef.current;
    const currentHeroSliderRef = heroSliderRef.current;
    const currentLoadMoreRef = loadMoreRef.current;
    const currentFooterRef = footerRef.current;

    if (!currentAllMoviesSectionRef || !currentAllMoviesTitleContainerRef) return;

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

    const sectionInViewObserver = new IntersectionObserver(
      ([entry]) => {
        setIsAllMoviesSectionInView(entry.isIntersecting);
      },
      { threshold: 0 }
    );

    const titleTopObserver = new IntersectionObserver(
      ([entry]) => {
        setIsTitleScrolledPastTop(!entry.isIntersecting);
      },
      {
        rootMargin: `-${shrunkenHeaderHeight}px 0px 0px 0px`,
        threshold: 0,
      }
    );

    let heroSliderObserver: IntersectionObserver | undefined;
    if (currentHeroSliderRef) {
      heroSliderObserver = new IntersectionObserver(
        ([entry]) => {
          setIsHeroSliderInView(entry.isIntersecting);
        },
        { threshold: 0.1 } // Appear later
      );
      heroSliderObserver.observe(currentHeroSliderRef);
    }

    // Observer for loadMoreRef (for infinite scroll and search bar positioning)
    const loadMoreObserver = new IntersectionObserver(
      ([entry]) => {
        setIsLoadMoreTriggerVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    // Observer for footerRef (to move search bar up)
    const footerObserver = new IntersectionObserver(
      ([entry]) => {
        setIsFooter(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    headerDarkObserver.observe(currentAllMoviesSectionRef);
    sectionInViewObserver.observe(currentAllMoviesSectionRef);
    titleTopObserver.observe(currentAllMoviesTitleContainerRef);
    if (currentLoadMoreRef) loadMoreObserver.observe(currentLoadMoreRef);
    if (currentFooterRef) footerObserver.observe(currentFooterRef);


    return () => {
      headerDarkObserver.unobserve(currentAllMoviesSectionRef);
      sectionInViewObserver.unobserve(currentAllMoviesSectionRef);
      titleTopObserver.unobserve(currentAllMoviesTitleContainerRef);
      if (heroSliderObserver && currentHeroSliderRef) {
        heroSliderObserver.unobserve(currentHeroSliderRef);
      }
      if (currentLoadMoreRef) loadMoreObserver.unobserve(currentLoadMoreRef);
      if (currentFooterRef) footerObserver.unobserve(currentFooterRef);
    };
  }, [isMobile, headerShrunk, shrunkenHeaderHeight]);

  useEffect(() => {
    // New logic for the search bar: show it only when the "All Movies" section is in view on desktop.
    setShouldShowSearchBar(isAllMoviesSectionInView && !isMobile);
    
    setShouldMoveSearchUp(isFooterVisible);
    setIsFloatingAllMoviesHeaderVisible(isTitleScrolledPastTop && isAllMoviesSectionInView && !isHeroSliderInView);
  }, [isAllMoviesSectionInView, isMobile, isFooterVisible, isTitleScrolledPastTop, isHeroSliderInView]);

  useEffect(() => {
    const prevSearchQuery = prevSearchQueryRef.current;
    const prevSortAndFilter = prevSortAndFilterRef.current;

    const searchInitiated = !prevSearchQuery && searchQuery;
    const filterChanged = sortAndFilter !== prevSortAndFilter;

    if ((searchInitiated || filterChanged) && allMoviesSectionRef.current) {
      const headerOffset = shrunkenHeaderHeight + 8;
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

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
    setSelectedLetter(null);
  }, [searchQuery, sortAndFilter]);

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

  const handleAddOrRemoveFromCarousel = async (collectionName: string, action: 'add' | 'remove') => {
    if (selectedMovieIds.size === 0) {
      showError("No movies selected.");
      return;
    }
    if (!isAdmin) {
      showError("You do not have permission to manage carousels.");
      return;
    }

    setIsManagingCarousels(true);

    const movieIdsArray = Array.from(selectedMovieIds);
    let successfulCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Determine if the collection is predefined or custom
    const isPredefined = predefinedCarouselNames.includes(collectionName);
    const collectionType = isPredefined ? 'predefined' : 'custom';

    if (action === 'add') {
      const inserts = movieIdsArray.map(movieId => ({
        user_id: ADMIN_USER_ID,
        movie_id: movieId,
        collection_name: collectionName,
        type: collectionType, // Use determined type
      }));
      const { error } = await supabase.from('carousel_collections').upsert(inserts, { onConflict: 'user_id, movie_id, collection_name' });
      if (error) {
        errors.push(error.message);
        failedCount = movieIdsArray.length;
      } else {
        successfulCount = movieIdsArray.length;
      }
    } else { // 'remove'
      const deletePromises = movieIdsArray.map(movieId =>
        supabase.from('carousel_collections')
          .delete()
          .eq('user_id', ADMIN_USER_ID)
          .eq('movie_id', movieId)
          .eq('collection_name', collectionName)
      );
      const results = await Promise.allSettled(deletePromises);
      results.forEach(result => {
        if (result.status === 'fulfilled' && !result.value.error) {
          successfulCount++;
        } else {
          failedCount++;
          errors.push(result.status === 'rejected' ? result.reason.message : (result.value as any).error.message);
        }
      });
    }

    if (successfulCount > 0) {
      showSuccess(`${successfulCount} movies ${action === 'add' ? 'added to' : 'removed from'} "${collectionName}".`);
    }
    if (failedCount > 0) {
      showError(`Failed to ${action} ${failedCount} movies. Errors: ${errors.join("; ")}`);
    }

    queryClient.invalidateQueries({ queryKey: ["adminCarouselEntries"] });
    queryClient.invalidateQueries({ queryKey: ["adminGroupedCarousels"] });
    setSelectedMovieIds(new Set()); // Clear selection after action
    setIsManagingCarousels(false);
  };

  const shrunkenHeaderPaddingY = '0.5rem';
  const headerVariants = {
    full: { minHeight: "200px", paddingTop: "2rem", paddingBottom: "2rem", transition: { duration: 0.5, ease: "easeOut" } },
    shrunk: { minHeight: `${shrunkenHeaderHeight}px`, paddingTop: shrunkenHeaderPaddingY, paddingBottom: shrunkenHeaderPaddingY, transition: { duration: 0.5, ease: "easeOut" } },
  };
  const titleShrinkVariants = {
    full: { fontSize: isMobile ? "1.5rem" : "3rem", transition: { duration: 0.5, ease: "easeOut" } },
    shrunk: { fontSize: isMobile ? "1.1rem" : "1.8rem", transition: { duration: 0.5, ease: "easeOut" } }, // Adjusted font size
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
          isFilterOpen && "pointer-events-none filter-is-open"
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
          {/* Floating Search Bar (bottom-center) */}
          {!isMobile && shouldShowSearchBar && (
            <motion.div
              key="floating-search-bar"
              className={cn(
                "fixed bottom-6 z-40 left-0 right-0 mx-auto",
                "flex items-center gap-2 bg-black/30 backdrop-blur-xl rounded-full p-2 shadow-lg w-fit",
                isFilterOpen && "pointer-events-auto"
              )}
              initial={{ opacity: 0, y: 100 }}
              animate={{
                opacity: 1,
                y: shouldMoveSearchUp ? -80 : 0,
              }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <Input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[300px] bg-transparent border-none focus:ring-0 !focus:outline-none !focus:border-transparent !focus-visible:ring-0 !focus-visible:outline-none !focus-visible:border-transparent text-white placeholder:text-gray-300 pl-4 custom-no-focus-outline"
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Floating All Movies Header (top-left) */}
        {!isMobile && (
          <FloatingAllMoviesHeader
            count={filteredAndSortedMovies.length}
            searchQuery={searchQuery}
            sortAndFilter={sortAndFilter}
            allGenres={allGenres}
            allCountries={allCountries}
            selectedLetter={selectedLetter}
            isVisible={isFloatingAllMoviesHeaderVisible}
            headerHeight={shrunkenHeaderHeight}
          />
        )}

        <motion.header
          className={cn(
            "w-full text-center z-50 fixed top-0 left-0 right-0",
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
                      "font-bold tracking-tight flex items-center justify-center",
                      (isMobile && headerShrunk) || (!isMobile && headerShrunk && isHeaderDark)
                        ? "text-foreground"
                        : "text-headerTitle",
                      "font-lato" // Apply Lato font here
                    )}
                    animate={headerShrunk ? "shrunk" : "full"}
                    variants={titleShrinkVariants}
                  >
                    <MovieReelIcon
                      className={cn(
                        "flex-shrink-0 mr-2 md:mr-4",
                        headerShrunk
                          ? "w-10 h-10 md:w-14 md:h-14" // Increased size when shrunk
                          : "w-12 h-12 md:w-20 md:h-20" // Original size when full
                      )}
                    />
                    <span className="truncate">Georgi's Movie Collection</span>
                  </motion.h1>
                  <motion.div
                    className="overflow-hidden"
                    animate={headerShrunk ? "shrunk" : "full"}
                    variants={fadeOutShrinkVariants}
                  >
                    <p className={cn("mt-2 text-sm md:text-lg", isMobile && headerShrunk ? "text-muted-foreground" : "text-headerDescription")}>
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
                          <Button variant="outline" className={cn(headerShrunk && isHeaderDark ? "border-primary text-primary hover:bg-accent hover:text-accent-foreground" : "bg-transparent border-black text-black hover:bg-gray-200 hover:text-black")}>Import My Ratings</Button>
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
                ref={heroSliderRef}
                initial={{ opacity: 0, y: 50 }}
                animate={pageLoaded ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0.8 }}
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
                  {categorizedMovies["Oscar winners"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Oscar winners" movies={categorizedMovies["Oscar winners"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["The best thought provoking / mind-bending movies in my collection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="The best thought provoking / mind-bending movies in my collection" movies={categorizedMovies["The best thought provoking / mind-bending movies in my collection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["The best mystery / psychological thrillers in my collection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="The best mystery / psychological thrillers in my collection" movies={categorizedMovies["The best mystery / psychological thrillers in my collection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Cannes selection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Cannes selection" movies={categorizedMovies["Cannes selection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["TIFF selection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="TIFF selection" movies={categorizedMovies["TIFF selection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Berlinale selection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Berlinale selection" movies={categorizedMovies["Berlinale selection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Venice selection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Venice selection" movies={categorizedMovies["Venice selection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Sundance selection"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Sundance selection" movies={categorizedMovies["Sundance selection"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Drama"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Drama" movies={categorizedMovies["Drama"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Thriller"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Thriller" movies={categorizedMovies["Thriller"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Sci-Fi"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Sci-Fi" movies={categorizedMovies["Sci-Fi"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {categorizedMovies["Horror"]?.length > 0 && <motion.div variants={contentVariants}><CustomCarousel title="Horror" movies={categorizedMovies["Horror"]} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} isMobile={isMobile} pageLoaded={pageLoaded} /></motion.div>}
                  {/* Display Custom Carousels */}
                  {isLoadingAdminGroupedCarousels ? (
                    <motion.div variants={contentVariants} className="container mx-auto px-4 mb-12">
                      <h2 className="text-3xl font-bold mb-4">Your Custom Carousels</h2>
                      <div className="flex overflow-hidden gap-4">
                        {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="aspect-[2/3] w-1/6 flex-shrink-0 rounded-lg" />)}
                      </div>
                    </motion.div>
                  ) : (
                    Object.entries(categorizedMovies).filter(([collectionName]) => customCarouselNames.includes(collectionName)).map(([collectionName, movies]) => (
                      <motion.div variants={contentVariants} key={collectionName}>
                        <CustomCarousel
                          title={collectionName}
                          movies={movies}
                          selectedMovieIds={selectedMovieIds}
                          onSelectMovie={handleSelectMovie}
                          isMobile={isMobile}
                          pageLoaded={pageLoaded}
                        />
                      </motion.div>
                    ))
                  )}
                </>
              )}
              <motion.div ref={allMoviesSectionRef} variants={contentVariants} className="px-4 overflow-x-visible md:bg-gray-200 md:text-black">
                {!loadingAllMovies && (
                  <>
                    <div ref={allMoviesTitleContainerRef} className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4 px-6 pt-8">
                      <DynamicMovieCountHeader
                        count={filteredAndSortedMovies.length}
                        searchQuery={searchQuery}
                        sortAndFilter={sortAndFilter}
                        allGenres={allGenres}
                        allCountries={allCountries}
                        selectedLetter={selectedLetter}
                      />
                      <AlphabeticalFilter movies={baseFilteredMovies} selectedLetter={selectedLetter} onSelectLetter={setSelectedLetter} />
                    </div>
                    {isAdmin && (
                      <div className="flex items-center justify-between mb-4 px-6">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="select-all" checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0} onCheckedChange={(checked) => handleSelectAll(!!checked)} disabled={filteredAndSortedMovies.length === 0 || isDeleting || isManagingCarousels} />
                          <label htmlFor="select-all" className="text-sm font-medium">Select All ({selectedMovieIds.size} selected)</label>
                        </div>
                        <div className="flex gap-2">
                          {selectedMovieIds.size > 0 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "gap-2",
                                    headerShrunk && isHeaderDark ? "border-primary text-primary hover:bg-accent hover:text-accent-foreground" : "bg-transparent border-black text-black hover:bg-gray-200 hover:text-black",
                                    // Force white text for this specific button when header is dark
                                    headerShrunk && isHeaderDark && "border-white text-white hover:bg-white/20 hover:text-white"
                                  )}
                                  disabled={isManagingCarousels || isDeleting}
                                >
                                  {isManagingCarousels ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Carousels"}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => setShowNewCarouselDialog(true)} disabled={selectedMovieIds.size === 0}>
                                  Add to new carousel...
                                </DropdownMenuItem>
                                {predefinedCarouselNames.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Predefined Carousels</DropdownMenuLabel>
                                    {predefinedCarouselNames.map(name => (
                                      <React.Fragment key={name}>
                                        <DropdownMenuItem key={`${name}-add`} onClick={() => handleAddOrRemoveFromCarousel(name, 'add')} disabled={selectedMovieIds.size === 0}>
                                          Add to "{name}"
                                        </DropdownMenuItem>
                                        <DropdownMenuItem key={`${name}-remove`} onClick={() => handleAddOrRemoveFromCarousel(name, 'remove')} disabled={selectedMovieIds.size === 0}>
                                          Remove from "{name}"
                                        </DropdownMenuItem>
                                      </React.Fragment>
                                    ))}
                                  </>
                                )}
                                {customCarouselNames.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel>Your Custom Carousels</DropdownMenuLabel>
                                    {customCarouselNames.map(name => (
                                      <React.Fragment key={name}>
                                        <DropdownMenuItem key={`${name}-add`} onClick={() => handleAddOrRemoveFromCarousel(name, 'add')} disabled={selectedMovieIds.size === 0}>
                                          Add to "{name}"
                                        </DropdownMenuItem>
                                        <DropdownMenuItem key={`${name}-remove`} onClick={() => handleAddOrRemoveFromCarousel(name, 'remove')} disabled={selectedMovieIds.size === 0}>
                                          Remove from "{name}"
                                        </DropdownMenuItem>
                                      </React.Fragment>
                                    ))}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {selectedMovieIds.size > 0 && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="destructive" className="gap-2" disabled={isDeleting || isManagingCarousels}><Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete Selected (${selectedMovieIds.size})`}</Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deconstruct</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <span className="font-bold">{selectedMovieIds.size}</span> selected movies.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel disabled={isDeleting || isManagingCarousels}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting || isManagingCarousels}>{isDeleting ? "Deleting..." : "Delete All"}</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {loadingAllMovies ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">{Array.from({ length: BATCH_SIZE }).map((_, index) => <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />)}</div>
                ) : isErrorAllMovies ? (
                  <div className="text-center text-destructive">{errorAllMovies?.message || "Failed to load movies."}</div>
                ) : filteredAndSortedMovies.length === 0 ? (
                  <div className="text-center text-muted-foreground text-lg py-16">No movies found matching your search.</div>
                ) : (
                  <MovieGrid movies={moviesToShow} selectedMovieIds={selectedMovieIds} onSelectMovie={handleSelectMovie} />
                )}
                {/* Desktop Load More Button */}
                <motion.div ref={loadMoreRef} variants={contentVariants} className="text-center mt-12 pb-12">
                  {visibleCount < filteredAndSortedMovies.length ? (
                    <Button
                      onClick={() => setVisibleCount(prev => prev + BATCH_SIZE)}
                      className="mt-4 bg-black text-white hover:bg-gray-800"
                      disabled={loadingAllMovies}
                    >
                      Load More
                    </Button>
                  ) : (
                    filteredAndSortedMovies.length > 0 && (
                      <p className="text-muted-foreground text-lg">No more movies.</p>
                    )
                  )}
                </motion.div>
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
                    <Checkbox id="select-all-mobile" checked={selectedMovieIds.size === filteredAndSortedMovies.length && filteredAndSortedMovies.length > 0} onCheckedChange={(checked) => handleSelectAll(!!checked)} disabled={filteredAndSortedMovies.length === 0 || isDeleting || isManagingCarousels} />
                    <label htmlFor="select-all-mobile" className="text-sm font-medium">Select All ({selectedMovieIds.size} selected)</label>
                  </div>
                  {selectedMovieIds.size > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2" disabled={isManagingCarousels || isDeleting}>
                          {isManagingCarousels ? <Loader2 className="h-4 w-4 animate-spin" /> : "Manage Carousels"}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => setShowNewCarouselDialog(true)} disabled={selectedMovieIds.size === 0}>
                          Add to new carousel...
                        </DropdownMenuItem>
                        {predefinedCarouselNames.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Predefined Carousels</DropdownMenuLabel>
                            {predefinedCarouselNames.map(name => (
                              <React.Fragment key={name}>
                                <DropdownMenuItem key={`${name}-add`} onClick={() => handleAddOrRemoveFromCarousel(name, 'add')} disabled={selectedMovieIds.size === 0}>
                                  Add to "{name}"
                                </DropdownMenuItem>
                                <DropdownMenuItem key={`${name}-remove`} onClick={() => handleAddOrRemoveFromCarousel(name, 'remove')} disabled={selectedMovieIds.size === 0}>
                                  Remove from "{name}"
                                </DropdownMenuItem>
                              </React.Fragment>
                            ))}
                          </>
                        )}
                        {customCarouselNames.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Your Custom Carousels</DropdownMenuLabel>
                            {customCarouselNames.map(name => (
                              <React.Fragment key={name}>
                                <DropdownMenuItem key={`${name}-add`} onClick={() => handleAddOrRemoveFromCarousel(name, 'add')} disabled={selectedMovieIds.size === 0}>
                                  Add to "{name}"
                                </DropdownMenuItem>
                                <DropdownMenuItem key={`${name}-remove`} onClick={() => handleAddOrRemoveFromCarousel(name, 'remove')} disabled={selectedMovieIds.size === 0}>
                                  Remove from "{name}"
                                </DropdownMenuItem>
                              </React.Fragment>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {selectedMovieIds.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="destructive" className="gap-2" disabled={isDeleting || isManagingCarousels}><Trash2 className="h-4 w-4" /> {isDeleting ? "Deleting..." : `Delete (${selectedMovieIds.size})`}</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirm Bulk Deletion</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete <span className="font-bold">{selectedMovieIds.size}</span> selected movies.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel disabled={isDeleting || isManagingCarousels}>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleBulkDelete} disabled={isDeleting || isManagingCarousels}>{isDeleting ? "Deleting..." : "Delete All"}</AlertDialogAction></AlertDialogFooter>
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
              {/* Infinite Scroll Trigger and Messages for Mobile */}
              <motion.div ref={loadMoreRef} variants={contentVariants} className="text-center mt-12 pb-12">
                {visibleCount < filteredAndSortedMovies.length ? (
                  isLoadMoreTriggerVisible && (
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Loading more movies...</span>
                    </div>
                  )
                ) : (
                  filteredAndSortedMovies.length > 0 && (
                    <p className="text-muted-foreground text-lg">No more movies.</p>
                    )
                  )}
                </motion.div>
              </motion.div>
            </main>
          </motion.div>
        <motion.footer ref={footerRef} className="py-8" initial="hidden" animate={headerShrunk ? "visible" : "hidden"} variants={contentVariants}>
          <MadeWithDyad />
        </motion.footer>
      </motion.div>

      {/* Dialog for New Carousel */}
      <Dialog open={showNewCarouselDialog} onOpenChange={setShowNewCarouselDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Carousel</DialogTitle>
            <DialogDescription>Enter a name for your new movie carousel.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-carousel-name" className="text-right">
                Name
              </Label>
              <Input
                id="new-carousel-name"
                placeholder="e.g., My Favorites, Sci-Fi Gems"
                value={newCarouselName}
                onChange={(e) => setNewCarouselName(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCarouselDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (newCarouselName.trim()) {
                  handleAddOrRemoveFromCarousel(newCarouselName.trim(), 'add');
                  setNewCarouselName('');
                  setShowNewCarouselDialog(false);
                } else {
                  showError("Carousel name cannot be empty.");
                }
              }}
              disabled={!newCarouselName.trim() || isManagingCarousels}
            >
              {isManagingCarousels ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Index;