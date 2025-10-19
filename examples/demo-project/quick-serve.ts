/**
 * Alternative way to serve .stx files using direct imports
 * This works when you have bunfig.toml with the preload configured
 */

// With bunfig.toml preload, you can import .stx files directly!
// (Note: This requires the plugin to be properly installed)

import { Glob } from 'bun'

async function startServer() {
  const glob = new Glob('pages/*.stx')
  const files = await Array.fromAsync(glob.scan('.'))

  console.log('📄 Serving', files.length, 'pages')

  // Simple server
  Bun.serve({
    port: 3456,
    async fetch(req) {
      const url = new URL(req.url)
      const path = url.pathname === '/' ? '/home' : url.pathname

      // Try to find matching .stx file
      const filename = `pages${path}.stx`
      const file = Bun.file(filename)

      if (await file.exists()) {
        try {
          // Import the .stx file (plugin processes it)
          const module = await import(`./${filename}`)
          const content = module.default || module.content

          return new Response(content, {
            headers: { 'Content-Type': 'text/html' },
          })
        }
        catch (error) {
          return new Response(`Error loading ${filename}: ${error}`, {
            status: 500,
          })
        }
      }

      return new Response('404 Not Found', { status: 404 })
    },
  })

  console.log('🌐 Server at http://localhost:3456')
}

// Execute the server function
startServer().catch(console.error)
