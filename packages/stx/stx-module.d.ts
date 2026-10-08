/// <reference path="./stx.d.ts" />

/**
 * The `stx` module, as a `.stx` script block sees it.
 *
 * `stx` is a VIRTUAL specifier. No package by that name is installed in an app,
 * and `import { … } from 'stx'` works only because both script paths intercept
 * it: a client block's import is stripped and its names destructured off
 * `window.stx`, and a server block's names are handed in by the engine as
 * parameters. So what this module exports is exactly what those two paths bind,
 * and nothing else from `@stacksjs/stx` (see src/stx-module-imports.ts):
 *
 *  - every name destructured off `window.stx` (STX_RUNTIME_GLOBALS), which a
 *    server block also receives where the engine binds it, and
 *  - the stx API names only the server engine binds, marked below.
 *
 * Each value is typed by the ambient global of the same name in `stx.d.ts`, so
 * an imported `state` is exactly the auto-imported one; the module adds no
 * second copy of any signature to drift.
 *
 * This file is NOT referenced from the package's types entry, on purpose. The
 * specifier is virtual only inside a `.stx` block; a `.ts` file importing from
 * `stx` has a real import that does not resolve. `stx typecheck` and the editor
 * plugin add it to the programs they build for `.stx` files.
 *
 * Which block kind gets which name is checked separately, because one
 * declaration cannot say it: `stxImportDiagnostics` reports a server-only name
 * imported into a client block and the reverse.
 *
 * test/stx-module-declaration.test.ts keeps this list equal to the runtime's.
 */
declare module 'stx' {
  export const $props: Record<string, any> // <script server> only
  export const batch: typeof globalThis.batch
  export const clearServerData: typeof globalThis.clearServerData
  export const computed: typeof globalThis.computed
  export const configureFetch: typeof globalThis.configureFetch
  export const defineClientPayload: (payload: Record<string, unknown>) => void // <script server> only
  export const defineEmits: typeof globalThis.defineEmits
  export const defineExpose: typeof globalThis.defineExpose
  export const definePageMeta: typeof globalThis.definePageMeta
  export const defineProps: typeof globalThis.defineProps
  export const defineSlots: typeof globalThis.defineSlots
  export const defineStore: typeof globalThis.defineStore
  export const derived: typeof globalThis.derived
  export const effect: typeof globalThis.effect
  export const goBack: typeof globalThis.goBack
  export const goForward: typeof globalThis.goForward
  export const inject: typeof globalThis.inject
  export const invalidateRoute: typeof globalThis.invalidateRoute
  export const isDerived: typeof globalThis.isDerived
  export const isSignal: typeof globalThis.isSignal
  export const navigate: typeof globalThis.navigate
  export const nextTick: typeof globalThis.nextTick
  export const notFound: (status?: number) => void // <script server> only
  export const onBeforeMount: typeof globalThis.onBeforeMount
  export const onBeforeUnmount: typeof globalThis.onBeforeUnmount
  export const onDestroy: typeof globalThis.onDestroy
  export const onMount: typeof globalThis.onMount
  export const onMounted: typeof globalThis.onMounted
  export const onUnmounted: typeof globalThis.onUnmounted
  export const params: Record<string, string> // <script server> only
  export const peek: typeof globalThis.peek
  export const props: Record<string, any> // <script server> only
  export const provide: typeof globalThis.provide
  export const reactive: typeof globalThis.reactive
  export const ref: typeof globalThis.ref
  export const refresh: typeof globalThis.refresh
  export const registerStoresClient: typeof globalThis.registerStoresClient
  export const setResponseHeader: (name: string, value: string) => void // <script server> only
  export const setResponseStatus: (status: number) => void // <script server> only
  export const setRouteParams: typeof globalThis.setRouteParams
  export const state: typeof globalThis.state
  export const untrack: typeof globalThis.untrack
  export const useAsync: typeof globalThis.useAsync
  export const useClickOutside: typeof globalThis.useClickOutside
  export const useColorMode: typeof globalThis.useColorMode
  export const useCookie: typeof globalThis.useCookie
  export const useCounter: typeof globalThis.useCounter
  export const useDark: typeof globalThis.useDark
  export const useDebounce: typeof globalThis.useDebounce
  export const useDebouncedValue: typeof globalThis.useDebouncedValue
  export const useDocumentVisibility: typeof globalThis.useDocumentVisibility
  export const useEventListener: typeof globalThis.useEventListener
  export const useFetch: typeof globalThis.useFetch
  export const useFocus: typeof globalThis.useFocus
  export const useHead: typeof globalThis.useHead
  export const useId: typeof globalThis.useId
  export const useInterval: typeof globalThis.useInterval
  export const useLocalStorage: typeof globalThis.useLocalStorage
  export const useMediaQuery: typeof globalThis.useMediaQuery
  export const useModel: typeof globalThis.useModel
  export const useMutation: typeof globalThis.useMutation
  export const useOptimistic: typeof globalThis.useOptimistic
  export const usePreferredContrast: typeof globalThis.usePreferredContrast
  export const usePreferredDark: typeof globalThis.usePreferredDark
  export const usePreferredLight: typeof globalThis.usePreferredLight
  export const usePreferredReducedMotion: typeof globalThis.usePreferredReducedMotion
  export const useQuery: typeof globalThis.useQuery
  export const useReactiveProp: typeof globalThis.useReactiveProp
  export const useRef: typeof globalThis.useRef
  export const useRoute: typeof globalThis.useRoute
  export const useRouteParam: typeof globalThis.useRouteParam
  export const useRouteParams: typeof globalThis.useRouteParams
  export const useRouter: () => { push: (to: unknown) => void, replace: (to: unknown) => void, back: () => void, forward: () => void, go: (n: number) => void } // <script server> only
  export const useRuntimeConfig: () => Readonly<Record<string, any>> // <script server> only
  export const useScrollLock: typeof globalThis.useScrollLock
  export const useSearchParams: typeof globalThis.useSearchParams
  export const useSeoMeta: typeof globalThis.useSeoMeta
  export const useServerData: typeof globalThis.useServerData // <script server> only
  export const useServerRuntimeConfig: () => Readonly<{ public: Record<string, any>, private: Record<string, any> }> // <script server> only
  export const useSessionStorage: typeof globalThis.useSessionStorage
  export const keptState: typeof globalThis.keptState
  export const forgetKeptState: typeof globalThis.forgetKeptState
  export const useSlots: typeof globalThis.useSlots
  export const useStore: typeof globalThis.useStore
  export const useThrottle: typeof globalThis.useThrottle
  export const useTimeout: typeof globalThis.useTimeout
  export const useToggle: typeof globalThis.useToggle
  export const useWebSocket: typeof globalThis.useWebSocket
  export const watch: typeof globalThis.watch
  export const watchEffect: typeof globalThis.watchEffect
  export const watchMultiple: typeof globalThis.watchMultiple
  export const withDefaults: typeof globalThis.withDefaults

  export type StxSignal<T> = globalThis.StxSignal<T>
  export type StxDerivedSignal<T> = globalThis.StxDerivedSignal<T>
  export type StxRef<T> = globalThis.StxRef<T>
  export type StxCleanup = globalThis.StxCleanup
  export type StxModelOptions<T> = globalThis.StxModelOptions<T>
  export type StxModelSignal<T> = globalThis.StxModelSignal<T>
  export type StxTemplateRef<T> = globalThis.StxTemplateRef<T>
  export type StxNavigateOptions = globalThis.StxNavigateOptions
  export type StxSearchParamsCommitOptions = globalThis.StxSearchParamsCommitOptions
  export type StxRefetchOptions = globalThis.StxRefetchOptions
  export type StxFetchResult<T> = globalThis.StxFetchResult<T>
  export type StxQueryResult<T> = globalThis.StxQueryResult<T>
  export type StxMutationResult<T> = globalThis.StxMutationResult<T>
  export type StxFetchRequestContext = globalThis.StxFetchRequestContext
  export type StxFetchResponseContext = globalThis.StxFetchResponseContext
  export type StxFetchErrorContext = globalThis.StxFetchErrorContext
  export type StxEventListenerOptions = globalThis.StxEventListenerOptions
  export type StxIntervalOptions = globalThis.StxIntervalOptions
  export type StxIntervalControls = globalThis.StxIntervalControls
  export type StxCookieOptions = globalThis.StxCookieOptions
  export type StxColorModeOptions = globalThis.StxColorModeOptions
  export type StxHeadConfig = globalThis.StxHeadConfig
  export type StxSeoMetaConfig = globalThis.StxSeoMetaConfig
  export type StxToastOptions = globalThis.StxToastOptions
  export type StxToast = globalThis.StxToast
  export type StxModal = globalThis.StxModal
  export type StxDrawer = globalThis.StxDrawer
  export type StxDialogOptions = globalThis.StxDialogOptions
  export type StxStorePersistOptions = globalThis.StxStorePersistOptions
  export type StxStoreOptions = globalThis.StxStoreOptions
}
