import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('stx Non-Exported Variables', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('should render variables without export keyword', async () => {
    const testFile = await createTestFile('non-exported-vars.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Non-Exported Variables Test</title>
        <script>
          const title = "Hello World"
          const subtitle = "Welcome to stx"
          const version = 1.0
          const isEnabled = true
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>
        <h2>{{ subtitle }}</h2>
        <p>Version: {{ version }}</p>
        <p>Enabled: {{ isEnabled }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>Hello World</h1>')
    expect(outputHtml).toContain('<h2>Welcome to stx</h2>')
    expect(outputHtml).toContain('<p>Version: 1</p>')
    expect(outputHtml).toContain('<p>Enabled: true</p>')
  })

  it('should render functions without export keyword', async () => {
    const testFile = await createTestFile('non-exported-functions.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Non-Exported Functions Test</title>
        <script>
          function greet(name) {
            return \`Hello, \${name}!\`
          }

          function add(a, b) {
            return a + b
          }

          const name = "Alice"
        </script>
      </head>
      <body>
        <p>{{ greet(name) }}</p>
        <p>Sum: {{ add(5, 3) }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Hello, Alice!</p>')
    expect(outputHtml).toContain('<p>Sum: 8</p>')
  })

  it('should handle mix of exported and non-exported variables', async () => {
    const testFile = await createTestFile('mixed-exports.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Mixed Exports Test</title>
        <script>
          // Non-exported
          const title = "My Title"
          const count = 42

          // Exported
          export const subtitle = "My Subtitle"
          export const enabled = true
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>
        <h2>{{ subtitle }}</h2>
        <p>Count: {{ count }}</p>
        <p>Enabled: {{ enabled }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>My Title</h1>')
    expect(outputHtml).toContain('<h2>My Subtitle</h2>')
    expect(outputHtml).toContain('<p>Count: 42</p>')
    expect(outputHtml).toContain('<p>Enabled: true</p>')
  })

  it('should handle let and var declarations without export', async () => {
    const testFile = await createTestFile('let-var-declarations.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Let/Var Test</title>
        <script>
          let counter = 10
          var message = "Test Message"
          const status = "active"
        </script>
      </head>
      <body>
        <p>Counter: {{ counter }}</p>
        <p>Message: {{ message }}</p>
        <p>Status: {{ status }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Counter: 10</p>')
    expect(outputHtml).toContain('<p>Message: Test Message</p>')
    expect(outputHtml).toContain('<p>Status: active</p>')
  })

  it('should handle complex objects without export', async () => {
    const testFile = await createTestFile('complex-objects.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complex Objects Test</title>
        <script>
          const user = {
            name: "John Doe",
            age: 30,
            email: "john@example.com",
            address: {
              street: "123 Main St",
              city: "New York"
            }
          }

          const items = [
            { id: 1, name: "Item 1" },
            { id: 2, name: "Item 2" },
            { id: 3, name: "Item 3" }
          ]
        </script>
      </head>
      <body>
        <div>
          <h2>{{ user.name }}</h2>
          <p>Age: {{ user.age }}</p>
          <p>Email: {{ user.email }}</p>
          <p>City: {{ user.address.city }}</p>
        </div>
        @foreach(item in items)
          <div class="item">{{ item.name }}</div>
        @endforeach
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h2>John Doe</h2>')
    expect(outputHtml).toContain('<p>Age: 30</p>')
    expect(outputHtml).toContain('<p>Email: john@example.com</p>')
    expect(outputHtml).toContain('<p>City: New York</p>')
    expect(outputHtml).toContain('<div class="item">Item 1</div>')
    expect(outputHtml).toContain('<div class="item">Item 2</div>')
    expect(outputHtml).toContain('<div class="item">Item 3</div>')
  })

  it('should handle arrow functions without export', async () => {
    const testFile = await createTestFile('arrow-functions.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Arrow Functions Test</title>
        <script>
          const double = (x) => x * 2
          const greet = (name) => \`Welcome, \${name}!\`
          const value = 5
        </script>
      </head>
      <body>
        <p>Double: {{ double(value) }}</p>
        <p>{{ greet("Alice") }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Double: 10</p>')
    expect(outputHtml).toContain('<p>Welcome, Alice!</p>')
  })
})
