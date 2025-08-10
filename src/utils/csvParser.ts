import Papa from 'papaparse';
import { Movie } from '@/data/movies';
import { fetchFromTmdb } from '@/lib/tmdb';

interface CsvMovieRow {
  Name: string;
  Year: string;
  Genres: string;
  ParentalRating: string;
  CommunityRating: string;
  Runtime: string;
  ImagePrimary: string;
}

export const parseMoviesCsv = (csvString: string, adminUserId: string): Promise<Movie[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvMovieRow>(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const movies: Movie[] = await Promise.all(
            results.data
              .filter(row => row.Name && row.Year)
              .map(async (row) => {
                const communityRating = parseFloat(row.CommunityRating);
                
                let origin_country: string[] = [];
                try {
                  const searchResults = await fetchFromTmdb("/search/movie", { query: row.Name, primary_release_year: row.Year });
                  if (searchResults && searchResults.results.length > 0) {
                      const movieDetails = await fetchFromTmdb(`/movie/${searchResults.results[0].id}`);
                      if (movieDetails && movieDetails.production_countries && movieDetails.production_countries.length > 0) {
                          origin_country = movieDetails.production_countries.map((c: any) => c.name);
                      }
                  }
                } catch (e) {
                    console.warn(`Could not fetch country for movie: ${row.Name}`, e);
                }

                return {
                  title: row.Name.trim(),
                  year: row.Year.toString().trim(),
                  genres: row.Genres ? row.Genres.split(';').map(g => g.trim()).filter(Boolean) : [],
                  rating: row.ParentalRating ? row.ParentalRating.trim() : 'N/A',
                  runtime: row.Runtime ? row.Runtime.toString().trim() : 'N/A',
                  community_rating: isNaN(communityRating) ? null : communityRating,
                  poster_url: row.ImagePrimary && row.ImagePrimary !== 'x' ? row.ImagePrimary.trim() : '/placeholder.svg',
                  synopsis: "",
                  movie_cast: [],
                  director: "",
                  user_id: adminUserId,
                  origin_country: origin_country,
                } as Movie;
              })
          );
          resolve(movies);
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};