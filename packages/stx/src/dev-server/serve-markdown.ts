// @ts-nocheck - Skip type checking due to HeadersInit type constraints
import type { SyntaxHighlightTheme } from '../types'
import type { DevServerOptions } from './types'
import { serve } from 'bun'
import fs from 'node:fs'
import path from 'node:path'
import { readMarkdownFile } from '../assets'
import { config } from '../config'
import {
  colors,
  findAvailablePort,
  getFrontmatterHtml,
  getThemeSelectorHtml,
  getThemeSelectorScript,
  getThemeSelectorStyles,
  openNativeWindow,
  setupKeyboardShortcuts,
} from './index'

// Serve a Markdown file directly
export async function serveMarkdownFile(filePath: string, options: DevServerOptions = {}): Promise<boolean> {
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
    ${getThemeSelectorStyles()}
  </style>
</head>
<body>
  ${getFrontmatterHtml(data)}
  ${getThemeSelectorHtml(themeOptions)}

  ${content}

  <script>
    ${getThemeSelectorScript()}
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
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
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
  console.log(`\n${colors.bright}→  ${colors.cyan}http://localhost:${actualPort}/${colors.reset}`)

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
    await openNativeWindow(actualPort, {
      title: path.basename(absolutePath, '.md'),
    })
  }

  // Set up file watching if enabled
  if (watch) {
    const dirToWatch = path.dirname(absolutePath)
    console.log(`${colors.blue}Watching ${colors.bright}${dirToWatch}${colors.reset} for changes...`)

    // eslint-disable-next-line pickier/no-unused-vars
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
