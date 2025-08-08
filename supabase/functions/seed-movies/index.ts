import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TMDb API configuration
const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

async function fetchTmdbMovieDetails(tmdbId: number) {
  if (!TMDB_API_KEY) {
    console.error("TMDb API key is missing in environment variables.");
    return null;
  }
  try {
    const url = `${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=credits`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`TMDb API request failed for ID ${tmdbId}: ${response.statusText}`);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching TMDb details for ID ${tmdbId}:`, error.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, movies_to_seed } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'User ID is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!movies_to_seed || !Array.isArray(movies_to_seed) || movies_to_seed.length === 0) {
      return new Response(JSON.stringify({ message: 'No movies provided for seeding.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for bulk insert/delete
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // 1. Delete all existing movies for the given user_id
    console.log(`Deleting existing movies for user: ${user_id}`);
    const { error: deleteError } = await supabaseClient
      .from('movies')
      .delete()
      .eq('user_id', user_id);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      throw new Error(`Failed to delete existing movies: ${deleteError.message}`);
    }
    console.log(`Successfully deleted existing movies for user: ${user_id}`);

    const moviesToInsert = [];
    const seenTmdbIds = new Set(); // To track seen tmdb_ids for deduplication

    for (const movieSummary of movies_to_seed) {
      if (seenTmdbIds.has(movieSummary.tmdb_id)) {
        console.warn(`Skipping duplicate TMDb ID in input list: ${movieSummary.tmdb_id}`);
        continue; // Skip this movie if its tmdb_id has already been processed
      }
      seenTmdbIds.add(movieSummary.tmdb_id);

      const tmdbDetails = await fetchTmdbMovieDetails(movieSummary.tmdb_id);

      if (tmdbDetails) {
        moviesToInsert.push({
          user_id: user_id,
          title: tmdbDetails.title,
          tmdb_id: tmdbDetails.id,
          poster_path: tmdbDetails.poster_path,
          backdrop_path: tmdbDetails.backdrop_path,
          release_date: tmdbDetails.release_date,
          overview: tmdbDetails.overview,
          genres: tmdbDetails.genres ? tmdbDetails.genres.map((g: { name: string }) => g.name) : [],
          runtime: tmdbDetails.runtime,
          tagline: tmdbDetails.tagline,
          vote_average: tmdbDetails.vote_average,
        });
      } else {
        console.warn(`Could not fetch TMDb details for movie ID: ${movieSummary.tmdb_id}. Skipping.`);
      }
    }

    if (moviesToInsert.length === 0) {
      return new Response(JSON.stringify({ message: 'No unique movies were successfully prepared for insertion.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Perform the insert operation for the filtered new movies
    console.log(`Inserting ${moviesToInsert.length} new movies for user: ${user_id}`);
    const { data, error } = await supabaseClient
      .from('movies')
      .insert(moviesToInsert)
      .select(); // .select() is needed to get the inserted rows

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to insert movies into Supabase: ${error.message}`);
    }

    return new Response(JSON.stringify({ message: `Successfully deleted old movies and added ${data.length} new movies to your list with full TMDb details!`, movies: data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Edge Function error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});