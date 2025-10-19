import process from 'node:process'
import stxPlugin from '../../src/index'

async function main() {
  console.log('Building multiple .stx files...')

  // Build all .stx files
  const result = await Bun.build({
    entrypoints: ['../fixtures/basic.stx', '../fixtures/about.stx'],
    outdir: './dist',
    plugins: [stxPlugin()],
  })

  if (!result.success) {
    console.error('❌ Build failed')
    process.exit(1)
  }

  console.log('✅ Build completed successfully!')
  console.log(`📁 Built ${result.outputs.length} files`)

  // Create a map of routes to HTML content
  const routes = new Map<string, string>()

  for (const output of result.outputs) {
    if (output.path.endsWith('.html')) {
      const content = await output.text()
      const filename = output.path.split('/').pop()?.replace('.html', '') || 'index'
      routes.set(filename === 'basic' ? 'index' : filename, content)
    }
  }

  console.log('📄 Available routes:', Array.from(routes.keys()))

  // Start a server with multiple routes
  const server = Bun.serve({
    port: 3456,
    async fetch(req) {
      const url = new URL(req.url)
      const path = url.pathname.substring(1) || 'index'

      if (routes.has(path)) {
        return new Response(routes.get(path), {
          headers: { 'Content-Type': 'text/html' },
        })
      }

      // 404 page
      const availableRoutes = Array.from(routes.keys())
        .map(route => `<li><a href="/${route === 'index' ? '' : route}">${route}</a></li>`)
        .join('\n')

      return new Response(`
        <!DOCTYPE html>
        <html>
          <head><title>404 - Not Found</title></head>
          <body style="font-family: system-ui; max-width: 800px; margin: 2rem auto; padding: 2rem;">
            <h1>404 - Page Not Found</h1>
            <p>Available pages:</p>
            <ul>
              ${availableRoutes}
            </ul>
          </body>
        </html>
      `, {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      })
    },
  })

  console.log(`\n🚀 Server running at: ${server.url}`)
  console.log('📄 Available routes:')
  for (const route of routes.keys()) {
    console.log(`  - ${server.url}${route === 'index' ? '' : route}`)
  }
  console.log('\nPress Ctrl+C to stop')
}

main().catch(console.error)
