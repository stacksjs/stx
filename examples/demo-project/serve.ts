import { Glob } from 'bun'
import stxPlugin from 'bun-plugin-stx'

console.log('🚀 Starting development server...\n')

// Build all .stx files
const glob = new Glob('pages/**/*.stx')
const entrypoints = await Array.fromAsync(glob.scan('.'))

const result = await Bun.build({
  entrypoints,
  outdir: './dist',
  plugins: [stxPlugin()],
  naming: {
    entry: '[dir]/[name].[ext]',
  },
})

if (!result.success) {
  console.error('❌ Build failed!')
  console.error(result.logs)
  process.exit(1)
}

console.log(`✅ Built ${result.outputs.length} files\n`)

// Create route map
const routes = new Map<string, string>()

for (const output of result.outputs) {
  if (output.path.endsWith('.html')) {
    const content = await output.text()
    const filename = output.path.split('/').pop()?.replace('.html', '') || 'index'

    // Map routes: home.html -> /, about.html -> /about
    const route = filename === 'home' ? '/' : `/${filename}`
    routes.set(route, content)

    console.log(`📄 ${route.padEnd(20)} -> ${filename}.html`)
  }
}

// Start server
const server = Bun.serve({
  port: 3456,
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname

    // Normalize path
    if (path === '/')
      path = '/'
    if (path === '/index')
      path = '/'
    if (!path.startsWith('/'))
      path = `/${path}`

    // Serve the page
    if (routes.has(path)) {
      return new Response(routes.get(path), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      })
    }

    // 404 page
    const availableRoutes = Array.from(routes.keys())
      .map(route => `<li><a href="${route}">${route}</a></li>`)
      .join('\n')

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>404 - Not Found</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              max-width: 800px;
              margin: 4rem auto;
              padding: 2rem;
              text-align: center;
            }
            h1 { color: #e53e3e; }
            ul {
              list-style: none;
              padding: 0;
              margin: 2rem 0;
            }
            li { margin: 0.5rem 0; }
            a {
              color: #667eea;
              text-decoration: none;
              font-size: 1.1rem;
            }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The page you're looking for doesn't exist.</p>
          <h2>Available pages:</h2>
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

console.log(`\n🌐 Server running at: ${server.url}`)
console.log('\n📚 Available routes:')
routes.forEach((_, route) => {
  console.log(`   http://localhost:3456${route}`)
})
console.log('\n💡 Press Ctrl+C to stop\n')
