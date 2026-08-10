/**
 * A toast follows the APP's theme, not the OS (stacksjs/stx#1912).
 *
 * #1875 fixed this for `stxConfirm` / `stxAlert`, and toast kept the OS-only
 * version:
 *
 *     var isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
 *
 * So an app pinned to light on a dark OS got a dark toast over a light page —
 * the failure #1875 describes, verbatim, on the third surface. Apps offering a
 * `light | dark | system` setting are the common case, and it is what stx's own
 * color-mode boot writes.
 *
 * The reporter's structural point is the reason this is one helper rather than
 * a third copy: toast drifted precisely BECAUSE #1875 was applied at the two
 * dialog call sites instead of somewhere shared. `_resolveDark` is now the only
 * place that decides, and both surfaces call it.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

/** The background the most recent toast rendered with. */
function toastBackground(): string {
  const el = document.querySelector('[data-stx-toast]') as HTMLElement | null
  return el?.style.background ?? ''
}

const DARK = '#1f2937'
const LIGHT = '#ffffff'

describe('toast theme resolution', () => {
  beforeAll(() => {
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  beforeEach(() => {
    document.body.innerHTML = '<div id="stx-toast-container"></div>'
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.removeAttribute('data-color-mode')
  })

  it('is dark when the app sets the dark class', () => {
    document.documentElement.classList.add('dark')
    window.stx.toast.info('hello')

    expect(toastBackground()).toBe(DARK)
  })

  it('is light when the app pins light, whatever the OS says', () => {
    // The reported failure: pinned light, dark OS, dark toast over a light page.
    document.documentElement.setAttribute('data-theme', 'light')
    window.stx.toast.info('hello')

    expect(toastBackground()).toBe(LIGHT)
  })

  it('reads data-color-mode as well as data-theme', () => {
    document.documentElement.setAttribute('data-color-mode', 'dark')
    window.stx.toast.info('hello')

    expect(toastBackground()).toBe(DARK)
  })

  it('lets the call site override, which toast had no way to do before', () => {
    document.documentElement.setAttribute('data-theme', 'light')
    window.stx.toast.info('hello', { dark: true })

    expect(toastBackground()).toBe(DARK)
  })

  it('falls back to light when the app says nothing', () => {
    // happy-dom reports no dark preference, so this is the media-query path.
    window.stx.toast.info('hello')

    expect(toastBackground()).toBe(LIGHT)
  })
})
