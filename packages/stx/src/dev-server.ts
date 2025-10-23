import type { SyntaxHighlightTheme } from './types'
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { readMarkdownFile } from './assets'
import { config } from './config'
// TODO: import this from `bun-plugin-stx`. Oddly, there seemingly are issues right now
import { plugin as stxPlugin } from './plugin'

// ANSI color codes for terminal output
const colors = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  underscore: '\x1B[4m',
  blink: '\x1B[5m',
  reverse: '\x1B[7m',
  hidden: '\x1B[8m',

  black: '\x1B[30m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
  white: '\x1B[37m',
  gray: '\x1B[90m',

  bgBlack: '\x1B[40m',
  bgRed: '\x1B[41m',
  bgGreen: '\x1B[42m',
  bgYellow: '\x1B[43m',
  bgBlue: '\x1B[44m',
  bgMagenta: '\x1B[45m',
  bgCyan: '\x1B[46m',
  bgWhite: '\x1B[47m',
  bgGray: '\x1B[100m',
}

/**
 * Find an available port starting from the given port
 */
async function findAvailablePort(startPort: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = startPort + i
    try {
      // Try to create a temporary server to check if port is available
      const testServer = serve({
        port,
        fetch: () => new Response('test'),
      })
      testServer.stop()
      return port
    }
    catch (error: any) {
      // Port is in use, try next one
      if (error.code === 'EADDRINUSE') {
        continue
      }
      // Other error, rethrow
      throw error
    }
  }
  throw new Error(`Could not find an available port between ${startPort} and ${startPort + maxAttempts - 1}`)
}

// Helper function to open native window with Zyte
async function openNativeWindow(port: number) {
  const { spawn } = await import('node:child_process')
  const zyteDir = path.resolve(__dirname, '../../zyte')
  const url = `http://localhost:${port}/`

  try {
    // Check if zyte is built
    if (!fs.existsSync(path.join(zyteDir, 'zig-out/bin/zyte-minimal'))) {
      console.log(`${colors.yellow}⚠${colors.reset}  Zyte not built. Building now...`)
      const { execSync } = await import('node:child_process')
      execSync(`cd ${zyteDir} && zig build`, { stdio: 'inherit' })
    }

    // Open Zyte with the dev server URL
    console.log(`${colors.magenta}⚡ Opening native window...${colors.reset}`)

    const zyteProcess = spawn(
      path.join(zyteDir, 'zig-out/bin/zyte-minimal'),
      [url],
      {
        detached: true,
        stdio: 'ignore',
      },
    )
    zyteProcess.unref()

    console.log(`${colors.green}✓${colors.reset} Native window opened with URL: ${colors.cyan}${url}${colors.reset}`)

    return true
  }
  catch (error) {
    console.log(`${colors.red}✗${colors.reset} Could not open native window:`, error)
    console.log(`${colors.dim}  You can manually run: cd ${zyteDir} && ./zig-out/bin/zyte-minimal ${url}${colors.reset}`)
    return false
  }
}

// Define types for dev server options
export interface DevServerOptions {
  port?: number
  watch?: boolean
  native?: boolean
  stxOptions?: any
  markdown?: {
    syntaxHighlighting?: {
      serverSide?: boolean
      enabled?: boolean
      defaultTheme?: SyntaxHighlightTheme
      highlightUnknownLanguages?: boolean
      additionalThemes?: SyntaxHighlightTheme[]
    }
  }
  cache?: boolean
}

// Function to setup keyboard shortcuts for the server
function setupKeyboardShortcuts(serverUrl: string, stopServer: () => void) {
  // Set up raw mode for handling keyboard input
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
    process.stdin.setEncoding('utf8')
    process.stdin.resume()

    console.log('\nKeyboard shortcuts:')
    console.log(`  ${colors.cyan}o${colors.reset} + Enter - Open in browser`)
    console.log(`  ${colors.cyan}c${colors.reset} + Enter - Clear console`)
    console.log(`  ${colors.cyan}q${colors.reset} + Enter (or ${colors.cyan}Ctrl+C${colors.reset}) - Quit server`)

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
          console.log(`${colors.dim}Opening ${colors.cyan}${serverUrl}${colors.dim} in your browser...${colors.reset}`)
          Bun.spawn(['open', serverUrl], { stderr: 'inherit' })
        }
        else if (cmd === 'c') {
          // Clear console
          console.clear()
          console.log(`${colors.green}Server running at ${colors.cyan}${serverUrl}${colors.reset}`)
          console.log(`Press ${colors.cyan}Ctrl+C${colors.reset} to stop the server`)
          console.log('\nKeyboard shortcuts:')
          console.log(`  ${colors.cyan}o${colors.reset} + Enter - Open in browser`)
          console.log(`  ${colors.cyan}c${colors.reset} + Enter - Clear console`)
          console.log(`  ${colors.cyan}q${colors.reset} + Enter (or ${colors.cyan}Ctrl+C${colors.reset}) - Quit server`)
        }
        else if (cmd === 'q') {
          // Quit server
          console.log(`${colors.yellow}Stopping server...${colors.reset}`)
          stopServer()
          process.exit(0)
        }
        else if (cmd === 'h') {
          // Show help/shortcuts
          console.log('\nKeyboard Shortcuts:')
          console.log(`  ${colors.cyan}o${colors.reset} + Enter - Open in browser`)
          console.log(`  ${colors.cyan}c${colors.reset} + Enter - Clear console`)
          console.log(`  ${colors.cyan}q${colors.reset} + Enter (or ${colors.cyan}Ctrl+C${colors.reset}) - Quit server`)
          console.log(`  ${colors.cyan}h${colors.reset} + Enter - Show this help`)
        }
      }
    })
  }
}

// Serve a Markdown file directly
async function serveMarkdownFile(filePath: string, options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate the file exists
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`${colors.red}Error: File not found: ${colors.bright}${absolutePath}${colors.reset}`)
    return false
  }

  // Validate it's a Markdown file
  if (!absolutePath.endsWith('.md')) {
    console.error(`${colors.red}Error: File must have .md extension: ${colors.bright}${absolutePath}${colors.reset}`)
    return false
  }

  // Initial processing
  console.log(`${colors.blue}Processing${colors.reset} ${colors.bright}${filePath}${colors.reset}...`)
  let htmlContent: string | null = null

  // Function to process the Markdown file
  const processFile = async (): Promise<boolean> => {
    try {
      // Read and process the markdown file
      const { content, data } = await readMarkdownFile(absolutePath, {
        markdown: {
          syntaxHighlighting: {
            serverSide: true,
            enabled: true,
            defaultTheme: config.markdown?.syntaxHighlighting?.defaultTheme || 'github-dark',
            highlightUnknownLanguages: true,
          },
        },
      })

      // Get the default theme from config
      const markdownConfig = options.markdown?.syntaxHighlighting || config.markdown?.syntaxHighlighting
      const defaultTheme = markdownConfig?.defaultTheme || 'github-dark'

      // Combine available themes
      const baseThemes: SyntaxHighlightTheme[] = ['github-dark'] // Always include github-dark
      const configThemes = markdownConfig?.additionalThemes || []
      const availableThemes = [...new Set([...baseThemes, ...configThemes])]

      // Create the theme options HTML
      const themeOptions = availableThemes.map((theme: SyntaxHighlightTheme) =>
        `<option value="${theme}"${theme === defaultTheme ? ' selected' : ''}>${theme}</option>`,
      ).join('\n      ')

      // Create a simple HTML wrapper for the content with a nice theme
      htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || path.basename(absolutePath)}</title>
  <!-- Syntax highlighting styles -->
  <style id="syntax-theme">
    :root {
      --shiki-color-text: #24292e;
      --shiki-color-background: #ffffff;
      --shiki-token-constant: #005cc5;
      --shiki-token-string: #032f62;
      --shiki-token-comment: #6a737d;
      --shiki-token-keyword: #d73a49;
      --shiki-token-parameter: #24292e;
      --shiki-token-function: #6f42c1;
      --shiki-token-string-expression: #032f62;
      --shiki-token-punctuation: #24292e;
      --shiki-token-link: #032f62;
    }
    pre {
      background-color: var(--shiki-color-background);
      padding: 1rem;
      border-radius: 4px;
    }
    code {
      color: var(--shiki-color-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .dark-mode {
      --shiki-color-text: #e1e4e8;
      --shiki-color-background: #24292e;
      --shiki-token-constant: #79b8ff;
      --shiki-token-string: #9ecbff;
      --shiki-token-comment: #6a737d;
      --shiki-token-keyword: #f97583;
      --shiki-token-parameter: #e1e4e8;
      --shiki-token-function: #b392f0;
      --shiki-token-string-expression: #9ecbff;
      --shiki-token-punctuation: #e1e4e8;
      --shiki-token-link: #9ecbff;
    }
  </style>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    pre {
      border-radius: 4px;
      padding: 0;
      margin: 1.5rem 0;
      overflow-x: auto;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    pre code {
      display: block;
      padding: 1rem;
      overflow-x: auto;
    }
    /* Apply background color to code blocks based on theme */
    pre.syntax-highlighter {
      background-color: var(--shiki-color-background) !important;
    }
    .dark-mode pre.syntax-highlighter {
      background-color: var(--shiki-color-background) !important;
    }
    code {
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }
    h1, h2, h3, h4 {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h1 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    h2 { color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.3rem; }
    h3 { color: #444; }
    img {
      max-width: 100%;
      border-radius: 4px;
      margin: 1rem 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      color: #555;
      background: #f9f9f9;
      padding: 0.5rem 1rem;
      margin: 1.5rem 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
    }
    th {
      background: #f0f0f0;
      text-align: left;
    }
    tr:nth-child(even) {
      background-color: #f8f8f8;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: 0;
      border-top: 1px solid #eee;
      margin: 2rem 0;
    }
    .frontmatter {
      background: #f8f8f8;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #ddd;
    }
    .frontmatter-item {
      margin-bottom: 0.5rem;
      display: flex;
    }
    .frontmatter-label {
      font-weight: bold;
      min-width: 100px;
      color: #555;
    }
    /* Theme selector for code blocks */
    .theme-selector {
      margin: 1rem 0;
      padding: 0.5rem;
      background: #f8f8f8;
      border-radius: 4px;
      text-align: right;
    }
    select {
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      border: 1px solid #ddd;
    }

    /* Dark mode body styles */
    body.dark-mode {
      background-color: #121212;
      color: #e1e4e8;
    }

    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3 {
      color: #e1e4e8;
      border-color: #2f363d;
    }

    body.dark-mode .theme-selector {
      background: #2f363d;
      color: #e1e4e8;
    }

    body.dark-mode select {
      background: #24292e;
      color: #e1e4e8;
      border-color: #444;
    }

    body.dark-mode blockquote {
      background: #24292e;
      color: #e1e4e8;
    }

    body.dark-mode .frontmatter {
      background: #24292e;
    }

    body.dark-mode a {
      color: #58a6ff;
    }
  </style>
</head>
<body>
  ${Object.keys(data).length > 0
    ? `
  <div class="frontmatter">
    <h3>Frontmatter</h3>
    ${Object.entries(data).map(([key, value]) => `
    <div class="frontmatter-item">
      <span class="frontmatter-label">${key}:</span>
      <span>${Array.isArray(value) ? value.join(', ') : value}</span>
    </div>`).join('')}
  </div>
  `
    : ''}

  <div class="theme-selector">
    Theme:
    <select id="themeSelector" onchange="changeTheme()">
      ${themeOptions}
    </select>
  </div>

  ${content}

  <script>
    function changeTheme() {
      const theme = document.getElementById('themeSelector').value;

      // Toggle dark mode class based on theme
      if (theme.includes('dark') || theme.includes('night') || theme.includes('monokai') ||
          theme.includes('dracula') || theme.includes('nord') || theme.includes('material')) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', function() {
      changeTheme();
    });
  </script>
</body>
</html>
      `
      return true
    }
    catch (error) {
      console.error(`${colors.red}Error processing Markdown file:${colors.reset}`, error)
      return false
    }
  }

  // Do initial processing
  const processSuccess = await processFile()
  if (!processSuccess) {
    return false
  }

  // Find an available port (with fallback)
  let actualPort = port
  try {
    actualPort = await findAvailablePort(port)
    if (actualPort !== port) {
      console.log(`${colors.yellow}Port ${port} is busy, using port ${actualPort} instead${colors.reset}`)
    }
  }
  catch {
    console.error(`${colors.red}Could not find an available port${colors.reset}`)
    return false
  }

  // Start a server
  console.log(`${colors.blue}Starting server on ${colors.cyan}http://localhost:${actualPort}/${colors.reset}...`)
  const server = serve({
    port: actualPort,
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
  console.log(`\n${colors.blue}stx${colors.reset}  ${colors.green}${process.env.stx_VERSION || 'v0.0.10'}${colors.reset}  ${colors.dim}ready in  ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0}  ms${colors.reset}`)
  console.log(`\n${colors.bright}→  ${colors.cyan}http://localhost:${port}/${colors.reset}`)

  // Print the route in Bun-like format
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)
  const relativeFilePath = path.relative(process.cwd(), absolutePath)
  console.log(`  ${colors.green}└─ /${colors.reset} → ${colors.bright}${relativeFilePath}${colors.reset}`)

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(path.dirname(absolutePath), { recursive: true })
      watcher.close()
    }
    server.stop()
  })

  // Open native window if requested
  if (options.native) {
    await openNativeWindow(actualPort)
  }

  // Set up file watching if enabled
  if (watch) {
    const dirToWatch = path.dirname(absolutePath)
    console.log(`${colors.blue}Watching ${colors.bright}${dirToWatch}${colors.reset} for changes...`)

    const watcher = fs.watch(dirToWatch, { recursive: true }, async (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, reprocessing...${colors.reset}`)
        await processFile()
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

// Build and serve a specific stx file
export async function serveStxFile(filePath: string, options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate the file exists
  const absolutePath = path.resolve(filePath)
  if (!fs.existsSync(absolutePath)) {
    console.error(`${colors.red}Error: File not found: ${colors.bright}${absolutePath}${colors.reset}`)
    return false
  }

  // Check file type and handle accordingly
  if (absolutePath.endsWith('.md')) {
    return serveMarkdownFile(absolutePath, options)
  }
  else if (!absolutePath.endsWith('.stx')) {
    console.error(`${colors.red}Error: Unsupported file type: ${colors.bright}${absolutePath}${colors.reset}. Only .stx and .md files are supported.`)
    return false
  }

  // Create a temporary output directory
  const outputDir = path.join(process.cwd(), '.stx-output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Initial build
  console.log(`${colors.blue}Building ${colors.bright}${filePath}${colors.reset}...`)
  let htmlContent: string | null = null

  // Function to build the stx file
  const buildFile = async (): Promise<boolean> => {
    try {
      const result = await Bun.build({
        entrypoints: [absolutePath],
        outdir: outputDir,
        plugins: [stxPlugin],
        define: {
          'process.env.NODE_ENV': '"development"',
        },
        ...options.stxOptions,
      })

      if (!result.success) {
        console.error(`${colors.red}Build failed:${colors.reset}`, result.logs)
        return false
      }

      // Find the HTML output
      const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
      if (!htmlOutput) {
        console.error(`${colors.red}No HTML output found${colors.reset}`)
        return false
      }

      // Read the file content
      const html = await Bun.file(htmlOutput.path).text()

      htmlContent = html
      return true
    }
    catch (error) {
      console.error(`${colors.red}Error building stx file:${colors.reset}`, error)
      return false
    }
  }

  // Do initial build
  const buildSuccess = await buildFile()
  if (!buildSuccess) {
    return false
  }

  // Find an available port (with fallback)
  let actualPort = port
  try {
    actualPort = await findAvailablePort(port)
    if (actualPort !== port) {
      console.log(`${colors.yellow}Port ${port} is busy, using port ${actualPort} instead${colors.reset}`)
    }
  }
  catch {
    console.error(`${colors.red}Could not find an available port${colors.reset}`)
    return false
  }

  // Start a server
  console.log(`${colors.blue}Starting server on ${colors.cyan}http://localhost:${actualPort}/${colors.reset}...`)
  const server = serve({
    port: actualPort,
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
          case '.html':
            contentType = 'text/html'
            break
          case '.css':
            contentType = 'text/css'
            break
          case '.js':
            contentType = 'text/javascript'
            break
          case '.json':
            contentType = 'application/json'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg'
            break
          case '.gif':
            contentType = 'image/gif'
            break
        }

        return new Response(file, {
          headers: { 'Content-Type': contentType },
        })
      }

      // Check if it's a static file in the source directory (for JS, CSS, etc.)
      const sourceDir = path.dirname(absolutePath)
      const sourcePath = path.join(sourceDir, url.pathname)
      if (fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
        const file = Bun.file(sourcePath)
        // Determine content type based on extension
        const ext = path.extname(sourcePath).toLowerCase()
        let contentType = 'text/plain'

        switch (ext) {
          case '.html':
            contentType = 'text/html'
            break
          case '.css':
            contentType = 'text/css'
            break
          case '.js':
            contentType = 'text/javascript'
            break
          case '.json':
            contentType = 'application/json'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg'
            break
          case '.gif':
            contentType = 'image/gif'
            break
          case '.svg':
            contentType = 'image/svg+xml'
            break
          case '.ico':
            contentType = 'image/x-icon'
            break
        }

        return new Response(file, {
          headers: { 'Content-Type': contentType },
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
  console.log(`\n${colors.blue}stx${colors.reset}  ${colors.green}${process.env.stx_VERSION || 'v0.0.10'}${colors.reset}  ${colors.dim}ready in  ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0}  ms${colors.reset}`)
  console.log(`\n${colors.bright}→  ${colors.cyan}http://localhost:${port}/${colors.reset}`)

  // Print the route in Bun-like format
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)
  const relativeFilePath = path.relative(process.cwd(), absolutePath)
  console.log(`  ${colors.green}└─ /${colors.reset} → ${colors.bright}${relativeFilePath}${colors.reset}`)

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

  // Set up keyboard shortcuts
  setupKeyboardShortcuts(server.url.toString(), () => {
    if (watch) {
      const watcher = fs.watch(path.dirname(absolutePath), { recursive: true })
      watcher.close()
    }
    server.stop()
  })

  // Open native window if requested
  if (options.native) {
    await openNativeWindow(actualPort)
  }

  // Set up file watching if enabled
  if (watch) {
    const dirToWatch = path.dirname(absolutePath)
    console.log(`${colors.blue}Watching ${colors.bright}${dirToWatch}${colors.reset} for changes...`)

    const watcher = fs.watch(dirToWatch, { recursive: true }, async (eventType, filename) => {
      if (filename && (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts'))) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, rebuilding...${colors.reset}`)
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

// Interface for mapping routes to built stx file content
interface RouteMapping {
  [routePath: string]: {
    filePath: string
    content: string
    fileType: 'stx' | 'md'
  }
}

// Build and serve multiple files (stx and Markdown)
export async function serveMultipleStxFiles(filePaths: string[], options: DevServerOptions = {}): Promise<boolean> {
  // Default options
  const port = options.port || 3000
  const watch = options.watch !== false

  // Validate all files exist and are supported types
  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath)
    if (!fs.existsSync(absolutePath)) {
      console.error(`${colors.red}Error: File not found: ${colors.bright}${absolutePath}${colors.reset}`)
      return false
    }
    if (!absolutePath.endsWith('.stx') && !absolutePath.endsWith('.md')) {
      console.error(`${colors.red}Error: Unsupported file type: ${colors.bright}${absolutePath}${colors.reset}. Only .stx and .md files are supported.`)
      return false
    }
  }

  // Create a temporary output directory
  const outputDir = path.join(process.cwd(), '.stx-output')
  fs.mkdirSync(outputDir, { recursive: true })

  // Get the common directory from all file paths
  const commonDir = findCommonDir(filePaths.map(f => path.dirname(path.resolve(f))))

  // Initial build of all files
  console.log(`${colors.blue}Processing ${colors.bright}${filePaths.length}${colors.reset} files...`)

  // Route mapping for serving files
  const routes: RouteMapping = {}

  // Function to build all files
  const buildFiles = async (): Promise<boolean> => {
    try {
      // Process each file individually
      for (const filePath of filePaths) {
        const absolutePath = path.resolve(filePath)
        const isMarkdown = absolutePath.endsWith('.md')

        if (isMarkdown) {
          // Process Markdown file
          try {
            // Read and process the markdown file
            const { content, data } = await readMarkdownFile(absolutePath, {
              markdown: {
                syntaxHighlighting: {
                  serverSide: true,
                  enabled: true,
                  defaultTheme: config.markdown?.syntaxHighlighting?.defaultTheme || 'github-dark',
                  highlightUnknownLanguages: true,
                },
              },
            })

            // Get the default theme from config
            const markdownConfig = options.markdown?.syntaxHighlighting || config.markdown?.syntaxHighlighting
            const defaultTheme = markdownConfig?.defaultTheme || 'github-dark'

            // Combine available themes
            const baseThemes: SyntaxHighlightTheme[] = ['github-dark'] // Always include github-dark
            const configThemes = markdownConfig?.additionalThemes || []
            const availableThemes = [...new Set([...baseThemes, ...configThemes])]

            // Create the theme options HTML
            const themeOptions = availableThemes.map((theme: SyntaxHighlightTheme) =>
              `<option value="${theme}"${theme === defaultTheme ? ' selected' : ''}>${theme}</option>`,
            ).join('\n      ')

            // Create a simple HTML wrapper for the content with a nice theme
            const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title || path.basename(absolutePath)}</title>
  <!-- Syntax highlighting styles -->
  <style id="syntax-theme">
    :root {
      --shiki-color-text: #24292e;
      --shiki-color-background: #ffffff;
      --shiki-token-constant: #005cc5;
      --shiki-token-string: #032f62;
      --shiki-token-comment: #6a737d;
      --shiki-token-keyword: #d73a49;
      --shiki-token-parameter: #24292e;
      --shiki-token-function: #6f42c1;
      --shiki-token-string-expression: #032f62;
      --shiki-token-punctuation: #24292e;
      --shiki-token-link: #032f62;
    }
    pre {
      background-color: var(--shiki-color-background);
      padding: 1rem;
      border-radius: 4px;
    }
    code {
      color: var(--shiki-color-text);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    .dark-mode {
      --shiki-color-text: #e1e4e8;
      --shiki-color-background: #24292e;
      --shiki-token-constant: #79b8ff;
      --shiki-token-string: #9ecbff;
      --shiki-token-comment: #6a737d;
      --shiki-token-keyword: #f97583;
      --shiki-token-parameter: #e1e4e8;
      --shiki-token-function: #b392f0;
      --shiki-token-string-expression: #9ecbff;
      --shiki-token-punctuation: #e1e4e8;
      --shiki-token-link: #9ecbff;
    }
  </style>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    pre {
      border-radius: 4px;
      padding: 0;
      margin: 1.5rem 0;
      overflow-x: auto;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
    pre code {
      display: block;
      padding: 1rem;
      overflow-x: auto;
    }
    /* Apply background color to code blocks based on theme */
    pre.syntax-highlighter {
      background-color: var(--shiki-color-background) !important;
    }
    .dark-mode pre.syntax-highlighter {
      background-color: var(--shiki-color-background) !important;
    }
    code {
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
    }
    h1, h2, h3, h4 {
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h1 { color: #111; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
    h2 { color: #333; border-bottom: 1px solid #f0f0f0; padding-bottom: 0.3rem; }
    h3 { color: #444; }
    img {
      max-width: 100%;
      border-radius: 4px;
      margin: 1rem 0;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1rem;
      margin-left: 0;
      color: #555;
      background: #f9f9f9;
      padding: 0.5rem 1rem;
      margin: 1.5rem 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1.5rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
    }
    th {
      background: #f0f0f0;
      text-align: left;
    }
    tr:nth-child(even) {
      background-color: #f8f8f8;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: 0;
      border-top: 1px solid #eee;
      margin: 2rem 0;
    }
    .frontmatter {
      background: #f8f8f8;
      border-radius: 4px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      font-size: 0.9rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #ddd;
    }
    .frontmatter-item {
      margin-bottom: 0.5rem;
      display: flex;
    }
    .frontmatter-label {
      font-weight: bold;
      min-width: 100px;
      color: #555;
    }
    /* Theme selector for code blocks */
    .theme-selector {
      margin: 1rem 0;
      padding: 0.5rem;
      background: #f8f8f8;
      border-radius: 4px;
      text-align: right;
    }
    select {
      padding: 0.25rem 0.5rem;
      border-radius: 3px;
      border: 1px solid #ddd;
    }

    /* Dark mode body styles */
    body.dark-mode {
      background-color: #121212;
      color: #e1e4e8;
    }

    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3 {
      color: #e1e4e8;
      border-color: #2f363d;
    }

    body.dark-mode .theme-selector {
      background: #2f363d;
      color: #e1e4e8;
    }

    body.dark-mode select {
      background: #24292e;
      color: #e1e4e8;
      border-color: #444;
    }

    body.dark-mode blockquote {
      background: #24292e;
      color: #e1e4e8;
    }

    body.dark-mode .frontmatter {
      background: #24292e;
    }

    body.dark-mode a {
      color: #58a6ff;
    }
  </style>
</head>
<body>
  ${Object.keys(data).length > 0
    ? `
  <div class="frontmatter">
    <h3>Frontmatter</h3>
    ${Object.entries(data).map(([key, value]) => `
    <div class="frontmatter-item">
      <span class="frontmatter-label">${key}:</span>
      <span>${Array.isArray(value) ? value.join(', ') : value}</span>
    </div>`).join('')}
  </div>
  `
    : ''}

  <div class="theme-selector">
    Theme:
    <select id="themeSelector" onchange="changeTheme()">
      ${themeOptions}
    </select>
  </div>

  ${content}

  <script>
    function changeTheme() {
      const theme = document.getElementById('themeSelector').value;

      // Toggle dark mode class based on theme
      if (theme.includes('dark') || theme.includes('night') || theme.includes('monokai') ||
          theme.includes('dracula') || theme.includes('nord') || theme.includes('material')) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }

    // Initialize theme on page load
    document.addEventListener('DOMContentLoaded', function() {
      changeTheme();
    });
  </script>
</body>
</html>
            `

            // Generate route path based on file location relative to common directory
            const relativePath = path.relative(commonDir, absolutePath)
            // Remove .md extension and use as route
            const routePath = `/${relativePath.replace(/\.md$/, '')}`

            // Add to routes mapping
            routes[routePath || '/'] = {
              filePath: absolutePath,
              content: htmlContent,
              fileType: 'md',
            }
          }
          catch (error) {
            console.error(`${colors.red}Error processing Markdown file ${colors.bright}${filePath}${colors.reset}:`, error)
            continue
          }
        }
        else {
          // Build stx file
          const result = await Bun.build({
            entrypoints: [absolutePath],
            outdir: outputDir,
            plugins: [stxPlugin],
            define: {
              'process.env.NODE_ENV': '"development"',
            },
            ...options.stxOptions,
          })

          if (!result.success) {
            console.error(`${colors.red}Build failed for ${colors.bright}${filePath}${colors.reset}:`, result.logs)
            continue
          }

          // Find the HTML output
          const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
          if (!htmlOutput) {
            console.error(`${colors.red}No HTML output found for ${colors.bright}${filePath}${colors.reset}`)
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
            content: htmlContent,
            fileType: 'stx',
          }
        }
      }

      // Check if we have at least one successful build
      if (Object.keys(routes).length === 0) {
        console.error(`${colors.red}No files were successfully processed${colors.reset}`)
        return false
      }

      return true
    }
    catch (error) {
      console.error(`${colors.red}Error processing files:${colors.reset}`, error)
      return false
    }
  }

  // Do initial build
  const buildSuccess = await buildFiles()
  if (!buildSuccess) {
    return false
  }

  // Find an available port (with fallback)
  let actualPort = port
  try {
    actualPort = await findAvailablePort(port)
    if (actualPort !== port) {
      console.log(`${colors.yellow}Port ${port} is busy, using port ${actualPort} instead${colors.reset}`)
    }
  }
  catch {
    console.error(`${colors.red}Could not find an available port${colors.reset}`)
    return false
  }

  // Start a server
  console.log(`${colors.blue}Starting server on ${colors.cyan}http://localhost:${actualPort}/${colors.reset}...`)
  const server = serve({
    port: actualPort,
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
          case '.html':
            contentType = 'text/html'
            break
          case '.css':
            contentType = 'text/css'
            break
          case '.js':
            contentType = 'text/javascript'
            break
          case '.json':
            contentType = 'application/json'
            break
          case '.png':
            contentType = 'image/png'
            break
          case '.jpg':
          case '.jpeg':
            contentType = 'image/jpeg'
            break
          case '.gif':
            contentType = 'image/gif'
            break
        }

        return new Response(file, {
          headers: { 'Content-Type': contentType },
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
  console.log(`\n${colors.blue}stx${colors.reset}  ${colors.green}${process.env.stx_VERSION || 'v0.0.10'}${colors.reset}  ${colors.dim}ready in  ${Math.random() * 10 + 5 | 0}.${Math.random() * 90 + 10 | 0}  ms${colors.reset}`)
  console.log(`\n${colors.bright}→  ${colors.cyan}http://localhost:${port}/${colors.reset}`)

  // Print the routes in Bun-like format
  console.log(`\n${colors.yellow}Routes:${colors.reset}`)

  // Get all routes sorted for display
  const sortedRoutes = Object.entries(routes)
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
    .map(([route, info]) => ({
      route: route === '/' ? '/' : route,
      filePath: path.relative(process.cwd(), info.filePath),
      fileType: info.fileType,
    }))

  // Display routes in tree-like structure
  sortedRoutes.forEach((routeInfo, index) => {
    const isLast = index === sortedRoutes.length - 1
    const prefix = isLast ? '└─ ' : '├─ '
    const fileTypeLabel = routeInfo.fileType === 'md' ? `${colors.magenta}(markdown)${colors.reset}` : ''

    if (routeInfo.route === '/') {
      console.log(`  ${colors.green}${prefix}/${colors.reset} → ${colors.bright}${routeInfo.filePath}${colors.reset} ${fileTypeLabel}`)
    }
    else {
      // Format like '/about → ./about/index.stx'
      const routeParts = routeInfo.route.split('/')
      const lastPart = routeParts[routeParts.length - 1] || routeParts[routeParts.length - 2]
      const displayRoute = routeInfo.route === '/' ? '/' : `/${lastPart}`

      // Get parent path for proper formatting
      let parentPath = routeParts.slice(0, -1).join('/')
      if (parentPath && !parentPath.startsWith('/'))
        parentPath = `/${parentPath}`

      console.log(`  ${colors.green}${prefix}${displayRoute}${colors.reset} → ${colors.bright}${routeInfo.filePath}${colors.reset} ${fileTypeLabel}`)
    }
  })

  console.log(`\nPress ${colors.cyan}h${colors.reset} + ${colors.cyan}Enter${colors.reset} to show shortcuts`)

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
    console.log(`${colors.blue}Watching for changes...${colors.reset}`)

    const watcher = fs.watch(commonDir, { recursive: true }, async (eventType, filename) => {
      if (!filename)
        return

      // Only rebuild if it's a supported file type
      if (filename.endsWith('.stx') || filename.endsWith('.js') || filename.endsWith('.ts') || filename.endsWith('.md')) {
        console.log(`${colors.yellow}File ${colors.bright}${filename}${colors.yellow} changed, rebuilding...${colors.reset}`)
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
  if (paths.length === 0)
    return ''
  if (paths.length === 1)
    return paths[0]

  // Split all paths into components
  const parts = paths.map(p => p.split(path.sep))

  // Find the common prefix
  const commonParts: string[] = []
  for (let i = 0; i < parts[0].length; i++) {
    const part = parts[0][i]
    if (parts.every(p => p[i] === part)) {
      commonParts.push(part)
    }
    else {
      break
    }
  }

  // Join the common parts back into a path
  return commonParts.join(path.sep)
}
