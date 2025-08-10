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
import { parseMoviesCsv } from '@/utils/csvParser';
import { Movie } from '@/data/movies'; // Import Movie interface

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const ImportMovies = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated or if authenticated user is not the admin
  React.useEffect(() => {
    if (!sessionLoading) {
      if (!session) {
        navigate('/login');
      } else if (session.user?.id !== ADMIN_USER_ID) {
        showError("You do not have permission to import movies.");
        navigate('/');
      }
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

    if (!session || session.user?.id !== ADMIN_USER_ID) {
      showError("You do not have permission to import movies.");
      navigate('/');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const parsedMovies = await parseMoviesCsv(text, ADMIN_USER_ID);

      // Fetch existing movies to check for uniqueness and get their IDs for updates
      const { data: existingMovies, error: fetchError } = await supabase
        .from('movies')
        .select('id, title, year');

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      const existingMovieMap = new Map<string, string>();
      existingMovies.forEach((movie: { id: string; title: string; year: string }) => {
        const key = `${movie.title.toLowerCase().trim()}-${movie.year.trim()}`;
        existingMovieMap.set(key, movie.id);
      });

      const moviesToInsert: Omit<Movie, 'id'>[] = [];
      const moviesToUpdate: Movie[] = [];

      parsedMovies.forEach(movie => {
        const key = `${movie.title.toLowerCase().trim()}-${movie.year.trim()}`;
        const existingId = existingMovieMap.get(key);
        if (existingId) {
          moviesToUpdate.push({ ...movie, id: existingId });
        } else {
          moviesToInsert.push(movie);
        }
      });

      let insertedCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      // Insert new movies
      if (moviesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('movies')
          .insert(moviesToInsert);

        if (insertError) {
          console.error("Error inserting new movies:", insertError);
          errorCount += moviesToInsert.length;
        } else {
          insertedCount = moviesToInsert.length;
        }
      }

      // Update existing movies
      if (moviesToUpdate.length > 0) {
        const updatePromises = moviesToUpdate.map(movie => {
          const { id, ...updateData } = movie;
          return supabase.from('movies').update(updateData).eq('id', id);
        });

        const results = await Promise.allSettled(updatePromises);
        results.forEach(result => {
          if (result.status === 'fulfilled' && !result.value.error) {
            updatedCount++;
          } else {
            errorCount++;
            console.error("Error updating movie:", result.status === 'rejected' ? result.reason : result.value.error);
          }
        });
      }

      let summaryMessage = "Import complete!";
      if (insertedCount > 0) summaryMessage += ` ${insertedCount} movies added.`;
      if (updatedCount > 0) summaryMessage += ` ${updatedCount} movies updated.`;
      if (errorCount > 0) {
        showError(`Import finished with ${errorCount} errors. Check console for details.`);
      }
      if (insertedCount > 0 || updatedCount > 0) {
        showSuccess(summaryMessage);
      } else if (errorCount === 0) {
        showSuccess("No new movies to add or existing movies to update.");
      }

      navigate('/');
    } catch (error: any) {
      console.error("Error importing movies:", error);
      showError("Failed to import movies: " + error.message);
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

  if (!session || session.user?.id !== ADMIN_USER_ID) {
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
            <CardTitle className="text-3xl font-bold text-center">Import Movies from CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                    <Upload className="mr-2 h-4 w-4" /> Import Movies
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

export default ImportMovies;