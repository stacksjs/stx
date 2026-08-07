/**
 * Which side a middleware chain thinks it is on (stacksjs/stx#1849).
 *
 * `createMiddlewareContext` sniffed `typeof window === 'undefined'` to decide
 * `isServer`, and `runMiddleware` filters on it: `mode: 'server'` is skipped
 * when not the server, `mode: 'client'` is skipped when it is. That sniff is
 * wrong in any process that has a DOM polyfilled into it, and this repo has two:
 * `bunfig.toml` preloads happy-dom for every test, and `story/visual-testing.ts`
 * imports very-happy-dom at runtime.
 *
 * The consequence is worse than a wrong flag. Under `bun test`, `window` exists,
 * so the filters INVERT — `mode: 'client'` middleware runs and `mode: 'server'`
 * middleware does not. Every existing middleware test in this repo has therefore
 * been asserting the mirror image of production, which is why nothing caught it.
 *
 * The first test below proves the inversion is real rather than theoretical, so
 * the rest cannot quietly become vacuous if the preload ever changes.
 */
import { describe, expect, it } from 'bun:test'
import {
  clearMiddleware,
  createMiddlewareContext,
  defineMiddleware,
  registerMiddleware,
  runMiddleware,
} from '../../src/route-middleware'

function routeTo(path: string) {
  return { path, params: {}, query: {}, fullPath: path, meta: {} } as any
}

describe('the hazard this guards against', () => {
  it('has a real window in this process, which is what broke the sniff', () => {
    // If this ever fails, the preload changed and the inversion tests below
    // stop being meaningful — they would pass for the wrong reason.
    expect(typeof window).not.toBe('undefined')
  })

  it('sniffs the wrong side when a DOM is present', () => {
    const sniffed = createMiddlewareContext(routeTo('/x'), null)

    // Not the behaviour anyone wants — pinned so the fix below has something to
    // be a fix OF.
    expect(sniffed.isServer).toBe(false)
    expect(sniffed.isClient).toBe(true)
  })
})

describe('stating the side explicitly', () => {
  it('overrides the sniff', () => {
    const ctx = createMiddlewareContext(routeTo('/x'), null, undefined, { isServer: true })

    expect(ctx.isServer).toBe(true)
    expect(ctx.isClient).toBe(false)
  })

  it('still sniffs when nothing is stated, so existing callers are unaffected', () => {
    const ctx = createMiddlewareContext(routeTo('/x'), null)

    expect(ctx.isServer).toBe(typeof window === 'undefined')
  })

  it('can state the client side too', () => {
    const ctx = createMiddlewareContext(routeTo('/x'), null, undefined, { isServer: false })

    expect(ctx.isServer).toBe(false)
  })
})

describe('mode filtering, with the side stated', () => {
  it('runs server-mode middleware on the server', async () => {
    // The case that was silently SKIPPED in every test run and in any build
    // process that had loaded a DOM.
    let ran = false
    clearMiddleware()
    registerMiddleware('guard', defineMiddleware(() => { ran = true }, { mode: 'server' }))

    const ctx = createMiddlewareContext(routeTo('/x'), null, undefined, { isServer: true })
    await runMiddleware('guard', ctx)

    expect(ran).toBe(true)
  })

  it('skips client-mode middleware on the server', async () => {
    // The mirror of the above: this one RAN under the old sniff.
    let ran = false
    clearMiddleware()
    registerMiddleware('ui', defineMiddleware(() => { ran = true }, { mode: 'client' }))

    const ctx = createMiddlewareContext(routeTo('/x'), null, undefined, { isServer: true })
    await runMiddleware('ui', ctx)

    expect(ran).toBe(false)
  })

  it('runs universal middleware either way', async () => {
    const sides: boolean[] = []
    clearMiddleware()
    registerMiddleware('both', defineMiddleware((c: any) => { sides.push(c.isServer) }))

    await runMiddleware('both', createMiddlewareContext(routeTo('/x'), null, undefined, { isServer: true }))
    await runMiddleware('both', createMiddlewareContext(routeTo('/x'), null, undefined, { isServer: false }))

    expect(sides).toEqual([true, false])
  })
})
