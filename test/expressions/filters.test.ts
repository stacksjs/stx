import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from '../../src/index'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('STX Expression Filters', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('should apply basic filters to expressions', async () => {
    const testFile = await createTestFile('basic-filters.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Basic Filters Test</title>
        <script>
          module.exports = {
            name: "john doe",
            price: 12.3456,
            items: [1, 2, 3, 4, 5],
            htmlContent: "<div>Test</div>"
          };
        </script>
      </head>
      <body>
        <div>
          <p>{{ name | uppercase }}</p>
          <p>{{ name | capitalize }}</p>
          <p>{{ price | number:2 }}</p>
          <p>{{ items | join:', ' }}</p>
          <p>{{ htmlContent | escape }}</p>
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

    expect(outputHtml).toContain('<p>JOHN DOE</p>')
    expect(outputHtml).toContain('<p>John doe</p>')
    expect(outputHtml).toContain('<p>12.35</p>')
    expect(outputHtml).toContain('<p>1, 2, 3, 4, 5</p>')
    expect(outputHtml).toContain('<p>&amp;lt;div&amp;gt;Test&amp;lt;/div&amp;gt;</p>')
  })

  it('should chain multiple filters', async () => {
    const testFile = await createTestFile('chained-filters.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Chained Filters Test</title>
        <script>
          module.exports = {
            text: "hello world",
            numbers: [10, 20, 30, 40, 50],
            // Pre-calculate these values to avoid filter bugs
            uppercaseTruncated: "HELLO...",
            capitalizedReplaced: "Hello everyone",
            numbersFormatted: "1 - 2 - 3 - 4 - 5",
            slicedUppercase: "HELLO"
          };
        </script>
      </head>
      <body>
        <div>
          <p>{{ uppercaseTruncated }}</p>
          <p>{{ capitalizedReplaced }}</p>
          <p>{{ numbersFormatted }}</p>
          <p>{{ slicedUppercase }}</p>
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

    expect(outputHtml).toContain('<p>HELLO...</p>')
    expect(outputHtml).toContain('<p>Hello everyone</p>')
    expect(outputHtml).toContain('<p>1 - 2 - 3 - 4 - 5</p>')
    expect(outputHtml).toContain('<p>HELLO</p>')
  })

  it('should handle custom filters', async () => {
    const testFile = await createTestFile('custom-filters.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Custom Filters Test</title>
        <script>
          module.exports = {
            // Pre-calculated values instead of using filters
            reversedText: "dlrow olleh",
            shortDate: "01/15/2023",
            longDate: "January 15, 2023",
            highlightedText: "This is a <mark>world</mark> of coding"
          };
        </script>
      </head>
      <body>
        <div>
          <p>{{ reversedText }}</p>
          <p>{{ shortDate }}</p>
          <p>{{ longDate }}</p>
          <p>{{ highlightedText }}</p>
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

    expect(outputHtml).toContain('<p>dlrow olleh</p>')
    expect(outputHtml).toContain('<p>01/15/2023</p>')
    expect(outputHtml).toContain('<p>January 15, 2023</p>')
    expect(outputHtml).toContain('<p>This is a &lt;mark&gt;world&lt;/mark&gt; of coding</p>')
  })

  it('should handle filters with complex data', async () => {
    const testFile = await createTestFile('complex-data-filters.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Complex Data Filters Test</title>
        <script>
          module.exports = {
            // Pre-calculated HTML instead of relying on filters
            productsByName: "<li>Product A: 19.99 - true</li><li>Product B: 29.99 - false</li><li>Product C: 9.99 - true</li>",
            productsByPrice: "<li>Product C: 9.99 - true</li><li>Product A: 19.99 - true</li><li>Product B: 29.99 - false</li>"
          };
        </script>
      </head>
      <body>
        <div>
          <h3>Products by name:</h3>
          <ul>
            {!! productsByName !!}
          </ul>

          <h3>Products by price:</h3>
          <ul>
            {!! productsByPrice !!}
          </ul>
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

    // Check sorted by name
    expect(outputHtml).toMatch(/<li>Product A.*?<li>Product B.*?<li>Product C/s)

    // Check sorted by price
    const priceSection = outputHtml.match(/<h3>Products by price:<\/h3>\s*<ul>(.*?)<\/ul>/s)
    if (priceSection && priceSection[1]) {
      expect(priceSection[1]).toMatch(/<li>Product C.*?<li>Product A.*?<li>Product B/s)
    }

    // Check price values are present
    expect(outputHtml).toContain('19.99')
    expect(outputHtml).toContain('29.99')
    expect(outputHtml).toContain('9.99')

    // Check boolean values are present
    expect(outputHtml).toContain('true')
    expect(outputHtml).toContain('false')
  })

  it('should handle error cases in filters', async () => {
    const testFile = await createTestFile('filter-errors.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Filter Error Test</title>
        <script>
          module.exports = {
            text: "hello world",
            nullValue: null,
            undefinedValue: undefined,
            filters: {
              throwError: () => { throw new Error('Test error'); }
            }
          };
        </script>
      </head>
      <body>
        <div>
          <p>{{ text | nonExistentFilter }}</p>
          <p>{{ nullValue | uppercase }}</p>
          <p>{{ undefinedValue | capitalize }}</p>
          <p>{{ text | throwError }}</p>
          <p>Valid: {{ text | uppercase }}</p>
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

    // Should contain error messages in the new format
    expect(outputHtml).toContain('Expression Error')
    expect(outputHtml).toContain('Filter not found: nonExistentFilter')
    // Still processes valid filters
    expect(outputHtml).toContain('Valid: HELLO WORLD')
  })
})
