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
  set: (value: T) => void
  update: (fn: (current: T) => T) => void
  subscribe: (cb: (value: T) => void) => () => void
  readonly _isSignal: true
}

interface StxDerivedSignal<T> {
  (): T
  readonly _isSignal: true
}

interface StxRef<T> {
  value: T
}

type StxCleanup = () => void

// ============================================================================
// Signals (modern reactivity)
// ============================================================================

declare function state<T>(initial: T): StxSignal<T>
declare function derived<T>(compute: () => T): StxDerivedSignal<T>
declare function effect(fn: () => void | StxCleanup): StxCleanup
declare function batch(fn: () => void): void
declare function untrack<T>(value: T | StxSignal<T> | StxDerivedSignal<T>): T
declare function peek<T>(fn: () => T): T
declare function isSignal(value: unknown): value is StxSignal<unknown>
declare function isDerived(value: unknown): value is StxDerivedSignal<unknown>

// ============================================================================
// Lifecycle
// ============================================================================

declare function onMount(fn: () => void | StxCleanup): void
declare function onDestroy(fn: () => void): void
declare function onBeforeMount(fn: () => void): void
declare function onMounted(fn: () => void | StxCleanup): void
declare function onBeforeUpdate(fn: () => void): void
declare function onUpdated(fn: () => void): void
declare function onBeforeUnmount(fn: () => void): void
declare function onUnmounted(fn: () => void): void
declare function onErrorCaptured(fn: (error: unknown, instance: any, info: string) => boolean | void): void

// ============================================================================
// Template refs
// ============================================================================

declare function useRef<T = HTMLElement>(name: string): { current: T | null }

// ============================================================================
// Routing / navigation
// ============================================================================

declare function navigate(url: string, options?: { replace?: boolean }): void
declare function goBack(): void
declare function goForward(): void
declare function useRoute(): {
  path: string
  params: Record<string, string>
  query: Record<string, string>
  hash: string
}
declare function setRouteParams(params: Record<string, string>): void
declare function useSearchParams(): {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
  delete: (key: string) => void
  has: (key: string) => boolean
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
  mutate: (body?: any) => Promise<T>
}

declare function useFetch<T = any>(url: string, options?: any): StxQueryResult<T>
declare function useQuery<T = any>(url: string, options?: any): StxQueryResult<T>
declare function useMutation<T = any>(url: string, options?: any): StxMutationResult<T>

// ============================================================================
// DOM utilities
// ============================================================================

declare function useEventListener<K extends keyof WindowEventMap>(
  target: Window | Document | HTMLElement | string | null,
  event: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions,
): StxCleanup
declare function useEventListener(
  target: Window | Document | HTMLElement | string | null,
  event: string,
  handler: (event: Event) => void,
  options?: boolean | AddEventListenerOptions,
): StxCleanup
declare function useMeta(meta: Record<string, string>): void
declare function useClickOutside(target: any, handler: (event: MouseEvent) => void): StxCleanup
declare function useFocus(target: any): { focused: StxSignal<boolean>, focus: () => void, blur: () => void }

// ============================================================================
// Timers / scheduling
// ============================================================================

declare function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T
declare function useDebouncedValue<T>(value: StxSignal<T>, delay: number): StxSignal<T>
declare function useThrottle<T extends (...args: any[]) => any>(fn: T, delay: number): T
declare function useInterval(fn: () => void, ms: number, options?: { immediate?: boolean }): {
  start: () => void
  stop: () => void
  isActive: StxSignal<boolean>
}
declare function useTimeout(fn: () => void, ms: number): {
  start: () => void
  stop: () => void
  isPending: StxSignal<boolean>
}
declare function nextTick(fn?: () => void): Promise<void>

// ============================================================================
// State utilities
// ============================================================================

declare function useToggle(initial?: boolean): [StxSignal<boolean>, (value?: boolean) => void]
declare function useCounter(initial?: number, options?: { min?: number, max?: number }): {
  count: StxSignal<number>
  inc: (n?: number) => void
  dec: (n?: number) => void
  set: (n: number) => void
  reset: () => void
}
declare function useAsync<T>(fn: () => Promise<T>): {
  data: StxSignal<T | null>
  loading: StxSignal<boolean>
  error: StxSignal<Error | null>
  execute: () => Promise<T>
}

// ============================================================================
// Storage
// ============================================================================

declare function useLocalStorage<T>(key: string, defaultValue: T): StxSignal<T>
declare function useSessionStorage<T>(key: string, defaultValue: T): StxSignal<T>

// ============================================================================
// WebSocket
// ============================================================================

declare function useWebSocket(url: string, options?: {
  immediate?: boolean
  autoReconnect?: boolean | { retries?: number, delay?: number }
  onMessage?: (event: MessageEvent) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (event: Event) => void
}): {
  status: StxSignal<'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED'>
  data: StxSignal<any>
  send: (data: string | ArrayBuffer | Blob) => void
  open: () => void
  close: () => void
  ws: WebSocket | null
}

// ============================================================================
// Color mode
// ============================================================================

declare function useColorMode(): {
  mode: StxSignal<'light' | 'dark' | 'auto'>
  setMode: (mode: 'light' | 'dark' | 'auto') => void
}
declare function useDark(): StxSignal<boolean>

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

declare function useHead(config: StxHeadConfig): void
declare function useSeoMeta(config: StxSeoMetaConfig): void

// ============================================================================
// Vue-style reactivity (alternative API)
// ============================================================================

declare function ref<T>(value: T): StxRef<T>
declare function reactive<T extends object>(target: T): T
declare function computed<T>(getter: () => T): StxRef<T>
declare function watch<T>(
  source: (() => T) | StxRef<T> | StxSignal<T>,
  callback: (value: T, oldValue: T) => void,
  options?: { immediate?: boolean, deep?: boolean },
): StxCleanup
declare function watchEffect(fn: () => void): StxCleanup
declare function watchMultiple(
  sources: Array<() => any>,
  callback: (values: any[], oldValues: any[]) => void,
  options?: { immediate?: boolean },
): StxCleanup

// ============================================================================
// Component definition / composition API
// ============================================================================

declare function defineProps<T extends Record<string, any> = Record<string, any>>(definitions?: any): T
declare function withDefaults<T extends Record<string, any>>(props: T, defaults: Partial<T>): T
declare function defineEmits<T extends string = string>(): (event: T, payload?: any) => void
declare function defineExpose<T extends Record<string, any>>(exposed: T): void
declare function provide<T>(key: string | symbol, value: T): void
declare function inject<T>(key: string | symbol, defaultValue?: T): T | undefined
declare function getCurrentInstance(): any
declare function useSlots(): Record<string, any>
declare function useAttrs(): Record<string, any>
declare function $computed<T>(getter: () => T): StxRef<T>
declare function $watch<T>(
  source: (() => T) | StxRef<T> | StxSignal<T>,
  callback: (value: T, oldValue: T) => void,
  options?: { immediate?: boolean, deep?: boolean },
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
  id: string,
  setup: () => T,
  options?: StxStoreOptions,
): () => T
declare function defineStore<S extends Record<string, any>, G extends Record<string, any>, A extends Record<string, any>>(
  id: string,
  options: {
    state?: () => S
    getters?: G
    actions?: A
    persist?: boolean | StxStorePersistOptions
  },
): () => S & G & A
declare function useStore<T = any>(id: string): T
declare function createStore<T>(setup: () => T, options?: StxStoreOptions): () => T
declare function action<T extends (...args: any[]) => any>(fn: T): T
declare function createSelector<T, R>(selector: (state: T) => R): (state: T) => R

// ============================================================================
// JSX runtime (Vue/React style)
// ============================================================================

declare function h(tag: string | Function, props?: Record<string, any> | null, ...children: any[]): any
declare const Fragment: unique symbol

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

  // Routing
  navigate: typeof navigate
  goBack: typeof goBack
  goForward: typeof goForward
  useRoute: typeof useRoute
  setRouteParams: typeof setRouteParams
  useSearchParams: typeof useSearchParams

  // Composition
  provide: typeof provide
  defineProps: typeof defineProps
  withDefaults: typeof withDefaults
  defineEmits: typeof defineEmits
  defineExpose: typeof defineExpose

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
  useEventListener: typeof useEventListener
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
