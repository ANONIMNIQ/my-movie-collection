import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Movie } from "@/data/movies";
import { useSession } from "@/integrations/supabase/auth";

export const useUserMovies = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useQuery<Movie[], Error>({
    queryKey: ["user_movies", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return [];
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id, // Only run query if user is logged in
  });
};

export const useAddMovie = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation<Movie, Error, { title: string; tmdb_id: number }>({
    mutationFn: async ({ title, tmdb_id }) => {
      if (!session?.user?.id) throw new Error("User not authenticated.");
      const { data, error } = await supabase
        .from("movies")
        .insert({ user_id: session.user.id, title, tmdb_id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_movies"] });
    },
  });
};

export const useDeleteMovie = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: async (movieId) => {
      const { error } = await supabase
        .from("movies")
        .delete()
        .eq("id", movieId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_movies"] });
    },
  });
};