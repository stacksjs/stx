/**
 * Client-facing APIs actually reach the client (stacksjs/stx#1843).
 *
 * An adoption audit of a 6.5k-line production app found it hand-rolling
 * routing, data fetching, forms and overlays in vanilla JS — and nearly every
 * workaround mapped to a primitive stx already exports. The app was written
 * while the runtime DELIVERY layer was broken (#1804, #1805, #1819, #1832), so
 * the team fell back correctly at the time and never migrated back.
 *
 * Auditing the list turned up one real residual gap: `useRouteParams` and
 * `useRouteParam` are exported from `src/runtime.ts`, whose docblock says it is
 * "the public API for accessing stx runtime state, all window.* access
 * abstracted away" — and they were not on `window.stx`. Since the bundler
 * rewrites a client script's imports into a destructure from `window.stx`, an
 * app importing them got `undefined` and threw on call. The capability was
 * always reachable through `useRoute().params`; only the documented names were
 * not.
 *
 * The surface assertion below is the durable half. A name that an app is told
 * to import must be delivered, and "it exists in src" is not the same claim.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { generateSignalsRuntimeDev } from '../../src/signals'

/**
 * Booting a runtime means installing DOM globals, so they have to come back
 * off afterwards. Leaving them in place broke six web-component tests that run
 * later in the same process — the failure looked like a bug in those, not here.
 */
const originalGlobals = {
  window: globalThis.window,
  document: globalThis.document,
  location: globalThis.location,
  history: globalThis.history,
  CustomEvent: globalThis.CustomEvent,
  requestAnimationFrame: globalThis.requestAnimationFrame,
}

afterEach(() => {
  Object.assign(globalThis, originalGlobals)
})

/** Boot the real runtime in a DOM and hand back `window.stx`. */
function bootRuntime(url = 'http://localhost/judges/42') {
  const window = new Window({ url })
  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    history: window.history,
    CustomEvent: window.CustomEvent,
    requestAnimationFrame: (fn: () => void) => setTimeout(fn, 0),
  })
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  return (window as any).stx as Record<string, any>
}

describe('route params reach the client', () => {
  it('publishes useRouteParams and useRouteParam on window.stx', () => {
    const stx = bootRuntime()

    expect(typeof stx.useRouteParams).toBe('function')
    expect(typeof stx.useRouteParam).toBe('function')
  })

  it('returns the current params', () => {
    const stx = bootRuntime()
    stx.setRouteParams({ id: '42' })

    expect(stx.useRouteParams()).toEqual({ id: '42' })
    expect(stx.useRouteParam('id')).toBe('42')
  })

  it('falls back when a param is absent', () => {
    const stx = bootRuntime()
    stx.setRouteParams({ id: '42' })

    expect(stx.useRouteParam('missing', 'fallback')).toBe('fallback')
    expect(stx.useRouteParam('missing')).toBeUndefined()
  })

  it('agrees with useRoute().params, which was the workaround', () => {
    const stx = bootRuntime()
    stx.setRouteParams({ id: '42', slug: 'x' })

    expect(stx.useRouteParams()).toEqual(stx.useRoute().params)
  })
})

describe('the delivery surface', () => {
  /**
   * Every API an app is told to reach for from a `<script client>` block.
   *
   * Deliberately NOT the whole export list of the package: several exports are
   * server-side by design and belong nowhere near this assertion — `query`
   * (database.ts), `redirect` (edge-runtime.ts) and `validateFields` /
   * `defaultFormClasses` (forms.ts, which processes @csrf and friends). The
   * adoption report listed those as client primitives; they are not, and
   * shipping them here would be the wrong fix for that row.
   */
  const CLIENT_APIS = [
    'state', 'derived', 'effect', 'batch', 'watch', 'watchEffect', 'watchMultiple',
    'onMount', 'onDestroy',
    'navigate', 'goBack', 'goForward', 'useRoute', 'useRouteParams', 'useRouteParam',
    'setRouteParams', 'useSearchParams',
    'useFetch', 'useQuery', 'useMutation',
    'useLocalStorage', 'useSessionStorage', 'useCookie',
    'useEventListener', 'useWebSocket', 'useClickOutside', 'useFocus',
    'useDebounce', 'useThrottle', 'useToggle',
    'defineStore', 'useStore',
    'defineProps', 'defineEmits', 'defineExpose',
  ]

  it('publishes every one of them on window.stx', () => {
    const stx = bootRuntime()
    const missing = CLIENT_APIS.filter(name => typeof stx[name] !== 'function')

    expect(missing).toEqual([])
  })
})
