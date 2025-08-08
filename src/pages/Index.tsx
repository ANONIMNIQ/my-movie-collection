import { useState } from "react";
import { MovieGrid } from "@/components/MovieGrid";
import { movies } from "@/data/movies";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Button } from "@/components/ui/button";

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(18);
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
        </header>
        <MovieGrid movies={moviesToShow} />
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