import type { Middleware } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

describe('STX Middleware', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should run pre-processing middleware before directive processing', async () => {
    // Create a pre-processing middleware that adds a variable to the template
    const preProcessMiddleware: Middleware = {
      name: 'variable-injector',
      handler: (template) => {
        // Inject a variable that will be processed by the template engine
        return template.replace('<!-- PRE_PROCESS_PLACEHOLDER -->', '{{ injectedVariable }}')
      },
      timing: 'before',
      description: 'Injects a variable into the template',
    }

    // Create a test file
    const testFile = await createTestFile('pre-process-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pre-Processing Middleware Test</title>
        <script>
          module.exports = {
            injectedVariable: 'Pre-processed content'
          };
        </script>
      </head>
      <body>
        <h1>Pre-Processing Middleware Test</h1>

        <div>
          <!-- PRE_PROCESS_PLACEHOLDER -->
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [preProcessMiddleware],
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that middleware processed the template and the variable was rendered
    expect(outputHtml).toContain('Pre-processed content')
    expect(outputHtml).not.toContain('PRE_PROCESS_PLACEHOLDER')
  })

  it('should run post-processing middleware after directive processing', async () => {
    // Create a post-processing middleware that transforms the final HTML
    const postProcessMiddleware: Middleware = {
      name: 'html-transformer',
      handler: (template) => {
        // Add a footer to the output HTML
        return template.replace('</body>', '<footer>Added by post-processing middleware</footer></body>')
      },
      timing: 'after',
      description: 'Adds a footer to the final HTML',
    }

    // Create a test file
    const testFile = await createTestFile('post-process-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Post-Processing Middleware Test</title>
      </head>
      <body>
        <h1>Post-Processing Middleware Test</h1>

        <div>
          <p>This is a test for post-processing middleware</p>
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [postProcessMiddleware],
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that middleware processed the final HTML
    expect(outputHtml).toContain('<footer>Added by post-processing middleware</footer>')
  })

  it('should run multiple middleware in sequence', async () => {
    // Create multiple middleware
    const headerMiddleware: Middleware = {
      name: 'header-injector',
      handler: (template) => {
        return template.replace('<body>', '<body><header>Added by pre-processing middleware</header>')
      },
      timing: 'before',
    }

    const footerMiddleware: Middleware = {
      name: 'footer-injector',
      handler: (template) => {
        return template.replace('</body>', '<footer>Added by post-processing middleware</footer></body>')
      },
      timing: 'after',
    }

    const textTransformer: Middleware = {
      name: 'text-transformer',
      handler: (template) => {
        return template.replace('Regular content', 'Transformed content')
      },
      timing: 'after',
    }

    // Create a test file
    const testFile = await createTestFile('multiple-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multiple Middleware Test</title>
      </head>
      <body>
        <h1>Multiple Middleware Test</h1>

        <div>
          <p>Regular content</p>
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [headerMiddleware, footerMiddleware, textTransformer],
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that all middleware applied their transformations
    expect(outputHtml).toContain('<header>Added by pre-processing middleware</header>')
    expect(outputHtml).toContain('<footer>Added by post-processing middleware</footer>')
    expect(outputHtml).toContain('Transformed content')
    expect(outputHtml).not.toContain('Regular content')
  })

  it('should provide context to middleware handlers', async () => {
    // Create a middleware that uses context
    const contextAwareMiddleware: Middleware = {
      name: 'context-aware',
      handler: (template, context) => {
        // Insert the user's name from context
        if (context.user && context.user.name) {
          return template.replace('<!-- USER_NAME -->', context.user.name)
        }
        return template
      },
      timing: 'before',
    }

    // Create a test file
    const testFile = await createTestFile('context-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Context in Middleware Test</title>
        <script>
          module.exports = {
            user: {
              name: 'John Doe',
              role: 'admin'
            }
          };
        </script>
      </head>
      <body>
        <h1>Context in Middleware Test</h1>

        <div>
          <p>Welcome, <!-- USER_NAME --></p>
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [contextAwareMiddleware],
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that middleware used context data
    expect(outputHtml).toContain('Welcome, John Doe')
    expect(outputHtml).not.toContain('<!-- USER_NAME -->')
  })

  it('should handle async middleware', async () => {
    // Create an async middleware
    const asyncMiddleware: Middleware = {
      name: 'async-middleware',
      handler: async (template) => {
        // Simulate an async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return template.replace('<!-- ASYNC_CONTENT -->', 'Content from async middleware')
      },
      timing: 'before',
    }

    // Create a test file
    const testFile = await createTestFile('async-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Async Middleware Test</title>
      </head>
      <body>
        <h1>Async Middleware Test</h1>

        <div>
          <p><!-- ASYNC_CONTENT --></p>
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [asyncMiddleware],
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that async middleware worked
    expect(outputHtml).toContain('Content from async middleware')
    expect(outputHtml).not.toContain('<!-- ASYNC_CONTENT -->')
  })

  it('should provide file path to middleware handlers', async () => {
    // Create a middleware that uses file path
    const filePathMiddleware: Middleware = {
      name: 'file-path-middleware',
      handler: (template, _context, filePath) => {
        const filename = path.basename(filePath)
        return template.replace('<!-- FILE_PATH -->', filename)
      },
      timing: 'before',
    }

    // Create a test file
    const testFile = await createTestFile('file-path-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>File Path in Middleware Test</title>
      </head>
      <body>
        <h1>File Path in Middleware Test</h1>

        <div>
          <p>Current file: <!-- FILE_PATH --></p>
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [filePathMiddleware],
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that middleware used file path
    expect(outputHtml).toContain('Current file: file-path-middleware.stx')
    expect(outputHtml).not.toContain('<!-- FILE_PATH -->')
  })

  it('should handle errors in middleware gracefully', async () => {
    // Create a middleware that throws an error
    const errorMiddleware: Middleware = {
      name: 'error-middleware',
      handler: () => {
        throw new Error('Intentional middleware error')
      },
      timing: 'before',
    }

    // Create a middleware that runs after the error middleware
    const safeMiddleware: Middleware = {
      name: 'safe-middleware',
      handler: (template) => {
        return template.replace('<!-- SAFE_CONTENT -->', 'Content from safe middleware')
      },
      timing: 'before',
    }

    // Create a test file
    const testFile = await createTestFile('error-middleware.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error in Middleware Test</title>
      </head>
      <body>
        <h1>Error in Middleware Test</h1>

        <div>
          <p><!-- SAFE_CONTENT --></p>
        </div>
      </body>
      </html>
    `)

    // Build with middleware
    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        middleware: [errorMiddleware, safeMiddleware],
        debug: true,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that error middleware didn't break processing and safe middleware still ran
    expect(outputHtml).toContain('Content from safe middleware')
    expect(outputHtml).not.toContain('<!-- SAFE_CONTENT -->')
  })
})
