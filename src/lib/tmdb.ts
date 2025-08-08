const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

export const fetchFromTmdb = async (
  path: string,
  params: Record<string, string> = {},
) => {
  if (!API_KEY) {
    console.error(
      "TMDb API key is missing. Please set VITE_TMDB_API_KEY in your .env.local file.",
    );
    return null;
  }
  try {
    const urlParams = new URLSearchParams({ ...params, api_key: API_KEY });
    const response = await fetch(`${BASE_URL}${path}?${urlParams}`);
    if (!response.ok) {
      console.error(`TMDb API request failed: ${response.statusText}`);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching from TMDb:", error);
    return null;
  }
};