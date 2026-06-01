import type { Middleware } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { processDirectives } from '../../src/process'

/**
 * Middleware is applied by the core pipeline — `runPreProcessingMiddleware` /
 * `runPostProcessingMiddleware` inside `processDirectives` — so these tests
 * drive `processDirectives` directly in the src realm.
 *
 * They previously rendered through `Bun.build({ plugins: [stxPlugin(...)] })`,
 * but that path loads the pipeline from `@stacksjs/stx`'s GITIGNORED dist
 * bundle. When the dist is stale (e.g. a checkout without a fresh `bun run
 * build`), it predates the "run before-middleware against the raw template,
 * BEFORE HTML comments are masked" fix (see process.ts) — so comment-placeholder
 * middleware ran but its result was immediately undone by comment unmasking,
 * and only tag/text-targeting middleware appeared to work. Driving
 * `processDirectives` directly tests the real middleware contract
 * deterministically, independent of dist freshness.
 */
async function render(
  template: string,
  middleware: Middleware[],
  context: Record<string, any> = {},
  filePath = 'middleware-test.stx',
  debug = false,
): Promise<string> {
  return processDirectives(
    template,
    context,
    filePath,
    { middleware, debug, partialsDir: '/tmp', componentsDir: '/tmp' },
    new Set<string>(),
  )
}

describe('stx Middleware', () => {
  it('should run pre-processing middleware before directive processing', async () => {
    // A "before" middleware may inject directives/expressions using an HTML
    // comment as a placeholder; the injected `{{ injectedVariable }}` must then
    // be resolved by the expression pass that runs afterwards.
    const preProcessMiddleware: Middleware = {
      name: 'variable-injector',
      handler: template => template.replace('<!-- PRE_PROCESS_PLACEHOLDER -->', '{{ injectedVariable }}'),
      timing: 'before',
      description: 'Injects a variable into the template',
    }

    const output = await render(
      '<div><!-- PRE_PROCESS_PLACEHOLDER --></div>',
      [preProcessMiddleware],
      { injectedVariable: 'Pre-processed content' },
    )

    expect(output).toContain('Pre-processed content')
    expect(output).not.toContain('PRE_PROCESS_PLACEHOLDER')
  })

  it('should run post-processing middleware after directive processing', async () => {
    const postProcessMiddleware: Middleware = {
      name: 'html-transformer',
      handler: template => template.replace('</body>', '<footer>Added by post-processing middleware</footer></body>'),
      timing: 'after',
      description: 'Adds a footer to the final HTML',
    }

    const output = await render('<body><h1>Post-Processing Middleware Test</h1></body>', [postProcessMiddleware])

    expect(output).toContain('<footer>Added by post-processing middleware</footer>')
  })

  it('should run multiple middleware in sequence', async () => {
    const headerMiddleware: Middleware = {
      name: 'header-injector',
      handler: template => template.replace('<body>', '<body><header>Added by pre-processing middleware</header>'),
      timing: 'before',
    }
    const footerMiddleware: Middleware = {
      name: 'footer-injector',
      handler: template => template.replace('</body>', '<footer>Added by post-processing middleware</footer></body>'),
      timing: 'after',
    }
    const textTransformer: Middleware = {
      name: 'text-transformer',
      handler: template => template.replace('Regular content', 'Transformed content'),
      timing: 'after',
    }

    const output = await render(
      '<body><h1>Multiple Middleware Test</h1><div><p>Regular content</p></div></body>',
      [headerMiddleware, footerMiddleware, textTransformer],
    )

    expect(output).toContain('<header>Added by pre-processing middleware</header>')
    expect(output).toContain('<footer>Added by post-processing middleware</footer>')
    expect(output).toContain('Transformed content')
    expect(output).not.toContain('Regular content')
  })

  it('should provide context to middleware handlers', async () => {
    const contextAwareMiddleware: Middleware = {
      name: 'context-aware',
      handler: (template, context: Record<string, any>) => {
        if (context.user && (context.user as Record<string, any>).name) {
          return template.replace('<!-- USER_NAME -->', (context.user as Record<string, any>).name)
        }
        return template
      },
      timing: 'before',
    }

    const output = await render(
      '<div><p>Welcome, <!-- USER_NAME --></p></div>',
      [contextAwareMiddleware],
      { user: { name: 'John Doe', role: 'admin' } },
    )

    expect(output).toContain('Welcome, John Doe')
    expect(output).not.toContain('<!-- USER_NAME -->')
  })

  it('should handle async middleware', async () => {
    const asyncMiddleware: Middleware = {
      name: 'async-middleware',
      handler: async (template) => {
        // Simulate an async operation
        await new Promise(resolve => setTimeout(resolve, 10))
        return template.replace('<!-- ASYNC_CONTENT -->', 'Content from async middleware')
      },
      timing: 'before',
    }

    const output = await render('<div><p><!-- ASYNC_CONTENT --></p></div>', [asyncMiddleware])

    expect(output).toContain('Content from async middleware')
    expect(output).not.toContain('<!-- ASYNC_CONTENT -->')
  })

  it('should provide file path to middleware handlers', async () => {
    const filePathMiddleware: Middleware = {
      name: 'file-path-middleware',
      handler: (template, _context, filePath) => template.replace('<!-- FILE_PATH -->', path.basename(filePath || '')),
      timing: 'before',
    }

    const output = await render(
      '<div><p>Current file: <!-- FILE_PATH --></p></div>',
      [filePathMiddleware],
      {},
      'file-path-middleware.stx',
    )

    expect(output).toContain('Current file: file-path-middleware.stx')
    expect(output).not.toContain('<!-- FILE_PATH -->')
  })

  it('should handle errors in middleware gracefully', async () => {
    // One middleware throwing must not prevent later middleware from running.
    const errorMiddleware: Middleware = {
      name: 'error-middleware',
      handler: () => {
        throw new Error('Intentional middleware error')
      },
      timing: 'before',
    }
    const safeMiddleware: Middleware = {
      name: 'safe-middleware',
      handler: template => template.replace('<!-- SAFE_CONTENT -->', 'Content from safe middleware'),
      timing: 'before',
    }

    const output = await render(
      '<div><p><!-- SAFE_CONTENT --></p></div>',
      [errorMiddleware, safeMiddleware],
      {},
      'error-middleware.stx',
    )

    expect(output).toContain('Content from safe middleware')
    expect(output).not.toContain('<!-- SAFE_CONTENT -->')
  })
})
