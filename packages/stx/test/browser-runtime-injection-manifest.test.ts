/**
 * The names that make a template need `@stacksjs/browser` are the names stx
 * auto-imports from it.
 *
 * `injectBrowserRuntime` decides whether to load the module; the client-script
 * pass decides what to destructure out of `window.StacksBrowser`. They read
 * the same manifest now, but they used to read two hand-maintained lists, and
 * the injector's copy had drifted seven names behind: BrowserQueryError,
 * browserAuth, getBrowserConfig, createBrowserDb, isBrowser, useObjectUrl and
 * useTimeoutFn.
 *
 * A page whose client code used only those got the destructure without the
 * module — `var { useTimeoutFn } = window.StacksBrowser || {}` against a global
 * nothing had defined. Every name came out undefined. It surfaced through the
 * auto-import guard rather than at the call site, so it read as a packaging
 * warning about exports rather than as the missing bootstrap it actually was.
 *
 * Pinned as a set comparison rather than a spot-check: the failure mode here is
 * drift, and drift is only caught by asserting the whole list.
 */
import { describe, expect, it } from 'bun:test'
import { BROWSER_CORE_IMPORTS } from '../src/browser-core-imports'
import { injectBrowserRuntime } from '../src/runtime-injection'

function templateUsing(symbol: string): string {
  return `<html><body><script>const value = ${symbol}()</script></body></html>`
}

function injects(symbol: string): boolean {
  return injectBrowserRuntime(templateUsing(symbol)).includes('@stacksjs/browser')
}

describe('browser runtime injection follows the auto-import manifest', () => {
  it('injects for every name the manifest promises', () => {
    const missed = BROWSER_CORE_IMPORTS.filter(symbol => !injects(symbol))
    expect(missed).toEqual([])
  })

  it('injects for the seven that the drifted list missed', () => {
    // Named individually so a regression reports which one came back rather
    // than only that the set changed.
    for (const symbol of [
      'BrowserQueryError',
      'browserAuth',
      'getBrowserConfig',
      'createBrowserDb',
      'isBrowser',
      'useObjectUrl',
      'useTimeoutFn',
    ]) {
      expect(injects(symbol)).toBe(true)
    }
  })

  it('leaves a template that uses none of them alone', () => {
    // The guard that keeps this from becoming "always inject": the module
    // pulls in the query builder and every app model, so a page with no
    // browser symbols must not pay for it.
    const plain = '<html><body><script>const y = 1</script></body></html>'
    expect(injectBrowserRuntime(plain)).not.toContain('@stacksjs/browser')
  })

  it('ignores the names when they appear in prose rather than in code', () => {
    // The injector reads client code, not copy. A doc page describing
    // useTimeoutFn should not acquire a module import from having said so.
    const prose = '<html><body><p>Call useTimeoutFn to defer work.</p></body></html>'
    expect(injectBrowserRuntime(prose)).not.toContain('@stacksjs/browser')
  })
})
