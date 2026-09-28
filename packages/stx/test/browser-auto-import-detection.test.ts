/**
 * A browser symbol is auto-imported because the code uses it, not because the
 * file says its name.
 *
 * `transformAutoImports` matched BROWSER_CORE_IMPORTS as bare words against raw
 * source, comments and string literals included. A component whose comment
 * mentioned useTimeoutFn — or whose UI copy read "Your Mac can sleep" — got that
 * name added to the destructure it emits:
 *
 *   var { useTimeoutFn } = window.StacksBrowser || {}
 *
 * Nothing called it, so neither the real-import conversion nor the module
 * bootstrap ever supplied it, and the page reported it on every navigation
 * through the auto-import guard as a name the client runtime does not provide.
 * That is true and unfixable from the other end: no export can satisfy a
 * reference nothing needed. `injectBrowserCoreAutoImports` had already learned
 * this one screen down, where its comment records the same "Your Mac can sleep"
 * failure; this is the sibling that never got the lesson.
 *
 * Detection stays a bare word rather than requiring a call, because these are
 * not all functions — BrowserQueryError is a class reached through `instanceof`
 * and `new`, and a `(` requirement would drop real uses with the prose.
 */
import { describe, expect, it } from 'bun:test'
import { transformAutoImports } from '../src/client-script'

const browserImportsFor = (code: string): string[] => transformAutoImports(code).browserImports

describe('browser auto-import detection reads code, not prose', () => {
  it('ignores a name that appears only in a line comment', () => {
    expect(browserImportsFor('// useTimeoutFn defers the work\nconst a = 1')).not.toContain('useTimeoutFn')
  })

  it('ignores a name that appears only in a block comment', () => {
    expect(browserImportsFor('/* see useObjectUrl for the blob case */\nconst a = 1')).not.toContain('useObjectUrl')
  })

  it('ignores a name that appears only inside a string literal', () => {
    // The reported shape: UI copy, not code.
    expect(browserImportsFor('const msg = "Your Mac can sleep"')).not.toContain('sleep')
  })

  it('still detects a real call', () => {
    expect(browserImportsFor('const t = useTimeoutFn(() => {}, 10)')).toContain('useTimeoutFn')
  })

  it('still detects a class used through instanceof', () => {
    // Why detection is not narrowed to `name(`: this use has no call at all.
    const code = 'try { load() } catch (e) { if (e instanceof BrowserQueryError) report(e) }'
    expect(browserImportsFor(code)).toContain('BrowserQueryError')
  })

  it('still detects a class used through new', () => {
    expect(browserImportsFor('throw new BrowserQueryError("nope")')).toContain('BrowserQueryError')
  })

  it('ignores a name used as an object key or as a property of something else', () => {
    // The reported shape: a bundled library building `{ ...rest, delay: wait }`
    // got `delay` auto-imported, and every page said the runtime lacked it.
    expect(browserImportsFor('const options = { ...rest, delay: wait }')).not.toContain('delay')
    expect(browserImportsFor('const o = {\n  delay : 5,\n}')).not.toContain('delay')
    expect(browserImportsFor('timer.delay(20)')).not.toContain('delay')
    expect(browserImportsFor('const d = options?.delay')).not.toContain('delay')
  })

  it('still counts the binding itself, in a ternary, a spread, a shorthand or a call', () => {
    expect(browserImportsFor('await delay(20)')).toContain('delay')
    expect(browserImportsFor('const run = fast ? delay : later')).toContain('delay')
    expect(browserImportsFor('const helpers = { delay }')).toContain('delay')
    expect(browserImportsFor('const all = [...delay]')).toContain('delay')
  })
})
