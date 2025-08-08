import { useState, useEffect } from "react"; // Import useEffect
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import { Link } from "react-router-dom";
import { useSession } from "@/integrations/supabase/auth";

const MOVIES_PER_LOAD = 18;

const Index = () => {
  const [offset, setOffset] = useState(0);
  const { session } = useSession();

  // TEMPORARY: Log user ID to console
  useEffect(() => {
    if (session?.user?.id) {
      console.log("Your Supabase User ID:", session.user.id);
    }
  }, [session]);

  const { data: movies, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useQuery({
    queryKey: ["movies", offset],
    queryFn: async ({ queryKey }) => {
      const [, currentOffset] = queryKey;
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true })
        .range(currentOffset, currentOffset + MOVIES_PER_LOAD - 1);

      if (error) throw error;
      return data as Movie[];
    },
    initialData: [],
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < MOVIES_PER_LOAD) return undefined;
      return allPages.length * MOVIES_PER_LOAD;
    },
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  const handleLoadMore = () => {
    setOffset((prevOffset) => prevOffset + MOVIES_PER_LOAD);
  };

  if (isLoading && offset === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading movies...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-destructive">
        <p>Error loading movies. Please try again later.</p>
      </div>
    );
  }

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
          {session && (
            <div className="mt-6">
              <Link to="/add-movie">
                <Button size="lg">Add New Movie</Button>
              </Link>
            </div>
          )}
        </header>
        {movies && movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <div className="text-center text-muted-foreground">No movies found.</div>
        )}
        {movies && movies.length === offset + MOVIES_PER_LOAD && (
          <div className="text-center mt-12">
            <Button onClick={handleLoadMore} size="lg" disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading More..." : "Load More"}
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