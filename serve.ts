import home from './home.stx'

const server = Bun.serve({
  // Use routes instead of static for HTML imports
  routes: {
    // Bundle & route home.stx to "/"
    '/': home,
  },

  // Enable development mode for:
  // - Detailed error messages
  // - Rebuild on request
  development: true,

  // Handle API requests
  // eslint-disable-next-line unused-imports/no-unused-vars
  fetch(req) {
    // eslint-disable-next-line no-console
    console.log('on server')

    // Return 404 for unmatched routes
    return new Response('Not Found', { status: 404 })
  },
})

// eslint-disable-next-line no-console
console.log(`Listening on ${server.url}`)
