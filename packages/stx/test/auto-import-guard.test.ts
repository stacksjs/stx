import { describe, expect, it } from 'bun:test'
import { generateAutoImportDestructuring } from '../src/client-script'

/**
 * Auto-imported symbols are destructured off `window.stx` /
 * `window.StacksBrowser`. A name that is not there becomes `undefined` in
 * silence, and the script ships. The failure then surfaces much later, inside
 * a handler, as `x is not a function` - or worse, reaches the user as an error
 * message in the UI. The guard turns that into one precise line at load.
 */

/** Run the generated snippet with a stubbed runtime, capturing console.error. */
function runGuard(source: string, runtime: { stx?: Record<string, unknown>, browser?: Record<string, unknown> }): string[] {
  const errors: string[] = []
  const fakeWindow = { stx: runtime.stx ?? {}, StacksBrowser: runtime.browser ?? {} }
  const fn = new Function('window', 'console', source)
  fn(fakeWindow, { error: (msg: string) => errors.push(String(msg)) })
  return errors
}

describe('auto-import guard', () => {
  it('names the missing symbol and where it was expected from', () => {
    const code = generateAutoImportDestructuring([], ['describeThrownError'])

    const errors = runGuard(code, { browser: {} })

    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('describeThrownError')
    expect(errors[0]).toContain('@stacksjs/browser')
  })

  it('suggests the fix that actually works', () => {
    const code = generateAutoImportDestructuring([], ['somethingUnexported'])

    const [error] = runGuard(code, { browser: {} })

    // The resolution is to import it relatively so the bundler inlines it.
    expect(error).toContain('relative path')
  })

  it('stays silent when the runtime provides everything', () => {
    const code = generateAutoImportDestructuring(['state'], ['useAuth'])

    const errors = runGuard(code, { stx: { state: () => {} }, browser: { useAuth: () => {} } })

    expect(errors).toEqual([])
  })

  it('reports each missing symbol separately', () => {
    const code = generateAutoImportDestructuring(['state', 'derived'], ['useAuth'])

    const errors = runGuard(code, { stx: { state: () => {} }, browser: {} })

    expect(errors).toHaveLength(2)
    expect(errors.join(' ')).toContain('derived')
    expect(errors.join(' ')).toContain('useAuth')
  })

  it('distinguishes the two origins', () => {
    const code = generateAutoImportDestructuring(['missingFromStx'], ['missingFromBrowser'])

    const errors = runGuard(code, {})

    const stxError = errors.find(e => e.includes('missingFromStx'))!
    const browserError = errors.find(e => e.includes('missingFromBrowser'))!
    expect(stxError).toContain('from stx')
    expect(browserError).toContain('@stacksjs/browser')
  })

  it('emits nothing at all when there is nothing to auto-import', () => {
    expect(generateAutoImportDestructuring([], [])).toBe('')
  })

  it('still destructures the symbols it guards', () => {
    const code = generateAutoImportDestructuring(['state'], [])

    expect(code).toContain('var { state } = window.stx || window;')
  })
})
