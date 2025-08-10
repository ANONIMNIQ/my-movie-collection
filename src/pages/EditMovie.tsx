import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/contexts/SessionContext";
import { Movie } from "@/data/movies";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFromTmdb } from "@/lib/tmdb";
import { extractTmdbMovieId, getTmdbPosterUrl } from "@/utils/tmdbUtils";
import PersonalRating from "@/components/PersonalRating"; // Import PersonalRating
import { useQueryClient, useQuery } from "@tanstack/react-query";

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const EditMovie = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session, loading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const [formData, setFormData] = useState({
    title: "",
    year: "",
    genres: "",
    rating: "",
    runtime: "",
    community_rating: null,
    poster_url: "",
    synopsis: "",
    movie_cast: "",
    director: "",
    origin_country: "",
  });
  const [personalRating, setPersonalRating] = useState<number | null>(null); // State for personal rating
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tmdbUrl, setTmdbUrl] = useState("");
  const [fetchingTmdb, setFetchingTmdb] = useState(false);

  // Fetch main movie data using useQuery
  const { data: movieData, isLoading: isLoadingMovieData, isError: isErrorMovieData } = useQuery<Movie, Error>({
    queryKey: ["movie", id],
    queryFn: async () => {
      if (!id) throw new Error("Movie ID is missing.");
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching movie details:", error);
        throw new Error("Failed to load movie details.");
      }
      return data as Movie;
    },
    enabled: !!id && !sessionLoading, // Only run this query if id is available and session is loaded
    staleTime: 1000 * 60 * 5, // Cache data for 5 minutes
    retry: false, // Do not retry on error, handle it directly
  });

  // Fetch current user's personal rating (for interactive rating if logged in)
  const { data: currentUserPersonalRatingData, isLoading: isLoadingCurrentUserPersonalRating } = useQuery({
    queryKey: ['current_user_rating', id, userId],
    queryFn: async () => {
      if (!userId || !id) return null;
      const { data, error } = await supabase
        .from('user_ratings')
        .select('rating')
        .eq('user_id', userId)
        .eq('movie_id', id)
        .single();
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error("Error fetching current user's personal rating:", error);
        return null;
      }
      return data?.rating ?? null;
    },
    enabled: !!userId && !!id && !sessionLoading,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (!sessionLoading) {
      if (!session || session.user?.id !== ADMIN_USER_ID) {
        showError("You do not have permission to edit movies.");
        navigate('/');
        return;
      }
      // Set initial form data and personal rating once movieData and currentUserPersonalRatingData are loaded
      if (movieData && !isLoadingMovieData) {
        setFormData({
          title: movieData.title,
          year: movieData.year,
          genres: Array.isArray(movieData.genres) ? movieData.genres.join(", ") : "",
          rating: movieData.rating,
          runtime: movieData.runtime,
          community_rating: movieData.community_rating,
          poster_url: movieData.poster_url,
          synopsis: movieData.synopsis,
          movie_cast: Array.isArray(movieData.movie_cast) ? movieData.movie_cast.join(", ") : "",
          director: movieData.director,
          origin_country: Array.isArray(movieData.origin_country) ? movieData.origin_country.join(", ") : "",
        });
        setLoading(false);
      }
      if (!isLoadingCurrentUserPersonalRating) {
        setPersonalRating(currentUserPersonalRatingData ?? null);
      }
    }
  }, [session, sessionLoading, navigate, movieData, isLoadingMovieData, currentUserPersonalRatingData, isLoadingCurrentUserPersonalRating]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handlePersonalRatingChange = (rating: number | null) => {
    setPersonalRating(rating);
  };

  const handleTmdbUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTmdbUrl(e.target.value);
  };

  const handleFetchTmdbDetails = async () => {
    if (!tmdbUrl) {
      showError("Please enter a TMDb URL.");
      return;
    }

    setFetchingTmdb(true);
    const tmdbId = extractTmdbMovieId(tmdbUrl);

    if (!tmdbId) {
      showError("Invalid TMDb URL. Please ensure it contains a movie ID.");
      setFetchingTmdb(false);
      return;
    }

    try {
      const details = await fetchFromTmdb(`/movie/${tmdbId}`, {
        append_to_response: "credits,release_dates",
      });

      if (!details) {
        showError("Could not fetch movie details from TMDb. Please check the URL.");
        return;
      }

      const director = details.credits?.crew?.find((c: any) => c.job === "Director")?.name || "";
      const cast = details.credits?.cast?.slice(0, 10).map((c: any) => c.name).join(", ") || "";
      const usRelease = details.release_dates?.results.find((r: any) => r.iso_3166_1 === "US");
      const rating = usRelease?.release_dates[0]?.certification || "";
      const country = details.production_countries?.map((c: any) => c.name).join(", ") || "";

      setFormData({
        title: details.title || "",
        year: details.release_date ? details.release_date.substring(0, 4) : "",
        genres: details.genres?.map((g: any) => g.name).join(", ") || "",
        rating: rating,
        runtime: details.runtime ? String(details.runtime) : "",
        community_rating: details.vote_average ? parseFloat(details.vote_average.toFixed(1)) : null,
        poster_url: getTmdbPosterUrl(details.poster_path),
        synopsis: details.overview || "",
        movie_cast: cast,
        director: director,
        origin_country: country,
      });
      showSuccess("Movie details fetched from TMDb!");
    } catch (error: any) {
      console.error("Error fetching TMDb details:", error);
      showError("Failed to fetch TMDb details: " + error.message);
    } finally {
      setFetchingTmdb(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!session || session.user?.id !== ADMIN_USER_ID) {
      showError("You do not have permission to edit movies.");
      setLoading(false);
      navigate('/');
      return;
    }

    const { title, year, genres, rating, runtime, community_rating, poster_url, synopsis, movie_cast, director, origin_country } = formData;

    const parsedCommunityRating = community_rating ? parseFloat(String(community_rating)) : null;
    const finalCommunityRating = isNaN(parsedCommunityRating as number) ? null : parsedCommunityRating;

    const movieData = {
      title,
      year,
      genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
      rating,
      runtime,
      community_rating: finalCommunityRating,
      poster_url: poster_url || "/placeholder.svg",
      synopsis,
      movie_cast: movie_cast.split(",").map((c) => c.trim()).filter(Boolean),
      director,
      origin_country: origin_country.split(",").map((c) => c.trim()).filter(Boolean),
    };

    const { error: updateError } = await supabase
      .from("movies")
      .update(movieData)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating movie:", updateError);
      showError("Failed to update movie: " + updateError.message);
    } else {
      // Invalidate caches to ensure fresh data is displayed on other pages
      queryClient.invalidateQueries({ queryKey: ["movies"] });
      queryClient.invalidateQueries({ queryKey: ["tmdb", title, year] }); // Invalidate specific TMDb query

      // Update personal rating if changed
      if (userId && id) {
        if (personalRating !== null) {
          const { error: ratingError } = await supabase
            .from('user_ratings')
            .upsert(
              { user_id: userId, movie_id: id, rating: personalRating },
              { onConflict: 'user_id, movie_id' }
            );
          if (ratingError) {
            console.error("Error updating personal rating:", ratingError);
            showError("Movie updated, but failed to save personal rating: " + ratingError.message);
          } else {
            showSuccess("Movie and personal rating updated successfully!");
            queryClient.invalidateQueries({ queryKey: ['user_rating', id, userId] });
          }
        } else {
          // If personal rating is set to null, delete it
          const { error: deleteRatingError } = await supabase
            .from('user_ratings')
            .delete()
            .eq('user_id', userId)
            .eq('movie_id', id);
          if (deleteRatingError && deleteRatingError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
            console.error("Error deleting personal rating:", deleteRatingError);
            showError("Movie updated, but failed to remove personal rating: " + deleteRatingError.message);
          } else {
            showSuccess("Movie updated successfully!");
            queryClient.invalidateQueries({ queryKey: ['user_rating', id, userId] });
          }
        }
      } else {
        showSuccess("Movie updated successfully!");
      }
      navigate("/");
    }
    setLoading(false);
  };

  // Combine all loading states for the skeleton
  const overallLoading = sessionLoading || isLoadingMovieData || isLoadingCurrentUserPersonalRating || loading;

  if (overallLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Skeleton className="w-64 h-96 rounded-lg" />
      </div>
    );
  }

  if (isErrorMovieData || !movieData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl text-muted-foreground mb-4">{error || "Failed to load movie details."}</p>
          <Link to="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
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
            <CardTitle className="text-3xl font-bold text-center">Edit Movie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-4">
              <Label htmlFor="tmdb-url">Fetch from TMDb URL</Label>
              <div className="flex gap-2">
                <Input
                  id="tmdb-url"
                  type="url"
                  placeholder="e.g., https://www.themoviedb.org/movie/12345"
                  value={tmdbUrl}
                  onChange={handleTmdbUrlChange}
                />
                <Button onClick={handleFetchTmdbDetails} disabled={fetchingTmdb}>
                  {fetchingTmdb ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-spin" /> Fetching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" /> Fetch Details
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Paste a TMDb movie URL to automatically fill or update the fields below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={formData.title} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="year">Year</Label>
                <Input id="year" value={formData.year} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="genres">Genres (comma-separated)</Label>
                <Input id="genres" value={formData.genres} onChange={handleChange} placeholder="e.g., Action, Sci-Fi, Drama" />
              </div>
              <div>
                <Label htmlFor="rating">Rating</Label>
                <Input id="rating" value={formData.rating} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="runtime">Runtime (minutes)</Label>
                <Input id="runtime" value={formData.runtime} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="community_rating">Community Rating (e.g., 7.5)</Label>
                <Input id="community_rating" type="number" step="0.1" value={formData.community_rating ?? ''} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="poster_url">Poster URL</Label>
                <Input id="poster_url" value={formData.poster_url} onChange={handleChange} placeholder="Optional: URL to movie poster image" />
              </div>
              <div>
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea id="synopsis" value={formData.synopsis} onChange={handleChange} rows={5} />
              </div>
              <div>
                <Label htmlFor="movie_cast">Cast (comma-separated)</Label>
                <Textarea id="movie_cast" value={formData.movie_cast} onChange={handleChange} rows={3} placeholder="e.g., Actor 1, Actor 2, Actor 3" />
              </div>
              <div>
                <Label htmlFor="director">Director</Label>
                <Input id="director" value={formData.director} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="origin_country">Origin Country (comma-separated)</Label>
                <Input id="origin_country" value={formData.origin_country} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="personal-rating">Your Personal Rating</Label>
                <PersonalRating movieId={id || ""} initialRating={personalRating} onRatingChange={handlePersonalRatingChange} />
                <p className="text-sm text-muted-foreground mt-1">
                  Set your personal rating for this movie (1-10).
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading || fetchingTmdb}>
                {loading ? "Updating Movie..." : "Update Movie"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditMovie;