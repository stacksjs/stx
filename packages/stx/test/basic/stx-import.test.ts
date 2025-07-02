import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// DOM is already registered by the global setup

// Set up test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

// Create a simple server setup to test STX like Bun.serve's routes
function createTestServer(routes: Record<string, string>) {
  return {
    routes,
    // Mock implementation to simulate Bun.serve's processing
    async process(route: string) {
      const template = routes[route]
      if (!template)
        return null

      // This simulates what Bun.serve would do with an HTML file
      const result = await Bun.build({
        entrypoints: [template],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })

      const outputs = result.outputs || []
      const htmlOutput = outputs.find(o => o.path.endsWith('.html'))
      if (!htmlOutput)
        return null

      return await Bun.file(htmlOutput.path).text()
    },
  }
}

describe('STX Server Import Tests', () => {
  // Set up test files before running tests
  beforeAll(async () => {
    // Create test directories
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Create a simple homepage template
    await Bun.write(path.join(TEMPLATE_DIR, 'home.stx'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>STX Home</title>
        <script>
          module.exports = {
            title: "Welcome to STX",
            showFeature: true,
            features: ["Templates", "Directives", "Components"]
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        @if(showFeature)
          <div class="features">
            <h2>Key Features:</h2>
            <ul>
              @foreach(features as feature)
                <li>{{ feature }}</li>
              @endforeach
            </ul>
          </div>
        @endif

        <button id="btn-primary">Click Me</button>
      </body>
      </html>
    `)

    // Create a dashboard template
    await Bun.write(path.join(TEMPLATE_DIR, 'dashboard.stx'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>STX Dashboard</title>
        <script>
          module.exports = {
            user: {
              name: "Test User",
              role: "Admin"
            },
            stats: {
              visitors: 1024,
              pageviews: 5678
            }
          };
        </script>
      </head>
      <body>
        <header>
          <h1>Dashboard</h1>
          <p>Welcome back, {{ user.name }} ({{ user.role }})</p>
        </header>

        <main>
          <div class="stats-container">
            <div class="stat-box">
              <span class="stat-value">{{ stats.visitors }}</span>
              <span class="stat-label">Visitors</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">{{ stats.pageviews }}</span>
              <span class="stat-label">Pageviews</span>
            </div>
          </div>
        </main>
      </body>
      </html>
    `)
  })

  // Clean up test files after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
      await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should import and render STX templates like HTML files', async () => {
    // Set up routes similar to how Bun.serve would do it
    const homePath = path.join(TEMPLATE_DIR, 'home.stx')
    const dashboardPath = path.join(TEMPLATE_DIR, 'dashboard.stx')

    const server = createTestServer({
      '/': homePath,
      '/dashboard': dashboardPath,
    })

    // Test homepage route
    const homeHtml = await server.process('/')
    expect(homeHtml).toBeDefined()

    // Verify homepage content
    expect(homeHtml).toContain('<h1>Welcome to STX</h1>')
    expect(homeHtml).toContain('<h2>Key Features:</h2>')
    expect(homeHtml).toContain('<li>Templates</li>')
    expect(homeHtml).toContain('<li>Directives</li>')
    expect(homeHtml).toContain('<li>Components</li>')
    expect(homeHtml).toContain('<button id="btn-primary">Click Me</button>')

    // Test dashboard route
    const dashboardHtml = await server.process('/dashboard')
    expect(dashboardHtml).toBeDefined()

    // Verify dashboard content
    expect(dashboardHtml).toContain('<h1>Dashboard</h1>')
    expect(dashboardHtml).toContain('<p>Welcome back, Test User (Admin)</p>')
    expect(dashboardHtml).toContain('<span class="stat-value">1024</span>')
    expect(dashboardHtml).toContain('<span class="stat-label">Visitors</span>')
    expect(dashboardHtml).toContain('<span class="stat-value">5678</span>')
    expect(dashboardHtml).toContain('<span class="stat-label">Pageviews</span>')
  })

  test('should support DOM manipulation after rendering', async () => {
    const server = createTestServer({
      '/': path.join(TEMPLATE_DIR, 'home.stx'),
    })

    const html = await server.process('/')
    expect(html).toBeDefined()

    // Set up HTML in the virtual DOM
    document.body.innerHTML = html || ''

    // Test DOM manipulation
    const h1 = document.querySelector('h1')
    expect(h1?.textContent).toBe('Welcome to STX')

    // Modify button text
    const button = document.querySelector('#btn-primary')
    expect(button?.textContent).toBe('Click Me')

    if (button) {
      button.textContent = 'Clicked!'
      expect(button.textContent).toBe('Clicked!')
    }

    // Verify features list
    const features = document.querySelectorAll('.features li')
    expect(features.length).toBe(3)
    expect(features[0].textContent).toBe('Templates')
    expect(features[1].textContent).toBe('Directives')
    expect(features[2].textContent).toBe('Components')
  })
})
