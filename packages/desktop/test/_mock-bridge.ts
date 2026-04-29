/**
 * Test helper — install a mocked `window.craft` namespace and capture
 * every method call made against it. Each individual test file imports
 * `installMockBridge()`, calls the API under test, then asserts on the
 * captured calls and/or returned values.
 *
 * Tests run under very-happy-dom (configured in `bunfig.toml`), which
 * provides a `window` object but does NOT implement window-level
 * `addEventListener` / `dispatchEvent`. Rather than chase a different
 * DOM stub, we polyfill those two methods at install time so the
 * production code can use them naturally.
 */

ensureWindowEventTarget()

function ensureWindowEventTarget(): void {
  if (typeof window === 'undefined') return
  const w = window as any
  if (typeof w.addEventListener === 'function' && typeof w.dispatchEvent === 'function') return

  // Minimal `addEventListener` / `removeEventListener` / `dispatchEvent`
  // backed by a Map<eventName, Set<listener>>. Sufficient for the bridge
  // event API which only ever does name-based subscribe/dispatch.
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
   * Override the response from `window.craft[ns][method]`. The mock
   * walks: explicit return → matched response handler → default.
   */
  whenCalled: (ns: string, method: string, response: unknown | ((...args: unknown[]) => unknown)) => void
  /** Remove the mock and restore whatever was on window.craft before. */
  uninstall: () => void
}

/**
 * Install a configurable mock at `window.craft`. The returned handle's
 * `calls` array grows as each method is invoked; per-call responses can
 * be queued via `whenCalled`.
 *
 * The mock auto-vivifies namespaces on access (so e.g. `craft.fs.readFile`
 * works without pre-declaring `fs`). Methods return a Promise resolving
 * to the configured response, defaulting to `undefined`.
 */
export function installMockBridge(initialNamespaces: string[] = []): MockBridgeHandle {
  const calls: CapturedCall[] = []
  const responses = new Map<string, unknown | ((...args: unknown[]) => unknown)>()

  // If the bridge IIFE (craft-bridge.js) was loaded earlier in this
  // test process — e.g. by `bridge-translators.test.ts` — `window.craft`
  // already contains the production facade. Restoring that would leak
  // into subsequent "no bridge" assertions. Treat the IIFE-marker as
  // "no real previous" and clean it up on uninstall.
  const previousRaw = (window as any).craft
  const previous = (previousRaw && previousRaw.__craft_bridge_loaded) ? undefined : previousRaw

  function makeMethod(ns: string, method: string) {
    return (...args: unknown[]) => {
      calls.push({ ns, method, args })
      const key = `${ns}:${method}`
      if (responses.has(key)) {
        const r = responses.get(key)
        const resolved = typeof r === 'function' ? (r as (...a: unknown[]) => unknown)(...args) : r
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
        // theme.get returns an object, not a promise). Allow the test
        // to register those via whenCalled with a non-function value
        // and a `:` separator handled below.
        if (responses.has(`${ns}:${prop}`)) {
          const r = responses.get(`${ns}:${prop}`)
          // For sync methods like theme.get, callers register a function
          // that synchronously returns. Distinguish via name convention.
          if (typeof r === 'function' && r.length === 0) {
            // Wrap so call recording still happens.
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
      // hasBridge uses `&& c[ns]` truthiness, not `prop in c`. The proxy
      // already returns truthy from `get`, so this is mostly cosmetic —
      // but for completeness we honour the initial namespace list.
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

/** Small assertion helper — find a captured call by ns + method. */
export function findCall(calls: CapturedCall[], ns: string, method: string): CapturedCall | undefined {
  return calls.find(c => c.ns === ns && c.method === method)
}
