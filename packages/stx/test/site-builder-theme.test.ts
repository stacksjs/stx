import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { injectThemeBootstrap } from '../src/site-builder/theme'

const BASE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>t</title>
</head>
<body>
  <main>x</main>
</body>
</html>`

function runGuardScript(html: string) {
  const guardMatch = html.match(/<script data-stx-theme-guard="1">([\s\S]*?)<\/script>/)
  if (!guardMatch) throw new Error('FOUC guard script not found in injected HTML')
  // Strip the trailing `;window.__stxThemeGuard=1;` marker — that runs in a real browser to mark
  // idempotency; we want to control it ourselves so the test can re-run apply() cleanly.
  const body = guardMatch[1].replace(/;window\.__stxThemeGuard=1;$/, '')
  // eslint-disable-next-line no-new-func
  new Function(body)()
}

describe('injectThemeBootstrap — defensive re-prepend on SPA nav', () => {
  let originalLS: any
  let listeners: Record<string, Array<(e: any) => void>>

  beforeEach(() => {
    document.head.innerHTML = '<meta charset="UTF-8"><title>t</title>'
    document.body.innerHTML = '<main>x</main>'
    document.documentElement.className = ''
    originalLS = (globalThis as any).localStorage
    const store: Record<string, string> = {}
    ;(globalThis as any).localStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v },
      removeItem: (k: string) => { delete store[k] },
    }
    // very-happy-dom's Window doesn't implement addEventListener/dispatchEvent;
    // polyfill a minimal event target so the FOUC guard's nav listener works.
    listeners = {}
    ;(globalThis.window as any).addEventListener = (type: string, fn: (e: any) => void) => {
      ;(listeners[type] = listeners[type] || []).push(fn)
    }
    ;(globalThis.window as any).dispatchEvent = (e: any) => {
      const arr = listeners[e.type] || []
      for (const fn of arr) fn(e)
      return true
    }
  })

  afterEach(() => {
    ;(globalThis as any).localStorage = originalLS
    delete (globalThis.window as any).addEventListener
    delete (globalThis.window as any).dispatchEvent
  })

  it('creates the unmediated meta as first child of <head> on initial run', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'dark', colors: { light: '#fafafa', dark: '#0a0a0a' } } } as any)
    runGuardScript(html)

    const tc = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null
    expect(tc).not.toBeNull()
    expect(tc!.getAttribute('content')).toBe('#0a0a0a')
    expect(document.head.firstChild).toBe(tc)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('respects stored=light over default=dark and uses light color', () => {
    ;(globalThis as any).localStorage.setItem('theme', 'light')
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'dark', colors: { light: '#fafafa', dark: '#0a0a0a' } } } as any)
    runGuardScript(html)

    const tc = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement
    expect(tc.getAttribute('content')).toBe('#fafafa')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('re-prepends the meta if some code path moved it elsewhere in <head>', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'dark' } } as any)
    runGuardScript(html)

    const tc = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement
    expect(document.head.firstChild).toBe(tc)

    // Simulate a buggy code path that moves the meta to the end of <head>
    tc.remove()
    document.head.appendChild(tc)
    expect(document.head.firstChild).not.toBe(tc)
    expect(document.head.lastChild).toBe(tc)

    // SPA navigation fires stx:navigate; the guard's apply() should re-prepend
    window.dispatchEvent(new CustomEvent('stx:navigate', { detail: { url: '/about' } }))

    expect(document.head.firstChild).toBe(tc)
    // Content should still be correct after the move+re-prepend
    expect(tc.getAttribute('content')).toBe('#000000')
  })

  it('re-creates the meta if it was removed from <head> entirely', () => {
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'dark' } } as any)
    runGuardScript(html)

    const initial = document.querySelector('meta[name="theme-color"]:not([media])')!
    initial.remove()
    expect(document.querySelector('meta[name="theme-color"]:not([media])')).toBeNull()

    window.dispatchEvent(new CustomEvent('stx:navigate', { detail: { url: '/about' } }))

    const re = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement
    expect(re).not.toBeNull()
    expect(document.head.firstChild).toBe(re)
    expect(re.getAttribute('content')).toBe('#000000')
  })

  it('content updates on theme change between navigations', () => {
    ;(globalThis as any).localStorage.setItem('theme', 'dark')
    const html = injectThemeBootstrap(BASE_HTML, { theme: { default: 'auto', colors: { light: '#fff', dark: '#000' } } } as any)
    runGuardScript(html)

    let tc = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement
    expect(tc.getAttribute('content')).toBe('#000')

    ;(globalThis as any).localStorage.setItem('theme', 'light')
    window.dispatchEvent(new CustomEvent('stx:navigate', { detail: { url: '/about' } }))

    tc = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement
    expect(tc.getAttribute('content')).toBe('#fff')
    expect(document.head.firstChild).toBe(tc)
  })
})
