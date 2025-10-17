/* eslint-disable no-console */
/**
 * Example: Using stx programmatically for a documentation system
 * This example shows how to build a VitePress-like documentation system using stx
 */

import type { ServeOptions } from '@stacksjs/stx'
import process from 'node:process'
import { createMiddleware, serve } from '@stacksjs/stx'

// Example configuration (like bunPress.config.ts)
interface DocsConfig {
  title: string
  description: string
  nav: Array<{ text: string, link: string }>
  sidebar: Array<{
    text: string
    items: Array<{ text: string, link: string }>
  }>
}

const docsConfig: DocsConfig = {
  title: 'My Documentation',
  description: 'Documentation built with stx',
  nav: [
    { text: 'Home', link: '/' },
    { text: 'Guide', link: '/guide/' },
    { text: 'API', link: '/api/' },
    { text: 'GitHub', link: 'https://github.com' },
  ],
  sidebar: [
    {
      text: 'Getting Started',
      items: [
        { text: 'Introduction', link: '/guide/intro' },
        { text: 'Installation', link: '/guide/install' },
        { text: 'Quick Start', link: '/guide/quickstart' },
      ],
    },
    {
      text: 'API Reference',
      items: [
        { text: 'Components', link: '/api/components' },
        { text: 'Utilities', link: '/api/utilities' },
      ],
    },
  ],
}

/**
 * Generate sidebar HTML from config
 */
function generateSidebar(config: DocsConfig, currentPath: string): string {
  let html = '<nav class="sidebar">'

  for (const section of config.sidebar) {
    html += `<div class="sidebar-section">
      <h3 class="sidebar-title">${section.text}</h3>
      <ul class="sidebar-items">`

    for (const item of section.items) {
      const isActive = item.link === currentPath
      html += `<li><a href="${item.link}" class="${isActive ? 'active' : ''}">${item.text}</a></li>`
    }

    html += '</ul></div>'
  }

  html += '</nav>'
  return html
}

/**
 * Generate navigation HTML from config
 */
function generateNav(config: DocsConfig): string {
  let html = '<nav class="header-nav">'

  for (const item of config.nav) {
    html += `<a href="${item.link}" class="nav-link">${item.text}</a>`
  }

  html += '</nav>'
  return html
}

/**
 * Wrap content in documentation layout
 */
function wrapInLayout(content: string, config: DocsConfig, currentPath: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <meta name="description" content="${config.description}">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      line-height: 1.7;
    }
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #fff;
      border-bottom: 1px solid #e2e2e3;
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      z-index: 100;
    }
    .header-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-right: 2rem;
    }
    .header-nav {
      display: flex;
      gap: 1.5rem;
    }
    .nav-link {
      color: #476582;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .nav-link:hover {
      color: #3451b2;
    }
    .sidebar {
      position: fixed;
      top: 60px;
      left: 0;
      bottom: 0;
      width: 260px;
      background: #fff;
      border-right: 1px solid #e2e2e3;
      overflow-y: auto;
      padding: 1.5rem 0;
    }
    .sidebar-section {
      margin-bottom: 1.5rem;
    }
    .sidebar-title {
      padding: 0 1.5rem;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .sidebar-items {
      list-style: none;
    }
    .sidebar-items a {
      display: block;
      padding: 0.4rem 1.5rem;
      color: #476582;
      text-decoration: none;
      font-size: 0.9rem;
    }
    .sidebar-items a:hover {
      color: #3451b2;
    }
    .sidebar-items a.active {
      color: #3451b2;
      font-weight: 500;
      border-right: 2px solid #3451b2;
    }
    .main {
      margin-left: 260px;
      margin-top: 60px;
      padding: 2rem 3rem;
      max-width: 900px;
    }
    .content h1 {
      font-size: 2rem;
      margin: 2rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e2e2e3;
    }
    .content h2 {
      font-size: 1.5rem;
      margin: 1.8rem 0 0.8rem;
    }
    .content p {
      margin: 1rem 0;
    }
    .content a {
      color: #3451b2;
      text-decoration: none;
    }
    .content a:hover {
      text-decoration: underline;
    }
    .content code {
      background: #f6f6f7;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      font-family: 'Menlo', 'Monaco', monospace;
      font-size: 0.9em;
    }
    .content pre {
      background: #f6f6f7;
      padding: 1.2rem;
      border-radius: 6px;
      overflow-x: auto;
      margin: 1.5rem 0;
    }
    .content pre code {
      background: none;
      padding: 0;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-title">${config.title}</div>
    ${generateNav(config)}
  </header>

  ${generateSidebar(config, currentPath)}

  <main class="main">
    <article class="content">
      ${content}
    </article>
  </main>
</body>
</html>
  `
}

/**
 * Middleware to wrap markdown/stx output in documentation layout
 */
const layoutMiddleware = createMiddleware(async (request, next) => {
  const response = await next()

  // Only wrap HTML responses
  const contentType = response.headers.get('Content-Type')
  if (!contentType?.includes('text/html')) {
    return response
  }

  const content = await response.text()
  const url = new URL(request.url)
  const wrappedContent = wrapInLayout(content, docsConfig, url.pathname)

  return new Response(wrappedContent, {
    headers: { 'Content-Type': 'text/html' },
  })
})

/**
 * Start the documentation server
 */
async function startDocsServer(): Promise<void> {
  const serverConfig: ServeOptions = {
    port: 3000,
    root: './docs', // Directory containing .md and .stx files
    watch: true,
    middleware: [layoutMiddleware],
    stxOptions: {
      markdown: {
        syntaxHighlighting: {
          enabled: true,
          serverSide: true,
          defaultTheme: 'github-dark',
        },
      },
    },
    onError: (error, request) => {
      console.error('Error:', error)
      return new Response(
        wrapInLayout(
          `<h1>Error</h1><pre>${error.message}\n${error.stack}</pre>`,
          docsConfig,
          new URL(request.url).pathname,
        ),
        {
          status: 500,
          headers: { 'Content-Type': 'text/html' },
        },
      )
    },
    on404: (request) => {
      return new Response(
        wrapInLayout(
          '<h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p>',
          docsConfig,
          new URL(request.url).pathname,
        ),
        {
          status: 404,
          headers: { 'Content-Type': 'text/html' },
        },
      )
    },
  }

  const { server: _server, url, stop } = await serve(serverConfig)

  console.log(`\n📚 Documentation server running at ${url}`)
  console.log('Press Ctrl+C to stop\n')

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down server...')
    stop()
    process.exit(0)
  })
}

// Start server if run directly
if (import.meta.main) {
  startDocsServer().catch(console.error)
}

export { docsConfig, startDocsServer }
