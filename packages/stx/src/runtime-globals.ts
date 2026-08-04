/**
 * Runtime Globals
 *
 * The single source of truth for the stx APIs destructured off `window.stx` at
 * the top of every generated client script, so user code can write `state(...)`
 * or `onMount(...)` without importing anything.
 *
 * This list used to be hardcoded separately in three places — the `@include`
 * component wrapper, the page setup function, and the `<Component />` client
 * script wrapper. They drifted, so which APIs existed depended on which kind of
 * script you happened to be writing, and the failure was a bare `ReferenceError`
 * at runtime with nothing at build time: `nextTick()` resolved in a component
 * script but threw in a page, `onMounted()` resolved in a page but threw in an
 * `@include`d component. See #1785.
 *
 * Two entries were also phantoms - `inject` and `nextTick` were destructured by
 * one site but never defined on `window.stx` at all, so they silently evaluated
 * to `undefined` and threw "is not a function" when called. Both are now
 * implemented by the signals runtime (`inject` as of #1804).
 *
 * This list is also the source of `STX_AUTO_IMPORTS` (client-script.ts), which
 * used to be a fourth hand-maintained copy for the classic `<script client>`
 * path. It had drifted to 82 names against a runtime surface of 66, so 16 names
 * — `h`, `Fragment`, `createStore`, `useMeta`, `getCurrentInstance` and others —
 * were destructured off `window.stx` for every client script and silently bound
 * to `undefined`, failing at the call site as "undefined is not a function" with
 * nothing pointing at the missing name. One list, one guard (#1804).
 *
 * Adding a runtime global is now a one-line change here. `runtime-globals.test.ts`
 * asserts every name actually exists on `window.stx` and that all three call
 * sites emit the same set, which is what keeps this from drifting again.
 *
 * @module runtime-globals
 */

/**
 * Public stx APIs made available as bare identifiers inside client scripts.
 *
 * Sorted for a stable diff. Internal `window.stx` members (`_scopes`,
 * `_cleanupContainer`, …) are deliberately excluded — they are runtime
 * plumbing, not part of the authoring surface.
 */
export const STX_RUNTIME_GLOBALS: readonly string[] = [
  'batch', 'computed', 'defineEmits', 'defineExpose', 'definePageMeta', 'defineProps',
  'defineSlots', 'defineStore', 'derived', 'effect', 'goBack', 'goForward', 'inject',
  'isDerived', 'isSignal', 'navigate',
  'nextTick', 'onBeforeMount', 'onBeforeUnmount', 'onDestroy', 'onMount', 'onMounted', 'onUnmounted',
  'peek', 'provide', 'reactive',
  'ref', 'registerStoresClient', 'setRouteParams', 'state', 'untrack', 'useAsync', 'useClickOutside', 'useColorMode',
  'useCookie', 'useCounter', 'useDark', 'useDebounce', 'useDebouncedValue', 'useEventListener',
  'useFetch', 'useFocus', 'useHead', 'useId', 'useInterval', 'useLocalStorage', 'useMediaQuery',
  'useMutation', 'useOptimistic', 'usePreferredContrast', 'usePreferredDark',
  'usePreferredLight', 'usePreferredReducedMotion', 'useQuery', 'useReactiveProp',
  'useRef', 'useRoute', 'useScrollLock', 'useSearchParams', 'useSeoMeta', 'useSessionStorage', 'useSlots', 'useStore',
  'useThrottle', 'useTimeout', 'useToggle', 'useWebSocket', 'watch', 'watchEffect', 'watchMultiple', 'withDefaults',
]

/**
 * Names a call site declares itself and therefore must NOT also destructure.
 *
 * The `<Component />` wrapper defines scope-aware `onMount`/`onDestroy` that
 * push into that component's own callback arrays:
 *
 *   const onMount = (fn) => __scopeVars.__mountCallbacks.push(fn)
 *
 * Destructuring the same names first makes that a duplicate `const` — a
 * SyntaxError, which surfaces as the whole chunk silently failing to minify (and
 * failing to run). This omission is deliberate, unlike the accidental drift
 * #1785 fixed, so it is declared here rather than left implicit.
 */
export const COMPONENT_SCOPE_LOCAL_GLOBALS: readonly string[] = ['onMount', 'onDestroy']

/**
 * Build the destructuring statement that pulls {@link STX_RUNTIME_GLOBALS} into
 * a generated client script's scope.
 *
 * @param declaration `var` for scripts that reassign a binding (the `@include`
 * wrapper rebinds `onDestroy` to tee into its teardown channel — an assignment,
 * which `var` permits), `const` otherwise.
 * @param exclude names the generated wrapper or user script declares itself.
 * A local declaration is intentionally allowed to shadow a runtime convenience
 * global, just as an explicit import would. Omitting it from this destructure
 * prevents duplicate-binding syntax errors.
 * @param source optionally limits bindings to identifiers referenced by one
 * component script. Page-level callers omit it and retain the full authoring
 * surface.
 */
export function buildRuntimeGlobalsDestructure(
  declaration: 'const' | 'var' = 'const',
  exclude: readonly string[] = [],
  source?: string,
): string {
  let names = exclude.length
    ? STX_RUNTIME_GLOBALS.filter(name => !exclude.includes(name))
    : STX_RUNTIME_GLOBALS
  if (source !== undefined) {
    names = names.filter((name) => {
      const escaped = name.replace(/[$()*+.?[\\\]^{|}-]/g, '\\$&')
      return new RegExp(`(^|[^\\w$])${escaped}(?![\\w$])`).test(source)
    })
  }
  return `${declaration} { ${names.join(', ')} } = window.stx;`
}
