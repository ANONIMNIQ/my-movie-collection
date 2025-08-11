import { useQuery } from "@tanstack/react-query";
import { fetchFromTmdb } from "@/lib/tmdb";

export const useTmdbMovie = (supabaseMovieId: string, title: string, year: string, tmdbIdFromDb?: string | null) => {
  return useQuery({
    queryKey: ["tmdb", supabaseMovieId], // Use Supabase movie ID as the primary cache key
    queryFn: async () => {
      let finalTmdbId = tmdbIdFromDb;

      // If tmdbId is not provided from DB, try to search for it
      if (!finalTmdbId) {
        let searchResults = await fetchFromTmdb("/search/movie", {
          query: title,
          primary_release_year: year,
        });

        if (!searchResults || searchResults.results.length === 0) {
          // Fallback search without year if the first one fails
          searchResults = await fetchFromTmdb("/search/movie", { query: title });
        }

        if (searchResults && searchResults.results.length > 0) {
          finalTmdbId = String(searchResults.results[0].id);
        }
      }

      if (!finalTmdbId) {
        return null; // No TMDb ID found or provided
      }

      const details = await fetchFromTmdb(`/movie/${finalTmdbId}`, {
        append_to_response: "credits,release_dates,images,videos",
      });
      return details;
    },
    enabled: !!supabaseMovieId && !!title, // Enable if Supabase movie ID and title are available
    staleTime: 1000 * 60 * 60 * 24, // Cache data for 24 hours
    retry: false,
  });
};