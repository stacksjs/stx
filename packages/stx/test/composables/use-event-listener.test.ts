/**
 * Tests for the useEventListener composable.
 *
 * Primary regression target: stacksjs/stx#1721. Previously a typo'd CSS
 * selector silently upgraded the listener to `window` scope via
 * `document.querySelector(target) || window`, so a click handler intended
 * for `#dropdown` would fire on every click anywhere in the page. The fix
 * logs a clear warning and returns a no-op `EventListenerRef` instead.
 */
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test'
import { useEventListener } from '../../src/composables/use-event-listener'

describe('useEventListener', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    // eslint-disable-next-line ts/no-explicit-any
    delete (globalThis as any).onDestroy
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('attaches a listener to window when no target is provided', () => {
    let fired = 0
    const { remove } = useEventListener('click', () => { fired++ })
    window.dispatchEvent(new Event('click'))
    expect(fired).toBe(1)
    remove()
  })

  it('attaches to an Element target', () => {
    const el = document.createElement('button')
    document.body.appendChild(el)

    let fired = 0
    const { remove } = useEventListener('click', () => { fired++ }, { target: el })
    el.dispatchEvent(new Event('click'))
    expect(fired).toBe(1)
    remove()
  })

  it('resolves a string selector to the matching element', () => {
    const el = document.createElement('button')
    el.id = 'go'
    document.body.appendChild(el)

    let fired = 0
    useEventListener('click', () => { fired++ }, { target: '#go' })
    el.dispatchEvent(new Event('click'))
    expect(fired).toBe(1)
  })

  // Regression for stacksjs/stx#1721.
  describe('missing selector handling (#1721)', () => {
    it('does NOT attach to window when the selector resolves to nothing', () => {
      const warn = mock(() => {})
      const originalWarn = console.warn
      console.warn = warn

      try {
        let firedOnWindow = 0
        const windowHandler = () => { firedOnWindow++ }
        window.addEventListener('click', windowHandler)

        // The bogus selector should NOT cause the composable's handler to
        // attach to window. We dispatch a click on window and assert only
        // the test's own listener (which is the sole one attached to
        // window) sees the event — i.e. the composable did NOT add a
        // second window-scoped listener.
        let composableFired = 0
        useEventListener('click', () => { composableFired++ }, { target: '#does-not-exist' })

        window.dispatchEvent(new Event('click'))
        expect(firedOnWindow).toBe(1)
        expect(composableFired).toBe(0) // composable handler must not fire

        window.removeEventListener('click', windowHandler)
      }
      finally {
        console.warn = originalWarn
      }
    })

    it('warns with the offending selector', () => {
      const warn = mock(() => {})
      const originalWarn = console.warn
      console.warn = warn

      try {
        useEventListener('click', () => {}, { target: '#nonexistent-element' })
        expect(warn).toHaveBeenCalled()
        const firstCallArg = (warn.mock.calls[0]?.[0] ?? '') as string
        expect(firstCallArg).toContain('useEventListener')
        expect(firstCallArg).toContain('#nonexistent-element')
      }
      finally {
        console.warn = originalWarn
      }
    })

    it('returns a no-op remove() that does not throw', () => {
      const warn = mock(() => {})
      const originalWarn = console.warn
      console.warn = warn

      try {
        const { remove } = useEventListener('click', () => {}, { target: '#absent' })
        expect(() => remove()).not.toThrow()
        // Calling remove() twice should also be safe.
        expect(() => remove()).not.toThrow()
      }
      finally {
        console.warn = originalWarn
      }
    })

    it('does not register onDestroy when the selector fails to resolve', () => {
      const warn = mock(() => {})
      const originalWarn = console.warn
      console.warn = warn

      const callbacks: Array<() => void> = []
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).onDestroy = (fn: () => void) => { callbacks.push(fn) }

      try {
        useEventListener('click', () => {}, { target: '#missing' })
        // Nothing was attached, so there's nothing to clean up — no
        // onDestroy callback should have been registered.
        expect(callbacks).toHaveLength(0)
      }
      finally {
        console.warn = originalWarn
      }
    })
  })

  describe('cleanup', () => {
    it('remove() detaches the listener', () => {
      let fired = 0
      const { remove } = useEventListener('click', () => { fired++ })
      window.dispatchEvent(new Event('click'))
      expect(fired).toBe(1)
      remove()
      window.dispatchEvent(new Event('click'))
      expect(fired).toBe(1) // unchanged
    })

    it('registers an onDestroy callback when one is available', () => {
      const callbacks: Array<() => void> = []
      // eslint-disable-next-line ts/no-explicit-any
      ;(globalThis as any).onDestroy = (fn: () => void) => { callbacks.push(fn) }

      let fired = 0
      useEventListener('click', () => { fired++ })
      expect(callbacks).toHaveLength(1)

      // Simulate scope teardown — running the registered cleanup must
      // detach the listener.
      callbacks[0]()
      window.dispatchEvent(new Event('click'))
      expect(fired).toBe(0)
    })
  })
})
