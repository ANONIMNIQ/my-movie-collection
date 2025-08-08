export interface Movie {
  id: string; // Changed to string for UUID from Supabase
  user_id: string | null; // Added user_id for RLS, can be null for initial data
  title: string;
  year: string;
  genres: string[];
  rating: string;
  runtime: string;
  community_rating: number; // Changed from communityRating to community_rating
  poster_url: string; // Changed from posterUrl to poster_url
  synopsis: string;
  movie_cast: string[];
  director: string;
  created_at: string; // Timestamp from Supabase
}