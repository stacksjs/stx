/**
 * Test utilities — install a mock `window.craft` namespace + capture
 * every call against it. Apps consuming this package can `import {
 * installMockBridge } from '@stacksjs/desktop/test-utils'` to hand
 * their unit tests the same harness this package uses internally.
 *
 * The mock auto-vivifies namespaces on access — `craft.fs.readFile`
 * works without pre-declaring `fs`. Methods return a Promise resolving
 * to whatever was queued via `whenCalled`, defaulting to `undefined`.
 *
 * Tests should follow the install / call / assert / uninstall cycle:
 * ```ts
 * import { installMockBridge, findCall } from '@stacksjs/desktop/test-utils'
 * import { fs } from '@stacksjs/desktop'
 *
 * const bridge = installMockBridge()
 * bridge.whenCalled('fs', 'readFile', { data: 'hello' })
 * expect(await fs.readFile('/x')).toBe('hello')
 * expect(findCall(bridge.calls, 'fs', 'readFile')!.args).toEqual(['/x'])
 * bridge.uninstall()
 * ```
 *
 * Polyfills `window.addEventListener` / `dispatchEvent` for runners
 * (very-happy-dom, jsdom older versions) that don't ship them by
 * default — facade tests rely on those for event-based facades.
 */

ensureWindowEventTarget()

function ensureWindowEventTarget(): void {
  if (typeof window === 'undefined') return
  const w = window as any
  if (typeof w.addEventListener === 'function' && typeof w.dispatchEvent === 'function') return

  const listeners = new Map<string, Set<EventListener>>()

  w.addEventListener = (name: string, cb: EventListener): void => {
    let set = listeners.get(name)
    if (!set) {
      set = new Set()
      listeners.set(name, set)
    }
    set.add(cb)
  }

  w.removeEventListener = (name: string, cb: EventListener): void => {
    listeners.get(name)?.delete(cb)
  }

  w.dispatchEvent = (event: Event): boolean => {
    const set = listeners.get(event.type)
    if (set) {
      for (const fn of set) {
        try { fn(event) } catch { /* swallow listener errors during tests */ }
      }
    }
    return true
  }
}

export interface CapturedCall {
  ns: string
  method: string
  args: unknown[]
}

export interface MockBridgeHandle {
  /** Calls captured since the bridge was installed. */
  calls: CapturedCall[]
  /**
   * Queue the response from `window.craft[ns][method]`. The mock
   * walks: explicit return → matched response handler → default.
   */
  whenCalled: (
    ns: string,
    method: string,
    response: unknown | ((...args: unknown[]) => unknown)
  ) => void
  /** Remove the mock and restore whatever was on window.craft before. */
  uninstall: () => void
}

export function installMockBridge(initialNamespaces: string[] = []): MockBridgeHandle {
  const calls: CapturedCall[] = []
  const responses = new Map<string, unknown | ((...args: unknown[]) => unknown)>()

  // If the production bridge IIFE has already loaded — flagged via
  // `__craft_bridge_loaded` — treat the existing window.craft as
  // "no real previous." Otherwise restoring it on uninstall would
  // leak the production facade into "no bridge" assertions in
  // subsequent tests.
  const previousRaw = (window as any).craft
  const previous = previousRaw && previousRaw.__craft_bridge_loaded ? undefined : previousRaw

  function makeMethod(ns: string, method: string) {
    return (...args: unknown[]) => {
      calls.push({ ns, method, args })
      const key = `${ns}:${method}`
      if (responses.has(key)) {
        const r = responses.get(key)
        const resolved = typeof r === 'function'
          ? (r as (...a: unknown[]) => unknown)(...args)
          : r
        return Promise.resolve(resolved)
      }
      return Promise.resolve(undefined)
    }
  }

  function makeNamespace(ns: string): Record<string, unknown> {
    return new Proxy({} as Record<string, unknown>, {
      get(_target, prop: string) {
        if (typeof prop !== 'string') return undefined
        // Some non-method properties may be read synchronously (e.g.
        // theme.get returns an object, not a promise). Allow callers
        // to register those by passing a zero-arg function — we
        // recognize the shape and return the value synchronously.
        if (responses.has(`${ns}:${prop}`)) {
          const r = responses.get(`${ns}:${prop}`)
          if (typeof r === 'function' && r.length === 0) {
            return () => {
              calls.push({ ns, method: prop, args: [] })
              return (r as () => unknown)()
            }
          }
        }
        return makeMethod(ns, prop)
      },
    })
  }

  const root = new Proxy({} as Record<string, unknown>, {
    get(_target, prop: string) {
      if (typeof prop !== 'string') return undefined
      return makeNamespace(prop)
    },
    has(_target, prop) {
      if (typeof prop !== 'string') return false
      if (initialNamespaces.length === 0) return true
      return initialNamespaces.includes(prop)
    },
  })

  ;(window as any).craft = root

  return {
    calls,
    whenCalled(ns, method, response) {
      responses.set(`${ns}:${method}`, response)
    },
    uninstall() {
      if (previous === undefined) {
        delete (window as any).craft
      }
      else {
        ;(window as any).craft = previous
      }
    },
  }
}

/** Helper — find the first captured call matching `ns` + `method`. */
export function findCall(
  calls: CapturedCall[],
  ns: string,
  method: string,
): CapturedCall | undefined {
  return calls.find(c => c.ns === ns && c.method === method)
}
