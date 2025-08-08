import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/contexts/SessionContext"; // Import useSession

const AddMovie = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(); // Get session and loading state

  // Redirect if not authenticated and session is loaded
  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/login');
    }
  }, [session, sessionLoading, navigate]);

  const [formData, setFormData] = useState({
    title: "",
    year: "",
    genres: "",
    rating: "",
    runtime: "",
    communityRating: "",
    posterUrl: "",
    synopsis: "",
    cast: "",
    director: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { title, year, genres, rating, runtime, communityRating, posterUrl, synopsis, cast, director } = formData;

    // Safely parse communityRating, setting to null if empty or results in NaN
    const parsedCommunityRating = communityRating ? parseFloat(communityRating) : null;
    const finalCommunityRating = isNaN(parsedCommunityRating as number) ? null : parsedCommunityRating;

    const movieData = {
      title,
      year,
      genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
      rating,
      runtime,
      community_rating: finalCommunityRating,
      poster_url: posterUrl || "/placeholder.svg",
      synopsis,
      movie_cast: cast.split(",").map((c) => c.trim()).filter(Boolean),
      director,
      user_id: session?.user?.id, // Add the user_id from the session
    };

    const { error } = await supabase.from("movies").insert([movieData]);

    if (error) {
      console.error("Error adding movie:", error);
      showError("Failed to add movie: " + error.message);
    } else {
      showSuccess("Movie added successfully!");
      navigate("/");
    }
    setLoading(false);
  };

  // Render null or loading state while session is loading or if not authenticated
  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication...</p>
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
            <CardTitle className="text-3xl font-bold text-center">Add New Movie</CardTitle>
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
                <Label htmlFor="communityRating">Community Rating (e.g., 7.5)</Label>
                <Input id="communityRating" type="number" step="0.1" value={formData.communityRating} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="posterUrl">Poster URL</Label>
                <Input id="posterUrl" value={formData.posterUrl} onChange={handleChange} placeholder="Optional: URL to movie poster image" />
              </div>
              <div>
                <Label htmlFor="synopsis">Synopsis</Label>
                <Textarea id="synopsis" value={formData.synopsis} onChange={handleChange} rows={5} />
              </div>
              <div>
                <Label htmlFor="cast">Cast (comma-separated)</Label>
                <Textarea id="cast" value={formData.cast} onChange={handleChange} rows={3} placeholder="e.g., Actor 1, Actor 2, Actor 3" />
              </div>
              <div>
                <Label htmlFor="director">Director</Label>
                <Input id="director" value={formData.director} onChange={handleChange} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Adding Movie..." : "Add Movie"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AddMovie;