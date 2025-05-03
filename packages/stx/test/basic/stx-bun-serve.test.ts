import { test, expect, describe, beforeAll, afterAll } from 'bun:test'
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
      import homepage from "./templates/index.stx";
      import dashboard from "./templates/dashboard.stx";

      // API handler function
      async function handleApi(req) {
        const url = new URL(req.url);

        if (url.pathname === "/api/user") {
          return Response.json({
            name: "Test User",
            email: "test@example.com"
          });
        }

        if (url.pathname === "/api/items") {
          return Response.json([
            { id: 1, name: "Item 1" },
            { id: 2, name: "Item 2" },
            { id: 3, name: "Item 3" }
          ]);
        }

        return new Response("Not Found", { status: 404 });
      }

      // Create server
      export const server = serve({
        routes: {
          "/": homepage,
          "/dashboard": dashboard,

          "/api/user": {
            GET: async (req) => {
              return Response.json({
                name: "Test User",
                email: "test@example.com"
              });
            }
          },

          "/api/items": {
            GET: async (req) => {
              return Response.json([
                { id: 1, name: "Item 1" },
                { id: 2, name: "Item 2" },
                { id: 3, name: "Item 3" }
              ]);
            },
            POST: async (req) => {
              const data = await req.json();
              return Response.json({
                success: true,
                message: "Item created",
                item: data
              });
            }
          }
        },

        // Enable development mode
        development: true,

        // Fallback fetch handler
        fetch(req) {
          return handleApi(req);
        }
      });
    `)
  })

  // Clean up test files
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATES_DIR, { recursive: true, force: true });
      await fs.promises.unlink(APP_FILE);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  })

  // Test that STX imports work in Bun.serve
  test('should properly import and use STX templates in Bun.serve routes', async () => {
    // We're not actually starting the server in the test
    // Instead, we verify that the imports are set up correctly and the server object is created

    // Import the app module that uses STX templates
    const { server } = await import(APP_FILE);

    // Verify server was created
    expect(server).toBeDefined();

    // Check that routes were properly set up
    const routes = Object.keys(server.routes || {});
    expect(routes).toContain('/');
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/api/user');
    expect(routes).toContain('/api/items');

    // Test API endpoints
    const userResponse = await server.routes['/api/user'].GET(
      new Request('http://localhost/api/user')
    );
    expect(userResponse).toBeInstanceOf(Response);

    const userData = await userResponse.json();
    expect(userData.name).toBe('Test User');
    expect(userData.email).toBe('test@example.com');

    // Test API POST endpoint
    const itemsPostResponse = await server.routes['/api/items'].POST(
      new Request('http://localhost/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Item' })
      })
    );

    const postResult = await itemsPostResponse.json();
    expect(postResult.success).toBe(true);
    expect(postResult.message).toBe('Item created');
    expect(postResult.item.name).toBe('New Item');
  });
});