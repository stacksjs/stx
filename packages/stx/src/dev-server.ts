import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
// TODO: import this from `bun-plugin-stx`. Oddly, there seemingly are issues right now
import { plugin as stxPlugin } from './plugin'

// Define types for dev server options
export interface DevServerOptions {
  port?: number
  watch?: boolean
  stxOptions?: any
}

// Build and serve a specific STX file
export async function serveStxFile(filePath: string, options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate the file exists
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`)
    return false
  }

  // Validate it's an STX file
  if (!absolutePath.endsWith('.stx')) {
    console.error(`Error: File must have .stx extension: ${absolutePath}`)
    return false
  }

  // Create a temporary output directory
  const outputDir = path.join(process.cwd(), '.stx-output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Initial build
  console.log(`Building ${filePath}...`)
  let htmlContent: string | null = null

  // Function to build the STX file
  const buildFile = async (): Promise<boolean> => {
    try {
      const result = await Bun.build({
        entrypoints: [absolutePath],
        outdir: outputDir,
        plugins: [stxPlugin],
        define: {
          'process.env.NODE_ENV': '"development"'
        },
        ...options.stxOptions
      })

      if (!result.success) {
        console.error('Build failed:', result.logs)
        return false
      }

      // Find the HTML output
      const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
      if (!htmlOutput) {
        console.error('No HTML output found')
        return false
      }

      // Read the file content
      htmlContent = await Bun.file(htmlOutput.path).text()
      return true
    }
    catch (error) {
      console.error('Error building STX file:', error)
      return false
    }
  }

  // Do initial build
  const buildSuccess = await buildFile()
  if (!buildSuccess) {
    return false
  }

  // Start a server
  console.log(`Starting server on http://localhost:${port}...`)
  const server = serve({
    port,
    fetch(request) {
      const url = new URL(request.url)

      // Serve the main HTML for the root path
      if (url.pathname === '/') {
        return new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
          },
        })
      }

      // Check if it's a file in the output directory
      const requestedPath = path.join(outputDir, url.pathname)
      if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
        const file = Bun.file(requestedPath)
        // Determine content type based on extension
        const ext = path.extname(requestedPath).toLowerCase()
        let contentType = 'text/plain'

        switch (ext) {
          case '.html': contentType = 'text/html'; break
          case '.css': contentType = 'text/css'; break
          case '.js': contentType = 'text/javascript'; break
          case '.json': contentType = 'application/json'; break
          case '.png': contentType = 'image/png'; break
          case '.jpg': case '.jpeg': contentType = 'image/jpeg'; break
          case '.gif': contentType = 'image/gif'; break
          case '.svg': contentType = 'image/svg+xml'; break
        }

        return new Response(file, {
          headers: { 'Content-Type': contentType }
        })
      }

      // Fallback 404 response
      return new Response('Not Found', { status: 404 })
    },
    error(error) {
      return new Response(`<pre>${error}\n${error.stack}</pre>`, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    },
  })

  console.log(`Server running at ${server.url}`)
  console.log('Press Ctrl+C to stop the server')

  // Set up file watching if enabled
  if (watch) {
    const dirToWatch = path.dirname(absolutePath)
    console.log(`Watching ${dirToWatch} for changes...`)

    const watcher = fs.watch(dirToWatch, { recursive: true }, async (eventType, filename) => {
      if (filename && (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts'))) {
        console.log(`File ${filename} changed, rebuilding...`)
        await buildFile()
      }
    })

    // Clean up on process exit
    process.on('SIGINT', () => {
      watcher.close()
      server.stop()
      process.exit(0)
    })
  }

  return true
}
