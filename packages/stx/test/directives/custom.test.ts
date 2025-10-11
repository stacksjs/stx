import type { CustomDirective } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('stx Custom Directives', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should process simple custom directive without end tag', async () => {
    // Create a custom directive that makes text uppercase
    const uppercaseDirective: CustomDirective = {
      name: 'uppercase',
      handler: (content, params) => {
        return params[0] ? params[0].toUpperCase() : content.toUpperCase()
      },
      description: 'Converts text to uppercase',
    }

    // Create a test file
    const testFile = await createTestFile('custom-directive-uppercase.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Custom Directive Test</title>
      </head>
      <body>
        <h1>Custom Directive Test</h1>

        <p>Normal text</p>
        <p>@uppercase('hello world')</p>
        <p>@uppercase('this is uppercase')</p>
      </body>
      </html>
    `)

    // Build with custom directive
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [uppercaseDirective],
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that the custom directive worked
    expect(outputHtml).toContain('<p>Normal text</p>')
    expect(outputHtml).toContain('<p>HELLO WORLD</p>')
    expect(outputHtml).toContain('<p>THIS IS UPPERCASE</p>')
  })

  it('should process custom directive with end tag', async () => {
    // Create a custom directive that wraps content in a div with specific class
    const wrapDirective: CustomDirective = {
      name: 'wrap',
      handler: (content, params) => {
        const className = params[0] || 'default-wrapper'
        return `<div class="${className}">${content}</div>`
      },
      hasEndTag: true,
      description: 'Wraps content in a div with the specified class',
    }

    // Create a test file
    const testFile = await createTestFile('custom-directive-wrap.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Custom Directive Test</title>
      </head>
      <body>
        <h1>Custom Directive Test</h1>

        <p>Normal text</p>

        @wrap(highlight)
          <p>This should be wrapped in a div with highlight class</p>
        @endwrap

        @wrap(container)
          <span>Nested content with</span>
          <strong>formatted elements</strong>
        @endwrap

        @wrap
          <p>This uses the default class</p>
        @endwrap
      </body>
      </html>
    `)

    // Build with custom directive
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [wrapDirective],
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that the custom directive worked
    expect(outputHtml).toContain('<div class="highlight">')
    expect(outputHtml).toContain('<div class="container">')
    expect(outputHtml).toContain('<div class="default-wrapper">')
    expect(outputHtml).toContain('<p>This should be wrapped in a div with highlight class</p>')
    expect(outputHtml).toContain('<span>Nested content with</span>')
    expect(outputHtml).toContain('<strong>formatted elements</strong>')
  })

  it('should handle multiple custom directives', async () => {
    // Create multiple custom directives
    const uppercaseDirective: CustomDirective = {
      name: 'uppercase',
      handler: (content, params) => {
        return params[0] ? params[0].toUpperCase() : content.toUpperCase()
      },
    }

    const lowercaseDirective: CustomDirective = {
      name: 'lowercase',
      handler: (content, params) => {
        return params[0] ? params[0].toLowerCase() : content.toLowerCase()
      },
    }

    const highlightDirective: CustomDirective = {
      name: 'highlight',
      handler: (content) => {
        return `<mark>${content}</mark>`
      },
      hasEndTag: true,
    }

    // Create a test file
    const testFile = await createTestFile('custom-directive-multiple.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multiple Custom Directives</title>
      </head>
      <body>
        <h1>Multiple Custom Directives</h1>

        <p>@uppercase('hello world')</p>
        <p>@lowercase('THIS SHOULD BE LOWERCASE')</p>

        @highlight
          <p>This text should be highlighted</p>
        @endhighlight

        @highlight
          @uppercase('nested directives')
        @endhighlight
      </body>
      </html>
    `)

    // Build with custom directives
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [uppercaseDirective, lowercaseDirective, highlightDirective],
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that all custom directives worked
    expect(outputHtml).toContain('<p>HELLO WORLD</p>')
    expect(outputHtml).toContain('<p>this should be lowercase</p>')
    expect(outputHtml).toContain('<mark>')
    expect(outputHtml).toContain('<p>This text should be highlighted</p>')
    expect(outputHtml).toContain('NESTED DIRECTIVES')
  })

  it('should handle custom directives with access to context', async () => {
    // Create a custom directive that accesses context data
    const userInfoDirective: CustomDirective = {
      name: 'userinfo',
      handler: (content, params, context) => {
        const field = params[0] || 'name'
        if (context.user && context.user[field]) {
          return context.user[field]
        }
        return `[No user ${field} available]`
      },
    }

    // Create a test file
    const testFile = await createTestFile('custom-directive-context.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Context Access Test</title>
        <script>
          module.exports = {
            user: {
              name: 'John Doe',
              email: 'john@example.com',
              role: 'admin'
            }
          };
        </script>
      </head>
      <body>
        <h1>User Profile</h1>

        <p>Name: @userinfo('name')</p>
        <p>Email: @userinfo('email')</p>
        <p>Role: @userinfo('role')</p>
        <p>Missing: @userinfo('phone')</p>
      </body>
      </html>
    `)

    // Build with custom directive
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [userInfoDirective],
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that context is properly accessed
    expect(outputHtml).toContain('<p>Name: John Doe</p>')
    expect(outputHtml).toContain('<p>Email: john@example.com</p>')
    expect(outputHtml).toContain('<p>Role: admin</p>')
    expect(outputHtml).toContain('<p>Missing: [No user phone available]</p>')
  })

  it('should handle errors in custom directives gracefully', async () => {
    // Create a custom directive that throws an error
    const errorDirective: CustomDirective = {
      name: 'error',
      handler: () => {
        throw new Error('Intentional test error')
      },
    }

    // Create a test file
    const testFile = await createTestFile('custom-directive-error.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Handling Test</title>
      </head>
      <body>
        <h1>Error Handling Test</h1>

        <p>Before error</p>
        <p>@error('test')</p>
        <p>After error</p>
      </body>
      </html>
    `)

    // Build with custom directive
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [errorDirective],
          debug: true,
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that the error is properly handled with the new format
    expect(outputHtml).toContain('<p>Before error</p>')
    expect(outputHtml).toContain('Custom Directive Error')
    expect(outputHtml).toContain('Intentional test error')
    expect(outputHtml).toContain('<p>After error</p>')
  })

  it('should support async custom directives', async () => {
    // Create an async custom directive that fetches data
    const asyncDirective: CustomDirective = {
      name: 'async',
      handler: async (content, params) => {
        // Simulate an async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return `Async result: ${params[0] || content}`
      },
    }

    // Create a test file with just the simple parameter directive
    const testFile = await createTestFile('custom-directive-async.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Async Custom Directive</title>
      </head>
      <body>
        <h1>Async Custom Directive</h1>

        <p>@async('simple parameter')</p>
      </body>
      </html>
    `)

    // Build with custom directive
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [asyncDirective],
          debug: true,
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that the async directive worked
    expect(outputHtml).toContain('simple parameter')
  })

  it('should support using file paths in custom directives', async () => {
    // Create a custom directive that uses file path
    const fileInfoDirective: CustomDirective = {
      name: 'fileinfo',
      handler: (content, params, context, filePath) => {
        const infoType = params[0] || 'name'

        switch (infoType) {
          case 'name':
            return path.basename(filePath)
          case 'dir':
            return path.dirname(filePath)
          case 'ext':
            return path.extname(filePath)
          default:
            return filePath
        }
      },
    }

    // Create a test file
    const testFile = await createTestFile('custom-directive-filepath.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>File Info Test</title>
      </head>
      <body>
        <h1>File Info Test</h1>

        <p>File name: @fileinfo('name')</p>
        <p>Directory: @fileinfo('dir')</p>
        <p>Extension: @fileinfo('ext')</p>
        <p>Full path: @fileinfo('path')</p>
      </body>
      </html>
    `)

    // Build with custom directive
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin(
        {
          customDirectives: [fileInfoDirective],
        },
      )],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that file path information is correctly processed
    expect(outputHtml).toContain('<p>File name: custom-directive-filepath.stx</p>')
    expect(outputHtml).toContain(`<p>Directory: ${path.resolve(TEMP_DIR)}</p>`)
    expect(outputHtml).toContain('<p>Extension: .stx</p>')
    expect(outputHtml).toContain(TEMP_DIR)
  })
})
