import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// Define CORS headers for your API if needed, though for static assets, it's usually not required.
// Keeping it here for consistency with common Worker patterns.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

addEventListener('fetch', event => {
  // Handle OPTIONS requests for CORS preflight
  if (event.request.method === 'OPTIONS') {
    return event.respondWith(new Response(null, { headers: corsHeaders }));
  }

  event.respondWith(handleEvent(event));
});

async function handleEvent(event) {
  try {
    // Try to serve the static asset directly
    return await getAssetFromKV(event, {
      cacheControl: {
        browserTTL: 60 * 60 * 24 * 30, // Cache assets for 30 days
        edgeTTL: 60 * 60 * 24 * 2, // Cache at edge for 2 days
        bypassCache: false,
      },
    });
  } catch (e) {
    // If the asset is not found (e.g., /login), serve index.html
    const url = new URL(event.request.url);
    url.pathname = '/index.html'; // Always serve index.html for non-existent paths

    try {
      return await getAssetFromKV(new Request(url.toString(), event.request), {
        cacheControl: {
          browserTTL: 0, // Don't cache index.html in browser
          edgeTTL: 60 * 5, // Cache index.html at edge for 5 minutes
          bypassCache: false,
        },
      });
    } catch (e) {
      // If index.html itself cannot be served, return a generic 404
      return new Response('Not Found', { status: 404 });
    }
  }
}