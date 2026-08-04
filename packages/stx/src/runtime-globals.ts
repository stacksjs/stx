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

/**
 * Runtime globals that are COMPILE-TIME macros rather than reactive APIs.
 *
 * Calling one of these does not make a script reactive — they are consumed by
 * the compiler and produce no runtime subscription — so the auto-mount test
 * below must not treat them as evidence that a block needs mounting.
 */
export const COMPILE_TIME_ONLY_GLOBALS: readonly string[] = [
  'defineEmits', 'defineExpose', 'definePageMeta', 'defineProps', 'defineSlots', 'withDefaults',
]

/**
 * Names whose presence in a client script means it needs the signals runtime
 * and an `stx.mount()` wrapper.
 *
 * DERIVED, not hand-maintained (stacksjs/stx#1819). This was a literal regex
 * alternation of 36 names against 71 runtime globals, so a block built out of
 * the newer reactive composables — `useStore`, `useQuery`, `useMutation`,
 * `useCookie`, `watchMultiple` and a dozen more — was classified as "not using
 * signals", skipped mounting, and fell through to the legacy IIFE path with no
 * reactivity at all.
 *
 * Exactly the drift #1804 removed for STX_AUTO_IMPORTS, one file away.
 */
export const REACTIVE_RUNTIME_GLOBALS: readonly string[] = STX_RUNTIME_GLOBALS
  .filter(name => !COMPILE_TIME_ONLY_GLOBALS.includes(name))

/**
 * Does this script call anything that needs the reactive runtime?
 *
 * Matches a CALL, not a mention: a bare word can be a property, a string or a
 * comment. Tolerates a generic argument list, since `state<Foo>(…)` is valid
 * TypeScript and common.
 */
export function usesReactiveRuntime(source: string): boolean {
  if (!source)
    return false
  return REACTIVE_RUNTIME_GLOBALS.some(name =>
    new RegExp(`\\b${name}\\s*(?:<[^>]*>)?\\s*\\(`).test(source),
  )
}
