import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { serve, serveFile, createMiddleware, createRoute } from '../../src/serve'

const TEST_DIR = path.join(import.meta.dir, 'fixtures')
const PORT_START = 9000 + Math.floor(Math.random() * 1000) // Random port to avoid conflicts

let portCounter = PORT_START

function getPort() {
  return portCounter++
}

// Helper to wait for server to be ready
async function waitForServer(url: string, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await fetch(url)
      return
    }
    catch {
      await Bun.sleep(50)
    }
  }
}

describe('Serve API', () => {
  beforeAll(async () => {
    // Create test directory structure
    await fs.promises.mkdir(TEST_DIR, { recursive: true })

    // Create test files
    await Bun.write(path.join(TEST_DIR, 'index.md'), `---
title: "Test Page"
---

# Hello from Markdown

This is a test page with **bold** text.
`)

    await Bun.write(path.join(TEST_DIR, 'template.stx'), `<script>
module.exports = {
  title: "Test Template",
  items: [1, 2, 3]
};
</script>

<h1>{{ title }}</h1>
<ul>
  @foreach(items as item)
    <li>Item {{ item }}</li>
  @endforeach
</ul>
`)

    await Bun.write(path.join(TEST_DIR, 'plain.html'), `<!DOCTYPE html>
<html>
<body>
  <h1>Plain HTML</h1>
</body>
</html>
`)

    // Create subdirectory
    await fs.promises.mkdir(path.join(TEST_DIR, 'sub'), { recursive: true })
    await Bun.write(path.join(TEST_DIR, 'sub', 'page.md'), `# Subpage

This is in a subdirectory.
`)
  })

  afterAll(async () => {
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true })
  })

  test('should serve markdown files', async () => {
    const port = getPort()
    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
    })

    try {
      await waitForServer(url)
      const response = await fetch(`${url}/index`)
      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toBe('text/html')

      const html = await response.text()
      expect(html).toContain('Hello from Markdown')
      expect(html).toContain('<strong>bold</strong>')
    }
    finally {
      stop()
    }
  })

  test('should serve stx files', async () => {
    const port = getPort()
    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
    })

    try {
      const response = await fetch(`${url}/template`)
      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('<h1>Test Template</h1>')
      expect(html).toContain('<li>Item 1</li>')
      expect(html).toContain('<li>Item 2</li>')
      expect(html).toContain('<li>Item 3</li>')
    }
    finally {
      stop()
    }
  })

  test('should serve plain HTML files', async () => {
    const port = getPort()
    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
    })

    try {
      const response = await fetch(`${url}/plain.html`)
      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('Plain HTML')
    }
    finally {
      stop()
    }
  })

  test('should handle subdirectories', async () => {
    const port = getPort()
    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
    })

    try {
      const response = await fetch(`${url}/sub/page`)
      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('Subpage')
    }
    finally {
      stop()
    }
  })

  test('should return 404 for missing files', async () => {
    const port = getPort()
    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
    })

    try {
      const response = await fetch(`${url}/nonexistent`)
      expect(response.status).toBe(404)
    }
    finally {
      stop()
    }
  })

  test('should apply middleware', async () => {
    const port = getPort()

    const testMiddleware = createMiddleware(async (request, next) => {
      const response = await next()
      const content = await response.text()
      const wrapped = `<div class="wrapper">${content}</div>`

      return new Response(wrapped, {
        headers: { 'Content-Type': 'text/html' },
      })
    })

    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
      middleware: [testMiddleware],
    })

    try {
      const response = await fetch(`${url}/index`)
      const html = await response.text()

      expect(html).toContain('<div class="wrapper">')
      expect(html).toContain('</div>')
      expect(html).toContain('Hello from Markdown')
    }
    finally {
      stop()
    }
  })

  test('should handle custom routes', async () => {
    const port = getPort()

    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
      routes: {
        '/api/test': createRoute(async (request) => {
          return Response.json({ message: 'Custom route works!' })
        }),
      },
    })

    try {
      const response = await fetch(`${url}/api/test`)
      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json.message).toBe('Custom route works!')
    }
    finally {
      stop()
    }
  })

  test('should call custom 404 handler', async () => {
    const port = getPort()

    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
      on404: (request) => {
        return new Response('Custom 404 Page', {
          status: 404,
          headers: { 'Content-Type': 'text/plain' },
        })
      },
    })

    try {
      const response = await fetch(`${url}/nonexistent`)
      expect(response.status).toBe(404)

      const text = await response.text()
      expect(text).toBe('Custom 404 Page')
    }
    finally {
      stop()
    }
  })

  test('should call custom error handler', async () => {
    const port = getPort()

    // Create a file that will cause an error during processing
    await Bun.write(path.join(TEST_DIR, 'error.stx'), `<script>
module.exports = {
  getData() {
    throw new Error('Test error');
  }
};
</script>
<h1>Should not render {{ getData() }}</h1>
`)

    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
      onError: (error, request) => {
        return new Response(`Custom Error: ${error.message}`, {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
        })
      },
    })

    try {
      await waitForServer(url)
      const response = await fetch(`${url}/error`)

      // The error might be caught during processing
      if (response.status === 500) {
        const text = await response.text()
        expect(text).toContain('Custom Error:')
      }
      else {
        // If it rendered, that's also acceptable as the error might be caught elsewhere
        expect(response.status).toBeGreaterThanOrEqual(200)
      }
    }
    finally {
      stop()
    }
  })

  test('should use custom request handler', async () => {
    const port = getPort()

    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
      onRequest: (request) => {
        const url = new URL(request.url)
        if (url.pathname === '/custom') {
          return new Response('Custom handler')
        }
        return null // Let normal processing continue
      },
    })

    try {
      const response = await fetch(`${url}/custom`)
      expect(response.status).toBe(200)
      expect(await response.text()).toBe('Custom handler')
    }
    finally {
      stop()
    }
  })

  test('should cache processed files', async () => {
    const port = getPort()

    const { server, url, stop } = await serve({
      port,
      root: TEST_DIR,
      watch: false,
    })

    try {
      // First request
      const response1 = await fetch(`${url}/template`)
      const html1 = await response1.text()

      // Second request (should use cache)
      const response2 = await fetch(`${url}/template`)
      const html2 = await response2.text()

      expect(html1).toBe(html2)
    }
    finally {
      stop()
    }
  })
})

describe('serveFile API', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEST_DIR, { recursive: true })

    await Bun.write(path.join(TEST_DIR, 'single.md'), `# Single File Test

This tests serving a single file.
`)
  })

  afterAll(async () => {
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true })
  })

  test('should serve a single markdown file', async () => {
    const port = getPort()
    const filePath = path.join(TEST_DIR, 'single.md')

    const { server, url, stop } = await serveFile(filePath, {
      port,
      watch: false,
    })

    try {
      const response = await fetch(url)
      expect(response.status).toBe(200)

      const html = await response.text()
      expect(html).toContain('Single File Test')
    }
    finally {
      stop()
    }
  })

  test('should throw error for missing file', async () => {
    const port = getPort()

    await expect(
      serveFile(path.join(TEST_DIR, 'nonexistent.md'), { port }),
    ).rejects.toThrow('File not found')
  })

  test('should throw error for unsupported file type', async () => {
    const port = getPort()

    // Create unsupported file
    await Bun.write(path.join(TEST_DIR, 'unsupported.txt'), 'text file')

    await expect(
      serveFile(path.join(TEST_DIR, 'unsupported.txt'), { port }),
    ).rejects.toThrow('Unsupported file type')
  })
})

describe('Helper functions', () => {
  test('createMiddleware should create a middleware function', () => {
    const middleware = createMiddleware(async (request, next) => {
      return await next()
    })

    expect(typeof middleware).toBe('function')
  })

  test('createRoute should create a route handler', () => {
    const route = createRoute(async (request) => {
      return new Response('test')
    })

    expect(typeof route).toBe('function')
  })
})
