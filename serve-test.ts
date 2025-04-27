import test from './test.stx'

const server = Bun.serve({
  // Use routes for HTML imports
  routes: {
    '/': test,
  },

  // Enable development mode for better testing
  development: true,

  // Handle API requests (optional)
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/api/hello') {
      return Response.json({ message: 'Hello from STX plugin!' })
    }

    // Return 404 for unmatched routes
    return new Response('Not Found', { status: 404 })
  },
})

// eslint-disable-next-line no-console
console.log(`STX Plugin Test Server running at ${server.url}`)
// eslint-disable-next-line no-console
console.log('Open your browser to view the rendered .stx template')
