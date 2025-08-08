import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Movie } from "@/data/movies";

interface MovieCardProps {
  movie: Movie;
}

export const MovieCard = ({ movie }: MovieCardProps) => {
  return (
    <Link to={`/movie/${movie.id}`} className="block group">
      <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col bg-card">
        <CardHeader className="p-0 relative">
          <div className="aspect-[2/3] w-full overflow-hidden">
            <img
              src={movie.posterUrl}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </CardHeader>
        <div className="p-4 flex flex-col flex-grow">
          <CardTitle className="text-base font-bold line-clamp-2 flex-grow">{movie.title}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{movie.year}</p>
        </div>
      </Card>
    </Link>
  );
};