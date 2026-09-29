/**
 * A bound value cannot introduce a URL scheme the page did not ask for either.
 *
 * The server refuses a scheme substituted into an href (url-safety.ts); the same
 * payload reaches the same attribute through `x-href` over a signal, which the
 * runtime writes with setAttribute long after any server pass. Both halves have
 * to agree, or the fix is a fix only for values that happen to be known at
 * render time -- and a URL held in a signal is exactly the one that came from a
 * fetch.
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 30))

let booted = 0
async function boot(markup: string, scope: Record<string, unknown>): Promise<void> {
  const name = `url_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`
  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()
}

const attr = (selector: string, name: string): string | null =>
  document.querySelector(selector)?.getAttribute(name) ?? null

describe('a bound URL cannot carry a script scheme', () => {
  beforeAll(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('refuses javascript: written through x-href', async () => {
    const url = window.stx.state('javascript:alert(1)')
    await boot('<a data-link x-href="url">L</a>', { url })
    expect(attr('[data-link]', 'href')).toBe('unsafe:javascript:alert(1)')
  })

  it('refuses it when a later update introduces it', async () => {
    const url = window.stx.state('/safe')
    await boot('<a data-late x-href="url">L</a>', { url })
    expect(attr('[data-late]', 'href')).toBe('/safe')

    url.set('javascript:alert(1)')
    await settle()
    expect(attr('[data-late]', 'href')).toBe('unsafe:javascript:alert(1)')

    url.set('/safe/again')
    await settle()
    expect(attr('[data-late]', 'href')).toBe('/safe/again')
  })

  it('reads the scheme through whitespace and case', async () => {
    const url = window.stx.state('  JaVa\tScript:alert(1)')
    await boot('<a data-odd x-href="url">L</a>', { url })
    expect(attr('[data-odd]', 'href')).toStartWith('unsafe:')
  })

  it('applies the same split over data URLs as the server does', async () => {
    const doc = window.stx.state('data:text/html,<b>x</b>')
    await boot('<a data-doc x-href="doc">L</a>', { doc })
    expect(attr('[data-doc]', 'href')).toStartWith('unsafe:data:text/html')

    const svg = window.stx.state('data:image/svg+xml,<svg/>')
    await boot('<img data-svg x-src="svg">', { svg })
    // An <img> does not run script in an SVG it loads, and StxImage inlines its
    // own placeholder this way.
    expect(attr('[data-svg]', 'src')).toBe('data:image/svg+xml,<svg/>')
  })

  it('covers the other binding spellings for the same attribute', async () => {
    const url = window.stx.state('javascript:alert(1)')
    await boot('<a data-colon :href="url">a</a><a data-bind x-bind:href="url">b</a>', { url })
    expect(attr('[data-colon]', 'href')).toStartWith('unsafe:')
    expect(attr('[data-bind]', 'href')).toStartWith('unsafe:')
  })

  it('leaves an ordinary URL and a non-URL attribute alone', async () => {
    const url = window.stx.state('/products?q=javascript:alert(1)')
    const text = window.stx.state('javascript:alert(1)')
    await boot('<a data-ok x-href="url" x-title="text">L</a>', { url, text })
    expect(attr('[data-ok]', 'href')).toBe('/products?q=javascript:alert(1)')
    expect(attr('[data-ok]', 'title')).toBe('javascript:alert(1)')
  })
})
