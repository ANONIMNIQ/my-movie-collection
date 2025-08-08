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

    const moviesToInsert = movies_to_seed.map((movie: { title: string; tmdb_id: number }) => ({
      user_id: user_id,
      title: movie.title,
      tmdb_id: movie.tmdb_id,
    }));

    // Use onConflict to ignore duplicates based on tmdb_id
    const { data, error } = await supabaseClient
      .from('movies')
      .insert(moviesToInsert)
      .onConflict('tmdb_id') // Specify the column with the unique constraint
      .ignoreDuplicates() // Tell Supabase to ignore if a conflict occurs
      .select();

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