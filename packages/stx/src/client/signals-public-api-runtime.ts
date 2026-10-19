export function signalsPublicApiRuntime(componentApiRuntime: string): string {
  return `  // Component mount system
  var mountQueue = [];

  // MERGE, never replace (#1804). Three client bundles assign window.stx and
  // the last one used to erase the others. Object.assign also preserves the
  // object IDENTITY, which matters because the generated store runtime captures
  // window.stx in a closure variable — replacing the object leaves that closure
  // calling a detached one.
  window.stx = Object.assign(window.stx || {}, {
    hydrate: hydrateSubtree,
    hydrateHost,
    state,
    derived,
    memo,
    effect,
    batch,
    isSignal,
    isDerived,
    untrack,
    peek,
    inject,
    watchMultiple,
    onMount,
    onBeforeMount: onMount,
    onDestroy,
    onMounted: onMount,
    onBeforeUnmount: onDestroy,
    onUnmounted: onDestroy,
    useFetch,
    clearServerData,
    useRef,
    navigate,
    refresh,
    invalidateRoute,
    goBack,
    goForward,
    useRoute,
    useRouteParams,
    useRouteParam,
    setRouteParams,
    useSearchParams,
    useQuery,
    useMutation,
    configureFetch,
    useOptimistic,
    provide,
    $computed,
    $watch,
    ref,
    reactive,
    computed,
    watch,
    watchEffect,
    useDebounce,
    useDebounceFn,
    useDebouncedValue,
    refDebounced,
    useThrottle,
    useThrottleFn,
    useInterval,
    useTimeout,
    useTimeoutFn,
    useToggle,
    useCounter,
    useClickOutside,
    useFocus,
    nextTick,
    useAsync,
    useLocalStorage,
    useSessionStorage,
    keptState,
    forgetKeptState,
    setKeptScope,
    flushKeptState,
    cachedQuery,
    sharedRequest,
    useCookie,
    useId,
    useReactiveProp,
    useModel,
    useEventListener,
    useWebSocket,
    useColorMode,
    useDark,
    useMediaQuery,
    useDocumentVisibility,
    useScrollLock,
    usePreferredDark,
    usePreferredLight,
    usePreferredReducedMotion,
    usePreferredContrast,
    useHead,
    useSeoMeta,
    // Client-side no-op for definePageMeta — the real implementation registers
    // page metadata (middleware / validate / etc.) at SSR/SSG time. Pages that
    // call it inside a bare <script> or <script client> would otherwise hit
    // ReferenceError on hydration; this shim lets shared client/server code
    // call it safely.
    definePageMeta: function() {},
    toast,
    modal,
    drawer,
    overlays,
    alert: stxAlert,
    confirm: stxConfirm,
    helpers: globalHelpers,

${componentApiRuntime}

    _mountCallbacks: mountCallbacks,
    _destroyCallbacks: destroyCallbacks,
    _cleanupContainer: cleanupContainer,
    _flushLoad: flushStxLoad,
    _beginSwap: beginSwap,
    _registerSuspense: registerSuspense,  // <Suspense> query registration (#1742)
    _tg: { enter: tgEnter, leave: tgLeave, flip: tgFlip, snapshot: tgSnapshot },  // <TransitionGroup> helpers (#1742)
    _scopes: {},  // Component-level scopes
    _scopeCounter: 0,  // Counter for generating unique scope IDs during SPA navigation
    _latestSetup: window.__stx_latestSetup || null,  // Latest SFC setup function (including scripts parsed before the runtime)
    _stores: new Map(),  // Global store registry — survives SPA navigation`
}

