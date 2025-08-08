addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Check if the requested path exists as a static asset
  const response = await fetch(request)

  // If the response is a 404 (meaning the static asset was not found),
  // then serve the index.html file for SPA routing.
  if (response.status === 404) {
    const indexUrl = new URL('/', url.origin)
    const indexResponse = await fetch(indexUrl)
    // Add a debug header to confirm _worker.js is handling the fallback
    const newHeaders = new Headers(indexResponse.headers);
    newHeaders.set('X-Worker-Fallback', 'true'); // This is our debug header
    return new Response(indexResponse.body, {
      status: indexResponse.status,
      statusText: indexResponse.statusText,
      headers: newHeaders,
    });
  }

  // Otherwise, return the original response (e.g., a static asset or a successful fetch)
  return response
}