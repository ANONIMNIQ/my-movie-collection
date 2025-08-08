export interface Movie {
  id: number;
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
}