#!/usr/bin/env bun

/**
 * stx serve command
 * Serves .stx, .md, and .html files directly without manual build step
 *
 * Usage:
 *   serve pages/*.stx
 *   serve pages/*.md
 *   serve pages/*.html
 *   serve pages/ --port 3000
 *   serve pages/home.stx pages/about.md pages/index.html
 */

import { serve as bunServe, Glob } from 'bun'
import stxPlugin from './index'

// Parse command line arguments
const args = process.argv.slice(2)

// Remove 'serve' if it's the first argument (for compatibility)
if (args[0] === 'serve') {
  args.shift()
}
const portIndex = args.indexOf('--port')
const port = portIndex !== -1 && args[portIndex + 1] ? Number.parseInt(args[portIndex + 1]) : 3456

// Get file patterns (everything that's not a flag)
const patterns = args.filter(arg => !arg.startsWith('--') && arg !== args[portIndex + 1])

if (patterns.length === 0) {
  console.error('Usage: serve <files...> [--port 3000]')
  console.error('\nExamples:')
  console.error('  serve pages/*.stx')
  console.error('  serve pages/*.md')
  console.error('  serve pages/*.html')
  console.error('  serve pages/ --port 3000')
  console.error('  serve index.stx about.md page.html')
  console.error('\nAfter installing: bun add bun-plugin-stx')
  process.exit(1)
}

console.log('🚀 Starting stx development server...\n')

// Discover all .stx, .md, and .html files
const sourceFiles: string[] = []
const supportedExtensions = ['.stx', '.md', '.html']

for (const pattern of patterns) {
  try {
    // Check if it's a directory using fs.stat
    const fs = await import('node:fs/promises')
    const stat = await fs.stat(pattern).catch(() => null)

    if (stat?.isDirectory()) {
      // Scan directory for supported files
      for (const ext of ['.stx', '.md', '.html']) {
        const glob = new Glob(`**/*${ext}`)
        const files = await Array.fromAsync(glob.scan(pattern))
        sourceFiles.push(...files.map(f => `${pattern}/${f}`.replace(/\/+/g, '/')))
      }
    }
    else if (pattern.includes('*')) {
      // Handle glob patterns
      const glob = new Glob(pattern)
      const basePath = pattern.split('*')[0].replace(/\/$/, '')
      const files = await Array.fromAsync(glob.scan(basePath || '.'))
      sourceFiles.push(...files.map(f => basePath ? `${basePath}/${f}` : f))
    }
    else if (supportedExtensions.some(ext => pattern.endsWith(ext))) {
      // Single file with supported extension
      sourceFiles.push(pattern)
    }
  }
  catch (error) {
    console.error(`Error processing pattern "${pattern}":`, error)
  }
}

if (sourceFiles.length === 0) {
  console.error('❌ No .stx, .md, or .html files found')
  process.exit(1)
}

console.log(`📄 Found ${sourceFiles.length} file(s):`)
sourceFiles.forEach(file => console.log(`   - ${file}`))

// Build all files
console.log('\n🔨 Building...')
const result = await Bun.build({
  entrypoints: sourceFiles,
  outdir: './.stx-serve',
  plugins: [stxPlugin()],
  splitting: false, // Disable code splitting - we're serving HTML, not JS bundles
})

if (!result.success) {
  console.error('\n❌ Build failed!')
  console.error(result.logs)
  process.exit(1)
}

console.log('✅ Build complete\n')

// Create route map
const routes = new Map<string, string>()

console.log(`\n📦 Processing ${result.outputs.length} build outputs...`)
for (const output of result.outputs) {
  try {
    const outputFile = output.path.split('/').pop() || 'index'

    // Only process .html files (skip any .js chunks)
    if (!outputFile.endsWith('.html')) {
      console.log(`   ⊘ Skipping ${outputFile} (not HTML)`)
      continue
    }

    const content = await output.text()
    // Get the base filename without any extension
    const filename = outputFile
      .replace('.html', '')
      .replace('.md', '')
      .replace('.stx', '')

    // Smart routing: index/home -> /, others -> /filename
    const route = ['index', 'home'].includes(filename) ? '/' : `/${filename}`
    console.log(`   ✓ ${outputFile} -> ${route}`)
    routes.set(route, content)
  }
  catch (error) {
    // Skip outputs that can't be converted to text (e.g., binary files)
    console.warn(`   ✗ Skipping output: ${output.path} (${error})`)
  }
}

// Start server
const server = bunServe({
  port,
  async fetch(req) {
    const url = new URL(req.url)
    let path = url.pathname

    // Normalize path
    if (path === '/index')
      path = '/'

    // Try to serve the requested page
    if (routes.has(path)) {
      return new Response(routes.get(path), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
        },
      })
    }

    // Try without extension
    if (routes.has(`${path}.html`)) {
      return new Response(routes.get(`${path}.html`), {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache',
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
            ul { list-style: none; padding: 0; margin: 2rem 0; }
            li { margin: 0.5rem 0; }
            a { color: #667eea; text-decoration: none; font-size: 1.1rem; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p>The page "${path}" doesn't exist.</p>
          <h2>Available pages:</h2>
          <ul>${availableRoutes}</ul>
        </body>
      </html>
    `, {
      status: 404,
      headers: { 'Content-Type': 'text/html' },
    })
  },
})

console.log(`🌐 Server running at: http://localhost:${port}\n`)
console.log('📚 Available routes:')
routes.forEach((_, route) => {
  console.log(`   http://localhost:${port}${route}`)
})
console.log('\n💡 Press Ctrl+C to stop\n')

// Keep the process running
await Bun.sleep(Number.POSITIVE_INFINITY)
