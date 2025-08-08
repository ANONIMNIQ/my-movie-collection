import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      return new Response(JSON.stringify({ error: 'An array of movies (title, tmdb_id) is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for bulk insert
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // 1. Deduplicate movies_to_seed based on tmdb_id in case the input array has duplicates
    const uniqueMoviesToSeedMap = new Map<number, { title: string; tmdb_id: number }>();
    movies_to_seed.forEach((movie: { title: string; tmdb_id: number }) => {
      if (!uniqueMoviesToSeedMap.has(movie.tmdb_id)) {
        uniqueMoviesToSeedMap.set(movie.tmdb_id, movie);
      }
    });
    const deduplicatedMoviesToSeed = Array.from(uniqueMoviesToSeedMap.values());

    // 2. Fetch existing (user_id, tmdb_id) pairs for this user to prevent duplicates
    const { data: existingMovies, error: fetchError } = await supabaseClient
      .from('movies')
      .select('tmdb_id')
      .eq('user_id', user_id); // Filter by user_id

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      throw new Error(`Failed to fetch existing movies: ${fetchError.message}`);
    }

    // Create a set of existing tmdb_ids for the current user
    const existingTmdbIdsForUser = new Set(existingMovies.map(movie => movie.tmdb_id));

    // 3. Filter deduplicated_movies_to_seed to only include new movies for this specific user
    const moviesToInsert = deduplicatedMoviesToSeed.filter((movie: { title: string; tmdb_id: number }) =>
      !existingTmdbIdsForUser.has(movie.tmdb_id)
    ).map((movie: { title: string; tmdb_id: number }) => ({
      user_id: user_id,
      title: movie.title,
      tmdb_id: movie.tmdb_id,
    }));

    if (moviesToInsert.length === 0) {
      return new Response(JSON.stringify({ message: 'All provided movies already exist in your list. No new movies added.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 4. Perform the insert operation for the filtered new movies
    const { data, error } = await supabaseClient
      .from('movies')
      .insert(moviesToInsert)
      .select(); // .select() is needed to get the inserted rows

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to insert movies into Supabase: ${error.message}`);
    }

    return new Response(JSON.stringify({ message: `Successfully added ${data.length} new movies to your list!`, movies: data }), {
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