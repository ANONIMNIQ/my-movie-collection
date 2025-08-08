export interface Movie {
  id: string; // Changed to string for UUID from Supabase
  user_id: string | null; // Added user_id for RLS, can be null for initial data
  title: string;
  year: string;
  genres: string[];
  rating: string;
  runtime: string;
  communityRating: number;
  posterUrl: string;
  synopsis: string;
  movie_cast: string[]; // Renamed from 'cast' to 'movie_cast'
  director: string;
  created_at: string; // Timestamp from Supabase
}

// The local 'movies' array is no longer needed as data will be fetched from Supabase.
// export const movies: Movie[] = [...];