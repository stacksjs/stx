import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { useColorMode as moduleUseColorMode } from '../../src/composables/use-color-mode'
import { generateSignalsRuntimeDev } from '../../src/signals'

/**
 * A forced theme survives mount, in both reactive implementations
 * (stacksjs/stx#2050).
 *
 * The pre-paint half of this is `test/directives/color-mode-respect-existing`:
 * the boot script adopts a server-stamped attribute and publishes it as
 * `forced`. On its own that fixes nothing visible, because `useColorMode`
 * recomputes from storage on mount and stamps the attribute itself, so the
 * page painted the forced mode and then flipped to the visitor's preference.
 *
 * Both impls have to honour it at once (CLAUDE.md, dual reactive
 * implementations) or hydration disagrees with first paint, which is the flash
 * the boot script exists to prevent.
 *
 * `forced` is read from the boot global rather than the DOM on purpose: the
 * boot script stamps the attribute whether or not it adopted one, so by the
 * time a composable runs the DOM cannot say which happened.
 */

const g = globalThis as any

class MemoryStorage {
  private data = new Map<string, string>()
  get length(): number { return this.data.size }
  key(i: number): string | null { return Array.from(this.data.keys())[i] ?? null }
  getItem(k: string): string | null { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string): void { this.data.set(k, String(v)) }
  removeItem(k: string): void { this.data.delete(k) }
  clear(): void { this.data.clear() }
  seed(k: string, v: string): void { this.data.set(k, v) }
}

const store = new MemoryStorage()

function fakeMatchMedia(query: string) {
  return {
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => true,
  }
}

const saved: Record<string, any> = {}

beforeAll(() => {
  saved.localStorage = g.localStorage
  saved.matchMedia = g.matchMedia
  saved.windowLocalStorage = g.window?.localStorage
  saved.windowMatchMedia = g.window?.matchMedia

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
  reset()
})

function root(): HTMLElement {
  return g.document.documentElement
}

function reset(): void {
  root().removeAttribute('class')
  root().removeAttribute('data-theme')
  root().removeAttribute('style')
}

beforeEach(() => {
  store.clear()
  reset()
  delete g.window.__STX_COLOR_MODE__
})

afterEach(reset)

/** The state the boot script publishes once it has adopted a forced mode. */
function bootPublished(forced: 'light' | 'dark' | null, respectExisting = true) {
  g.window.__STX_COLOR_MODE__ = {
    storageKey: 'app-theme',
    initialMode: 'light',
    darkClass: null,
    attribute: 'data-theme',
    autoValue: 'auto',
    respectExisting,
    forced,
  }
  // The attribute the boot script already stamped, which is what the
  // composable must leave alone.
  root().setAttribute('data-theme', forced ?? 'light')
}

type Factory = (options?: Record<string, any>) => any

const IMPLS: Array<[string, Factory]> = [
  ['runtime (window.stx)', opts => g.window.stx.useColorMode(opts ?? {})],
  ['module (composables)', opts => moduleUseColorMode(opts ?? {})],
]

describe('useColorMode respects a forced mode', () => {
  for (const [name, useColorMode] of IMPLS) {
    describe(name, () => {
      it('leaves the forced attribute alone on mount', () => {
        // Without this the attribute came back as the stored preference and
        // the page visibly flipped after painting correctly.
        store.seed('app-theme', 'dark')
        bootPublished('light')

        const cm = useColorMode()

        expect(root().getAttribute('data-theme')).toBe('light')
        expect(cm.mode).toBe('light')
        expect(cm.isDark).toBe(false)
      })

      it('still reports the visitor own preference', () => {
        store.seed('app-theme', 'dark')
        bootPublished('light')

        expect(useColorMode().preference).toBe('dark')
      })

      it('holds the forced mode through an explicit toggle', () => {
        // A forced page is not the visitor's to change. Their choice is still
        // recorded, so it applies on pages that are not forced.
        store.seed('app-theme', 'dark')
        bootPublished('light')

        const cm = useColorMode()
        cm.toggle()

        expect(root().getAttribute('data-theme')).toBe('light')
        expect(cm.mode).toBe('light')
        expect(store.getItem('app-theme')).toBe('dark')
      })

      it('holds it through another tab writing the key', () => {
        store.seed('app-theme', 'dark')
        bootPublished('dark')
        useColorMode()

        g.window.dispatchEvent(Object.assign(new Event('storage'), { key: 'app-theme', newValue: 'light' }))

        expect(root().getAttribute('data-theme')).toBe('dark')
      })

      it('resolves normally when nothing was forced', () => {
        store.seed('app-theme', 'dark')
        bootPublished(null)

        expect(useColorMode().mode).toBe('dark')
        expect(root().getAttribute('data-theme')).toBe('dark')
      })

      it('ignores a forced value when the option is off', () => {
        // Default-off everywhere, so an app that has not asked for this is
        // unaffected even if something else put a value on the attribute.
        store.seed('app-theme', 'dark')
        bootPublished('light', false)

        expect(useColorMode().mode).toBe('dark')
        expect(root().getAttribute('data-theme')).toBe('dark')
      })
    })
  }
})
