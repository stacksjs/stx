/**
 * STX Ambient Type Declarations
 *
 * This file is shipped with the @stacksjs/stx package and referenced from
 * the package's main types entry. When stx is installed, TypeScript picks
 * these declarations up automatically — apps do NOT need to write their own
 * stx.d.ts workaround for runtime globals.
 *
 * What's declared here:
 *   1. Module declarations for `*.stx` and `*.md` imports
 *   2. Runtime globals injected by the stx signals runtime into <script client>
 *      blocks (signals, lifecycle, stores, composables, head, routing, etc.)
 *   3. The `window.stx` registry interface
 *
 * Source of truth for the auto-imported global list:
 *   packages/stx/src/client-script.ts → STX_AUTO_IMPORTS
 *   packages/stx/src/signals.ts → window.stx = { ... }
 */

// ============================================================================
// Module declarations
// ============================================================================

// Allow importing .stx files
declare module '*.stx'

// Allow importing .md files with frontmatter
declare module '*.md' {
  const content: string
  const data: Record<string, any>
  export default content
  export { data }
}

// ============================================================================
// Signal types
// ============================================================================

interface StxSignal<T> {
  (): T
  value: T
  set: (value: T) => void
  update: (fn: (current: T) => T) => void
  subscribe: (cb: (value: T) => void) => () => void
  readonly _isSignal: true
}

interface StxDerivedSignal<T> {
  (): T
  readonly value: T
  // Derived signals carry `_isDerived: true` (distinguishes them from state
  // signals, which carry `_isSignal: true`). The two branches are exposed
  // separately as `isSignal()` / `isDerived()`. Surfaced by the dual-impl
  // parity test — both implementations agree on this contract.
  readonly _isDerived: true
}

interface StxRef<T> {
  value: T
}

type StxCleanup = () => void

// ============================================================================
// Signals (modern reactivity)
// ============================================================================

declare function state<T>(_initial: T): StxSignal<T>
declare function derived<T>(_compute: () => T): StxDerivedSignal<T>
declare function effect(_fn: () => void | StxCleanup): StxCleanup
declare function batch(_fn: () => void): void
declare function untrack<T>(_value: T | StxSignal<T> | StxDerivedSignal<T>): T
declare function peek<T>(_fn: () => T): T
declare function isSignal(_value: unknown): value is StxSignal<unknown>
declare function isDerived(_value: unknown): value is StxDerivedSignal<unknown>

// ============================================================================
// Lifecycle
// ============================================================================

declare function onMount(_fn: () => void | StxCleanup): void
declare function onDestroy(_fn: () => void): void
declare function onBeforeMount(_fn: () => void): void
declare function onMounted(_fn: () => void | StxCleanup): void
declare function onBeforeUnmount(_fn: () => void): void
declare function onUnmounted(_fn: () => void): void
// onBeforeUpdate / onUpdated / onErrorCaptured are NOT declared: they exist in
// reactivity.ts and composition-api.ts but have no client-runtime counterpart,
// so declaring them promised a global that resolved to undefined (#1804).

// ============================================================================
// Template refs
// ============================================================================

/** Stable per-component id, unique across instances. */
declare function useId(_prefix?: string): string
/**
 * Signal tracking a parent-driven `:prop="signal()"` attribute on the
 * component's root element. One-way: parent to child.
 */
declare function useReactiveProp<T = unknown>(
  _name: string,
  _defaultValue?: T,
  _options?: { parse?: (_value: string) => T },
): StxSignal<T>
declare function useRef<T = HTMLElement>(_name: string): { current: T | null }

// ============================================================================
// Routing / navigation
// ============================================================================

interface StxNavigateOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean
  /** Bypass the SPA router and perform a full document load. */
  reload?: boolean
}

/**
 * Navigate via the SPA router.
 *
 * The second argument is deliberately NOT typed to also accept a boolean. The
 * legacy positional `forceReload` boolean still works at runtime — it was the
 * shape that actually shipped — but keeping it out of the type means nothing
 * that type-checks today changes meaning (#1807).
 */
declare function navigate<T extends string>(
  _url: T & import('@stacksjs/stx').CheckHref<T>,
  _options?: StxNavigateOptions,
): void
declare function goBack(): void
declare function goForward(): void

/**
 * Re-run the current route against the server and swap the result, without a
 * document load. Use after a mutation that changed server-rendered content.
 */
declare function refresh(): Promise<boolean>

/**
 * Expire one cached route so the next visit re-fetches it. Defaults to the
 * current path.
 */
declare function invalidateRoute(_url?: string): void
declare function useRoute(): {
  path: string
  params: Record<string, string>
  query: Record<string, string>
  hash: string
}
declare function setRouteParams(_params: Record<string, string>): void

/**
 * Reactive access to the current route's dynamic segments.
 *
 * Published on `window.stx` by 5daaba1f9b but never added to the auto-imported
 * list, so it was reachable only as `window.stx.useRouteParams()` — exactly the
 * authoring-surface gap in #1846.
 */
declare function useRouteParams(): StxSignal<Record<string, string>>
/** One dynamic segment, as a signal. */
declare function useRouteParam(_name: string, _defaultValue?: string): StxSignal<string>
/** How a search-param mutation is written to session history (#1825). */
interface StxSearchParamsCommitOptions {
  /** Replace the current history entry instead of pushing a new one. */
  replace?: boolean
}

/**
 * Reactive access to the URL query string.
 *
 * The declaration was wrong in both directions (#1806): it promised `delete`
 * and `has`, which did not exist at runtime, and omitted `setAll` and `data`,
 * which did. `delete`/`has` are now implemented rather than dropped; `get`
 * returns `undefined` for a missing key, not `null`, which is what the runtime
 * and the docs have always said.
 */
declare function useSearchParams(): {
  /** The backing signal — read it to make a binding reactive to the query. */
  data: StxSignal<Record<string, string>>
  get: (_key: string) => string | undefined
  has: (_key: string) => boolean
  /** Set a param. Pushes a history entry unless `{ replace: true }` is passed. */
  set: (_key: string, _value: string, _options?: StxSearchParamsCommitOptions) => void
  /**
   * Remove a param. Pushes a history entry unless `{ replace: true }` is passed.
   *
   * CONSUMING a one-shot param — an OAuth callback result, `?checkout=success`,
   * a flash token — needs `{ replace: true }`. Under the default push, the URL
   * that still carries the param becomes the previous history entry, so Back
   * replays the callback and re-runs whatever consuming it triggered (#1825).
   */
  delete: (_key: string, _options?: StxSearchParamsCommitOptions) => void
  /** Set several params. Pushes a history entry unless `{ replace: true }` is passed. */
  setAll: (_values: Record<string, string>, _options?: StxSearchParamsCommitOptions) => void
}

// ============================================================================
// Data fetching
// ============================================================================

/** How one run of a request should behave. */
interface StxRefetchOptions {
  /**
   * Refresh without touching `loading` or clearing the current error.
   *
   * A poll refreshes data that is already on screen, so driving the first-load
   * state from it puts a spinner over a populated view on every tick — the
   * reason a polling view could not use these primitives at all (#1929). Bind
   * `isFetching` for a subtle in-flight indicator instead.
   */
  background?: boolean
}

interface StxFetchResult<T> {
  data: StxSignal<T | null>
  /** True while a first-load request is in flight. A background one leaves it alone. */
  loading: StxSignal<boolean>
  /** True while ANY request is in flight, background ones included. */
  isFetching: StxSignal<boolean>
  error: StxSignal<Error | null>
  refetch: (_options?: StxRefetchOptions) => Promise<void>
}

/*
 * `useQuery` returns more than `useFetch` does, and declaring one shape for
 * both hid it: `isStale` and `invalidate` existed at runtime and were invisible
 * to the type, so reading either was an error on a value that was really there
 * (#1929). Extending rather than widening the shared interface, because the
 * inverse mistake is worse — declaring `invalidate` on `useFetch` would
 * type-check a call to something that is undefined at runtime.
 */
interface StxQueryResult<T> extends StxFetchResult<T> {
  /** True when cached data is on screen while a revalidation runs. */
  isStale: StxSignal<boolean>
  /** Drop this key from the cache and refetch. */
  invalidate: (_options?: StxRefetchOptions) => Promise<void>
}

interface StxMutationResult<T> {
  data: StxSignal<T | null>
  loading: StxSignal<boolean>
  error: StxSignal<Error | null>
  mutate: (body?: unknown) => Promise<T>
}

declare function useFetch<T = any>(_url: string, _options?: any): StxFetchResult<T>
declare function useQuery<T = any>(_url: string, _options?: any): StxQueryResult<T>
declare function useMutation<T = any>(_url: string, _options?: any): StxMutationResult<T>

/** Context handed to a request interceptor. Mutate it; the return is ignored. */
interface StxFetchRequestContext {
  /** Which primitive made the call: 'useFetch' | 'useQuery' | 'useMutation'. */
  source: string
  /** Reassignable, so a hook can prefix a baseURL. */
  url: string
  /** `headers` is normalised to an object before the hook runs. */
  options: RequestInit & { headers: Record<string, string> }
}

/** Context handed to a response interceptor. */
interface StxFetchResponseContext extends StxFetchRequestContext {
  response: Response
}

/**
 * Context handed to an error interceptor. `response` is the non-ok Response, or
 * null when the fetch itself threw (a network failure); `error` is set only in
 * the latter case.
 */
interface StxFetchErrorContext extends StxFetchRequestContext {
  response: Response | null
  error: Error | null
}

/**
 * Install request/response interceptors for every stx data primitive.
 *
 * All three funnel through one internal fetch, so a single pair of hooks
 * carries an auth header or observes a 401 across `useFetch`, `useQuery` and
 * `useMutation`. Calling this again REPLACES the hooks rather than adding to
 * them, so a re-evaluated module cannot install the same interceptor twice.
 *
 * `onResponseError` fires for a non-ok response and for a thrown fetch. Return
 * a Response to replace the failed one — the shape a 401 -> refresh -> retry
 * takes: refresh the token, re-issue the request with a plain `fetch()` (not
 * this data layer, so it does not re-enter the hook), and return that Response.
 * Return nothing to let the original error stand.
 */
declare function configureFetch(_config: {
  onRequest?: (_ctx: StxFetchRequestContext) => void | Promise<void>
  onResponse?: (_ctx: StxFetchResponseContext) => void | Promise<void>
  onResponseError?: (_ctx: StxFetchErrorContext) => void | Response | Promise<void | Response>
}): void

declare function useOptimistic<T = any, A = any>(
  _base: StxSignal<T> | (() => T) | T,
  _reducer: (_current: T, _action: A) => T,
): [StxSignal<T>, (_action: A, _settleWhen?: PromiseLike<unknown>) => () => void]

// ============================================================================
// DOM utilities
// ============================================================================

/**
 * Options the runtime reads, including the target it binds to.
 *
 * The target travels HERE rather than in a leading parameter, because that is
 * what the implementation does: `var target = (options && options.target) || window`.
 */
interface StxEventListenerOptions {
  /** Element, selector, or document/window. Defaults to `window`. */
  target?: Window | Document | HTMLElement | string | null
  capture?: boolean
  passive?: boolean
  once?: boolean
}

/*
 * Event first, then handler, then options (stacksjs/stx#1923).
 *
 * This was declared target-first while the runtime has always been
 * event-first, so the two disagreed in the worst possible direction: `_target`
 * accepted `string`, so the CORRECT call got as far as reading 'keydown' as a
 * selector before failing on the handler, and an author who trusted the type
 * and added a target wrote `useEventListener(window, 'keydown', fn)` — which
 * binds an event named "window" with the string 'keydown' as its handler, and
 * silently attaches nothing.
 *
 * `browser-composables.ts` had it right all along; the package shipped two
 * declarations of one name with different arities and the registry got the
 * wrong one. Same shape as the `reactive` split: one name, two conventions, and
 * no way for the call site to tell which it has.
 */
declare function useEventListener<K extends keyof WindowEventMap>(
  _event: K,
  _handler: (event: WindowEventMap[K]) => void,
  _options?: StxEventListenerOptions,
): StxCleanup
declare function useEventListener(
  _event: string,
  _handler: (event: Event) => void,
  _options?: StxEventListenerOptions,
): StxCleanup
declare function useScrollLock(
  _target?: HTMLElement | null | { current?: HTMLElement | null, value?: HTMLElement | null } | (() => HTMLElement | null | undefined),
): StxSignal<boolean>
declare function useClickOutside(_target: HTMLElement | StxRef<HTMLElement | null> | string | null, _handler: (event: MouseEvent) => void): StxCleanup
declare function useFocus(_target: HTMLElement | StxRef<HTMLElement | null> | string | null): { focused: StxSignal<boolean>, focus: () => void, blur: () => void }

// ============================================================================
// Timers / scheduling
// ============================================================================

declare function useDebounce<T extends (..._args: any[]) => any>(_fn: T, _delay: number): T
declare function useDebouncedValue<T>(_value: StxSignal<T>, _delay: number): StxSignal<T>
declare function useThrottle<T extends (..._args: any[]) => any>(_fn: T, _delay: number): T
interface StxIntervalOptions {
  /** Tick once on start/resume instead of waiting out the first interval. */
  immediate?: boolean
  /** Gate ticks. `false`, or a function returning false, skips them entirely. */
  enabled?: boolean | (() => boolean)
  /** Skip ticks while `document.hidden`. */
  whileVisible?: boolean
}

interface StxIntervalControls {
  /**
   * Ticks elapsed. A plain number — read it, do not call it. It is not a
   * signal and an `effect` cannot track it; use `subscribe` to react.
   */
  readonly counter: number
  pause: () => void
  resume: () => void
  reset: () => void
  /** Runs on each tick with the new count. Returns an unsubscribe. */
  subscribe: (_fn: (_count: number) => void) => () => void
}

/**
 * Interval with controls. Both call forms work:
 * `useInterval(1000)` for the counter, `useInterval(fn, 1000)` to run something.
 *
 * There is deliberately no `start`/`stop`/`isActive` here. A declaration of that
 * shape shipped for some time and nothing implemented it, so calls against it
 * typechecked clean and threw `poll.start is not a function` on mount (#1941).
 * `resume`/`pause` are the real names.
 */
declare function useInterval(_interval?: number, _options?: StxIntervalOptions): StxIntervalControls
declare function useInterval(_fn: (_count: number) => void, _ms?: number, _options?: StxIntervalOptions): StxIntervalControls
declare function useInterval(_fn: (_count: number) => void, _options?: StxIntervalOptions): StxIntervalControls
declare function useTimeout(_fn: () => void, _ms?: number): {
  /** Plain boolean, not a signal. Use `subscribe` to react to it. */
  readonly isPending: boolean
  start: () => void
  stop: () => void
  subscribe: (_fn: (_pending: boolean) => void) => () => void
}
declare function nextTick(_fn?: () => void): Promise<void>

// ============================================================================
// State utilities
// ============================================================================

declare function useToggle(_initial?: boolean): [StxSignal<boolean>, (value?: boolean) => void]
declare function useCounter(_initial?: number, _options?: { min?: number, max?: number }): {
  count: StxSignal<number>
  inc: (n?: number) => void
  dec: (n?: number) => void
  set: (n: number) => void
  reset: () => void
}
declare function useAsync<T>(_fn: () => Promise<T>): {
  data: StxSignal<T | null>
  loading: StxSignal<boolean>
  error: StxSignal<Error | null>
  execute: () => Promise<T>
}

// ============================================================================
// Storage
// ============================================================================

declare function useLocalStorage<T>(_key: string, _defaultValue: T): StxSignal<T>
declare function useSessionStorage<T>(_key: string, _defaultValue: T): StxSignal<T>

/**
 * Options accepted by the auto-imported `useCookie` global.
 *
 * This describes the CLIENT RUNTIME's cookie composable, which is what a bare
 * `useCookie(...)` in a `<script client>` block resolves to. The module export
 * `@stacksjs/stx/composables` accepts a slightly wider `expires` (Date, epoch ms
 * or parseable string); the runtime calls `.toUTCString()` on it, so only a Date
 * works there. See #1710.
 */
interface StxCookieOptions {
  /** Max age in seconds. */
  maxAge?: number
  /** Expiration date. */
  expires?: Date
  /** Cookie path. Defaults to '/'. */
  path?: string
  /** Cookie domain. */
  domain?: string
  /** Secure flag. Defaults to true when location.protocol is https:. */
  secure?: boolean
  /** SameSite attribute. Defaults to 'Lax'. */
  sameSite?: 'Strict' | 'Lax' | 'None' | 'strict' | 'lax' | 'none'
  /** Value returned when the cookie is absent. Defaults to ''. */
  defaultValue?: string
  /** Custom encoder. Defaults to encodeURIComponent. */
  encode?: (_value: string) => string
  /** Custom decoder. Defaults to decodeURIComponent. */
  decode?: (_value: string) => string
}

/**
 * Reactive binding to a single cookie (#1808).
 *
 * Returns a signal, like `useLocalStorage` — writes serialise straight to
 * `document.cookie`, and `.set('')` deletes by emitting `max-age=0`.
 */
declare function useCookie(_name: string, _options?: StxCookieOptions): StxSignal<string>

// ============================================================================
// WebSocket
// ============================================================================

declare function useWebSocket(_url: string, _options?: {
  immediate?: boolean
  autoReconnect?: boolean | { retries?: number, delay?: number }
  onMessage?: (event: MessageEvent) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (event: Event) => void
}): {
  status: StxSignal<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>
  data: StxSignal<unknown>
  send: (data: string | ArrayBuffer | Blob) => void
  open: () => void
  close: () => void
  ws: WebSocket | null
}

// ============================================================================
// Color mode
// ============================================================================

interface StxColorModeOptions {
  /** localStorage key holding the preference. @default 'stx-color-mode' */
  storageKey?: string
  /** Mode used when nothing valid is stored. @default 'auto' */
  initialMode?: 'light' | 'dark' | 'auto' | 'system'
  /**
   * Class applied to `<html>` when dark. @default 'dark'
   * Applied alongside `attribute`; pass `null` to opt out of the class.
   */
  darkClass?: string | null
  /** Attribute set to the resolved mode on `<html>`, e.g. 'data-theme'. */
  attribute?: string | null
  /**
   * Spelling written to storage for "follow the system".
   * @default whatever is already stored, else 'auto'
   */
  autoValue?: 'auto' | 'system'
  /** Suppress CSS transitions across a mode switch. @default true */
  disableTransitions?: boolean
}

/**
 * Omitting the options picks up whatever `app.colorMode` in `stx.config.ts`
 * published via the pre-paint boot script (stacksjs/stx#1794), so the storage
 * key and attribute don't have to be repeated at the call site.
 */
declare function useColorMode(_options?: StxColorModeOptions): {
  /** Current resolved mode. */
  readonly mode: 'light' | 'dark'
  /** User preference, which may be 'auto'. */
  readonly preference: 'light' | 'dark' | 'auto'
  readonly isDark: boolean
  set: (mode: 'light' | 'dark' | 'auto' | 'system') => void
  toggle: () => void
  subscribe: (fn: (mode: 'light' | 'dark', preference: 'light' | 'dark' | 'auto') => void) => () => void
}
declare function useDark(_options?: StxColorModeOptions): StxSignal<boolean> & {
  readonly isDark: boolean
  toggle: () => void
}
declare function useMediaQuery(query: string): StxSignal<boolean> & {
  readonly matches: boolean
  readonly value: boolean
}
declare function usePreferredDark(): ReturnType<typeof useMediaQuery>
declare function usePreferredLight(): ReturnType<typeof useMediaQuery>
declare function usePreferredReducedMotion(): ReturnType<typeof useMediaQuery>
declare function usePreferredContrast(): ReturnType<typeof useMediaQuery>

// ============================================================================
// Head / SEO
// ============================================================================

interface StxHeadConfig {
  title?: string
  titleTemplate?: string | ((title?: string) => string)
  meta?: Array<Record<string, string>>
  link?: Array<Record<string, string>>
  script?: Array<Record<string, string> & { children?: string }>
  style?: Array<Record<string, string> & { children?: string }>
  htmlAttrs?: Record<string, string>
  bodyAttrs?: Record<string, string>
}

interface StxSeoMetaConfig {
  title?: string
  description?: string
  keywords?: string
  author?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: string
  ogUrl?: string
  ogType?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  twitterTitle?: string
  twitterDescription?: string
  twitterImage?: string
  robots?: string
  canonical?: string
}

declare function useHead(_config: StxHeadConfig): void
declare function useSeoMeta(_config: StxSeoMetaConfig): void
/** No-op on the client; the real one runs at SSR/SSG time. */
declare function definePageMeta(_meta: Record<string, unknown>): void

// ============================================================================
// Vue-style reactivity (alternative API)
// ============================================================================

declare function ref<T>(_value: T): StxRef<T>
declare function reactive<T extends object>(_target: T): T
declare function computed<T>(_getter: () => T): StxRef<T>
declare function watch<T>(
  _source: (() => T) | StxRef<T> | StxSignal<T>,
  _callback: (value: T, oldValue: T) => void,
  _options?: { immediate?: boolean, deep?: boolean },
): StxCleanup
declare function watchEffect(_fn: () => void): StxCleanup
declare function watchMultiple(
  _sources: Array<() => unknown>,
  _callback: (values: unknown[], oldValues: unknown[]) => void,
  _options?: { immediate?: boolean },
): StxCleanup

// ============================================================================
// Component definition / composition API
// ============================================================================

declare function defineProps<T extends Record<string, any> = Record<string, any>>(_definitions?: any): T
declare function withDefaults<T extends Record<string, any>>(_props: T, _defaults: Partial<T>): T
declare function defineEmits<T extends string = string>(): (_event: T, _payload?: unknown) => void
declare function defineExpose<T extends Record<string, any>>(_exposed: T): void
declare function defineSlots<T extends Record<string, (..._args: any[]) => any> = Record<string, (..._args: any[]) => any>>(): T
declare function provide<T>(_key: string | symbol, _value: T): void
declare function inject<T>(_key: string | symbol, _defaultValue?: T): T | undefined
declare function useSlots(): Record<string, any>
// getCurrentInstance / useAttrs are NOT declared — composition-api.ts exports
// them for server use; no client-runtime counterpart exists (#1804).
declare function $computed<T>(_getter: () => T): StxRef<T>
declare function $watch<T>(
  _source: (() => T) | StxRef<T> | StxSignal<T>,
  _callback: (value: T, oldValue: T) => void,
  _options?: { immediate?: boolean, deep?: boolean },
): StxCleanup

// ============================================================================
// Toast notifications
// ============================================================================

/*
 * Every option `addToast` reads (#1932).
 *
 * `title`, `id` and `dark` shipped in the runtime for #1913 and none of them
 * reached here, so the feature built to unblock a migration could not be called
 * from a typechecked file — `stx typecheck` rejected the exact snippet that
 * issue was closed with.
 *
 * `test/signals/toast-declaration-drift.test.ts` now reads the option names out
 * of the runtime and fails if this list falls behind again. Adding an option
 * here without the runtime reading it fails too: a documented option that does
 * nothing is the quieter half of the same problem.
 */
interface StxToastOptions {
  /** Auto-dismiss duration in ms. 0 = persistent. Default: 3000 */
  duration?: number
  /** Heading rendered above the message, in bold. */
  title?: string
  /**
   * Semantic key. A second toast with the same id REPLACES the first in place
   * rather than stacking, and `dismiss(id)` ends it — so a persistent
   * "Publishing…" toast and the call that clears it need not thread the numeric
   * handle between them.
   */
  id?: string | number
  /**
   * Force the dark or light palette. Omitted, it follows the document — the
   * `dark` class, then `data-theme` / `data-color-mode`, then the OS setting.
   */
  dark?: boolean
}

interface StxToast {
  /** Show a success toast (green) */
  success: (message: string, options?: StxToastOptions) => number
  /** Show an error toast (red) */
  error: (message: string, options?: StxToastOptions) => number
  /** Show an info toast (blue) */
  info: (message: string, options?: StxToastOptions) => number
  /** Show a warning toast (yellow) */
  warning: (message: string, options?: StxToastOptions) => number
  /**
   * Dismiss a toast, or all of them if nothing is given.
   *
   * Takes the semantic `id` the toast was created with, or the numeric handle
   * these methods return. The runtime branches on which it got, so a caller does
   * not have to know which kind it is holding — this used to accept `number`
   * only, which made replace-by-id unreachable from a typechecked call site.
   */
  dismiss: (id?: string | number) => void
}

declare const toast: StxToast

// ============================================================================
// Modal system
// ============================================================================

interface StxModal {
  /** Open a modal by its id */
  open: (id: string) => void
  /** Close a modal by its id */
  close: (id: string) => void
  /** Toggle a modal by its id */
  toggle: (id: string) => void
}

declare const modal: StxModal

// ============================================================================
// Drawer system
// ============================================================================

interface StxDrawer {
  /** Open a drawer by its id */
  open: (id: string) => void
  /** Close a drawer by its id */
  close: (id: string) => void
  /** Toggle a drawer by its id */
  toggle: (id: string) => void
}

declare const drawer: StxDrawer

// ============================================================================
// Alert & Confirm dialogs
// ============================================================================

interface StxDialogOptions {
  /** Dialog title displayed above the message */
  title?: string
  /** Icon type: 'info' | 'warning' | 'error' | 'success' | 'question' */
  type?: 'info' | 'warning' | 'error' | 'success' | 'question'
  /** Text for the confirm/OK button (default: 'OK') */
  confirmText?: string
  /** Text for the cancel button — confirm only (default: 'Cancel') */
  cancelText?: string
}

/** Styled replacement for window.alert(). Returns a Promise that resolves when dismissed. */
declare function stxAlert(_message: string, _options?: StxDialogOptions): Promise<void>

/** Styled replacement for window.confirm(). Returns a Promise<boolean>. */
declare function stxConfirm(_message: string, _options?: StxDialogOptions): Promise<boolean>

// ============================================================================
// Stores (Pinia-inspired, signals-based)
// ============================================================================

interface StxStorePersistOptions {
  pick?: string[]
  storage?: 'localStorage' | 'sessionStorage'
  key?: string
}

interface StxStoreOptions {
  persist?: boolean | StxStorePersistOptions
}

declare function defineStore<T>(
  _id: string,
  _setup: () => T,
  _options?: StxStoreOptions,
): () => T
declare function defineStore<S extends Record<string, any>, G extends Record<string, any>, A extends Record<string, any>>(
  _id: string,
  _options: {
    state?: () => S
    getters?: G
    actions?: A
    persist?: boolean | StxStorePersistOptions
  },
): () => S & G & A
declare function useStore<T = any>(_id: string): T
declare function registerStoresClient(_stores: Record<string, unknown>): void
// createStore / createSelector are exported by state-management.ts for server
// use and `action` has no implementation anywhere; none reaches window.stx, so
// none is declared as an ambient global (#1804).

// ============================================================================
// JSX runtime (Vue/React style)
// ============================================================================

// h / Fragment belong to the JSX runtime (jsx-runtime.ts) and are resolved by
// the transform, not destructured off window.stx — so they are not ambient
// globals (#1804). Import them explicitly if you call them directly.

// ============================================================================
// window.stx registry
// ============================================================================

interface StxRuntimeRegistry {
  // Signals
  state: typeof state
  derived: typeof derived
  effect: typeof effect
  batch: typeof batch
  untrack: typeof untrack
  peek: typeof peek
  isSignal: typeof isSignal

  // Lifecycle
  onMount: typeof onMount
  onDestroy: typeof onDestroy

  // Composables
  useFetch: typeof useFetch
  useRef: typeof useRef
  useQuery: typeof useQuery
  useMutation: typeof useMutation
  configureFetch: typeof configureFetch
  useOptimistic: typeof useOptimistic

  // Routing
  navigate: typeof navigate
  goBack: typeof goBack
  goForward: typeof goForward
  refresh: typeof refresh
  invalidateRoute: typeof invalidateRoute
  useRoute: typeof useRoute
  setRouteParams: typeof setRouteParams
  useRouteParams: typeof useRouteParams
  useRouteParam: typeof useRouteParam
  useSearchParams: typeof useSearchParams

  // Composition
  provide: typeof provide
  defineProps: typeof defineProps
  withDefaults: typeof withDefaults
  defineEmits: typeof defineEmits
  defineExpose: typeof defineExpose
  defineSlots: typeof defineSlots

  // Vue compat
  ref: typeof ref
  reactive: typeof reactive
  computed: typeof computed
  watch: typeof watch
  watchEffect: typeof watchEffect
  $computed: typeof $computed
  $watch: typeof $watch

  // Utilities
  useDebounce: typeof useDebounce
  useDebouncedValue: typeof useDebouncedValue
  useThrottle: typeof useThrottle
  useInterval: typeof useInterval
  useTimeout: typeof useTimeout
  useToggle: typeof useToggle
  useCounter: typeof useCounter
  useClickOutside: typeof useClickOutside
  useFocus: typeof useFocus
  useAsync: typeof useAsync
  useLocalStorage: typeof useLocalStorage
  useSessionStorage: typeof useSessionStorage
  useEventListener: typeof useEventListener
  useScrollLock: typeof useScrollLock
  useWebSocket: typeof useWebSocket
  useColorMode: typeof useColorMode
  useDark: typeof useDark
  useHead: typeof useHead
  useSeoMeta: typeof useSeoMeta

  // Stores
  defineStore: typeof defineStore
  useStore: typeof useStore

  // Toast
  toast: StxToast

  // Modal
  modal: StxModal

  // Drawer
  drawer: StxDrawer

  // Dialogs
  alert: typeof stxAlert
  confirm: typeof stxConfirm

  // Mount API
  mount: (setupFn: () => any) => void
  mountEl: (selector: string, setupFn: () => any) => void

  // Helpers (template helpers — populated by app)
  helpers: Record<string, any>

  // Internals (escape hatch)
  [key: string]: any
}

// Bare global so existing code that references `stx` (without `window.`) still works
declare const stx: StxRuntimeRegistry

// Augment Window so `window.stx` is typed
interface Window {
  stx: StxRuntimeRegistry
  __STX_STORES__?: Record<string, any>
  __STX_CURRENT_PROPS__?: Record<string, any>
  __STX_CURRENT_ELEMENT__?: HTMLElement | null
  __stxRouter?: boolean
  __stxRouterConfig?: Record<string, any>
}
