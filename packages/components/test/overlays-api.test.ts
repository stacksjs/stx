/**
 * The exported overlay API reaches the runtime's stack (stacksjs/stx#2057),
 * and does nothing at all where there is no runtime, so code shared with the
 * server can call it without a guard.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { closeOverlay, isTopOverlay, openOverlay, openOverlays } from '../src'

const calls: unknown[][] = []
const g = globalThis as any

afterEach(() => {
  calls.length = 0
  delete g.stx
})

describe('the overlay API', () => {
  it('is a no-op with no runtime on the page', () => {
    expect(() => openOverlay('a', { panel: null })).not.toThrow()
    expect(() => closeOverlay('a')).not.toThrow()
    expect(isTopOverlay('a')).toBe(false)
    expect(openOverlays()).toEqual([])
  })

  it('forwards to window.stx.overlays', () => {
    g.stx = {
      overlays: {
        open: (...args: unknown[]) => calls.push(['open', ...args]),
        close: (...args: unknown[]) => calls.push(['close', ...args]),
        isTop: (id: string) => id === 'a',
        list: () => ['a'],
      },
    }
    const options = { panel: null, onEscape: () => {} }
    openOverlay('a', options)
    closeOverlay('a')
    expect(calls).toEqual([['open', 'a', options], ['close', 'a']])
    expect(isTopOverlay('a')).toBe(true)
    expect(openOverlays()).toEqual(['a'])
  })
})
