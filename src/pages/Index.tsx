import { useEffect, useMemo } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";
import { useTmdbPopularMovies } from "@/hooks/useTmdbPopularMovies";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useTmdbPopularMovies();

  const movies = useMemo(() => {
    return data?.pages.flatMap((page) => page.results) || [];
  }, [data]);

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg text-destructive">
          Error loading movies. Please check your TMDb API key.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Popular Movies
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Discover the latest and greatest films.
          </p>
        </header>
        {isLoading && movies.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="w-full aspect-[2/3] bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : (
          <MovieGrid movies={movies} />
        )}
        {hasNextPage && (
          <div className="text-center mt-12">
            <Button onClick={() => fetchNextPage()} size="lg" disabled={isFetchingNextPage}>
              {isFetchingNextPage ? "Loading..." : "Load More"}
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