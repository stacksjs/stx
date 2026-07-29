import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any

describe('preferred media runtime composables', () => {
  const listeners = new Map<string, Set<(event: { matches: boolean }) => void>>()
  const matches = new Map<string, boolean>([
    ['(prefers-color-scheme: dark)', true],
    ['(prefers-reduced-motion: reduce)', false],
  ])

  beforeAll(() => {
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
