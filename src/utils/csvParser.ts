import Papa from 'papaparse';
import { Movie } from '@/data/movies';

interface CsvMovieRow {
  Name: string;
  Year: string;
  Genres: string;
  ParentalRating: string;
  CommunityRating: string;
  Runtime: string;
  ImagePrimary: string;
  // Add other fields from your CSV if needed, even if not directly mapped to Movie interface
  // For example, 'Path' is in your CSV but not in Movie interface, so it's omitted here.
}

export const parseMoviesCsv = (csvString: string, adminUserId: string): Promise<Movie[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse<CsvMovieRow>(csvString, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const movies: Movie[] = results.data
          .filter(row => row.Name && row.Year) // Ensure basic data exists
          .map((row, index) => {
            const communityRating = parseFloat(row.CommunityRating);
            return {
              id: `csv-${Date.now()}-${index}`, // Generate a unique ID for new entries
              title: row.Name.trim(),
              year: row.Year.toString().trim(),
              genres: row.Genres ? row.Genres.split(';').map(g => g.trim()).filter(Boolean) : [],
              rating: row.ParentalRating ? row.ParentalRating.trim() : 'N/A',
              runtime: row.Runtime ? row.Runtime.toString().trim() : 'N/A',
              community_rating: isNaN(communityRating) ? null : communityRating,
              poster_url: row.ImagePrimary && row.ImagePrimary !== 'x' ? row.ImagePrimary.trim() : '/placeholder.svg', // Changed to poster_url
              synopsis: "", // Not available in CSV, default to empty
              movie_cast: [],
              director: "", // Not available in CSV, default to empty
              user_id: adminUserId, // Assign the admin user ID
            };
          });
        resolve(movies);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};