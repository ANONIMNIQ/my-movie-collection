import { useQuery } from "@tanstack/react-query";
import { fetchFromTmdb } from "@/lib/tmdb";
import { TmdbMovieDetail } from "@/data/movies";

export const useTmdbMovieDetails = (tmdbId: number) => {
  return useQuery<TmdbMovieDetail, Error>({
    queryKey: ["tmdb", "movie", tmdbId],
    queryFn: async () => {
      const details = await fetchFromTmdb(`/movie/${tmdbId}`, {
        append_to_response: "credits",
      });
      if (!details) throw new Error(`Failed to fetch details for movie ID: ${tmdbId}`);
      return details;
    },
    enabled: !!tmdbId,
    staleTime: 1000 * 60 * 60 * 24, // Cache data for 24 hours
    retry: false,
  });
};