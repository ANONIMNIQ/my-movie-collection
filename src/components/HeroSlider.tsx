import React, { useCallback, useEffect, useState, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTmdbMovie } from '@/hooks/useTmdbMovie';
import YouTubePlayerBackground from './YouTubePlayerBackground';
import { Movie } from '@/data/movies';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface HeroSliderProps {
  movies: Movie[];
  adminUserId: string; // To fetch admin's rating for display
}

const HeroSlider: React.FC<HeroSliderProps> = ({ movies, adminUserId }) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [showTrailer, setShowTrailer] = useState<boolean[]>([]); // Array to manage trailer state for each slide
  const trailerTimers = useRef<Map<number, number>>(new Map()); // Map to store timers for each slide

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi, setSelectedIndex]);

  const onInit = useCallback((emblaApi: any) => {
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
  }, [setScrollSnaps, onSelect]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on('select', onSelect);
    emblaApi.on('init', onInit);
    emblaApi.on('reInit', onInit);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('init', onInit);
      emblaApi.off('reInit', onInit);
    };
  }, [emblaApi, onSelect, onInit]);

  // Manage trailer playback for the active slide
  useEffect(() => {
    // Clear all existing timers
    trailerTimers.current.forEach(timer => clearTimeout(timer));
    trailerTimers.current.clear();

    // Set up timer for the currently selected slide
    if (movies[selectedIndex]) {
      const newShowTrailer = Array(movies.length).fill(false);
      newShowTrailer[selectedIndex] = false; // Start with backdrop
      setShowTrailer(newShowTrailer);

      const timer = window.setTimeout(() => {
        setShowTrailer(prev => {
          const updated = [...prev];
          updated[selectedIndex] = true; // Show trailer after delay
          return updated;
        });
      }, 10000); // 10 seconds delay

      trailerTimers.current.set(selectedIndex, timer);
    }

    return () => {
      trailerTimers.current.forEach(timer => clearTimeout(timer));
      trailerTimers.current.clear();
    };
  }, [selectedIndex, movies]); // Re-run when selectedIndex or movies change

  if (movies.length === 0) {
    return null; // Or a skeleton for the whole slider
  }

  return (
    <div className="relative w-full h-[calc(100vh-100px)] overflow-hidden bg-black"> {/* Adjusted height */}
      <div className="embla h-full" ref={emblaRef}>
        <div className="embla__container flex h-full">
          {movies.map((movie, index) => (
            <HeroSlide
              key={movie.id}
              movie={movie}
              isActive={index === selectedIndex}
              showTrailer={showTrailer[index]}
              adminUserId={adminUserId}
              onNavigate={() => navigate(`/movie/${movie.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
        onClick={() => emblaApi?.scrollPrev()}
      >
        <ChevronLeft className="h-8 w-8" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
        onClick={() => emblaApi?.scrollNext()}
      >
        <ChevronRight className="h-8 w-8" />
      </Button>

      {/* Dots Pagination */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-2 w-2 rounded-full bg-white transition-all",
              index === selectedIndex ? "w-6 bg-primary" : "opacity-50"
            )}
            onClick={() => scrollTo(index)}
          />
        ))}
      </div>
    </div>
  );
};

interface HeroSlideProps {
  movie: Movie;
  isActive: boolean;
  showTrailer: boolean;
  adminUserId: string;
  onNavigate: () => void;
}

const HeroSlide: React.FC<HeroSlideProps> = ({ movie, isActive, showTrailer, adminUserId, onNavigate }) => {
  const { data: tmdbMovie, isLoading: isLoadingTmdb } = useTmdbMovie(movie.id, movie.title, movie.year, movie.tmdb_id);

  const backdropUrl = tmdbMovie?.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : null;
  const movieLogo = tmdbMovie?.images?.logos?.find((logo: any) => logo.iso_639_1 === 'en') || tmdbMovie?.images?.logos?.[0];
  const logoUrl = movieLogo ? `https://image.tmdb.org/t/p/w500${movieLogo.file_path}` : null;
  const trailer = tmdbMovie?.videos?.results?.find(
    (video: any) => video.type === "Trailer" && video.site === "YouTube"
  );
  const trailerKey = trailer ? trailer.key : null;

  const synopsis = movie.synopsis || tmdbMovie?.overview || "No synopsis available.";

  return (
    <div className="embla__slide flex-[0_0_100%] relative h-full">
      {isLoadingTmdb ? (
        <Skeleton className="w-full h-full absolute inset-0" />
      ) : (
        // Removed the fragment here
        isActive && showTrailer && trailerKey ? (
          <YouTubePlayerBackground videoId={trailerKey} delay={0} />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: backdropUrl ? `url(${backdropUrl})` : 'none', backgroundColor: 'black' }}
          >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
          </div>
        )
      )}

      <div className="absolute inset-0 flex items-center p-8 z-10">
        <div className="max-w-3xl text-white">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={`${movie.title} logo`}
              className="max-h-32 md:max-h-48 mb-4 object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          {!logoUrl && (
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4">
              {movie.title}
            </h1>
          )}
          <p className="text-lg md:text-xl text-gray-200 mb-4 line-clamp-3">
            {synopsis}
          </p>
          <div className="flex items-center gap-4 text-gray-300 text-lg mb-6">
            <span>{movie.rating}</span>
            <span>{movie.runtime ? `${movie.runtime} min` : "N/A min"}</span>
            <span>{movie.year}</span>
          </div>
          <Button size="lg" onClick={onNavigate}>
            <Info className="mr-2 h-5 w-5" /> View Details
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;