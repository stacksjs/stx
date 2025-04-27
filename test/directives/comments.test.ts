import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from '../../src/index'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('STX Comments', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  it('should properly handle inline blade comments', async () => {
    const testFile = await createTestFile('inline-comments.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inline Comments Test</title>
      </head>
      <body>
        <h1>Inline Comments</h1>
        <p>This content should be visible</p>
        {{-- This is a blade comment that should not appear in output --}}
        <div>
          <span>Visible content</span>
          {{-- Another comment --}}
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

    expect(outputHtml).toContain('<h1>Inline Comments</h1>')
    expect(outputHtml).toContain('<p>This content should be visible</p>')
    expect(outputHtml).toContain('<span>Visible content</span>')
    expect(outputHtml).not.toContain('This is a blade comment that should not appear in output')
    expect(outputHtml).not.toContain('Another comment')
    expect(true).toBe(true)
  })

  it('should properly handle multi-line blade comments', async () => {
    const testFile = await createTestFile('multiline-comments.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multi-line Comments Test</title>
      </head>
      <body>
        <h1>Multi-line Comments</h1>

        {{--
          This is a multi-line comment
          None of this should be visible
          in the final output
        --}}

        <p>This paragraph should be visible</p>

        <div>
          {{--
          <p>This paragraph within comments should NOT be visible</p>
          <ul>
            <li>This list item should not be visible</li>
          </ul>
          --}}
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

    expect(outputHtml).toContain('<h1>Multi-line Comments</h1>')
    expect(outputHtml).toContain('<p>This paragraph should be visible</p>')
    expect(outputHtml).not.toContain('This is a multi-line comment')
    expect(outputHtml).not.toContain('None of this should be visible')
    expect(outputHtml).not.toContain('in the final output')
    expect(outputHtml).not.toContain('This paragraph within comments should NOT be visible')
    expect(outputHtml).not.toContain('This list item should not be visible')
    expect(true).toBe(true)
  })

  it('should properly handle nested comments', async () => {
    const testFile = await createTestFile('nested-comments.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nested Comments Test</title>
      </head>
      <body>
        <h1>Nested Comments</h1>

        {{-- This outer comment contains {{-- another comment --}} inside it --}}

        <p>This content should be visible</p>

        <div>
          {{--
            Comment with {{ variable }} expressions
            and {!! rawOutput !!} inside
          --}}
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

    expect(outputHtml).toContain('<h1>Nested Comments</h1>')
    expect(outputHtml).toContain('<p>This content should be visible</p>')
    expect(outputHtml).not.toContain('This outer comment contains')
    expect(outputHtml).not.toContain('another comment')
    expect(outputHtml).not.toContain('Comment with')
    expect(outputHtml).not.toContain('expressions')
    expect(outputHtml).not.toContain('rawOutput')
    expect(true).toBe(true)
  })

  it('should handle comments that contain HTML code', async () => {
    const testFile = await createTestFile('html-in-comments.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>HTML in Comments Test</title>
      </head>
      <body>
        <h1>HTML in Comments</h1>

        {{--
          <div class="commented-out">
            <h2>This heading should not appear</h2>
            <p>This paragraph inside a comment should not appear</p>
          </div>
        --}}

        <p>This visible paragraph should appear</p>

        {{-- <div data-comment="This avoids using script tags entirely"></div> --}}
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        debug: false,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>HTML in Comments</h1>')
    expect(outputHtml).toContain('<p>This visible paragraph should appear</p>')
    expect(outputHtml).not.toContain('commented-out')
    expect(outputHtml).not.toContain('This heading should not appear')
    expect(outputHtml).not.toContain('This paragraph inside a comment should not appear')
    expect(outputHtml).not.toContain('This avoids using script tags entirely')
    expect(true).toBe(true)
  })

  it('should handle comments that contain Blade directives', async () => {
    const testFile = await createTestFile('directives-in-comments.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Directives in Comments Test</title>
        <script>
          module.exports = {
            items: ['Apple', 'Banana', 'Cherry']
          };
        </script>
      </head>
      <body>
        <h1>Directives in Comments</h1>

        {{--
          @if (true)
            <p>This conditional should not be processed</p>
          @endif
        --}}

        {{--
          @foreach (items as item)
            <li>{{ item }} should not appear</li>
          @endforeach
        --}}

        <p>This content should be visible</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>Directives in Comments</h1>')
    expect(outputHtml).toContain('<p>This content should be visible</p>')
    expect(outputHtml).not.toContain('This conditional should not be processed')
    expect(outputHtml).not.toContain('should not appear')
    expect(outputHtml).not.toContain('Apple')
    expect(outputHtml).not.toContain('Banana')
    expect(true).toBe(true)
  })
})
