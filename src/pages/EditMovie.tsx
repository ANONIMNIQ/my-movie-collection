import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const EditMovie = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { session, loading: sessionLoading } = useSession();

  const [formData, setFormData] = useState<Omit<Movie, 'id' | 'user_id'>>({
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionLoading) {
      if (!session || session.user?.id !== ADMIN_USER_ID) {
        showError("You do not have permission to edit movies.");
        navigate('/');
        return;
      }
      fetchMovieData();
    }
  }, [session, sessionLoading, navigate, id]);

  const fetchMovieData = async () => {
    if (!id) {
      setError("Movie ID is missing.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching movie:", error);
      setError("Failed to load movie details: " + error.message);
    } else if (data) {
      setFormData({
        title: data.title,
        year: data.year,
        genres: data.genres.join(", "),
        rating: data.rating,
        runtime: data.runtime,
        community_rating: data.community_rating,
        poster_url: data.poster_url,
        synopsis: data.synopsis,
        movie_cast: data.movie_cast.join(", "),
        director: data.director,
      });
    } else {
      setError("Movie not found.");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
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

    const { title, year, genres, rating, runtime, community_rating, poster_url, synopsis, movie_cast, director } = formData;

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
    };

    const { error: updateError } = await supabase
      .from("movies")
      .update(movieData)
      .eq("id", id);

    if (updateError) {
      console.error("Error updating movie:", updateError);
      showError("Failed to update movie: " + updateError.message);
    } else {
      showSuccess("Movie updated successfully!");
      navigate("/");
    }
    setLoading(false);
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Skeleton className="w-64 h-96 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Error</h1>
          <p className="text-xl text-muted-foreground mb-4">{error}</p>
          <Link to="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
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
              <Button type="submit" className="w-full" disabled={loading}>
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