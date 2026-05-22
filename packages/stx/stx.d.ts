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
declare function onBeforeUpdate(_fn: () => void): void
declare function onUpdated(_fn: () => void): void
declare function onBeforeUnmount(_fn: () => void): void
declare function onUnmounted(_fn: () => void): void
declare function onErrorCaptured(_fn: (error: unknown, instance: HTMLElement | null, info: string) => boolean | void): void

// ============================================================================
// Template refs
// ============================================================================

declare function useRef<T = HTMLElement>(_name: string): { current: T | null }

// ============================================================================
// Routing / navigation
// ============================================================================

declare function navigate(_url: string, options?: { replace?: boolean }): void
declare function goBack(): void
declare function goForward(): void
declare function useRoute(): {
  path: string
  params: Record<string, string>
  query: Record<string, string>
  hash: string
}
declare function setRouteParams(_params: Record<string, string>): void
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
  mutate: (body?: unknown) => Promise<T>
}

declare function useFetch<T = any>(_url: string, options?: any): StxQueryResult<T>
declare function useQuery<T = any>(_url: string, options?: any): StxQueryResult<T>
declare function useMutation<T = any>(_url: string, options?: any): StxMutationResult<T>

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
declare function useMeta(_meta: Record<string, string>): void
declare function useClickOutside(_target: HTMLElement | StxRef<HTMLElement | null> | string | null, _handler: (event: MouseEvent) => void): StxCleanup
declare function useFocus(_target: HTMLElement | StxRef<HTMLElement | null> | string | null): { focused: StxSignal<boolean>, focus: () => void, blur: () => void }

// ============================================================================
// Timers / scheduling
// ============================================================================

declare function useDebounce<T extends (...args: any[]) => any>(fn: T, delay: number): T
declare function useDebouncedValue<T>(_value: StxSignal<T>, _delay: number): StxSignal<T>
declare function useThrottle<T extends (...args: any[]) => any>(fn: T, delay: number): T
declare function useInterval(_fn: () => void, ms: number, options?: { immediate?: boolean }): {
  start: () => void
  stop: () => void
  isActive: StxSignal<boolean>
}
declare function useTimeout(_fn: () => void, ms: number): {
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

// ============================================================================
// WebSocket
// ============================================================================

declare function useWebSocket(_url: string, options?: {
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

declare function useHead(_config: StxHeadConfig): void
declare function useSeoMeta(_config: StxSeoMetaConfig): void

// ============================================================================
// Vue-style reactivity (alternative API)
// ============================================================================

declare function ref<T>(_value: T): StxRef<T>
declare function reactive<T extends object>(_target: T): T
declare function computed<T>(_getter: () => T): StxRef<T>
declare function watch<T>(
  source: (() => T) | StxRef<T> | StxSignal<T>,
  callback: (value: T, oldValue: T) => void,
  options?: { immediate?: boolean, deep?: boolean },
): StxCleanup
declare function watchEffect(_fn: () => void): StxCleanup
declare function watchMultiple(
  sources: Array<() => unknown>,
  callback: (values: unknown[], oldValues: unknown[]) => void,
  options?: { immediate?: boolean },
): StxCleanup

// ============================================================================
// Component definition / composition API
// ============================================================================

declare function defineProps<T extends Record<string, any> = Record<string, any>>(definitions?: any): T
declare function withDefaults<T extends Record<string, any>>(_props: T, _defaults: Partial<T>): T
declare function defineEmits<T extends string = string>(): (event: T, payload?: unknown) => void
declare function defineExpose<T extends Record<string, any>>(_exposed: T): void
declare function provide<T>(_key: string | symbol, _value: T): void
declare function inject<T>(_key: string | symbol, defaultValue?: T): T | undefined
declare function getCurrentInstance(): any
declare function useSlots(): Record<string, any>
declare function useAttrs(): Record<string, any>
declare function $computed<T>(_getter: () => T): StxRef<T>
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
declare function stxAlert(_message: string, options?: StxDialogOptions): Promise<void>

/** Styled replacement for window.confirm(). Returns a Promise<boolean>. */
declare function stxConfirm(_message: string, options?: StxDialogOptions): Promise<boolean>

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
declare function useStore<T = any>(_id: string): T
declare function createStore<T>(_setup: () => T, options?: StxStoreOptions): () => T
declare function action<T extends (...args: any[]) => any>(fn: T): T
declare function createSelector<T, R>(selector: (state: T) => R): (state: T) => R

// ============================================================================
// JSX runtime (Vue/React style)
// ============================================================================

declare function h(_tag: string | Function, props?: Record<string, any> | null, ...children: any[]): any
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
