import { MovieGrid } from "@/components/MovieGrid";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserMovies } from "@/hooks/useUserMovies";
import { useSession } from "@/integrations/supabase/auth";
import { AddMovieForm } from "@/components/AddMovieForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  const { session } = useSession();
  const { data: movies, isLoading, isError } = useUserMovies();

  // Determine if the AddMovieForm should be shown
  const showAddMovieForm = !!session;

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p className="text-lg text-destructive">
          Error loading your movie list.
        </p>
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
            Your personal list of favorite films.
          </p>
          {!session && (
            <p className="text-muted-foreground mt-4">
              <Link to="/login" className="text-primary hover:underline">
                Log in
              </Link> to manage your own collection.
            </p>
          )}
        </header>

        {showAddMovieForm && <AddMovieForm />}

        {isLoading && showAddMovieForm ? ( // Only show skeleton if logged in and loading
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-full aspect-[2/3] bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : movies && movies.length > 0 ? (
          <MovieGrid movies={movies} />
        ) : (
          <div className="text-center text-muted-foreground text-lg mt-12">
            {session ? (
              "Your movie list is empty. Search and add some movies above!"
            ) : (
              "No movies to display. Log in to see your collection or add new movies."
            )}
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