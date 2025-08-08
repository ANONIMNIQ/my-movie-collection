export interface TmdbMovieSummary {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string; // YYYY-MM-DD format
  vote_average: number;
  overview: string;
  genre_ids: number[];
}

export interface TmdbMovieDetail {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  overview: string;
  genres: { id: number; name: string }[];
  runtime: number | null; // in minutes
  tagline: string | null;
  credits: {
    cast: { name: string; character: string }[];
    crew: { name: string; job: string }[];
  };
  // Add other fields as needed from TMDb API
}