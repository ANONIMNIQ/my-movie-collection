import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useSession } from '@/contexts/SessionContext';
import Papa from 'papaparse';
import { useQueryClient } from '@tanstack/react-query';

interface CsvRatingRow {
  Title: string;
  Year: string;
  'Your Rating': string;
}

const ImportRatings = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/login');
    }
  }, [session, sessionLoading, navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      showError("Please select a CSV file to import.");
      return;
    }

    if (!session) {
      showError("You must be logged in to import ratings.");
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const parsedData: CsvRatingRow[] = await new Promise((resolve, reject) => {
        Papa.parse<CsvRatingRow>(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error),
        });
      });

      const userId = session.user.id;
      let importedCount = 0;
      let skippedCount = 0;

      for (const row of parsedData) {
        const movieTitle = row.Title?.trim();
        const movieYear = row.Year?.trim();
        const userRating = parseFloat(row['Your Rating']);

        if (!movieTitle || !movieYear || isNaN(userRating) || userRating < 0 || userRating > 10) {
          console.warn(`Skipping invalid row: ${JSON.stringify(row)}`);
          skippedCount++;
          continue;
        }

        // Find the movie in your database
        const { data: movieData, error: movieError } = await supabase
          .from('movies')
          .select('id')
          .eq('title', movieTitle)
          .eq('year', movieYear)
          .single();

        if (movieError && movieError.code !== 'PGRST116') { // PGRST116 means no rows found
          console.error(`Error finding movie '${movieTitle}' (${movieYear}):`, movieError.message);
          skippedCount++;
          continue;
        }

        if (movieData) {
          const movieId = movieData.id;
          // Upsert the personal rating
          const { error: upsertError } = await supabase
            .from('user_ratings')
            .upsert(
              { user_id: userId, movie_id: movieId, rating: userRating },
              { onConflict: 'user_id, movie_id' }
            );

          if (upsertError) {
            console.error(`Error upserting rating for '${movieTitle}':`, upsertError.message);
            skippedCount++;
          } else {
            importedCount++;
          }
        } else {
          console.warn(`Movie '${movieTitle}' (${movieYear}) not found in your collection. Skipping rating import.`);
          skippedCount++;
        }
      }

      if (importedCount > 0) {
        showSuccess(`Successfully imported ${importedCount} ratings!`);
        queryClient.invalidateQueries({ queryKey: ['user_rating'] }); // Invalidate all user ratings
        queryClient.invalidateQueries({ queryKey: ['movies'] }); // Invalidate movies to update cards
      }
      if (skippedCount > 0) {
        showError(`Skipped ${skippedCount} ratings due to missing movies or invalid data.`);
      }
      if (importedCount === 0 && skippedCount === 0) {
        showSuccess("No ratings found in the CSV to import.");
      }
      navigate('/');
    } catch (error: any) {
      console.error("Error importing ratings:", error);
      showError("Failed to import ratings: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication...</p>
      </div>
    );
  }

  if (!session) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12">
      <div className="container mx-auto px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-8"
        >
          <ArrowLeft size={16} />
          Back to Collection
        </Link>
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Import Your Ratings from CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <p className="text-muted-foreground text-center">
                Upload a CSV file (e.g., from IMDb export) to import your personal movie ratings.
                Ratings will be matched by movie title and year.
              </p>
              <div>
                <Label htmlFor="csv-file">Upload CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
                {file && <p className="text-sm text-muted-foreground mt-2">Selected file: {file.name}</p>}
              </div>
              <Button
                onClick={handleImport}
                className="w-full"
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Import Ratings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportRatings;