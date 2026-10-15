/** Browser-global aliases used by the generated client runtime. */
export const SIGNALS_GLOBALS_RUNTIME = `  // Also expose globally for convenience
  window.state = state;
  window.derived = derived;
  window.effect = effect;
  window.batch = batch;
  window.onMount = onMount;
  window.onDestroy = onDestroy;
  window.useFetch = useFetch;
  window.clearServerData = clearServerData;
  window.useRef = useRef;
  window.navigate = navigate;
  window.goBack = goBack;
  window.goForward = goForward;
  window.useRoute = useRoute;
  window.useSearchParams = useSearchParams;
  window.useQuery = useQuery;
  window.useMutation = useMutation;
  window.provide = provide;
  window.$computed = $computed;
  window.$watch = $watch;
  window.useDebounce = useDebounce;
  window.useDebouncedValue = useDebouncedValue;
  window.useThrottle = useThrottle;
  window.useInterval = useInterval;
  window.useTimeout = useTimeout;
  window.useToggle = useToggle;
  window.useCounter = useCounter;
  window.useClickOutside = useClickOutside;
  window.useFocus = useFocus;
  window.nextTick = nextTick;
  window.useAsync = useAsync;
  window.useLocalStorage = useLocalStorage;
  // Paired with the line above. Both are in STX_RUNTIME_GLOBALS, so a
  // <script client> block gets either via the setup destructure — but code
  // that reads the bare window global directly (a plain <script>, or a
  // bundled module that wasn't rewritten) found useLocalStorage defined and
  // useSessionStorage undefined.
  window.useSessionStorage = useSessionStorage;
  window.keptState = keptState;
  window.forgetKeptState = forgetKeptState;
  window.setKeptScope = setKeptScope;
  window.flushKeptState = flushKeptState;
  window.cachedQuery = cachedQuery;
  window.useEventListener = useEventListener;
  window.useWebSocket = useWebSocket;
  window.useColorMode = useColorMode;
  window.useDark = useDark;
  window.useHead = useHead;
  window.useSeoMeta = useSeoMeta;
  window.toast = toast;
  window.modal = modal;
  window.drawer = drawer;
  window.stxAlert = stxAlert;
  window.stxConfirm = stxConfirm;
  window.defineStore = window.stx.defineStore;
  window.useStore = window.stx.useStore;
  window.ref = state;
  window.reactive = reactive;
  window.computed = derived;
  window.watch = $watch;
  window.watchEffect = function(fn) { return effect(fn); };

  // Note: SPA Router and View Transitions CSS are provided by the canonical
  // router script (packages/router/src/client.ts) which is injected alongside
  // the signals runtime or via the @stxRouter directive.
`
