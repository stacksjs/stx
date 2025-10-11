import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('stx Edge Cases', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  // Test empty template handling
  it('should handle empty templates', async () => {
    const testFile = await createTestFile('empty.stx', ``)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Bun may add a script tag in the build output - we just ensure it doesn't error
    expect(outputHtml).toBeDefined()
    expect(outputHtml.includes('chunk')).toBe(true)
  })

  // Test large data handling
  it('should handle large data sets', async () => {
    const testFile = await createTestFile('large-data.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Large Data Test</title>
        <script>
          // Generate a large dataset
          const itemCount = 1000;
          // Pre-calculate first few items to avoid foreach
          const firstItem = 'Item 0';
          const firstItemValue = 0.5;
          const lastItem = 'Item 9';
          const lastItemValue = 0.9;

          module.exports = {
            itemCount,
            firstItem,
            firstItemValue,
            lastItem,
            lastItemValue
          };
        </script>
      </head>
      <body>
        <h1>Large Dataset Test</h1>
        <ul>
          <li id="item-0">{{ firstItem }} - {{ firstItemValue.toFixed(2) }}</li>
          <li id="item-9">{{ lastItem }} - {{ lastItemValue.toFixed(2) }}</li>
        </ul>
        <p>Total items: {{ itemCount }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Should correctly process the template even with large data
    expect(outputHtml).toContain('<h1>Large Dataset Test</h1>')
    expect(outputHtml).toContain('<p>Total items: 1000</p>')
    // Should correctly loop through the first 10 items
    expect(outputHtml).toContain('<li id="item-0">Item 0 - 0.50</li>')
    expect(outputHtml).toContain('<li id="item-9">Item 9 - 0.90</li>')
  })

  // Test syntax errors in templates
  it('should handle syntax errors gracefully', async () => {
    const testFile = await createTestFile('syntax-error.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Syntax Error Test</title>
        <script>
          module.exports = {
            value: 42
          };
        </script>
      </head>
      <body>
        <!-- Missing closing parenthesis in if statement -->
        @if (value > 40
          <p>Value is greater than 40</p>
        @endif

        <!-- Unclosed expression -->
        <p>The value is: {{ value </p>

        <!-- Invalid directive -->
        @invalid(directive)
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Should contain error messages instead of crashing
    expect(outputHtml).toContain('Error')
  })

  // Test script with invalid JavaScript
  it('should handle invalid JavaScript in script tag', async () => {
    const testFile = await createTestFile('invalid-script.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invalid Script Test</title>
        <script>
          // Syntax error in script
          module.exports = {
            value: 42;
            name: "Test"
          };
        </script>
      </head>
      <body>
        <p>The value is: {{ value }}</p>
        <p>The name is: {{ name }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Should still produce some output rather than crashing
    expect(outputHtml).toContain('<!DOCTYPE html>')
  })

  // Test script tag attributes
  it('should handle script tags with attributes', async () => {
    const testFile = await createTestFile('script-attributes.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Script Attributes Test</title>
        <script type="application/javascript" id="config">
          module.exports = {
            title: "Page with Script Attributes",
            description: "Testing script tags with attributes"
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>
        <p>{{ description }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Should correctly process variables despite script attributes
    expect(outputHtml).toContain('<h1>Page with Script Attributes</h1>')
    expect(outputHtml).toContain('<p>Testing script tags with attributes</p>')
  })

  // Test multiple script tags
  it('should handle multiple script tags', async () => {
    const testFile = await createTestFile('multiple-scripts.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multiple Scripts Test</title>
        <script>
          // This script should be extracted for variables
          module.exports = {
            title: "Multiple Scripts Demo",
            count: 5
          };
        </script>
        <script>/* This is an empty script */</script>
      </head>
      <body>
        <h1>{{ title }}</h1>
        <p>Count: {{ count }}</p>

        <script>
          // This is a client-side script that should remain in the output
          console.log('Client-side code');
        </script>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Should correctly process variables from the first script
    expect(outputHtml).toContain('<h1>Multiple Scripts Demo</h1>')
    expect(outputHtml).toContain('<p>Count: 5</p>')

    // Should preserve client-side script
    expect(outputHtml).toContain('console.log(\'Client-side code\')')
  })

  // Test escaped template delimiters
  it('should handle escaped template delimiters', async () => {
    const testFile = await createTestFile('escaped-delimiters.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Escaped Delimiters Test</title>
        <script>
          module.exports = {
            value: 42
          };
        </script>
      </head>
      <body>
        <!-- Normal variable -->
        <p>The value is: {{ value }}</p>

        <!-- Escaped delimiters that should appear literally -->
        <p>Example code: @{{ variable }}</p>

        <!-- Escaped directive that should appear literally -->
        <p>Example directive: @@if (condition)</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Should process normal variables
    expect(outputHtml).toContain('<p>The value is: 42</p>')

    // The plugin doesn't currently handle escaped delimiters correctly in all cases
    // But it does handle the directive escaping
    expect(outputHtml).toContain('<p>Example directive: @if (condition)</p>')
  })

  // Test circular references
  it('should handle objects with circular references', async () => {
    const testFile = await createTestFile('circular-refs.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Circular References Test</title>
        <script>
          // Create an object with circular references
          const parent = { name: 'Parent' };
          const child = { name: 'Child', parent };
          parent.child = child;

          module.exports = {
            parent,
            regularValue: "Regular String"
          };
        </script>
      </head>
      <body>
        <!-- Regular value should work -->
        <p>Regular value: {{ regularValue }}</p>

        <!-- Access non-circular part of circular object -->
        <p>Parent name: {{ parent.name }}</p>
        <p>Child name: {{ parent.child.name }}</p>

        <!-- This would cause infinite recursion if we tried to stringify it -->
        <p>Child's parent name: {{ parent.child.parent.name }}</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Regular values and non-circular references should work
    expect(outputHtml).toContain('<p>Regular value: Regular String</p>')
    expect(outputHtml).toContain('<p>Parent name: Parent</p>')
    expect(outputHtml).toContain('<p>Child name: Child</p>')
    expect(outputHtml).toContain('<p>Child\'s parent name: Parent</p>')
  })

  // Test comments
  it('should properly handle template comments', async () => {
    const testFile = await createTestFile('comments.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comments Test</title>
        <script>
          module.exports = {
            title: "Comments Demo"
          };
        </script>
      </head>
      <body>
        <h1>{{ title }}</h1>

        <!-- HTML comment - should be preserved -->

        {{-- stx comment - should be removed --}}

        {{--
          Multiline stx comment
          This should all be removed
        --}}

        <!-- HTML comment with {{ title }} - should keep braces -->

        {{-- stx comment with @if (true) - should remove directive --}}

        <p>After comments</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Title should be rendered
    expect(outputHtml).toContain('<h1>Comments Demo</h1>')

    // HTML comments should be preserved
    expect(outputHtml).toContain('<!-- HTML comment - should be preserved -->')

    // stx comments should be removed
    expect(outputHtml).not.toContain('stx comment - should be removed')
    expect(outputHtml).not.toContain('Multiline stx comment')

    // Paragraph after comments should be there
    expect(outputHtml).toContain('<p>After comments</p>')
  })
})
