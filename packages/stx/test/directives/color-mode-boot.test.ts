/**
 * Pre-paint color-mode bootstrap (stacksjs/stx#1794).
 *
 * `useColorMode` runs after the signals runtime has loaded and hydration has
 * begun, so it cannot apply the theme before first paint. Apps therefore
 * hand-write a render-blocking snippet in `<head>` and keep it in sync with the
 * composable by hand. This suite covers the generated replacement.
 *
 * The suite that matters most is the last one: it runs the boot script and THEN
 * `useColorMode`, and asserts the root element is untouched by the second step.
 * That equivalence IS the absence of a flash — if the two ever disagree, the
 * boot script sets one thing and hydration immediately undoes it, which is
 * worse than shipping no boot script at all.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { COLOR_MODE_BOOT_MARKER, generateColorModeBootScript, injectColorModeBootScript } from '../../src/color-mode-boot'
import { defaultConfig } from '../../src/config'
import { generateDocumentShell } from '../../src/document-shell'
import { processDirectives } from '../../src/process'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
const g = globalThis as any

// ---------------------------------------------------------------------------
// Controllable environment
// ---------------------------------------------------------------------------

class MemoryStorage {
  private map = new Map<string, string>()
  failGet: Error | null = null

  getItem(key: string): string | null {
    if (this.failGet)
      throw this.failGet
    return this.map.has(key) ? this.map.get(key)! : null
  }

  setItem(key: string, value: string): void { this.map.set(key, value) }
  removeItem(key: string): void { this.map.delete(key) }
  clear(): void { this.map.clear() }
  seed(key: string, raw: string): void { this.map.set(key, raw) }
}

const store = new MemoryStorage()
let systemPrefersDark = false
const saved: Record<string, unknown> = {}

function fakeMatchMedia(query: string) {
  const matches = /prefers-color-scheme:\s*dark/i.test(query) ? systemPrefersDark : false
  return {
    matches,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
  }
}

/** Run the JS out of a generated `<script …>BODY</script>` string. */
function runBootScript(html: string): void {
  const body = /<script[^>]*>([\s\S]*?)<\/script>/.exec(html)
  if (!body)
    throw new Error('no <script> found in generated boot markup')
  // eslint-disable-next-line no-new-func
  new Function(body[1])()
}

function root(): HTMLElement {
  return g.document.documentElement
}

function rootState(): { class: string | null, theme: string | null } {
  return {
    class: root().getAttribute('class'),
    theme: root().getAttribute('data-theme'),
  }
}

function resetRoot(): void {
  root().removeAttribute('class')
  root().removeAttribute('data-theme')
}

beforeAll(() => {
  saved.localStorage = g.localStorage
  saved.matchMedia = g.matchMedia
  saved.windowMatchMedia = g.window?.matchMedia
  saved.windowLocalStorage = g.window?.localStorage

  g.localStorage = store
  g.matchMedia = fakeMatchMedia
  if (g.window) {
    g.window.localStorage = store
    g.window.matchMedia = fakeMatchMedia
  }

  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
})

afterAll(() => {
  g.localStorage = saved.localStorage
  g.matchMedia = saved.matchMedia
  if (g.window) {
    g.window.localStorage = saved.windowLocalStorage
    g.window.matchMedia = saved.windowMatchMedia
  }
})

beforeEach(() => {
  store.clear()
  store.failGet = null
  systemPrefersDark = false
  resetRoot()
  delete g.window.__STX_COLOR_MODE__
})

afterEach(resetRoot)

// ---------------------------------------------------------------------------

describe('generateColorModeBootScript', () => {
  it('emits a marked inline script', () => {
    const script = generateColorModeBootScript()
    expect(script.startsWith(`<script ${COLOR_MODE_BOOT_MARKER}>`)).toBe(true)
    expect(script.endsWith('</script>')).toBe(true)
    // No defer/async/type=module — the whole point is that it blocks.
    expect(script).not.toContain('defer')
    expect(script).not.toContain('async')
    expect(script).not.toContain('type="module"')
  })

  it('carries the configured options into the script', () => {
    const script = generateColorModeBootScript({ storageKey: 'theme', attribute: 'data-theme', darkClass: 'night', initialMode: 'dark' })
    expect(script).toContain('"storageKey":"theme"')
    expect(script).toContain('"attribute":"data-theme"')
    expect(script).toContain('"darkClass":"night"')
    expect(script).toContain('"initialMode":"dark"')
  })

  it('escapes a storage key that would close the script element', () => {
    const script = generateColorModeBootScript({ storageKey: 'a</script><script>alert(1)' })
    // Exactly one closing tag — the payload's is neutralised.
    expect(script.match(/<\/script>/g)).toHaveLength(1)
    expect(script).not.toContain('<script>alert(1)')
    expect(script).toContain('\\u003c')
  })

  it('rejects configuration that cannot be applied safely', () => {
    expect(() => generateColorModeBootScript({ initialMode: 'system' as never })).toThrow(/light, dark, auto/)
    expect(() => generateColorModeBootScript({ darkClass: 'has space' })).toThrow(/CSS class/)
    expect(() => generateColorModeBootScript({ attribute: 'not valid!' })).toThrow(/attribute name/)
    expect(() => generateColorModeBootScript({ storageKey: '' })).toThrow(/non-empty/)
  })
})

describe('injectColorModeBootScript', () => {
  it('puts the script ahead of every stylesheet', () => {
    const html = '<html><head><link rel="stylesheet" href="/app.css"></head><body></body></html>'
    const out = injectColorModeBootScript(html, {})
    // A stylesheet above the script would block its execution, delaying the
    // one thing it exists to do early.
    expect(out.indexOf(COLOR_MODE_BOOT_MARKER)).toBeLessThan(out.indexOf('stylesheet'))
  })

  it('keeps <meta charset> first', () => {
    const html = '<html><head><meta charset="UTF-8"><link rel="stylesheet" href="/a.css"></head><body></body></html>'
    const out = injectColorModeBootScript(html, {})
    expect(out.indexOf('charset')).toBeLessThan(out.indexOf(COLOR_MODE_BOOT_MARKER))
    expect(out.indexOf(COLOR_MODE_BOOT_MARKER)).toBeLessThan(out.indexOf('stylesheet'))
  })

  it('is idempotent', () => {
    const html = '<html><head><title>t</title></head><body></body></html>'
    const once = injectColorModeBootScript(html, {})
    expect(injectColorModeBootScript(once, {})).toBe(once)
    expect(once.match(new RegExp(COLOR_MODE_BOOT_MARKER, 'g'))).toHaveLength(1)
  })

  it('leaves a fragment without a head alone', () => {
    const fragment = '<div>just content</div>'
    expect(injectColorModeBootScript(fragment, {})).toBe(fragment)
  })

  it('handles a head element carrying attributes', () => {
    const html = '<html><head data-x="1"><title>t</title></head><body></body></html>'
    expect(injectColorModeBootScript(html, {})).toContain(COLOR_MODE_BOOT_MARKER)
  })
})

describe('boot script behaviour', () => {
  it('applies the dark class from a stored preference', () => {
    store.seed('stx-color-mode', 'dark')
    runBootScript(generateColorModeBootScript())
    expect(root().getAttribute('class')).toContain('dark')
  })

  it('leaves the class off for a stored light preference', () => {
    store.seed('stx-color-mode', 'light')
    runBootScript(generateColorModeBootScript())
    expect(root().getAttribute('class') || '').not.toContain('dark')
  })

  it('resolves auto against the system preference', () => {
    store.seed('stx-color-mode', 'auto')
    systemPrefersDark = true
    runBootScript(generateColorModeBootScript())
    expect(root().getAttribute('class')).toContain('dark')
  })

  it('falls back to initialMode when nothing is stored', () => {
    runBootScript(generateColorModeBootScript({ initialMode: 'dark' }))
    expect(root().getAttribute('class')).toContain('dark')
  })

  it('ignores a stored value outside the accepted vocabulary', () => {
    // Mirrors useColorMode's readPersisted, which accepts light|dark|auto only.
    // 'system' is deliberately NOT accepted here — see stacksjs/stx#1788.
    store.seed('stx-color-mode', 'system')
    runBootScript(generateColorModeBootScript({ initialMode: 'light' }))
    expect(root().getAttribute('class') || '').not.toContain('dark')
  })

  it('sets the attribute instead of the class when one is configured', () => {
    store.seed('stx-color-mode', 'dark')
    runBootScript(generateColorModeBootScript({ attribute: 'data-theme' }))
    expect(root().getAttribute('data-theme')).toBe('dark')
    // Either/or, exactly like useColorMode's applyDOM (see #1788).
    expect(root().getAttribute('class') || '').not.toContain('dark')
  })

  it('degrades to the default when storage throws', () => {
    // Sandboxed iframe / storage disabled. This script sits above the whole
    // application shell, so an uncaught throw here blocks the document.
    store.failGet = new Error('SecurityError')
    expect(() => runBootScript(generateColorModeBootScript({ initialMode: 'dark' }))).not.toThrow()
    expect(root().getAttribute('class')).toContain('dark')
  })

  it('publishes its resolved config for the composable to pick up', () => {
    store.seed('theme', 'dark')
    runBootScript(generateColorModeBootScript({ storageKey: 'theme', darkClass: 'night' }))
    expect(g.window.__STX_COLOR_MODE__).toMatchObject({
      storageKey: 'theme',
      darkClass: 'night',
      preference: 'dark',
      mode: 'dark',
    })
  })
})

describe('document shell integration', () => {
  it('emits the boot script above the stylesheets it injects', () => {
    const html = generateDocumentShell('<div>hi</div>', {}, {
      colorMode: { storageKey: 'theme' },
      styles: ['<style>body{color:red}</style>'],
    })
    expect(html.indexOf(COLOR_MODE_BOOT_MARKER)).toBeLessThan(html.indexOf('<style>body'))
    expect(html.indexOf('charset')).toBeLessThan(html.indexOf(COLOR_MODE_BOOT_MARKER))
  })

  it('emits nothing when colorMode is not configured', () => {
    const html = generateDocumentShell('<div>hi</div>', {}, {})
    expect(html).not.toContain(COLOR_MODE_BOOT_MARKER)
  })
})

describe('wiring through processDirectives', () => {
  const base = { ...defaultConfig, partialsDir: '/tmp', componentsDir: '/tmp', autoShell: true }

  it('injects from app.colorMode when stx generates the shell', async () => {
    const result = await processDirectives('<h1>Hello</h1>', {}, '/test.stx', {
      ...base,
      app: { colorMode: { storageKey: 'theme' } },
    } as any, new Set<string>())

    expect(result).toContain(COLOR_MODE_BOOT_MARKER)
    expect(result).toContain('"storageKey":"theme"')
  })

  it('injects into a head the page brought itself', async () => {
    // The common case, and what SSG emits — ensureDocumentShell is a no-op
    // here, so without a separate injection the boot script would never land.
    const page = '<!DOCTYPE html><html><head><meta charset="UTF-8"><link rel="stylesheet" href="/a.css"></head><body><h1>Hi</h1></body></html>'
    const result = await processDirectives(page, {}, '/test.stx', {
      ...base,
      app: { colorMode: { storageKey: 'theme' } },
    } as any, new Set<string>())

    expect(result).toContain(COLOR_MODE_BOOT_MARKER)
    expect(result.indexOf(COLOR_MODE_BOOT_MARKER)).toBeLessThan(result.indexOf('stylesheet'))
    expect(result.match(new RegExp(COLOR_MODE_BOOT_MARKER, 'g'))).toHaveLength(1)
  })

  it('stays out of the way when app.colorMode is unset', async () => {
    const result = await processDirectives('<h1>Hello</h1>', {}, '/test.stx', base as any, new Set<string>())
    expect(result).not.toContain(COLOR_MODE_BOOT_MARKER)
  })
})

describe('lockstep with useColorMode (no flash on hydration)', () => {
  // Each case: what's stored, what the system says, and how the app configured
  // the composable. For every one, hydration must be a no-op on the root
  // element — that equivalence is precisely "no flash".
  const cases: Array<{ name: string, stored?: string, systemDark: boolean, options: Record<string, unknown> }> = [
    { name: 'stored dark, class strategy', stored: 'dark', systemDark: false, options: {} },
    { name: 'stored light, class strategy', stored: 'light', systemDark: true, options: {} },
    { name: 'stored auto with dark system', stored: 'auto', systemDark: true, options: {} },
    { name: 'stored auto with light system', stored: 'auto', systemDark: false, options: {} },
    { name: 'nothing stored, auto default, dark system', systemDark: true, options: {} },
    { name: 'nothing stored, explicit dark default', systemDark: false, options: { initialMode: 'dark' } },
    { name: 'custom storage key and class', stored: 'dark', systemDark: false, options: { storageKey: 'theme', darkClass: 'night' } },
    { name: 'attribute strategy, stored dark', stored: 'dark', systemDark: false, options: { attribute: 'data-theme' } },
    { name: 'attribute strategy, auto with dark system', stored: 'auto', systemDark: true, options: { attribute: 'data-theme' } },
    { name: 'unrecognised stored value falls back', stored: 'system', systemDark: false, options: { initialMode: 'dark' } },
  ]

  for (const c of cases) {
    it(`hydration does not change the DOM: ${c.name}`, () => {
      const key = (c.options.storageKey as string) || 'stx-color-mode'
      if (c.stored)
        store.seed(key, c.stored)
      systemPrefersDark = c.systemDark

      runBootScript(generateColorModeBootScript(c.options))
      const afterBoot = rootState()
      const bootDecision = g.window.__STX_COLOR_MODE__

      // Now hydrate exactly as a page would, with NO options — the composable
      // is expected to recover them from what the boot script published.
      const cm = g.window.stx.useColorMode()

      expect(rootState()).toEqual(afterBoot)
      // Compare the decision too, not just the resulting DOM. Some
      // combinations leave the DOM coincidentally identical — a composable
      // that read the wrong storage key and removed class "dark" would not
      // disturb a root carrying class "night" — and would otherwise pass
      // while being entirely out of step with the boot script.
      expect({ preference: cm.preference, mode: cm.mode })
        .toEqual({ preference: bootDecision.preference, mode: bootDecision.mode })
    })
  }

  it('agrees even when the composable is called with the options repeated', () => {
    // The other path apps take: config in stx.config.ts AND options at the call
    // site. Passing them explicitly must not produce a different result.
    store.seed('theme', 'dark')
    const options = { storageKey: 'theme', attribute: 'data-theme' }

    runBootScript(generateColorModeBootScript(options))
    const afterBoot = rootState()

    g.window.stx.useColorMode(options)
    expect(rootState()).toEqual(afterBoot)
  })
})
