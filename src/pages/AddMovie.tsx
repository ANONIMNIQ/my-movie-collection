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

const ADMIN_USER_ID = "48127854-07f2-40a5-9373-3c75206482db"; // Your specific User ID

const AddMovie = () => {
  const navigate = useNavigate();
  const { session, loading: sessionLoading } = useSession(); // Get session and loading state

  // Redirect if not authenticated or if authenticated user is not the admin
  useEffect(() => {
    if (!sessionLoading) {
      if (!session) {
        navigate('/login');
      } else if (session.user?.id !== ADMIN_USER_ID) {
        showError("You do not have permission to add movies.");
        navigate('/'); // Redirect non-admin users to home
      }
    }
  }, [session, sessionLoading, navigate]);

  const [formData, setFormData] = useState({
    title: "",
    year: "",
    genres: "",
    rating: "",
    runtime: "",
    community_rating: "",
    poster_url: "", // Changed from 'posterUrl' to 'poster_url'
    synopsis: "",
    movie_cast: "",
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

    // Double-check authorization on submit for robustness
    if (!session || session.user?.id !== ADMIN_USER_ID) {
      showError("You do not have permission to add movies.");
      setLoading(false);
      navigate('/');
      return;
    }

    const { title, year, genres, rating, runtime, community_rating, poster_url, synopsis, movie_cast, director } = formData; // Changed 'posterUrl' to 'poster_url'

    // Safely parse community_rating, setting to null if empty or results in NaN
    const parsedCommunityRating = community_rating ? parseFloat(community_rating) : null;
    const finalCommunityRating = isNaN(parsedCommunityRating as number) ? null : parsedCommunityRating;

    const movieData = {
      title,
      year,
      genres: genres.split(",").map((g) => g.trim()).filter(Boolean),
      rating,
      runtime,
      community_rating: finalCommunityRating,
      poster_url: poster_url || "/placeholder.svg", // Changed to poster_url
      synopsis,
      movie_cast: movie_cast.split(",").map((c) => c.trim()).filter(Boolean),
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

  // Render loading state while session is loading
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <p>Loading authentication...</p>
      </div>
    );
  }

  // If session is loaded but user is not admin, this component won't render due to useEffect redirect
  // This check is primarily for initial render before useEffect kicks in or if direct access is attempted
  if (!session || session.user?.id !== ADMIN_USER_ID) {
    return null; // Or a simple message, as useEffect will handle redirection
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
                <Label htmlFor="community_rating">Community Rating (e.g., 7.5)</Label>
                <Input id="community_rating" type="number" step="0.1" value={formData.community_rating} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="poster_url">Poster URL</Label> {/* Changed label htmlFor */}
                <Input id="poster_url" value={formData.poster_url} onChange={handleChange} placeholder="Optional: URL to movie poster image" /> {/* Changed id and value */}
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