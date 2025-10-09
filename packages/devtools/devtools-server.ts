/* eslint-disable no-console */
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import stxPlugin from 'bun-plugin-stx'

// Port for the dev server
const PORT = process.env.PORT ? Number.parseInt(process.env.PORT) : 3500
const PUBLIC_DIR = './public'

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true })
}

// Build stx templates to the public directory
async function buildTemplates() {
  console.log('Building stx templates...')

  try {
    const result = await Bun.build({
      entrypoints: [
        './src/views/index.stx',
        './src/views/dashboard.stx',
        './src/views/templates.stx',
        './src/views/performance.stx',
        './src/views/config.stx',
      ],
      outdir: PUBLIC_DIR,
      plugins: [
        stxPlugin,
      ],
      minify: false,
      target: 'browser',
      define: {
        'process.env.NODE_ENV': '"development"',
      },
    })

    if (!result.success) {
      console.error('Build failed with errors:', result.logs)
      return
    }

    console.log('Templates built successfully!')

    // Copy CSS file to public
    const css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --primary-color: #3b82f6;
  --secondary-color: #6b7280;
  --background-color: #f9fafb;
  --text-color: #1f2937;
  --sidebar-width: 250px;
  --header-height: 60px;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
  color: var(--text-color);
}

.card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  padding: 20px;
  margin-bottom: 20px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-outline {
  border: 1px solid #e5e7eb;
  background-color: transparent;
}

.flex { display: flex; }
.grid { display: grid; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.font-bold { font-weight: bold; }
.text-2xl { font-size: 1.5rem; }
.text-xl { font-size: 1.25rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mr-1 { margin-right: 0.25rem; }
.mr-2 { margin-right: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.p-6 { padding: 1.5rem; }
.p-4 { padding: 1rem; }
.gap-6 { gap: 1.5rem; }
.gap-4 { gap: 1rem; }
.gap-2 { gap: 0.5rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.text-gray-500 { color: #6b7280; }
.text-gray-600 { color: #4b5563; }
.rounded-lg { border-radius: 0.5rem; }
.bg-white { background-color: white; }
.space-y-4 > * + * { margin-top: 1rem; }
.w-full { width: 100%; }
.shadow { box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06); }
.border-b { border-bottom-width: 1px; }
.border-gray-100 { border-color: #f3f4f6; }
.border-gray-200 { border-color: #e5e7eb; }
`

    fs.writeFileSync(path.join(PUBLIC_DIR, 'styles.css'), css)

    // Generate a simple HTML template for each page
    const htmlFiles = fs.readdirSync(PUBLIC_DIR).filter(file => file.endsWith('.html'))

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(path.join(PUBLIC_DIR, htmlFile), 'utf-8')
      const enhancedContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>stx DevTools</title>
  <link rel="stylesheet" href="/styles.css">
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      padding: 2rem;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .btn {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: #4f46e5;
      color: white;
      border-radius: 0.375rem;
      border: none;
      cursor: pointer;
      text-decoration: none;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #4b5563;
    }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`

      fs.writeFileSync(path.join(PUBLIC_DIR, htmlFile), enhancedContent)
    }
  }
  catch (error) {
    console.error('Error building templates:', error)
  }
}

// Initial build
// eslint-disable-next-line antfu/no-top-level-await
await buildTemplates()

// Start the server
console.log(`Starting stx DevTools server on http://localhost:${PORT}`)
const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url)
    let pathname = url.pathname

    // Default to index.html if path is "/"
    if (pathname === '/') {
      pathname = '/index.html'
    }

    // Add .html extension if no extension and not a CSS file
    if (!pathname.includes('.')) {
      pathname = `${pathname}.html`
    }

    const filePath = path.join(PUBLIC_DIR, pathname)

    try {
      // Check if the file exists
      if (fs.existsSync(filePath)) {
        const file = Bun.file(filePath)
        const contentType = pathname.endsWith('.css') ? 'text/css' : 'text/html'
        return new Response(file, {
          headers: {
            'Content-Type': contentType,
          },
        })
      }

      // Return 404 if file not found
      return new Response('Not Found', { status: 404 })
    }
    catch (error) {
      console.error(`Error serving ${pathname}:`, error)
      return new Response('Server Error', { status: 500 })
    }
  },
})

// Watch for file changes and rebuild
const watcher = fs.watch('./src', { recursive: true }, async (eventType, filename) => {
  if (filename && filename.endsWith('.stx')) {
    console.log(`File ${filename} changed, rebuilding...`)
    await buildTemplates()
  }
})

// Cleanup on exit
process.on('SIGINT', () => {
  watcher.close()
  server.stop()
  process.exit(0)
})
