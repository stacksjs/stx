import { test, expect, describe, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from '../../src/index'

// Setup test directories
const TEST_DIR = import.meta.dir
const TEMPLATE_DIR = path.join(TEST_DIR, 'templates')
const OUTPUT_DIR = path.join(TEST_DIR, 'out')

describe('STX Template Integration Tests', () => {
  // Set up test environment
  beforeAll(async () => {
    await fs.promises.mkdir(TEMPLATE_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Create test STX template
    await Bun.write(path.join(TEMPLATE_DIR, 'home.stx'), `
      <!DOCTYPE html>
      <html>
      <head>
        <title>STX Test</title>
        <script>
          module.exports = {
            title: "Welcome to STX",
            items: ["One", "Two", "Three"],
            user: {
              name: "Test User",
              loggedIn: true
            }
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        @if(user.loggedIn)
          <p>Hello, {{ user.name }}!</p>
        @else
          <p>Please log in</p>
        @endif

        <ul>
          @foreach(items as item)
            <li>{{ item }}</li>
          @endforeach
        </ul>
      </body>
      </html>
    `)
  })

  // Clean up after tests
  afterAll(async () => {
    try {
      await fs.promises.rm(TEMPLATE_DIR, { recursive: true, force: true })
      await fs.promises.rm(OUTPUT_DIR, { recursive: true, force: true })
    } catch (error) {
      console.error('Error cleaning up test directories:', error)
    }
  })

  test('should build STX template using plugin', async () => {
    const template = path.join(TEMPLATE_DIR, 'home.stx')

    // Simulate what happens when Bun.serve imports a .stx file
    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    // Verify build was successful
    expect(result.success).toBe(true)

    // Find HTML output
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    expect(htmlOutput).toBeDefined()

    // Read HTML content
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify template was processed correctly
    expect(content).toContain('<h1>Welcome to STX</h1>')
    expect(content).toContain('<p>Hello, Test User!</p>')
    expect(content).not.toContain('Please log in')
    expect(content).toContain('<li>One</li>')
    expect(content).toContain('<li>Two</li>')
    expect(content).toContain('<li>Three</li>')
  })

  test('should handle STX template modifications', async () => {
    const template = path.join(TEMPLATE_DIR, 'home.stx')

    // Update template to change content
    await Bun.write(template, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Updated STX Test</title>
        <script>
          module.exports = {
            title: "Updated STX Title",
            items: ["Apple", "Banana", "Cherry"],
            user: {
              name: "New User",
              loggedIn: false
            }
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        @if(user.loggedIn)
          <p>Hello, {{ user.name }}!</p>
        @else
          <p>Please log in</p>
        @endif

        <ul id="fruit-list">
          @foreach(items as item)
            <li>{{ item }}</li>
          @endforeach
        </ul>
      </body>
      </html>
    `)

    // Build the updated template
    const result = await Bun.build({
      entrypoints: [template],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    expect(htmlOutput).toBeDefined()

    const content = await Bun.file(htmlOutput!.path).text()

    // Verify updated content was processed correctly
    expect(content).toContain('<h1>Updated STX Title</h1>')
    expect(content).toContain('<p>Please log in</p>')
    expect(content).not.toContain('Hello, New User!')
    expect(content).toContain('<ul id="fruit-list">')
    expect(content).toContain('<li>Apple</li>')
    expect(content).toContain('<li>Banana</li>')
    expect(content).toContain('<li>Cherry</li>')
  })

  test('should support conditional rendering with @if directives', async () => {
    // Create a template with conditional logic
    const conditionalTemplate = path.join(TEMPLATE_DIR, 'conditional.stx')
    await Bun.write(conditionalTemplate, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conditional Test</title>
        <script>
          module.exports = {
            features: {
              darkMode: true,
              notifications: false,
              analytics: true
            }
          };
        </script>
      </head>
      <body>
        <div class="features">
          @if(features.darkMode)
            <div id="dark-mode">Dark Mode Enabled</div>
          @endif

          @if(features.notifications)
            <div id="notifications">Notifications Enabled</div>
          @endif

          @if(features.analytics)
            <div id="analytics">Analytics Enabled</div>
          @endif
        </div>
      </body>
      </html>
    `)

    // Build conditional template
    const result = await Bun.build({
      entrypoints: [conditionalTemplate],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    expect(result.success).toBe(true)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html'))
    const content = await Bun.file(htmlOutput!.path).text()

    // Verify conditional rendering
    expect(content).toContain('<div id="dark-mode">Dark Mode Enabled</div>')
    expect(content).not.toContain('<div id="notifications">Notifications Enabled</div>')
    expect(content).toContain('<div id="analytics">Analytics Enabled</div>')
  })
})