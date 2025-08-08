import { useState, useEffect } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies"; // Keep for interface definition for now
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(18); // Still used for pagination display

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true });

      if (error) {
        console.error("Error fetching movies:", error);
        setError("Failed to load movies.");
        setLoading(false);
      } else {
        setMovies(data as Movie[]);
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  const moviesToShow = movies.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prevCount) => prevCount + 18);
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
          <div className="mt-6">
            <Link to="/add-movie">
              <Button>Add New Movie</Button>
            </Link>
          </div>
        </header>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, index) => (
              <Skeleton key={index} className="aspect-[2/3] w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : (
          <MovieGrid movies={moviesToShow} />
        )}
        {visibleCount < movies.length && (
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