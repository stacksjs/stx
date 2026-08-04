/**
 * `useColorMode` behaves identically in both reactive impls (stacksjs/stx#1788).
 *
 * Two limitations pushed apps back to hand-written `classList.toggle` +
 * `setAttribute` + `localStorage` — the exact imperative DOM code the composable
 * exists to remove:
 *
 *  1. `applyDOM` set a class OR an attribute, never both. Passing `attribute`
 *     silently disabled `darkClass`. They aren't alternatives in practice: the
 *     class drives the utility framework's `dark:` variants, the attribute
 *     drives everything else.
 *
 *  2. The persisted vocabulary was hard-coded to `light|dark|auto`, so an app
 *     already storing `'system'` hit silent data loss — read `'system'`, reject
 *     it, fall back to `'auto'`, then OVERWRITE the stored value with `'auto'`.
 *     Anything else reading that key (typically a pre-paint script) then saw a
 *     value it didn't recognise and rendered the wrong theme. Only visible on
 *     reload.
 *
 * Both fixes have to land in both impls at once (CLAUDE.md, dual reactive
 * implementations) AND in the pre-paint boot script, or hydration disagrees
 * with first paint and the flash comes back. The boot-script half is pinned by
 * `test/directives/color-mode-boot.test.ts`.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { useColorMode as moduleUseColorMode } from '../../src/composables/use-color-mode'
import { generateSignalsRuntimeDev } from '../../src/signals'

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
let systemPrefersDark = false

function fakeMatchMedia(query: string) {
  return {
    matches: query.includes('dark') ? systemPrefersDark : false,
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
  systemPrefersDark = false
  reset()
  delete g.window.__STX_COLOR_MODE__
})

afterEach(reset)

type Factory = (options?: Record<string, any>) => any

const IMPLS: Array<[string, Factory]> = [
  ['runtime (window.stx)', opts => g.window.stx.useColorMode(opts ?? {})],
  ['module (composables)', opts => moduleUseColorMode(opts ?? {})],
]

describe('useColorMode — dual-impl parity', () => {
  for (const [name, useColorMode] of IMPLS) {
    describe(name, () => {
      describe('class and attribute are complements, not alternatives', () => {
        it('applies both when both are configured', () => {
          store.seed('stx-color-mode', 'dark')
          useColorMode({ attribute: 'data-theme' })
          expect(root().getAttribute('data-theme')).toBe('dark')
          expect(root().classList.contains('dark')).toBe(true)
        })

        it('removes the class in light mode while keeping the attribute', () => {
          store.seed('stx-color-mode', 'light')
          useColorMode({ attribute: 'data-theme' })
          expect(root().getAttribute('data-theme')).toBe('light')
          expect(root().classList.contains('dark')).toBe(false)
        })

        it('honours a custom darkClass alongside the attribute', () => {
          store.seed('stx-color-mode', 'dark')
          useColorMode({ attribute: 'data-theme', darkClass: 'night' })
          expect(root().getAttribute('data-theme')).toBe('dark')
          expect(root().classList.contains('night')).toBe(true)
        })

        it('lets darkClass:null opt out of the class entirely', () => {
          store.seed('stx-color-mode', 'dark')
          useColorMode({ attribute: 'data-theme', darkClass: null })
          expect(root().getAttribute('data-theme')).toBe('dark')
          expect(root().getAttribute('class') || '').not.toContain('dark')
        })

        it('still works with no attribute at all', () => {
          store.seed('stx-color-mode', 'dark')
          useColorMode()
          expect(root().classList.contains('dark')).toBe(true)
          expect(root().hasAttribute('data-theme')).toBe(false)
        })
      })

      describe('system is an accepted spelling of auto', () => {
        it('resolves a stored "system" against the system preference', () => {
          store.seed('theme', 'system')
          systemPrefersDark = true
          const cm = useColorMode({ storageKey: 'theme' })
          expect(cm.preference).toBe('auto')
          expect(cm.mode).toBe('dark')
        })

        it('does NOT overwrite the stored spelling', () => {
          // The data-loss path: read 'system' → unrecognised → fall back to
          // 'auto' → persist('auto') → the app's pre-paint script no longer
          // recognises its own key.
          store.seed('theme', 'system')
          useColorMode({ storageKey: 'theme' })
          expect(store.getItem('theme')).toBe('system')
        })

        it('keeps writing that spelling when the user re-selects auto', () => {
          store.seed('theme', 'system')
          const cm = useColorMode({ storageKey: 'theme' })
          cm.set('dark')
          expect(store.getItem('theme')).toBe('dark')
          cm.set('auto')
          expect(store.getItem('theme')).toBe('system')
        })

        it('accepts set("system")', () => {
          const cm = useColorMode({ storageKey: 'theme' })
          cm.set('system')
          expect(cm.preference).toBe('auto')
        })

        it('accepts initialMode: "system"', () => {
          systemPrefersDark = true
          const cm = useColorMode({ storageKey: 'theme', initialMode: 'system' })
          expect(cm.preference).toBe('auto')
          expect(cm.mode).toBe('dark')
        })

        it('writes "auto" by default when nothing was stored', () => {
          const cm = useColorMode({ storageKey: 'theme' })
          cm.set('auto')
          expect(store.getItem('theme')).toBe('auto')
        })

        it('lets an explicit autoValue override the stored spelling', () => {
          store.seed('theme', 'auto')
          const cm = useColorMode({ storageKey: 'theme', autoValue: 'system' })
          cm.set('auto')
          expect(store.getItem('theme')).toBe('system')
        })
      })

      describe('an unrecognised stored value is left alone', () => {
        it('does not overwrite it on init', () => {
          // "At minimum, do not overwrite a stored value that was not
          // recognised" — init is not a user choice, so it must not persist.
          store.seed('theme', 'midnight')
          useColorMode({ storageKey: 'theme', initialMode: 'light' })
          expect(store.getItem('theme')).toBe('midnight')
        })

        it('still falls back to initialMode for display', () => {
          store.seed('theme', 'midnight')
          const cm = useColorMode({ storageKey: 'theme', initialMode: 'dark' })
          expect(cm.mode).toBe('dark')
        })

        it('overwrites once the user actually chooses', () => {
          store.seed('theme', 'midnight')
          const cm = useColorMode({ storageKey: 'theme', initialMode: 'light' })
          cm.set('dark')
          expect(store.getItem('theme')).toBe('dark')
        })

        it('does not write anything on init when storage is empty', () => {
          useColorMode({ storageKey: 'theme' })
          expect(store.getItem('theme')).toBeNull()
        })
      })

      describe('unchanged behaviour', () => {
        it('toggle flips and persists', () => {
          store.seed('theme', 'light')
          const cm = useColorMode({ storageKey: 'theme' })
          cm.toggle()
          expect(cm.mode).toBe('dark')
          expect(store.getItem('theme')).toBe('dark')
        })

        it('exposes isDark', () => {
          store.seed('theme', 'dark')
          expect(useColorMode({ storageKey: 'theme' }).isDark).toBe(true)
        })

        it('notifies subscribers', () => {
          const seen: Array<[string, string]> = []
          const cm = useColorMode({ storageKey: 'theme' })
          cm.subscribe((mode: string, pref: string) => seen.push([mode, pref]))
          cm.set('dark')
          expect(seen).toEqual([['dark', 'dark']])
        })
      })
    })
  }
})

/**
 * An explicit `null` from `app.colorMode` opts out (stacksjs/stx#1813).
 *
 * `useColorMode` resolves options as call-site → boot global → default, and the
 * boot global is published from `app.colorMode`. Both impls treated a
 * boot-global `null` as "unspecified" and fell through to the default, so
 * config — the one path the global exists to serve — could not express an
 * opt-out.
 *
 * The asymmetry hid because it only bites where the fallback is non-null:
 * `attribute: null` looked like it worked (its fallback is null too), while
 * `darkClass: null` silently became `'dark'`. Opting out of the class therefore
 * required repeating the option at every call site, defeating the single-source
 * arrangement the global was added for.
 */
describe('explicit null in the boot global (#1813)', () => {
  for (const [name, create] of IMPLS) {
    describe(name, () => {
      it('honours darkClass:null from the boot global', () => {
        g.window.__STX_COLOR_MODE__ = { storageKey: 'app_theme', attribute: 'data-theme', darkClass: null, initialMode: 'auto' }
        const cm = create({})
        cm.set('dark')
        // The whole point: no class is managed, only the attribute.
        expect(root().getAttribute('class') ?? '').not.toContain('dark')
        expect(root().getAttribute('data-theme')).toBe('dark')
        cm.dispose?.()
      })

      it('still defaults darkClass when the boot global omits it', () => {
        g.window.__STX_COLOR_MODE__ = { storageKey: 'app_theme', attribute: 'data-theme', initialMode: 'auto' }
        const cm = create({})
        cm.set('dark')
        expect(root().getAttribute('class') ?? '').toContain('dark')
        cm.dispose?.()
      })

      it('lets a call-site option still win over the boot global', () => {
        g.window.__STX_COLOR_MODE__ = { darkClass: null }
        const cm = create({ darkClass: 'night' })
        cm.set('dark')
        expect(root().getAttribute('class') ?? '').toContain('night')
        cm.dispose?.()
      })
    })
  }
})
