import { useState, useEffect } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies"; // Keep for interface definition

const Index = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [visibleCount, setVisibleCount] = useState(18);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("id", { ascending: true })
        .range(0, visibleCount - 1); // Fetch up to visibleCount

      if (error) {
        console.error("Error fetching movies:", error);
      } else {
        setMovies(data || []);
        setHasMore(data ? data.length === visibleCount : false);
      }
      setLoading(false);
    };

    fetchMovies();
  }, [visibleCount]);

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
        </header>
        {loading && movies.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-full aspect-[2/3] bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <MovieGrid movies={movies} />
        )}
        {hasMore && (
          <div className="text-center mt-12">
            <Button onClick={handleLoadMore} size="lg" disabled={loading}>
              {loading ? "Loading..." : "Load More"}
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