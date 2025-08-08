import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTmdbSearch } from "@/hooks/useTmdbSearch";
import { useAddMovie } from "@/hooks/useUserMovies";
import { TmdbMovieSummary } from "@/data/movies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IMAGE_BASE_URL } from "@/lib/tmdb";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

export const AddMovieForm = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: searchResults, isLoading: isSearching } = useTmdbSearch(searchQuery);
  const addMovieMutation = useAddMovie();

  const handleAddMovie = async (movie: TmdbMovieSummary) => {
    try {
      await addMovieMutation.mutateAsync({ title: movie.title, tmdb_id: movie.id });
      toast.success(`"${movie.title}" added to your list!`);
      setSearchQuery(""); // Clear search after adding
    } catch (error: any) {
      toast.error(`Failed to add movie: ${error.message || "Unknown error"}`);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Add a Movie to Your List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2 mb-4">
          <Input
            placeholder="Search for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow"
          />
        </div>
        {isSearching && searchQuery && (
          <p className="text-muted-foreground">Searching...</p>
        )}
        {searchResults?.results && searchResults.results.length > 0 && (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {searchResults.results.map((movie) => (
                <div key={movie.id} className="flex items-center space-x-4 p-2 border rounded-md">
                  <img
                    src={movie.poster_path ? `${IMAGE_BASE_URL}w92${movie.poster_path}` : "/placeholder.svg"}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-sm flex-shrink-0"
                  />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{movie.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {movie.release_date ? movie.release_date.substring(0, 4) : "N/A"}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAddMovie(movie)}
                    disabled={addMovieMutation.isPending}
                    size="sm"
                    variant="outline"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        {searchQuery && !isSearching && searchResults?.results.length === 0 && (
          <p className="text-muted-foreground">No movies found for "{searchQuery}".</p>
        )}
      </CardContent>
    </Card>
  );
};