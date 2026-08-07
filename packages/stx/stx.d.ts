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

interface StxQueryResult<T> {
  data: StxSignal<T | null>
  loading: StxSignal<boolean>
  error: StxSignal<Error | null>
  refetch: () => Promise<void>
}

interface StxMutationResult<T> {
  data: StxSignal<T | null>
  loading: StxSignal<boolean>
  error: StxSignal<Error | null>
  mutate: (body?: unknown) => Promise<T>
}

declare function useFetch<T = any>(_url: string, _options?: any): StxQueryResult<T>
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

declare function useEventListener<K extends keyof WindowEventMap>(
  _target: Window | Document | HTMLElement | string | null,
  _event: K,
  _handler: (event: WindowEventMap[K]) => void,
  _options?: boolean | AddEventListenerOptions,
): StxCleanup
declare function useEventListener(
  _target: Window | Document | HTMLElement | string | null,
  _event: string,
  _handler: (event: Event) => void,
  _options?: boolean | AddEventListenerOptions,
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
declare function useInterval(_fn: () => void, _ms: number, _options?: { immediate?: boolean }): {
  start: () => void
  stop: () => void
  isActive: StxSignal<boolean>
}
declare function useTimeout(_fn: () => void, _ms: number): {
  start: () => void
  stop: () => void
  isPending: StxSignal<boolean>
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

interface StxToastOptions {
  /** Auto-dismiss duration in ms. 0 = persistent. Default: 3000 */
  duration?: number
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
  /** Dismiss a toast by id, or all toasts if no id is given */
  dismiss: (id?: number) => void
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
