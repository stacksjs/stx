/**
 * Fullstack Dev Server with .stx files
 *
 * Since Bun.serve() routes expect HTML files, we build .stx files
 * first and then import the generated HTML.
 *
 * Usage:
 *   bun server.ts
 */

import { Glob, serve } from 'bun'
import stxPlugin from 'bun-plugin-stx'

console.log('🔨 Building .stx files...')

// Build all .stx files to HTML
const glob = new Glob('pages/**/*.stx')
const stxFiles = await Array.fromAsync(glob.scan('.'))

const buildResult = await Bun.build({
  entrypoints: stxFiles,
  outdir: './dist',
  plugins: [stxPlugin()],
})

if (!buildResult.success) {
  console.error('❌ Build failed!')
  process.exit(1)
}

console.log(`✅ Built ${buildResult.outputs.length} files\n`)

// Import the built HTML files
const routes: Record<string, any> = {}

for (const output of buildResult.outputs) {
  if (output.path.endsWith('.html')) {
    const filename = output.path.split('/').pop()?.replace('.html', '')
    const route = filename === 'home' ? '/' : `/${filename}`

    // Read the HTML content
    const html = await output.text()

    // Create a Response for this route
    routes[route] = new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

// Start the server
const server = serve({
  port: 3456,
  routes,

  // Enable development mode
  development: true,

  // Fallback for 404s
  fetch(req) {
    const availableRoutes = Object.keys(routes)
      .map(route => `<li><a href="${route}">${route}</a></li>`)
      .join('\n')

    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head><title>404 - Not Found</title></head>
        <body style="font-family: system-ui; max-width: 800px; margin: 4rem auto; padding: 2rem; text-align: center;">
          <h1>404 - Not Found</h1>
          <h2>Available routes:</h2>
          <ul style="list-style: none; padding: 0;">
            ${availableRoutes}
          </ul>
        </body>
      </html>
    `,
      {
        status: 404,
        headers: { 'Content-Type': 'text/html' },
      },
    )
  },
})

console.log(`🚀 Server running at ${server.url}`)
console.log('\n📚 Available routes:')
Object.keys(routes).forEach((route) => {
  const url = `${server.url}`.replace(/\/$/, '')
  console.log(`   ${url}${route}`)
})
console.log('\n💡 Press Ctrl+C to stop\n')
