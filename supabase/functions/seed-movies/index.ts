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

    // 2. Deduplicate movies_to_seed based on tmdb_id in case the input array has duplicates
    const uniqueMoviesToSeedMap = new Map<number, { title: string; tmdb_id: number }>();
    movies_to_seed.forEach((movie: { title: string; tmdb_id: number }) => {
      if (!uniqueMoviesToSeedMap.has(movie.tmdb_id)) {
        uniqueMoviesToSeedMap.set(movie.tmdb_id, movie);
      }
    });
    const deduplicatedMoviesToSeed = Array.from(uniqueMoviesToSeedMap.values());

    // 3. Prepare movies for insertion (no need to check against existing now, as they've been deleted)
    const moviesToInsert = deduplicatedMoviesToSeed.map((movie: { title: string; tmdb_id: number }) => ({
      user_id: user_id,
      title: movie.title,
      tmdb_id: movie.tmdb_id,
    }));

    if (moviesToInsert.length === 0) {
      return new Response(JSON.stringify({ message: 'No movies provided to insert after deduplication.' }), {
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

    return new Response(JSON.stringify({ message: `Successfully deleted old movies and added ${data.length} new movies to your list!`, movies: data }), {
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