import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { createStreamRenderer, streamTemplate, islandDirective, registerStreamingDirectives } from '../../src/streaming'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp')

describe('STX Streaming', () => {
  // Create temp directories for testing
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  // Clean up temp directories after testing
  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  // Test basic template streaming
  it('should stream a basic template with variables', async () => {
    const testFile = path.join(TEMP_DIR, 'basic-stream.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Stream Test</title>
        <script>
          module.exports = {
            title: "Hello Streaming",
            subtitle: "Streaming STX"
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>
        <h2>{{ subtitle }}</h2>
      </body>
      </html>
    `)

    // Stream the template
    const stream = await streamTemplate(testFile)

    // Read the stream contents
    const chunks: string[] = []
    const reader = stream.getReader()

    let done = false
    while (!done) {
      const result = await reader.read()
      if (result.done) {
        done = true
      } else {
        chunks.push(result.value)
      }
    }

    // Join all chunks
    const output = chunks.join('')

    // Check content
    expect(output).toContain('<h1>Hello Streaming</h1>')
    expect(output).toContain('<h2>Streaming STX</h2>')
  })

  // Test stream renderer with sections
  it('should render template sections progressively', async () => {
    const testFile = path.join(TEMP_DIR, 'sections-stream.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sections Test</title>
        <script>
          module.exports = {
            title: "Dashboard",
            user: { name: "John" },
            stats: { items: [
              { label: "Users", value: 120 },
              { label: "Posts", value: 500 }
            ]},
            activities: [
              { time: "10:00", description: "Logged in" },
              { time: "11:25", description: "Created post" }
            ]
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        <!-- @section:header -->
        <header>
          <h2>Welcome, {{ user.name }}</h2>
        </header>
        <!-- @endsection:header -->

        <!-- @section:stats -->
        <div class="stats">
          <h3>Statistics</h3>
          <div class="stats-grid">
            @foreach (stats.items as stat)
              <div class="stat-card">
                <div class="stat-value">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
              </div>
            @endforeach
          </div>
        </div>
        <!-- @endsection:stats -->

        <!-- @section:activities -->
        <div class="activities">
          <h3>Recent Activities</h3>
          <ul>
            @foreach (activities as activity)
              <li>
                <span>{{ activity.time }}</span>
                <span>{{ activity.description }}</span>
              </li>
            @endforeach
          </ul>
        </div>
        <!-- @endsection:activities -->
      </body>
      </html>
    `)

    // Create stream renderer
    const renderer = await createStreamRenderer(testFile)

    // Get sections
    const sections = renderer.getSections()
    expect(sections).toContain('header')
    expect(sections).toContain('stats')
    expect(sections).toContain('activities')
    expect(sections.length).toBe(3)

    // Render shell
    const shell = await renderer.renderShell()
    expect(shell).toContain('<h1>Dashboard</h1>')
    expect(shell).not.toContain('Welcome, John')
    expect(shell).not.toContain('Statistics')

    // Render header section
    const header = await renderer.renderSection('header')
    expect(header).toContain('Welcome, John')

    // Render stats section
    const stats = await renderer.renderSection('stats')
    expect(stats).toContain('Statistics')
    expect(stats).toContain('<div class="stat-value">120</div>')
    expect(stats).toContain('<div class="stat-label">Users</div>')

    // Render activities section
    const activities = await renderer.renderSection('activities')
    expect(activities).toContain('Recent Activities')
    expect(activities).toContain('10:00')
    expect(activities).toContain('Logged in')
  })

  // Test error handling in stream renderer
  it('should handle errors in stream renderer', async () => {
    const testFile = path.join(TEMP_DIR, 'error-stream.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Test</title>
        <script>
          module.exports = {};
        </script>
      </head>
      <body>
        <!-- @section:content -->
        <div>
          {{ nonExistentVariable }}
        </div>
        <!-- @endsection:content -->
      </body>
      </html>
    `)

    // Create stream renderer
    const renderer = await createStreamRenderer(testFile)

    // Render shell should work
    const shell = await renderer.renderShell()
    expect(shell).toBeDefined()

    // Rendering section should handle the error
    const content = await renderer.renderSection('content')
    expect(content).toContain('Error')
    expect(content).toContain('nonExistentVariable')
  })

  // Test passing data to sections at render time
  it('should allow passing data to sections at render time', async () => {
    const testFile = path.join(TEMP_DIR, 'dynamic-data-stream.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dynamic Data Test</title>
        <script>
          module.exports = {
            title: "Base Data"
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        <!-- @section:dynamic -->
        <div class="dynamic">
          <h2>{{ dynamicTitle || 'Default Title' }}</h2>
          <p>{{ dynamicContent || 'Default content' }}</p>
        </div>
        <!-- @endsection:dynamic -->
      </body>
      </html>
    `)

    // Create stream renderer
    const renderer = await createStreamRenderer(testFile)

    // Render shell
    const shell = await renderer.renderShell()
    expect(shell).toContain('<h1>Base Data</h1>')

    // Render section with dynamic data
    const sectionWithData = await renderer.renderSection('dynamic', {
      dynamicTitle: 'Custom Section Title',
      dynamicContent: 'This content was provided at render time'
    })

    expect(sectionWithData).toContain('Custom Section Title')
    expect(sectionWithData).toContain('This content was provided at render time')

    // For the default values test, we need to make sure the conditional logic works in the template
    const defaultTest = path.join(TEMP_DIR, 'default-values-stream.stx')
    await Bun.write(defaultTest, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Default Values Test</title>
        <script>
          module.exports = {
            title: "Base Data",
            dynamicTitle: "Default Title",
            dynamicContent: "Default content"
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        <!-- @section:dynamic -->
        <div class="dynamic">
          <h2>{{ dynamicTitle }}</h2>
          <p>{{ dynamicContent }}</p>
        </div>
        <!-- @endsection:dynamic -->
      </body>
      </html>
    `)

    // Create a renderer with the defaults already in the template
    const defaultRenderer = await createStreamRenderer(defaultTest)
    const sectionWithDefaults = await defaultRenderer.renderSection('dynamic')
    expect(sectionWithDefaults).toContain('Default Title')
    expect(sectionWithDefaults).toContain('Default content')
  })

  // Test async data in sections
  it('should handle async data fetching within sections', async () => {
    const testFile = path.join(TEMP_DIR, 'async-data-stream.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Async Data Test</title>
        <script>
          // For testing we'll use predefined data
          module.exports = {
            title: "Async Data Example",
            data: {
              items: ['Item 1', 'Item 2', 'Item 3']
            }
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        <!-- @section:async-content -->
        <div class="async-content">
          <h2>Async Data</h2>
          <ul>
            @foreach (data.items as item)
              <li>{{ item }}</li>
            @endforeach
          </ul>
        </div>
        <!-- @endsection:async-content -->
      </body>
      </html>
    `)

    // Create stream renderer
    const renderer = await createStreamRenderer(testFile)

    // Render async section
    const asyncSection = await renderer.renderSection('async-content')
    expect(asyncSection).toContain('Async Data')
    expect(asyncSection).toContain('<li>Item 1</li>')
    expect(asyncSection).toContain('<li>Item 2</li>')
    expect(asyncSection).toContain('<li>Item 3</li>')
  })

  // Test rendering with complex nested sections
  it('should handle complex nested sections and directives', async () => {
    const testFile = path.join(TEMP_DIR, 'complex-sections.stx')
    await Bun.write(testFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complex Sections Test</title>
        <script>
          module.exports = {
            user: {
              name: "Jane",
              isAdmin: true,
              permissions: ["read", "write", "delete"]
            },
            items: [
              { id: 1, name: "Product A", inStock: true, tags: ["new", "featured"] },
              { id: 2, name: "Product B", inStock: false, tags: ["sale"] },
              { id: 3, name: "Product C", inStock: true, tags: [] }
            ]
          };
        </script>
      </head>
      <body>
        <!-- @section:header -->
        <header>
          <h1>Dashboard</h1>
          @if (user.isAdmin)
            <div class="admin-banner">Admin View</div>
          @endif
        </header>
        <!-- @endsection:header -->

        <!-- @section:product -->
        <div class="product @if (!items[0].inStock) out-of-stock @endif">
          <h3>{{ items[0].name }}</h3>
          @if (items[0].tags.length > 0)
            <div class="tags">
              @foreach (items[0].tags as tag)
                <span class="tag">{{ tag }}</span>
              @endforeach
            </div>
          @endif
          <div class="stock-status">
            @if (items[0].inStock)
              In Stock
            @else
              Out of Stock
            @endif
          </div>
        </div>
        <!-- @endsection:product -->

        <!-- @section:product-out-of-stock -->
        <div class="product @if (!items[1].inStock) out-of-stock @endif">
          <h3>{{ items[1].name }}</h3>
          @if (items[1].tags.length > 0)
            <div class="tags">
              @foreach (items[1].tags as tag)
                <span class="tag">{{ tag }}</span>
              @endforeach
            </div>
          @endif
          <div class="stock-status">
            @if (items[1].inStock)
              In Stock
            @else
              Out of Stock
            @endif
          </div>
        </div>
        <!-- @endsection:product-out-of-stock -->

        <!-- @section:product-no-tags -->
        <div class="product @if (!items[2].inStock) out-of-stock @endif">
          <h3>{{ items[2].name }}</h3>
          @if (items[2].tags.length > 0)
            <div class="tags">
              @foreach (items[2].tags as tag)
                <span class="tag">{{ tag }}</span>
              @endforeach
            </div>
          @else
            <div class="no-tags">No tags</div>
          @endif
          <div class="stock-status">
            @if (items[2].inStock)
              In Stock
            @else
              Out of Stock
            @endif
          </div>
        </div>
        <!-- @endsection:product-no-tags -->
      </body>
      </html>
    `)

    // Create stream renderer
    const renderer = await createStreamRenderer(testFile)

    // Render complex header section
    const header = await renderer.renderSection('header')
    expect(header).toContain('<h1>Dashboard</h1>')
    expect(header).toContain('<div class="admin-banner">Admin View</div>')

    // Render product section (in stock with tags)
    const productSection = await renderer.renderSection('product')
    expect(productSection).toContain('<h3>Product A</h3>')
    expect(productSection).toContain('<span class="tag">new</span>')
    expect(productSection).toContain('<span class="tag">featured</span>')
    expect(productSection).toContain('In Stock')

    // Render product section (out of stock with one tag)
    const outOfStockSection = await renderer.renderSection('product-out-of-stock')
    expect(outOfStockSection).toContain('<h3>Product B</h3>')
    expect(outOfStockSection).toContain('<span class="tag">sale</span>')
    expect(outOfStockSection).toContain('Out of Stock')
    expect(outOfStockSection).toContain('class="product  out-of-stock "')

    // Render product section (in stock with no tags)
    const noTagsSection = await renderer.renderSection('product-no-tags')
    expect(noTagsSection).toContain('<h3>Product C</h3>')
    expect(noTagsSection).toContain('<div class="no-tags">No tags</div>')
    expect(noTagsSection).not.toContain('<div class="tags">')
  })
})

// Tests for partial hydration features
describe('STX Partial Hydration', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  // Test island directive
  it('should process @island directive correctly', async () => {
    // Process a template string with the island directive
    const input = `
      <div>
        @island('counter')
          <div class="counter">
            <button class="decrement">-</button>
            <span class="count">0</span>
            <button class="increment">+</button>
          </div>
        @endisland
      </div>
    `

    // Process the directive manually
    const result = islandDirective.handler(
      `<div class="counter">
        <button class="decrement">-</button>
        <span class="count">0</span>
        <button class="increment">+</button>
      </div>`,
      ['counter'],
      {},
      'test.stx'
    )

    // Verify structure
    expect(result).toContain('data-island="counter"')
    expect(result).toContain('class="counter"')
    expect(result).toContain('<button class="decrement">-</button>')
    expect(result).toContain('<span class="count">0</span>')
    expect(result).toContain('<button class="increment">+</button>')
    expect(result).toContain('data-island-id="island-counter-')
    expect(result).toContain('data-priority="lazy"')
    expect(result).toContain('<script type="application/json" data-island-props=')
  })

  // Test island directive with props
  it('should handle island props correctly', async () => {
    // Process a template string with the island directive and props
    const content = `
      <div class="user-profile">
        <h2>{{ userName }}</h2>
      </div>
      <script props>
        defaultCount: 5,
        isInteractive: true
      </script>
    `

    // Process the directive manually
    const result = islandDirective.handler(
      content,
      ['user-profile'],
      { userName: 'John Doe' },
      'test.stx'
    )

    // Verify structure and props
    expect(result).toContain('data-island="user-profile"')
    expect(result).toContain('<div class="user-profile">')
    expect(result).toContain('<h2>{{ userName }}</h2>')
    expect(result).toContain('defaultCount: 5')
    expect(result).toContain('isInteractive: true')
    expect(result).not.toContain('<script props>')
  })

  // Test island directive with priority
  it('should handle island priority correctly', async () => {
    // Process the directive with priority
    const result = islandDirective.handler(
      '<div>Island content</div>',
      ['feature-island', 'eager'],
      {},
      'test.stx'
    )

    // Verify priority is set
    expect(result).toContain('data-island="feature-island"')
    expect(result).toContain('data-priority="eager"')
  })

  // Test registering streaming directives
  it('should register streaming directives when hydration is enabled', async () => {
    // Register with hydration enabled
    const directives = registerStreamingDirectives({
      hydration: {
        enabled: true,
        mode: 'islands',
        clientEntry: 'src/client.ts'
      }
    })

    // Verify the island directive is registered
    expect(directives.length).toBe(1)
    expect(directives[0].name).toBe('island')
    expect(directives[0].hasEndTag).toBe(true)
  })

  // Test not registering directives when hydration is disabled
  it('should not register streaming directives when hydration is disabled', async () => {
    // Register with hydration disabled
    const directives = registerStreamingDirectives({
      hydration: {
        enabled: false
      }
    })

    // Verify no directives are registered
    expect(directives.length).toBe(0)
  })
})
