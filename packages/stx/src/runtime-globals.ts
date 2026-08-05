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

/**
 * Template syntax that establishes a REACTIVE CONTEXT: a signal, a bound
 * attribute, a reactive directive, or a client script scope.
 *
 * Deliberately excludes a bare `@event=` handler — see `HAS_EVENT_HANDLER`.
 */
const TEMPLATE_REACTIVE_PATTERNS: readonly RegExp[] = [
  /@if\s*=/, // @if="condition"
  /@for\s*=/, // @for="item in items"
  /@show\s*=/, // @show="visible"
  /@model\s*=/, // @model="value"
  /@bind:/, // @bind:attr="value"
  /@class\s*=/, // @class="{ active: isActive }"
  /@style\s*=/, // @style="{ color: textColor }"
  /\bx-data\s*=/, // x-data="{ ... }" Alpine-style (reactive bridge needs signals runtime)
  /\bstate\s*(?:<[^>]*>)?\s*\(/, // state() signal API
  /\bderived\s*(?:<[^>]*>)?\s*\(/, // derived() signal API
  /\beffect\s*(?:<[^>]*>)?\s*\(/, // effect() signal API
  /\bref\s*(?:<[^>]*>)?\s*\(/, // ref() Vue-compat alias
  /\bcomputed\s*(?:<[^>]*>)?\s*\(/, // computed() Vue-compat alias
  /\breactive\s*(?:<[^>]*>)?\s*\(/, // reactive() Vue-compat alias
  /\bwatch\s*(?:<[^>]*>)?\s*\(/, // watch() Vue-compat alias
  /\bwatchEffect\s*(?:<[^>]*>)?\s*\(/, // watchEffect() Vue-compat alias
  // ANY colon-bound attribute, not a fixed list of seven. Arbitrary attribute
  // binding (:value, :disabled, :href, :data-x) is the common case and none
  // of it used to count. The `.` exclusion keeps this off Vue-style
  // `:prop.sync` spellings that are not ours, and requiring a value keeps it
  // off bare `:` in text.
  /\s:[a-z][\w-]*\s*=\s*["']/i,
  /\s:(?:if|else-if|else|for|show|text|html|model)\s*=/, // colon-form reactive directives
  /data-stx(?:-auto)?(?![-\w])/, // data-stx or data-stx-auto (not data-stx-ref, data-stx-id, etc.)
  /data-stx-scoped/, // client scripts need the signals runtime
]

/**
 * A bare event handler: `@click="fn"`, `@submit.prevent="fn()"`.
 *
 * Needs the runtime (something must bind it) but does NOT by itself establish a
 * reactive context — which is exactly the distinction the two predicates below
 * turn on.
 */
const HAS_EVENT_HANDLER = /\s@[a-z][\w.:-]*\s*=/i

/**
 * Does this template have a reactive context — a signal, a bound attribute, a
 * reactive directive, or a client script — that will own its event handlers?
 *
 * This is the question `processEventDirectives` (events.ts) needs. It decides
 * whether to leave `@click` in the markup for the signals runtime to bind, or to
 * strip it and bind it imperatively through `__stx_runHandler`.
 *
 * It used to answer that with its own regex matching only `state`/`derived`/
 * `effect` plus four directives, so a client block built out of `useStore` (or
 * any of the other ~65 reactive globals) failed it. The handler was stripped and
 * rebound to code that resolves it through a `[data-stx-scope]` ancestor that
 * page-level client blocks never get, then fell back to evaluating the bare
 * name — which lives inside the setup closure and is not a global. Every handler
 * on the page died with a ReferenceError on click (#1824).
 *
 * Note this is NOT the same question as {@link templateNeedsRuntime}: a template
 * whose only client-side behaviour is `<button @click="doIt()">` needs the
 * runtime injected, but has no reactive scope to own the handler, so events.ts
 * must still bind it imperatively. Conflating the two makes that fallback
 * unreachable.
 */
export function templateHasReactiveContext(template: string): boolean {
  if (!template)
    return false
  // Quoted syntax is not syntax: a docs page showing `:if="open"` inside a code
  // sample is text, and counting it shipped the runtime to pages that never
  // use it (#1835).
  const live = blankInertHtmlRegions(template)
  if (TEMPLATE_REACTIVE_PATTERNS.some(pattern => pattern.test(live)))
    return true
  // Every reactive runtime global, not just the handful spelled out above.
  return usesReactiveRuntime(live)
}

/**
 * Will this template get the client signals runtime?
 *
 * A reactive context needs it, and so does a lone event handler — something has
 * to bind that, and the runtime is what binds it when a reactive scope exists.
 *
 * This had three independent implementations that disagreed, and every
 * disagreement was a bug: `hasSignalsSyntax` (signal-processing.ts) decides
 * whether to INJECT the runtime; the auto-mount test (client-script.ts) decides
 * whether to wrap a client block in `stx.mount()` — when it said yes and the
 * first said no, the page emitted `stx.mount(...)` with nothing to mount onto
 * (#1819, #1820); and events.ts asked the related-but-distinct question above
 * (#1824).
 *
 * They live here because events.ts is a leaf module and importing
 * signal-processing.ts would close a cycle through client-script.ts.
 */
export function templateNeedsRuntime(template: string): boolean {
  if (!template)
    return false
  // Blanked for the same reason as above: `@click="go()"` inside a code sample
  // is documentation, not a handler (#1835).
  return HAS_EVENT_HANDLER.test(blankInertHtmlRegions(template)) || templateHasReactiveContext(template)
}

/**
 * `x-` attributes the signals runtime consumes itself.
 *
 * The runtime treats any unrecognised `x-foo` as a generic attribute binding
 * (`x-href`, `x-src`, `x-alt` all work that way), so the ones it handles
 * through their own code paths have to be excluded — that exclusion is what
 * this list is.
 *
 * It is also what decides whether a component may carry the attribute, which
 * is why it lives here rather than only inside the generated runtime. Those
 * were two hand-maintained lists, and they disagreed about exactly two names:
 * `x-tooltip` and `x-tooltip-position`, the most recently added pair (#1673).
 * Putting one on a COMPONENT rewrote it to `:tooltip="Settings"`, a signal
 * binding over an identifier that does not exist — so the tooltip silently
 * vanished AND the page reported a hydration invariant failure naming the
 * tooltip's text rather than the tooltip (#1830). The same attribute on a
 * plain element worked, which made it unguessable from the authoring side.
 */
export const RUNTIME_HANDLED_X_ATTRS: readonly string[] = [
  'x-text', 'x-html', 'x-model', 'x-show', 'x-if', 'x-for', 'x-cloak',
  'x-ref', 'x-data', 'x-bind', 'x-class', 'x-style',
  'x-tooltip', 'x-tooltip-position',
]

/**
 * `x-` attributes owned by the Alpine-style reactive bridge, not the signals
 * runtime. They never reach `X_HANDLED`, but must still survive on a component
 * for the bridge to find them on the rendered element.
 */
export const ALPINE_BRIDGE_X_ATTRS: readonly string[] = [
  'x-init', 'x-transition', 'x-effect', 'x-on',
]

/**
 * Every `x-` attribute that must reach the rendered DOM element untouched when
 * it is written on a component, rather than being captured as a prop binding.
 */
export const COMPONENT_PASSTHROUGH_X_ATTRS: readonly string[] = [
  ...RUNTIME_HANDLED_X_ATTRS,
  ...ALPINE_BRIDGE_X_ATTRS,
]

/** The `X_HANDLED` lookup the generated runtime embeds, as JS source. */
export function runtimeHandledXAttrsLiteral(): string {
  return `{${RUNTIME_HANDLED_X_ATTRS.map(n => `'${n}':1`).join(',')}}`
}

/**
 * Blank the parts of an HTML template that cannot carry a live directive,
 * for DETECTION only — never for output.
 *
 * `hasSignalsSyntax` and friends scan raw template text, so a documentation
 * page quoting stx syntax inside a code sample counted as reactive and shipped
 * the whole ~159KB signals runtime for markup that is inert text
 * (stacksjs/stx#1835).
 *
 * Only TEXT is blanked, and only inside `<pre>` / `<code>` and HTML comments.
 * Tags are kept intact, including their attributes, because that is where a
 * directive actually lives:
 *
 *   <pre><code>&lt;div :if="open"&gt;</code></pre>   -> blanked, it is text
 *   <pre><code><span>&lt;div :if="x"&gt;</span></pre> -> span kept, text blanked
 *   <pre><button @click="go()">run</button></pre>     -> kept, it is a real button
 *
 * Dropping whole regions instead would have been simpler and wrong in the
 * expensive direction: a page whose only reactive element sits inside a `<pre>`
 * would lose its runtime and break, which is worse than shipping bytes it does
 * not need.
 */
export function blankInertHtmlRegions(html: string): string {
  if (!html)
    return html

  const blankText = (segment: string): string =>
    segment.replace(/(<[^>]*>)|([^<]+)/g, (_match, tag: string, text: string) => tag ?? ' '.repeat(text.length))

  return html
    .replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (_m, open: string, body: string, close: string) => open + blankText(body) + close)
    .replace(/(<code\b[^>]*>)([\s\S]*?)(<\/code>)/gi, (_m, open: string, body: string, close: string) => open + blankText(body) + close)
    .replace(/<!--[\s\S]*?-->/g, match => ' '.repeat(match.length))
}
