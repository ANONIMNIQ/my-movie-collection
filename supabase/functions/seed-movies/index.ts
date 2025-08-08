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
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'User ID is required.' }), {
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

    const TMDB_API_KEY = Deno.env.get('TMDB_API_KEY');
    if (!TMDB_API_KEY) {
      return new Response(JSON.stringify({ error: 'TMDb API key not set as a Supabase secret.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    const moviesToInsert = [];
    let page = 1;
    const maxPages = 5; // Fetch up to 5 pages to get around 100 movies (20 movies per page)

    while (moviesToInsert.length < 100 && page <= maxPages) {
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&page=${page}`
      );

      if (!tmdbResponse.ok) {
        console.error(`TMDb API error: ${tmdbResponse.status} ${tmdbResponse.statusText}`);
        throw new Error('Failed to fetch popular movies from TMDb.');
      }

      const tmdbData = await tmdbResponse.json();
      if (tmdbData.results && tmdbData.results.length > 0) {
        for (const movie of tmdbData.results) {
          if (moviesToInsert.length < 100) {
            moviesToInsert.push({
              user_id: user_id,
              title: movie.title,
              tmdb_id: movie.id,
            });
          } else {
            break;
          }
        }
      }
      page++;
    }

    if (moviesToInsert.length === 0) {
      return new Response(JSON.stringify({ message: 'No movies found to insert.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const { data, error } = await supabaseClient
      .from('movies')
      .insert(moviesToInsert)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      throw new Error(`Failed to insert movies into Supabase: ${error.message}`);
    }

    return new Response(JSON.stringify({ message: `Successfully added ${data.length} movies to your list!`, movies: data }), {
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