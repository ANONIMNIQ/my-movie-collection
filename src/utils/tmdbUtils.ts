export const extractTmdbMovieId = (url: string): string | null => {
  const regex = /(?:themoviedb\.org\/(?:movie|tv)\/|imdb\.com\/title\/tt)(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const getTmdbPosterUrl = (posterPath: string | null): string => {
  return posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : '/placeholder.svg';
};