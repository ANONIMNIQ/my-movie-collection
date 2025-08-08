import { useParams, Link } from "react-router-dom";
import { movies } from "@/data/movies";
import { Badge } from "@/components/ui/badge";
import { Star, ArrowLeft } from "lucide-react";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const movie = movies.find((m) => m.id.toString() === id);

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Movie not found</h1>
          <Link to="/" className="text-primary hover:underline">
            Back to collection
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
        <div className="grid md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-1">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-auto rounded-lg shadow-lg aspect-[2/3] object-cover"
            />
          </div>
          <div className="md:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{movie.title}</h1>
            <p className="text-xl text-muted-foreground mt-2">{movie.year}</p>
            <div className="flex items-center flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1">
                <Star className="text-yellow-400" size={20} />
                <span className="font-bold text-lg">{movie.communityRating.toFixed(1)}</span>
              </div>
              <Badge variant="outline">{movie.rating}</Badge>
              <span className="text-muted-foreground">{movie.runtime} min</span>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary">{genre}</Badge>
              ))}
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Synopsis</h2>
              <p className="mt-2 text-lg text-muted-foreground">{movie.synopsis}</p>
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Director</h2>
              <p className="mt-2 text-lg text-muted-foreground">{movie.director}</p>
            </div>
            <div className="mt-8">
              <h2 className="text-2xl font-semibold">Cast</h2>
              <p className="mt-2 text-lg text-muted-foreground">{movie.cast.join(", ")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;