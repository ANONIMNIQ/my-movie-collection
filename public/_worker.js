addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  // Check if the requested path exists as a static asset
  // This is a common pattern for Pages to serve static files first
  const response = await fetch(request)

  // If the response is a 404 (meaning the static asset was not found),
  // then serve the index.html file for SPA routing.
  if (response.status === 404) {
    const indexUrl = new URL('/', url.origin)
    return fetch(indexUrl)
  }

  // Otherwise, return the original response (e.g., a static asset or a successful fetch)
  return response
}