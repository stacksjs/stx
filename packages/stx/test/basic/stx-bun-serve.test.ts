import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

// DOM is already registered by the global setup

// Test directories
const TEST_DIR = import.meta.dir
const TEMPLATES_DIR = path.join(TEST_DIR, 'templates')

// Create main app file with Bun.serve integration
const APP_FILE = path.join(TEST_DIR, 'app.ts')

describe('STX with Bun.serve direct imports', () => {
  // Set up test files
  beforeAll(async () => {
    // Create templates directory
    await fs.promises.mkdir(TEMPLATES_DIR, { recursive: true })

    // Create STX template files
    await Bun.write(path.join(TEMPLATES_DIR, 'index.stx'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>STX Home</title>
        <script>
          module.exports = {
            title: "Welcome to STX",
            description: "A powerful templating engine for Bun",
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
        <button>Get Started</button>
      </body>
      </html>
    `)

    await Bun.write(path.join(TEMPLATES_DIR, 'dashboard.stx'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard</title>
        <script>
          module.exports = {
            user: { name: "Test User" },
            items: [
              { id: 1, name: "Item 1" },
              { id: 2, name: "Item 2" },
              { id: 3, name: "Item 3" }
            ]
          };
        </script>
      </head>
      <body>
        <h1>Dashboard</h1>
        <p>Welcome, {{ user.name }}</p>

        <div class="items">
          <h2>Your Items</h2>
          <ul>
            @foreach(items as item)
              <li id="item-{{ item.id }}">{{ item.name }}</li>
            @endforeach
          </ul>
        </div>
      </body>
      </html>
    `)

    // Create main app file
    await Bun.write(APP_FILE, `
      import { serve } from "bun";
      import stxPlugin from "bun-plugin-stx";
      import path from "path";

      // Create HTML files from STX templates
      const TEMPLATES_DIR = path.join(import.meta.dir, "templates");

      // Process templates with the plugin
      const { outputs } = await Bun.build({
        entrypoints: [
          path.join(TEMPLATES_DIR, "index.stx"),
          path.join(TEMPLATES_DIR, "dashboard.stx")
        ],
        outdir: path.join(import.meta.dir, "dist"),
        plugins: [stxPlugin]
      });

      // Get HTML content
      const homepageHtml = await Bun.file(outputs.find(o => o.path.includes("index")).path).text();
      const dashboardHtml = await Bun.file(outputs.find(o => o.path.includes("dashboard")).path).text();

      // The fetch handler function that will be used by Bun.serve
      export async function handleRequest(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {
          return new Response(homepageHtml, {
            headers: { "Content-Type": "text/html" }
          });
        }

        if (url.pathname === "/dashboard") {
          return new Response(dashboardHtml, {
            headers: { "Content-Type": "text/html" }
          });
        }

        if (url.pathname === "/api/user") {
          return Response.json({
            name: "Test User",
            email: "test@example.com"
          });
        }

        if (url.pathname === "/api/items") {
          if (req.method === "GET") {
            return Response.json([
              { id: 1, name: "Item 1" },
              { id: 2, name: "Item 2" },
              { id: 3, name: "Item 3" }
            ]);
          }

          if (req.method === "POST") {
            return Response.json({
              success: true,
              message: "Item created",
              item: { name: "New Item" }
            });
          }
        }

        return new Response("Not Found", { status: 404 });
      }

      // Create server using Bun.serve
      export const server = serve({
        port: 3123,
        fetch: handleRequest
      });
    `)
  })

  // Clean up test files
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATES_DIR, { recursive: true, force: true })
      await fs.promises.unlink(APP_FILE)
      await fs.promises.rm(path.join(TEST_DIR, 'dist'), { recursive: true, force: true })
    }
    catch (error) {
      console.error('Error cleaning up test files:', error)
    }
  })

  // Test that STX imports work in Bun.serve
  test('should properly import and use STX templates in Bun.serve routes', async () => {
    // Import the app module that uses STX templates
    const { handleRequest } = await import(APP_FILE)

    // Test each route by directly calling the fetch handler

    // Test homepage route
    const homeRequest = new Request('http://localhost:3123/')
    const homeResponse = await handleRequest(homeRequest)
    expect(homeResponse.status).toBe(200)
    const homeHtml = await homeResponse.text()
    expect(homeHtml).toContain('<h1>Welcome to STX</h1>')

    // Test dashboard route
    const dashboardRequest = new Request('http://localhost:3123/dashboard')
    const dashboardResponse = await handleRequest(dashboardRequest)
    expect(dashboardResponse.status).toBe(200)
    const dashboardHtml = await dashboardResponse.text()
    expect(dashboardHtml).toContain('<h1>Dashboard</h1>')
    expect(dashboardHtml).toContain('Welcome, Test User')

    // Test API
    const userRequest = new Request('http://localhost:3123/api/user')
    const userResponse = await handleRequest(userRequest)
    expect(userResponse.status).toBe(200)
    const userData = await userResponse.json()
    expect(userData.name).toBe('Test User')

    // Test API POST endpoint
    const itemsRequest = new Request('http://localhost:3123/api/items', {
      method: 'POST',
    })
    const itemsResponse = await handleRequest(itemsRequest)
    expect(itemsResponse.status).toBe(200)
    const itemsData = await itemsResponse.json()
    expect(itemsData.success).toBe(true)
    expect(itemsData.item.name).toBe('New Item')
  })
})
