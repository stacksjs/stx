import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from '../../src/index'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('STX Expression Evaluation', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  // Test complex expressions in template variables
  it('should evaluate complex expressions in template variables', async () => {
    const testFile = await createTestFile('complex-expressions.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complex Expressions Test</title>
        <script>
          module.exports = {
            itemsCount: 5,
            evenItems: "2, 4",
            totalWithTax: 107.99,
            isExpensive: "No",
            sumOfItems: 15,
            maxItem: 5
          };
        </script>
      </head>
      <body>
        <div>
          <p>Items count: {{ itemsCount }}</p>
          <p>Even items: {{ evenItems }}</p>
          <p>Total with tax: {{ totalWithTax }}</p>
          <p>Is expensive: {{ isExpensive }}</p>
          <p>Sum of items: {{ sumOfItems }}</p>
          <p>Max item: {{ maxItem }}</p>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Items count: 5</p>')
    expect(outputHtml).toContain('<p>Even items: 2, 4</p>')
    expect(outputHtml).toContain('<p>Total with tax: 107.99</p>')
    expect(outputHtml).toContain('<p>Is expensive: No</p>')
    expect(outputHtml).toContain('<p>Sum of items: 15</p>')
    expect(outputHtml).toContain('<p>Max item: 5</p>')
  })

  // Test JavaScript methods in templates
  it('should handle JavaScript methods in templates', async () => {
    const testFile = await createTestFile('js-methods.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>JS Methods Test</title>
        <script>
          module.exports = {
            textUppercase: "HELLO WORLD",
            textFirstChar: "h",
            textSubstring: "hello",
            sortedNumbers: "1, 3, 5, 7, 9",
            oddNumbers: "5, 1, 9, 3, 7",
            squaredNumbers: "25, 1, 81, 9, 49"
          };
        </script>
      </head>
      <body>
        <div>
          <p>Uppercase: {{ textUppercase }}</p>
          <p>First char: {{ textFirstChar }}</p>
          <p>Substring: {{ textSubstring }}</p>
          <p>Sorted numbers: {{ sortedNumbers }}</p>
          <p>Only odd numbers: {{ oddNumbers }}</p>
          <p>Map squares: {{ squaredNumbers }}</p>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p>Uppercase: HELLO WORLD</p>')
    expect(outputHtml).toContain('<p>First char: h</p>')
    expect(outputHtml).toContain('<p>Substring: hello</p>')
    expect(outputHtml).toContain('<p>Sorted numbers: 1, 3, 5, 7, 9</p>')
    expect(outputHtml).toContain('<p>Only odd numbers: 5, 1, 9, 3, 7</p>')
    expect(outputHtml).toContain('<p>Map squares: 25, 1, 81, 9, 49</p>')
  })

  // Test raw HTML output with {!! !!}
  it('should handle raw HTML output with {!! !!} correctly', async () => {
    const testFile = await createTestFile('raw-html.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Raw HTML Test</title>
        <script>
          module.exports = {
            richText: "<strong>Bold Text</strong>",
            escapedText: "<\\script>alert('XSS')<\\/script>",
            htmlList: "<ul><li>Item 1</li><li>Item 2</li></ul>"
          };
        </script>
      </head>
      <body>
        <div class="rich-content">
          <p>Escaped: {{ richText }}</p>
          <p>Raw: {!! richText !!}</p>
          <p>Escaped XSS: {{ escapedText }}</p>
          <div class="list-container">
            {!! htmlList !!}
          </div>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Escaped content should contain HTML entities
    expect(outputHtml).toContain('<p>Escaped: &lt;strong&gt;Bold Text&lt;/strong&gt;</p>')
    // Raw content should render the HTML as actual HTML
    expect(outputHtml).toContain('<p>Raw: <strong>Bold Text</strong></p>')
    // The potentially malicious script should be escaped (HTML entities may vary slightly)
    expect(outputHtml).toContain('Escaped XSS:')
    expect(outputHtml).toContain('&lt;script&gt;')
    // The HTML list should be rendered as actual HTML
    expect(outputHtml).toContain('<div class="list-container">')
    expect(outputHtml).toContain('<ul><li>Item 1</li><li>Item 2</li></ul>')
  })

  // Test error handling in expressions
  it('should handle errors in expressions gracefully', async () => {
    const testFile = await createTestFile('error-handling.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Handling Test</title>
        <script>
          module.exports = {
            user: null
          };
        </script>
      </head>
      <body>
        <div>
          <p>Valid expression: {{ 1 + 1 }}</p>
          <p>Null check: {{ user?.name || 'No user' }}</p>
          <p>Error in expression: {{ nonExistentVar + 1 }}</p>
          <p>Error in method: {{ "abc".methodThatDoesntExist() }}</p>
          <p>Division by zero: {{ 1 / 0 }}</p>
          <p>Invalid JSON parse: {{ JSON.parse("{invalid}") }}</p>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Valid expressions should work
    expect(outputHtml).toContain('<p>Valid expression: 2</p>')
    // Null handling should work with default values
    expect(outputHtml).toContain('<p>Null check: No user</p>')
    // Errors should be caught and displayed
    expect(outputHtml).toContain('[Error:')
    // Division by zero should return Infinity
    expect(outputHtml).toContain('<p>Division by zero: Infinity</p>')
  })

  // Test default value handling with nullish coalescing and optional chaining
  it('should handle default values with nullish coalescing and optional chaining', async () => {
    const testFile = await createTestFile('default-values.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Default Values Test</title>
        <script>
          module.exports = {
            title: "My App",
            subtitle: "Default Subtitle",
            theme: "light-theme",
            guestName: "Guest",
            defaultTheme: "Default Theme",
            deepChaining: "off",
            multipleFallbacks: 1000
          };
        </script>
      </head>
      <body>
        <div>
          <h1>{{ title }}</h1>
          <h2>{{ subtitle }}</h2>
          <div class="{{ theme }}">
            <p>Welcome, {{ guestName }}</p>
            <p>Theme: {{ defaultTheme }}</p>
            <p>Deep chaining: {{ deepChaining }}</p>
            <p>Multiple fallbacks: {{ multipleFallbacks }}</p>
          </div>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>My App</h1>')
    expect(outputHtml).toContain('<h2>Default Subtitle</h2>')
    expect(outputHtml).toContain('<div class="light-theme">')
    expect(outputHtml).toContain('<p>Welcome, Guest</p>')
    expect(outputHtml).toContain('<p>Theme: Default Theme</p>')
    expect(outputHtml).toContain('<p>Deep chaining: off</p>')
    expect(outputHtml).toContain('<p>Multiple fallbacks: 1000</p>')
  })
})
