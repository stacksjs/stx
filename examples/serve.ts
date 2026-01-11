const _server = Bun.serve({
  port: 3000,
  development: true,
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname
    if (path === '/')
      path = '/homepage.stx'

    try {
      const file = Bun.file(`.${path}`)
      const exists = await file.exists()
      if (!exists) {
        console.log('404:', path)
        return new Response(`File not found: ${path}`, { status: 404 })
      }
      console.log('200:', path)

      // Transpile TypeScript files on the fly
      if (path.endsWith('.ts')) {
        const transpiler = new Bun.Transpiler({ loader: 'ts' })
        const code = await file.text()
        const js = transpiler.transformSync(code)
        return new Response(js, {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        })
      }

      // Serve .stx files as HTML
      if (path.endsWith('.stx')) {
        return new Response(file, {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        })
      }

      // Serve CSS with no-cache
      if (path.endsWith('.css')) {
        return new Response(file, {
          headers: {
            'Content-Type': 'text/css',
            'Cache-Control': 'no-store, no-cache, must-revalidate',
          },
        })
      }

      return new Response(file, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      })
    }
    catch (err: any) {
      console.error('Error:', err)
      return new Response(`Error: ${err.message}`, { status: 500 })
    }
  },
})

console.log('✓ Server running at http://localhost:3000')
console.log('✓ Voide: http://localhost:3000/voide-refactored.stx')
