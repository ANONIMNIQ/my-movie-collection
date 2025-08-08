import { useQuery } from "@tanstack/react-query";
import { fetchFromTmdb } from "@/lib/tmdb";

export const useTmdbMovie = (title: string, year: string) => {
  return useQuery({
    queryKey: ["tmdb", title, year],
    queryFn: async () => {
      let searchResults = await fetchFromTmdb("/search/movie", {
        query: title,
        primary_release_year: year,
      });

      if (!searchResults || searchResults.results.length === 0) {
        // Fallback search without year if the first one fails
        searchResults = await fetchFromTmdb("/search/movie", { query: title });
      }

      if (!searchResults || searchResults.results.length === 0) {
        return null; // Movie not found
      }

      const movieSummary = searchResults.results[0];
      const details = await fetchFromTmdb(`/movie/${movieSummary.id}`, {
        append_to_response: "credits,release_dates,images,videos", // Added images and videos
      });
      return details;
    },
    enabled: !!title,
    staleTime: 1000 * 60 * 60 * 24, // Cache data for 24 hours
    retry: false,
  });
};