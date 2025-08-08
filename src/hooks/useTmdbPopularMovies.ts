import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchFromTmdb } from "@/lib/tmdb";
import { TmdbMovieSummary } from "@/data/movies";

export const useTmdbPopularMovies = () => {
  return useInfiniteQuery<
    { results: TmdbMovieSummary[]; total_pages: number; page: number },
    Error,
    { results: TmdbMovieSummary[]; total_pages: number; page: number },
    string[],
    number
  >({
    queryKey: ["tmdb", "popular"],
    queryFn: async ({ pageParam = 1 }) => {
      const data = await fetchFromTmdb("/movie/popular", { page: pageParam.toString() });
      if (!data) throw new Error("Failed to fetch popular movies from TMDb.");
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 60 * 60, // Cache data for 1 hour
    retry: 3,
  });
};