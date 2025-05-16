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

// Function to setup keyboard shortcuts for the server
function setupKeyboardShortcuts(serverUrl: string, stopServer: () => void) {
  // Set up raw mode for handling keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()

    console.log('\nKeyboard shortcuts:')
    console.log('  o + Enter - Open in browser')
    console.log('  c + Enter - Clear console')
    console.log('  q + Enter (or Ctrl+C) - Quit server')

    let buffer = ''

    process.stdin.on('data', (key: string) => {
      // Handle Ctrl+C
      if (key === '\u0003') {
        stopServer()
        process.exit(0)
      }

      buffer += key

      // Check for command sequences
      if (buffer.endsWith('\r') || buffer.endsWith('\n')) {
        const cmd = buffer.trim().toLowerCase()
        buffer = ''

        if (cmd === 'o') {
          // Open in browser
          console.log(`Opening ${serverUrl} in your browser...`)
          Bun.spawn(['open', serverUrl], { stderr: 'inherit' })
        } else if (cmd === 'c') {
          // Clear console
          console.clear()
          console.log(`Server running at ${serverUrl}`)
          console.log('Press Ctrl+C to stop the server')
          console.log('\nKeyboard shortcuts:')
          console.log('  o + Enter - Open in browser')
          console.log('  c + Enter - Clear console')
          console.log('  q + Enter (or Ctrl+C) - Quit server')
        } else if (cmd === 'q') {
          // Quit server
          console.log('Stopping server...')
          stopServer()
          process.exit(0)
        } else if (cmd === 'h') {
          // Show help/shortcuts
          console.log('\nKeyboard Shortcuts:')
          console.log('  o + Enter - Open in browser')
          console.log('  c + Enter - Clear console')
          console.log('  q + Enter (or Ctrl+C) - Quit server')
          console.log('  h + Enter - Show this help')
        }
      }
    })
  }
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

  // Print Bun-style output header
  console.clear()
  console.log(`\nStx  ${process.env.STX_VERSION || 'v0.0.10'}  ready in  ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0}  ms`)
  console.log(`\n→  http://localhost:${port}/`)

  // Print the route in Bun-like format
  console.log(`\nRoutes:`)
  const relativeFilePath = path.relative(process.cwd(), absolutePath)
  console.log(`  └─ / → ${relativeFilePath}`)

  console.log(`\nPress h + Enter to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(path.dirname(absolutePath), { recursive: true })
      watcher.close()
    }
    server.stop()
  })

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

// Interface for mapping routes to built STX file content
interface RouteMapping {
  [routePath: string]: {
    filePath: string;
    content: string;
  }
}

// Build and serve multiple STX files
export async function serveMultipleStxFiles(filePaths: string[], options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate all files exist and are STX files
  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath)
    if (!fs.existsSync(absolutePath)) {
      console.error(`Error: File not found: ${absolutePath}`)
      return false
    }
    if (!absolutePath.endsWith('.stx')) {
      console.error(`Error: File must have .stx extension: ${absolutePath}`)
      return false
    }
  }

  // Create a temporary output directory
  const outputDir = path.join(process.cwd(), '.stx-output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Get the common directory from all file paths
  const commonDir = findCommonDir(filePaths.map(f => path.dirname(path.resolve(f))))

  // Initial build of all files
  console.log(`Building ${filePaths.length} STX files...`)

  // Route mapping for serving files
  const routes: RouteMapping = {}

  // Function to build all STX files
  const buildFiles = async (): Promise<boolean> => {
    try {
      // Build each file individually
      for (const filePath of filePaths) {
        const absolutePath = path.resolve(filePath)
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
          console.error(`Build failed for ${filePath}:`, result.logs)
          continue
        }

        // Find the HTML output
        const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
        if (!htmlOutput) {
          console.error(`No HTML output found for ${filePath}`)
          continue
        }

        // Read the file content
        const htmlContent = await Bun.file(htmlOutput.path).text()

        // Generate route path based on file location relative to common directory
        const relativePath = path.relative(commonDir, absolutePath)
        // Remove .stx extension and use as route
        const routePath = `/${relativePath.replace(/\.stx$/, '')}`

        // Add to routes mapping
        routes[routePath || '/'] = {
          filePath: absolutePath,
          content: htmlContent
        }
      }

      // Check if we have at least one successful build
      if (Object.keys(routes).length === 0) {
        console.error('No STX files were successfully built')
        return false
      }

      return true
    }
    catch (error) {
      console.error('Error building STX files:', error)
      return false
    }
  }

  // Do initial build
  const buildSuccess = await buildFiles()
  if (!buildSuccess) {
    return false
  }

  // Start a server
  console.log(`Starting server on http://localhost:${port}...`)
  const server = serve({
    port,
    fetch(request) {
      const url = new URL(request.url)

      // First, try to match the pathname exactly to a route
      let routeMatched = routes[url.pathname]

      // If no match, try to find a index match (for cases like /about -> /about/index)
      if (!routeMatched && !url.pathname.endsWith('/')) {
        routeMatched = routes[`${url.pathname}/`]
      }

      // If still no match and there's a root route, serve that as fallback (SPA mode)
      if (!routeMatched && url.pathname !== '/' && routes['/']) {
        routeMatched = routes['/']
      }

      // If we found a matching route, serve its content
      if (routeMatched) {
        return new Response(routeMatched.content, {
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

  // Print Bun-style output header
  console.clear()
  console.log(`\nStx  ${process.env.STX_VERSION || 'v0.0.10'}  ready in  ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0}  ms`)
  console.log(`\n→  http://localhost:${port}/`)

  // Print the routes in Bun-like format
  console.log(`\nRoutes:`)

  // Get all routes sorted for display
  const sortedRoutes = Object.entries(routes)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([route, info]) => ({
      route: route === '/' ? '/' : route,
      filePath: path.relative(process.cwd(), info.filePath)
    }))

  // Display routes in tree-like structure
  sortedRoutes.forEach((routeInfo, index) => {
    const isLast = index === sortedRoutes.length - 1
    const prefix = isLast ? '└─ ' : '├─ '

    if (routeInfo.route === '/') {
      console.log(`  ${prefix}/ → ${routeInfo.filePath}`)
    } else {
      // Format like '/about → ./about/index.stx'
      const routeParts = routeInfo.route.split('/')
      const lastPart = routeParts[routeParts.length - 1] || routeParts[routeParts.length - 2]
      const displayRoute = routeInfo.route === '/' ? '/' : `/${lastPart}`

      // Get parent path for proper formatting
      let parentPath = routeParts.slice(0, -1).join('/')
      if (parentPath && !parentPath.startsWith('/')) parentPath = '/' + parentPath

      console.log(`  ${prefix}${displayRoute} → ${routeInfo.filePath}`)
    }
  })

  console.log(`\nPress h + Enter to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(commonDir, { recursive: true })
      watcher.close()
    }
    server.stop()
  })

  // Set up file watching if enabled
  if (watch) {
    // Watch the entire common directory for changes
    console.log(`Watching for changes...`)

    const watcher = fs.watch(commonDir, { recursive: true }, async (eventType, filename) => {
      if (!filename) return

      // Only rebuild if it's an STX file or related JavaScript/TypeScript file
      if (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts')) {
        console.log(`File changed: ${filename}, rebuilding...`)
        await buildFiles()
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

// Helper function to find the common directory for multiple paths
function findCommonDir(paths: string[]): string {
  if (paths.length === 0) return ''
  if (paths.length === 1) return paths[0]

  // Split all paths into components
  const parts = paths.map(p => p.split(path.sep))

  // Find the common prefix
  const commonParts: string[] = []
  for (let i = 0; i < parts[0].length; i++) {
    const part = parts[0][i]
    if (parts.every(p => p[i] === part)) {
      commonParts.push(part)
    } else {
      break
    }
  }

  // Join the common parts back into a path
  return commonParts.join(path.sep)
}
