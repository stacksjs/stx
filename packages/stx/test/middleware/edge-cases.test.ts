/**
 * Middleware edge case tests - redistributed from bugs/ directory.
 *
 * Covers: Middleware Edge Cases from deep-edge-cases.ts.
 */
import { describe, expect, it } from 'bun:test'
import { processMiddleware } from '../../src/middleware'

describe('Middleware Edge Cases', () => {
  it('processMiddleware with no middleware configured', async () => {
    const result = await processMiddleware(
      '<div>test</div>',
      {},
      'test.stx',
      { middleware: [] },
      'before',
    )
    expect(result).toBe('<div>test</div>')
  })

  it('processMiddleware with before timing only runs before handlers', async () => {
    const result = await processMiddleware(
      'input',
      {},
      'test.stx',
      {
        middleware: [
          { name: 'before-mw', timing: 'before', handler: (t: string) => `BEFORE:${t}` },
          { name: 'after-mw', timing: 'after', handler: (t: string) => `AFTER:${t}` },
        ],
      },
      'before',
    )
    expect(result).toBe('BEFORE:input')
  })

  it('processMiddleware continues after one middleware errors', async () => {
    const result = await processMiddleware(
      'input',
      {},
      'test.stx',
      {
        debug: true,
        middleware: [
          {
            name: 'error-mw',
            timing: 'before',
            handler: () => {
              throw new Error('middleware failed')
            },
          },
          { name: 'ok-mw', timing: 'before', handler: (t: string) => `OK:${t}` },
        ],
      },
      'before',
    )
    expect(result).toContain('OK:')
  })

  it('processMiddleware skips middleware with no name', async () => {
    const result = await processMiddleware(
      'input',
      {},
      'test.stx',
      {
        debug: true,
        middleware: [
          { name: '', timing: 'before', handler: (t: string) => `BAD:${t}` },
          { name: 'good', timing: 'before', handler: (t: string) => `GOOD:${t}` },
        ],
      },
      'before',
    )
    expect(result).toBe('GOOD:input')
  })

  it('processMiddleware with handler that returns non-string', async () => {
    const result = await processMiddleware(
      'input',
      {},
      'test.stx',
      {
        debug: true,
        middleware: [
          { name: 'bad-return', timing: 'before', handler: () => 42 as any },
          { name: 'good', timing: 'before', handler: (t: string) => `GOOD:${t}` },
        ],
      },
      'before',
    )
    expect(result).toBe('GOOD:input')
  })

  it('processMiddleware with async handler', async () => {
    const result = await processMiddleware(
      'input',
      {},
      'test.stx',
      {
        middleware: [
          {
            name: 'async-mw',
            timing: 'before',
            handler: async (t: string) => `ASYNC:${t}`,
          },
        ],
      },
      'before',
    )
    expect(result).toBe('ASYNC:input')
  })

  it('middleware can modify context', async () => {
    const ctx: Record<string, any> = {}
    await processMiddleware(
      'input',
      ctx,
      'test.stx',
      {
        middleware: [
          {
            name: 'ctx-mw',
            timing: 'before',
            handler: (t: string, context: Record<string, any>) => {
              context.injected = true
              return t
            },
          },
        ],
      },
      'before',
    )
    expect(ctx.injected).toBe(true)
  })
})
