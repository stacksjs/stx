import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('stx Basic Variable Rendering', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  // Test basic template with variables
  it('should render basic variables', async () => {
    const testFile = await createTestFile('basic-vars.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Basic Variables Test</title>
        <script>
          module.exports = {
            title: "Hello World",
            subtitle: "Welcome to stx",
            version: 1.0,
            isEnabled: true
          };
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

  // Test with object properties
  it('should handle object properties correctly', async () => {
    const testFile = await createTestFile('object-props.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Object Properties Test</title>
        <script>
          module.exports = {
            user: {
              name: "John",
              email: "john@example.com",
              profile: {
                age: 30,
                location: "New York"
              }
            }
          };
        </script>
      </head>
      <body>
        <div class="user-profile">
          <h2>User Profile</h2>
          <p>Name: {{ user.name }}</p>
          <p>Email: {{ user.email }}</p>
          <p>Age: {{ user.profile.age }}</p>
          <p>Location: {{ user.profile.location }}</p>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Name: John</p>')
    expect(outputHtml).toContain('<p>Email: john@example.com</p>')
    expect(outputHtml).toContain('<p>Age: 30</p>')
    expect(outputHtml).toContain('<p>Location: New York</p>')
  })

  // Test variable with undefined and null values
  it('should handle undefined and null values', async () => {
    const testFile = await createTestFile('null-undefined.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Null/Undefined Test</title>
        <script>
          module.exports = {
            definedValue: "Defined",
            nullValue: null,
            // undefinedValue is intentionally not defined
            objectWithNull: { prop: null },
            emptyString: ""
          };
        </script>
      </head>
      <body>
        <p>Defined: {{ definedValue }}</p>
        <p>Null: {{ nullValue }}</p>
        <p>Undefined: {{ undefinedValue }}</p>
        <p>Object with null: {{ objectWithNull.prop }}</p>
        <p>Empty string: "{{ emptyString }}"</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Defined: Defined</p>')
    expect(outputHtml).toContain('<p>Null: </p>') // Null renders as empty
    expect(outputHtml).toContain('<p>Undefined: </p>') // In the current implementation, undefined renders as empty
    expect(outputHtml).toContain('<p>Object with null: </p>')
    expect(outputHtml).toContain('<p>Empty string: ""</p>')
  })

  // Test with CommonJS module exports
  it('should handle CommonJS module exports', async () => {
    const testFile = await createTestFile('commonjs-exports.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CommonJS Exports Test</title>
        <script>
          const myTitle = "Awesome Product";

          module.exports = {
            myTitle
          };
        </script>
      </head>
      <body>
        <div class="product">
          <h2>{{ myTitle }}</h2>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h2>Awesome Product</h2>')
  })

  // Test Vue-style SFC with <template> tag
  it('should handle Vue-style SFC with <template> tag', async () => {
    const testFile = await createTestFile('sfc-template.stx', `
      <script>
        const title = "Hello from SFC"
        const subtitle = "Template tags work"
      </script>

      <template>
        <div class="container">
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
      </template>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>Hello from SFC</h1>')
    expect(outputHtml).toContain('<p>Template tags work</p>')
    // Should NOT contain the literal <template> tags
    expect(outputHtml).not.toContain('<template>')
    expect(outputHtml).not.toContain('</template>')
  })

  // Test that template tags are optional
  it('should work without <template> tags', async () => {
    const testFile = await createTestFile('no-template-tag.stx', `
      <script>
        const title = "No Template Tag"
      </script>

      <div class="container">
        <h1>{{ title }}</h1>
      </div>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>No Template Tag</h1>')
  })

  // Test SFC with script, template, and style
  it('should handle full SFC with script, template, and style', async () => {
    const testFile = await createTestFile('full-sfc.stx', `
      <script>
        const message = "Full SFC Support"
      </script>

      <template>
        <div class="styled">
          <h1>{{ message }}</h1>
        </div>
      </template>

      <style>
        .styled { color: blue; }
      </style>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>Full SFC Support</h1>')
    expect(outputHtml).not.toContain('<template>')
  })
})
