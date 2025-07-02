import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'

// DOM is already registered by the global setup

// Set up test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')
const API_ROUTES = path.join(TEST_DIR, 'api')

// Mock Bun.serve implementation for testing
class MockServer {
  routes: Record<string, any>
  apiHandlers: Record<string, any>
  development: boolean

  constructor(options: {
    routes?: Record<string, any>
    development?: boolean
  }) {
    this.routes = options.routes || {}
    this.apiHandlers = {}
    this.development = options.development || false

    // Extract API handlers from routes object
    for (const [route, handler] of Object.entries(this.routes)) {
      if (typeof handler === 'object' && (handler.GET || handler.POST)) {
        this.apiHandlers[route] = handler
        delete this.routes[route]
      }
    }
  }

  // Process static routes (STX files)
  async processStaticRoute(route: string) {
    const template = this.routes[route]
    if (!template)
      return null

    // Simulate what Bun.serve would do with an STX file
    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      define: {
        'process.env.NODE_ENV': this.development ? '"development"' : '"production"',
      },
    })

    const outputs = result.outputs || []
    const htmlOutput = outputs.find(o => o.path.endsWith('.html'))
    if (!htmlOutput)
      return null

    return await Bun.file(htmlOutput.path).text()
  }

  // Process API route
  async processApiRoute(route: string, method: 'GET' | 'POST', body?: any) {
    const handler = this.apiHandlers[route]
    if (!handler || !handler[method])
      return null

    // Create mock request
    const request = new Request(`http://localhost${route}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // Call handler
    const response = await handler[method](request)
    return response
  }

  // Get server URL (mock)
  get url() {
    return 'http://localhost:3000'
  }
}

describe('STX with Bun.serve Routes', () => {
  // Set up test files before running tests
  beforeAll(async () => {
    // Create test directories
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
    await fs.promises.mkdir(API_ROUTES, { recursive: true })

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

    // Create API handler
    await Bun.write(path.join(API_ROUTES, 'users.ts'), `
      export default {
        async GET(req) {
          const users = [
            { id: 1, name: "John Doe" },
            { id: 2, name: "Jane Smith" }
          ];
          return Response.json(users);
        },

        async POST(req) {
          const data = await req.json();
          return Response.json({
            success: true,
            message: "User created",
            data
          });
        }
      };
    `)
  })

  // Clean up test files after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
      await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true })
      await fs.promises.rm(API_ROUTES, { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should serve STX templates as routes and handle API requests', async () => {
    // Import API handlers
    const usersApi = await import(path.join(API_ROUTES, 'users.ts')).then(m => m.default)

    // Create server with routes
    const server = new MockServer({
      routes: {
        '/': path.join(TEMPLATE_DIR, 'home.stx'),
        '/api/users': usersApi,
      },
      development: true,
    })

    // Test homepage route (STX template)
    const homeHtml = await server.processStaticRoute('/')
    expect(homeHtml).toBeDefined()
    expect(homeHtml).toContain('<h1>Welcome to STX</h1>')
    expect(homeHtml).toContain('<h2>Key Features:</h2>')

    // Test API GET endpoint
    const getUsersResponse = await server.processApiRoute('/api/users', 'GET')
    expect(getUsersResponse).toBeInstanceOf(Response)

    const users = await getUsersResponse?.json()
    expect(users).toBeInstanceOf(Array)
    expect(users.length).toBe(2)
    expect(users[0].name).toBe('John Doe')

    // Test API POST endpoint
    const createUserResponse = await server.processApiRoute('/api/users', 'POST', {
      name: 'Alice Brown',
      email: 'alice@example.com',
    })
    expect(createUserResponse).toBeInstanceOf(Response)

    const result = await createUserResponse?.json()
    expect(result.success).toBe(true)
    expect(result.message).toBe('User created')
    expect(result.data.name).toBe('Alice Brown')
  })

  test('should support DOM interaction with rendered STX templates', async () => {
    const server = new MockServer({
      routes: {
        '/': path.join(TEMPLATE_DIR, 'home.stx'),
      },
    })

    const html = await server.processStaticRoute('/')
    expect(html).toBeDefined()

    // Set rendered HTML to document body
    document.body.innerHTML = html || ''

    // Test DOM querying
    const title = document.querySelector('h1')
    expect(title?.textContent).toBe('Welcome to STX')

    // Test DOM manipulation
    const button = document.querySelector('#btn-primary')
    expect(button).not.toBeNull()
    expect(button?.textContent).toBe('Click Me')

    // Simulate click and change text
    let clicked = false
    if (button) {
      button.addEventListener('click', () => {
        clicked = true
        button.textContent = 'Clicked!'
      })

      // Dispatch click event (with error handling for happy-dom readonly property issue)
      try {
        button.__dispatchEvent_safe(new Event('click'))
      } catch (error) {
        // Handle happy-dom readonly property issue by triggering click directly
        (button as HTMLElement).click()
      }

      expect(clicked).toBe(true)
      expect(button.textContent).toBe('Clicked!')
    }

    // Verify list items
    const listItems = document.querySelectorAll('.features li')
    expect(listItems.length).toBe(3)
    expect(Array.from(listItems).map(li => li.textContent)).toEqual([
      'Templates',
      'Directives',
      'Components',
    ])
  })
})
