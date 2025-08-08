import { useQuery } from "@tanstack/react-query";
import { fetchFromTmdb } from "@/lib/tmdb";
import { TmdbMovieSummary } from "@/data/movies";

export const useTmdbSearch = (query: string) => {
  return useQuery<
    { results: TmdbMovieSummary[]; total_pages: number; page: number },
    Error
  >({
    queryKey: ["tmdb", "search", query],
    queryFn: async () => {
      const data = await fetchFromTmdb("/search/movie", { query });
      if (!data) throw new Error("Failed to search movies on TMDb.");
      return data;
    },
    enabled: !!query, // Only run query if query string is not empty
    staleTime: 1000 * 60 * 5, // Cache search results for 5 minutes
    retry: 1,
  });
};