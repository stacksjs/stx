import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

describe('preferred media runtime composables', () => {
  const listeners = new Map<string, Set<(event: { matches: boolean }) => void>>()
  const matches = new Map<string, boolean>([
    ['(prefers-color-scheme: dark)', true],
    ['(prefers-reduced-motion: reduce)', false],
  ])

  let originalMatchMedia: unknown

  beforeAll(() => {
    originalMatchMedia = window.matchMedia
    window.matchMedia = (query: string) => {
      const callbacks = listeners.get(query) ?? new Set()
      listeners.set(query, callbacks)
      return {
        matches: matches.get(query) ?? false,
        addEventListener: (_event: string, callback: (event: { matches: boolean }) => void) => callbacks.add(callback),
        removeEventListener: (_event: string, callback: (event: { matches: boolean }) => void) => callbacks.delete(callback),
      }
    }

    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  // `window` is shared by every test file in the process, so a replaced global
  // that is never put back is this file's state running in someone else's test.
  // This mock answers `(prefers-color-scheme: dark)` with true, and
  // toast-theme.test.ts asserts the light fallback on the stated grounds that
  // "happy-dom reports no dark preference" - true until this file has run, and
  // false afterwards. Running the two together failed that test every time.
  afterAll(() => {
    window.matchMedia = originalMatchMedia
  })

  // The preference map is seeded once at describe scope, and the test below
  // flips dark to false to prove a change propagates. Nothing put it back, so
  // in file order the first test read `true` and passed, and in any order where
  // it ran second it read the other test's leftover and failed
  // `expect(preferredDark()).toBe(true)` (stacksjs/stx#2003).
  //
  // Listeners are dropped for the same reason: each test registers its own via
  // `usePreferredDark()`, and keeping the previous ones means a change is
  // delivered to signals whose test has already finished.
  beforeEach(() => {
    matches.set('(prefers-color-scheme: dark)', true)
    matches.set('(prefers-reduced-motion: reduce)', false)
    listeners.clear()
  })

  it('exposes preferred media helpers as callable signals', () => {
    const preferredDark = window.stx.usePreferredDark()
    const reducedMotion = window.stx.usePreferredReducedMotion()

    expect(preferredDark()).toBe(true)
    expect(preferredDark.matches).toBe(true)
    expect(reducedMotion()).toBe(false)
  })

  it('updates media query signals when the browser preference changes', () => {
    const preferredDark = window.stx.usePreferredDark()
    matches.set('(prefers-color-scheme: dark)', false)
    for (const callback of listeners.get('(prefers-color-scheme: dark)') ?? [])
      callback({ matches: false })

    expect(preferredDark()).toBe(false)
    expect(preferredDark.value).toBe(false)
  })

  it('keeps useDark compatible with both signal and handle syntax', () => {
    window.localStorage.removeItem('stx-color-mode')
    const dark = window.stx.useDark({ initialMode: 'light' })

    expect(dark()).toBe(false)
    expect(dark.isDark).toBe(false)
    dark.set(true)
    expect(dark()).toBe(true)
    expect(dark.isDark).toBe(true)
    dark.toggle()
    expect(dark()).toBe(false)
  })
})
