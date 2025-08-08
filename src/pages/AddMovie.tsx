import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/integrations/supabase/auth';
import { QueryClient, useQueryClient } from '@tanstack/react-query';

const AddMovie = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { session } = useSession();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    year: '',
    genres: '',
    rating: '',
    runtime: '',
    communityRating: '',
    posterUrl: '',
    synopsis: '',
    movieCast: '', // Renamed from 'cast' to 'movieCast'
    director: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add a movie.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('movies').insert({
        user_id: session.user.id,
        title: formData.title,
        year: formData.year,
        genres: formData.genres.split(',').map(g => g.trim()).filter(g => g),
        rating: formData.rating,
        runtime: formData.runtime,
        community_rating: parseFloat(formData.communityRating),
        poster_url: formData.posterUrl || '/placeholder.svg', // Use placeholder if empty
        synopsis: formData.synopsis,
        movie_cast: formData.movieCast.split(',').map(c => c.trim()).filter(c => c), // Changed to movie_cast
        director: formData.director,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Success!",
        description: "Movie added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['movies'] }); // Invalidate movies query to refetch list
      navigate('/'); // Redirect to home page
    } catch (error: any) {
      toast({
        title: "Error adding movie",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 text-center">Add New Movie</h1>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
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
            <Input id="genres" value={formData.genres} onChange={handleChange} placeholder="e.g., Action, Sci-Fi" />
          </div>
          <div>
            <Label htmlFor="rating">Rating</Label>
            <Input id="rating" value={formData.rating} onChange={handleChange} placeholder="e.g., PG-13, R" />
          </div>
          <div>
            <Label htmlFor="runtime">Runtime (minutes)</Label>
            <Input id="runtime" type="number" value={formData.runtime} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="communityRating">Community Rating (0.0 - 10.0)</Label>
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
            <Label htmlFor="movieCast">Cast (comma-separated)</Label> {/* Changed htmlFor and id */}
            <Input id="movieCast" value={formData.movieCast} onChange={handleChange} placeholder="e.g., Actor 1, Actor 2" /> {/* Changed id and value */}
          </div>
          <div>
            <Label htmlFor="director">Director</Label>
            <Input id="director" value={formData.director} onChange={handleChange} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding Movie..." : "Add Movie"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddMovie;