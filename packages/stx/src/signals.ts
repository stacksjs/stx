/**
 * STX Signals - Reactive State Management
 * =========================================
 *
 * This module re-exports the build-time signals API from signals-api.ts
 * and provides the client runtime string generators.
 *
 * @module signals
 */

import { state, derived, effect, batch, onMount, onDestroy, isSignal, isDerived, untrack, peek } from './signals-api'
import { runtimeDirectiveNamesLiteral, runtimeEventRegexLiteral, runtimeHandledXAttrsLiteral } from './runtime-globals'
import { createModelSignal } from './component-model'
import { readHydratedData, clearServerData } from './composables/use-fetch'
import { createKeptStore, indexedDbBackend } from './offline/kept-store'
import { createQueryCache, queryTargetMatches } from './offline/query-cache'
import { SIGNALS_APPEARANCE_RUNTIME } from './client/signals-appearance-runtime'
import { signalsAuthoringRuntime } from './client/signals-authoring-runtime'
import { SIGNALS_BINDING_UTILS_RUNTIME } from './client/signals-binding-utils-runtime'
import { SIGNALS_CLOAK_RUNTIME, SIGNALS_PREAMBLE_RUNTIME } from './client/signals-bootstrap-runtime'
import { SIGNALS_CLASS_RUNTIME } from './client/signals-class-runtime'
import { SIGNALS_CONTEXT_RUNTIME } from './client/signals-context-runtime'
import { SIGNALS_COMPONENT_PROPS_RUNTIME } from './client/signals-component-props-runtime'
import { SIGNALS_COMPONENT_HYDRATION_RUNTIME } from './client/signals-component-hydration-runtime'
import { SIGNALS_COMPONENT_API_RUNTIME } from './client/signals-component-api-runtime'
import { SIGNALS_CONDITIONAL_CHAIN_RUNTIME } from './client/signals-conditional-chain-runtime'
import { SIGNALS_CONDITIONAL_COMPONENT_RUNTIME } from './client/signals-conditional-component-runtime'
import { SIGNALS_CONTAINER_CLEANUP_RUNTIME } from './client/signals-container-cleanup-runtime'
import { SIGNALS_COOKIE_RUNTIME } from './client/signals-cookie-runtime'
import { SIGNALS_DIALOG_RUNTIME } from './client/signals-dialog-runtime'
import { SIGNALS_DEVTOOLS_RUNTIME } from './client/signals-devtools-runtime'
import { SIGNALS_DOM_READY_RUNTIME } from './client/signals-dom-ready-runtime'
import { SIGNALS_DRAWER_RUNTIME } from './client/signals-drawer-runtime'
import { SIGNALS_EFFECT_RUNTIME } from './client/signals-effect-runtime'
import { SIGNALS_EVENT_SHORTHAND_RUNTIME } from './client/signals-event-shorthand-runtime'
import { SIGNALS_EXPRESSION_COMPILER_RUNTIME } from './client/signals-expression-compiler-runtime'
import { SIGNALS_EXPRESSION_RUNTIME } from './client/signals-expression-runtime'
import { SIGNALS_FETCH_TRANSPORT_RUNTIME } from './client/signals-fetch-transport-runtime'
import { signalsFetchRuntime } from './client/signals-fetch-runtime'
import { SIGNALS_FOR_RUNTIME } from './client/signals-for-runtime'
import { SIGNALS_GLOBALS_RUNTIME } from './client/signals-globals-runtime'
import { SIGNALS_HANDLER_RUNTIME } from './client/signals-handler-runtime'
import { SIGNALS_HEAD_RUNTIME } from './client/signals-head-runtime'
import { SIGNALS_HELPERS_RUNTIME } from './client/signals-helpers-runtime'
import { SIGNALS_HOST_RUNTIME } from './client/signals-host-runtime'
import { SIGNALS_HYDRATION_RUNTIME } from './client/signals-hydration-runtime'
import { SIGNALS_HYDRATION_AUDIT_RUNTIME } from './client/signals-hydration-audit-runtime'
import { SIGNALS_IF_CHAIN_RUNTIME } from './client/signals-if-chain-runtime'
import { SIGNALS_IF_RUNTIME } from './client/signals-if-runtime'
import { signalsKeptRuntime } from './client/signals-kept-runtime'
import { SIGNALS_LAZY_HYDRATION_RUNTIME } from './client/signals-lazy-hydration-runtime'
import { SIGNALS_LIFECYCLE_RUNTIME } from './client/signals-lifecycle-runtime'
import { SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME } from './client/signals-loop-component-remap-runtime'
import { SIGNALS_LOOP_CONDITIONAL_RUNTIME } from './client/signals-loop-conditional-runtime'
import { SIGNALS_LOOP_ROW_RUNTIME } from './client/signals-loop-row-runtime'
import { SIGNALS_MANIFEST_HYDRATION_RUNTIME } from './client/signals-manifest-hydration-runtime'
import { SIGNALS_MODEL_RUNTIME } from './client/signals-model-runtime'
import { SIGNALS_NAVIGATION_RUNTIME } from './client/signals-navigation-runtime'
import { SIGNALS_OPTIMISTIC_RUNTIME } from './client/signals-optimistic-runtime'
import { SIGNALS_OVERLAY_RUNTIME } from './client/signals-overlay-runtime'
import { SIGNALS_QUERY_RUNTIME } from './client/signals-query-runtime'
import { SIGNALS_REACTIVE_RUNTIME } from './client/signals-reactive-runtime'
import { SIGNALS_PIPE_RUNTIME } from './client/signals-pipe-runtime'
import { signalsProcessElementRuntime } from './client/signals-process-element-runtime'
import { SIGNALS_PROXY_RUNTIME } from './client/signals-proxy-runtime'
import { SIGNALS_REF_RUNTIME } from './client/signals-ref-runtime'
import { SIGNALS_SCOPE_DISPOSAL_RUNTIME } from './client/signals-scope-disposal-runtime'
import { SIGNALS_SCOPE_TRAVERSAL_RUNTIME } from './client/signals-scope-traversal-runtime'
import { SIGNALS_SHOW_RUNTIME } from './client/signals-show-runtime'
import { SIGNALS_SPA_LOAD_CONTROL_RUNTIME } from './client/signals-spa-load-control-runtime'
import { SIGNALS_SPA_LOAD_RUNTIME } from './client/signals-spa-load-runtime'
import { SIGNALS_STATE_RUNTIME } from './client/signals-state-runtime'
import { SIGNALS_STORE_REGISTRY_RUNTIME } from './client/signals-store-registry-runtime'
import { SIGNALS_STORAGE_RUNTIME } from './client/signals-storage-runtime'
import { SIGNALS_STYLE_RUNTIME } from './client/signals-style-runtime'
import { SIGNALS_SUSPENSE_RUNTIME } from './client/signals-suspense-runtime'
import { SIGNALS_TIMER_RUNTIME } from './client/signals-timer-runtime'
import { SIGNALS_TOOLTIP_RUNTIME } from './client/signals-tooltip-runtime'
import { SIGNALS_TOAST_RUNTIME } from './client/signals-toast-runtime'
import { SIGNALS_TRANSITION_GROUP_RUNTIME } from './client/signals-transition-group-runtime'
import { SIGNALS_WEBSOCKET_RUNTIME } from './client/signals-websocket-runtime'

export * from './signals-api'

// =============================================================================
// Client Runtime Generator
// =============================================================================

/**
 * Generates the browser runtime for STX signals.
 *
 * This runtime is automatically injected into pages that use signals.
 * It provides the full reactivity system and template binding.
 *
 * @returns Minified JavaScript runtime code
 */
export function generateSignalsRuntime(): string {
  // Strip `console.log(...)` calls before minification. They're useful in dev
  // (and the dev build keeps them via generateSignalsRuntimeDev), but in prod
  // they're noise — every nav fires ~15 log lines and they show up in
  // consumer DevTools. `console.warn` / `console.error` are preserved so
  // real problems still surface. See stacksjs/stx#1668 bug 8.
  //
  // Stripping happens OUTSIDE the try on purpose. It used to sit inside, with a
  // catch that returned generateSignalsRuntimeDev() — the raw, *unstripped*
  // source. So any failure in Bun.Transpiler silently shipped all ~40 log sites
  // to production, and the only symptom was a console full of `[stx] signal.set:`
  // in a consumer's DevTools with nothing to explain it. Minification is the
  // optional part; removing the logs is not. See #1873.
  const stripped = stripConsoleLog(generateSignalsRuntimeDev())

  // Use Bun.Transpiler for minification, then fix ASI edge cases. Bun.Transpiler
  // strips newlines but doesn't always insert semicolons at statement boundaries
  // like `}var` or `}let`. While Bun's parser handles these, browsers in strict
  // mode may reject them.
  try {
    const transpiler = new Bun.Transpiler({ loader: 'js', minifyWhitespace: true })
    let minified = transpiler.transformSync(stripped)
    // Insert semicolons at `}keyword` boundaries where ASI would have applied
    // with a newline but doesn't on a single line
    minified = minified.replace(/\}(var |let |const |function )/g, '};$1')
    return minified
  }
  catch {
    // Fallback: unminified but still stripped — larger, correct, and quiet.
    return stripped
  }
}

/**
 * Strips every `console.log(...)` call site from the source, replacing each
 * with `0` (a valid no-op expression statement). Preserves `console.warn` and
 * `console.error` — those signal real problems and should still reach the
 * consumer's DevTools. String contents are respected so a literal `(` or `)`
 * inside a logged message doesn't confuse the paren matcher.
 */
function stripConsoleLog(src: string): string {
  const out: string[] = []
  let i = 0
  const needle = 'console.log('
  while (i < src.length) {
    const hit = src.indexOf(needle, i)
    if (hit === -1) {
      out.push(src.slice(i))
      break
    }
    out.push(src.slice(i, hit))
    // Walk past the call, respecting nested parens and string literals.
    let depth = 1
    let j = hit + needle.length
    while (j < src.length && depth > 0) {
      const c = src[j]
      if (c === '"' || c === '\'' || c === '`') {
        const quote = c
        j++
        while (j < src.length && src[j] !== quote) {
          if (src[j] === '\\')
            j++ // skip escaped char
          j++
        }
        j++ // skip closing quote
        continue
      }
      if (c === '(') depth++
      else if (c === ')') depth--
      j++
    }
    out.push('0')
    i = j
  }
  return out.join('')
}

/**
 * Generates readable (non-minified) runtime for development.
 *
 * @returns Human-readable JavaScript runtime code
 */
export function generateSignalsRuntimeDev(): string {
  return `${SIGNALS_PREAMBLE_RUNTIME}${SIGNALS_HOST_RUNTIME}
${SIGNALS_CLOAK_RUNTIME}  // ==========================================================================
  // Reactive Core
  // ==========================================================================

${SIGNALS_EXPRESSION_COMPILER_RUNTIME}
  let activeEffect = null;
  const effectStack = [];
  const pendingEffects = new Set();
  let isBatching = false;

  // DevTools Phase 2 (#1747): dev-mode reactivity instrumentation. OFF by
  // default — even in the dev runtime — so set()/effect-run stay zero-overhead
  // until window.__stxDevtools.enable() turns counting on. The reactive graph
  // (each signal's subscriber set) is always available via the _effects handle.
  var __stxDevtoolsTracking = false;
  var __stxDevtoolsStats = { signalSets: 0, effectRuns: 0 };
  var __stxEffectId = 0;
  // Phase 3 (#1747): bounded trace buffers, recorded only while tracking.
  var __stxDevtoolsIfTrace = [];
  var __stxDevtoolsQueries = [];
  var __stxDevtoolsMutations = []; // state-change log (signal id + prev/next)
  var __stxSignalId = 0;
  function __stxDevtoolsNow() { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); }
  function __stxDevtoolsRecordIf(rec) { if (!__stxDevtoolsTracking) return; __stxDevtoolsIfTrace.push(rec); if (__stxDevtoolsIfTrace.length > 100) __stxDevtoolsIfTrace.shift(); }
  function __stxDevtoolsRecordQuery(rec) { if (!__stxDevtoolsTracking) return; __stxDevtoolsQueries.push(rec); if (__stxDevtoolsQueries.length > 100) __stxDevtoolsQueries.shift(); }
${SIGNALS_FETCH_TRANSPORT_RUNTIME}
  let activeDisposers = null; // Array | null — when non-null, effects auto-register their dispose fn
  const targetMap = new WeakMap();

${SIGNALS_HELPERS_RUNTIME}
${SIGNALS_PROXY_RUNTIME}
${SIGNALS_PIPE_RUNTIME}
${SIGNALS_STATE_RUNTIME}
${SIGNALS_EFFECT_RUNTIME}
${SIGNALS_LIFECYCLE_RUNTIME}
${SIGNALS_WEBSOCKET_RUNTIME}
${signalsFetchRuntime(readHydratedData.toString(), clearServerData.toString())}
${SIGNALS_REF_RUNTIME}
${SIGNALS_NAVIGATION_RUNTIME}
${SIGNALS_QUERY_RUNTIME}
${SIGNALS_OPTIMISTIC_RUNTIME}
  // ==========================================================================
  // Template Binding
  // ==========================================================================

${SIGNALS_EXPRESSION_RUNTIME}
${SIGNALS_EVENT_SHORTHAND_RUNTIME}
${SIGNALS_HANDLER_RUNTIME}
${SIGNALS_LAZY_HYDRATION_RUNTIME}
${SIGNALS_BINDING_UTILS_RUNTIME}
${SIGNALS_COMPONENT_PROPS_RUNTIME}
${SIGNALS_CONDITIONAL_COMPONENT_RUNTIME}
${SIGNALS_MANIFEST_HYDRATION_RUNTIME}
${signalsProcessElementRuntime(runtimeDirectiveNamesLiteral(), runtimeEventRegexLiteral(), runtimeHandledXAttrsLiteral())}

${SIGNALS_SUSPENSE_RUNTIME}
${SIGNALS_SHOW_RUNTIME}
${SIGNALS_MODEL_RUNTIME}
${SIGNALS_CLASS_RUNTIME}
${SIGNALS_STYLE_RUNTIME}
${SIGNALS_TRANSITION_GROUP_RUNTIME}
${SIGNALS_LOOP_COMPONENT_REMAP_RUNTIME}
${SIGNALS_COMPONENT_HYDRATION_RUNTIME}
${SIGNALS_LOOP_ROW_RUNTIME}
${SIGNALS_FOR_RUNTIME}
${SIGNALS_LOOP_CONDITIONAL_RUNTIME}
${SIGNALS_CONDITIONAL_CHAIN_RUNTIME}
${SIGNALS_IF_CHAIN_RUNTIME}
${SIGNALS_IF_RUNTIME}
${SIGNALS_CONTEXT_RUNTIME}
${SIGNALS_TIMER_RUNTIME}
${SIGNALS_APPEARANCE_RUNTIME}
${SIGNALS_REACTIVE_RUNTIME}

${SIGNALS_STORAGE_RUNTIME}

${signalsKeptRuntime(createKeptStore.toString(), indexedDbBackend.toString(), createQueryCache.toString(), queryTargetMatches.toString())}
${SIGNALS_COOKIE_RUNTIME}
${signalsAuthoringRuntime(createModelSignal.toString())}
${SIGNALS_HEAD_RUNTIME}
${SIGNALS_TOAST_RUNTIME}

${SIGNALS_OVERLAY_RUNTIME}
${SIGNALS_DIALOG_RUNTIME}
${SIGNALS_DRAWER_RUNTIME}
${SIGNALS_TOOLTIP_RUNTIME}
${SIGNALS_HYDRATION_RUNTIME}
  // Component mount system
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

${SIGNALS_COMPONENT_API_RUNTIME}

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
    _stores: new Map(),  // Global store registry — survives SPA navigation

${SIGNALS_STORE_REGISTRY_RUNTIME}

    mountEl: function(selector, setupFn) {
      function doMount() {
        var root = document.querySelector(selector);
        if (!root) { console.warn('[stx] mountEl: element not found:', selector); return; }

        // Set component context for defineProps/defineEmits (Phase 4)
        var prevProps = window.__STX_CURRENT_PROPS__;
        var prevEl = window.__STX_CURRENT_ELEMENT__;
        var propsAttr = root.getAttribute && root.getAttribute('data-stx-props');
        window.__STX_CURRENT_PROPS__ = root.__stx_props || (propsAttr ? JSON.parse(propsAttr) : {});
        window.__STX_CURRENT_ELEMENT__ = root;

        var mountStart = mountCallbacks.length;
        var destroyStart = destroyCallbacks.length;

        // The setup's hooks are collected off the global queues below, so an
        // outer flush's destroy sink must not catch them first (see mount).
        var outerSink = activeDestroySink;
        activeDestroySink = null;
        var scope;
        try { scope = setupFn(); }
        finally { activeDestroySink = outerSink; }

        // Restore previous context (supports nested components)
        window.__STX_CURRENT_PROPS__ = prevProps;
        window.__STX_CURRENT_ELEMENT__ = prevEl;

        var localMountHooks = mountCallbacks.splice(mountStart);
        var localDestroyHooks = destroyCallbacks.splice(destroyStart);

        if (typeof scope === 'object' && scope !== null) {
          scope.$el = root;
          scope.$refs = scope.$refs || {};
          root.__stx_scope = scope;
        }

        var disposeEffects = trackEffects(function() {
          processElement(root, { ...componentScope, ...(scope || {}) });
        });
        root.__stx_disposers = disposeEffects;

        root.removeAttribute('x-cloak');
        root.querySelectorAll('[x-cloak]').forEach(function(el) { el.removeAttribute('x-cloak'); });

        // Through runMountCallbacks, so an onDestroy called inside one of
        // them lands here too rather than on the global queue (#1958).
        runMountCallbacks(localMountHooks, localDestroyHooks);

        root.__stx_destroy = localDestroyHooks;
      }

      if (document.readyState === 'loading') {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    },
    mount: function(setupFn) {
      console.log('[mount] called');
      // Capture script reference synchronously (only valid during execution)
      var scriptEl = document.currentScript;

      function doMount() {
        // Auto-mount scripts are emitted after their component template. Other
        // generated helper scripts can sit between the rendered root and this
        // script, so walk past script/style siblings before selecting the root.
        // Router-injected page scripts are marked data-stx-page and must use the
        // content-container fallback below instead.
        var isSpaPageScript = scriptEl && scriptEl.hasAttribute
          && scriptEl.hasAttribute('data-stx-page')
          && !scriptEl.hasAttribute('data-stx-positioned');
        var root = null;
        if (scriptEl && !isSpaPageScript) {
          var previous = scriptEl.previousElementSibling;
          while (previous && (previous.tagName === 'SCRIPT' || previous.tagName === 'STYLE'))
            previous = previous.previousElementSibling;

          var next = scriptEl.nextElementSibling;
          while (next && (next.tagName === 'SCRIPT' || next.tagName === 'STYLE'))
            next = next.nextElementSibling;

          root = previous || next || scriptEl.parentElement;
        }

        // SPA fallback: during router navigation, script is appended to body>
        // (not inside the content container), so nextElementSibling won't find the page content.
        // Only use fallback when we genuinely couldn't find a suitable root element.
        // Do NOT fallback just because the script is in body> — layout scripts in body>
        // with valid siblings (e.g. sidebar <aside>) should use those siblings as root.

        // An x-data root that initScope has not claimed yet is not ours to mount.
        //
        // The element carries its own state expression and the reactive runtime
        // owns it; data-stx-scope is on it from the server, but the id is not
        // in stx._scopes until initScope runs, which on a navigation happens
        // later in the stx:load handler. Mounting it in the meantime binds its
        // whole subtree against whatever scope the mounting script brought.
        //
        // That is what a layout script did after every SPA navigation. Its own
        // re-executed script now lands inside the content container next to the
        // incoming page, so previousElementSibling resolved to the *page's*
        // x-data root; mount() adopted it and ran processElement over it with the
        // sidebar's scope. Every :for template inside was consumed against a
        // scope holding none of the page's data, and bindFor replaces each
        // template with its stx-for anchor on that single pass — so the markup a
        // retry needed was gone, and the effect had read no signal to re-run on.
        // The list stayed empty for the life of the page while its state sat
        // fully populated beside it. Cold loads never hit it: there the page's
        // own script mounts first, with the right scope.
        //
        // Registered scopes are left alone, so an element the reactive runtime
        // has already initialised keeps whatever behaviour it had.
        function awaitingReactiveInit(el) {
          if (!el || !el.hasAttribute || !el.hasAttribute('data-stx-xdata'))
            return false;
          var id = el.getAttribute('data-stx-scope');
          return !(id && window.stx && window.stx._scopes && window.stx._scopes[id]);
        }

        var needsFallback = !root || root === document.body
          || (root && root.tagName === 'SCRIPT')
          || awaitingReactiveInit(root);
        if (needsFallback) {
          var routerOpts = window.STX_ROUTER_OPTIONS || window.__stxRouterConfig || {};
          var container = document.querySelector('[data-stx-content]')
            || document.querySelector('[data-stx-router-container]')
            || (routerOpts.container ? document.querySelector(routerOpts.container) : null)
            || document.querySelector('main')
            || document.querySelector('#content');
          if (container) {
            // Use the container itself as root — process ALL content inside it
            root = container;
            // But if a specific child is already mounted, find first unmounted one instead
            var hasMount = false;
            var children = container.children;
            for (var ci = 0; ci < children.length; ci++) {
              if (children[ci].__stx_scope) { hasMount = true; break; }
            }
            if (hasMount) for (var ci = 0; ci < children.length; ci++) {
              var candidate = children[ci];
              if (candidate.__stx_scope || candidate.tagName === 'SCRIPT') continue;
              if (awaitingReactiveInit(candidate)) continue;
              root = candidate;
              break;
            }
          }
        }

        // The fallback can still land on one (a container whose only unmounted
        // child is the incoming page). Processing the container instead is safe:
        // processElement skips [data-stx-scope] children, so the reactive
        // runtime keeps its subtree and binds it with the right scope.
        if (awaitingReactiveInit(root)) {
          var reactiveOwnerParent = root.parentElement;
          root = reactiveOwnerParent && reactiveOwnerParent !== document.body ? reactiveOwnerParent : null;
        }

        if (!root) { console.warn('[stx] mount: no root element found'); return; }

        // Set component context for defineProps/defineEmits (Phase 4)
        var prevProps = window.__STX_CURRENT_PROPS__;
        var prevEl = window.__STX_CURRENT_ELEMENT__;
        var propsAttr = root.getAttribute && root.getAttribute('data-stx-props');
        window.__STX_CURRENT_PROPS__ = root.__stx_props || (propsAttr ? JSON.parse(propsAttr) : {});
        window.__STX_CURRENT_ELEMENT__ = root;

        // Track lifecycle hooks registered during setup
        var mountStart = mountCallbacks.length;
        var destroyStart = destroyCallbacks.length;

        // Run setup function — returns scope object with declarations
        //
        // With no outer destroy sink (#1958). This can run inside another
        // component's onMount, where runMountCallbacks has pointed onDestroy at
        // THAT component's queue. The setup's own teardown (a composable such
        // as useEventListener registers its removal with onDestroy) must land
        // on the global queue, where the splice below collects it for this
        // root. Otherwise it belonged to the outer component and outlived this
        // root: mounted on a :for row, removing the row left its listener in.
        var outerSink = activeDestroySink;
        activeDestroySink = null;
        var scope;
        try { scope = setupFn(); }
        finally { activeDestroySink = outerSink; }
        console.log('[mount] root:', root.tagName, 'scope keys:', scope ? Object.keys(scope).slice(0, 10) : 'null');

        // Restore previous context (supports nested components)
        window.__STX_CURRENT_PROPS__ = prevProps;
        window.__STX_CURRENT_ELEMENT__ = prevEl;

        // Capture mount/destroy hooks added during setup
        var localMountHooks = mountCallbacks.splice(mountStart);
        var localDestroyHooks = destroyCallbacks.splice(destroyStart);

        // Register scope
        if (typeof scope === 'object' && scope !== null) {
          scope.$el = root;
          scope.$refs = scope.$refs || {};
          root.__stx_scope = scope;  // Store isolated scope on element
          Object.assign(componentScope, scope);  // Keep for backwards compat
        }

        // Walk DOM and bind directives, tracking effects for cleanup
        var disposeEffects = trackEffects(function() {
          processElement(root, { ...componentScope, ...(scope || {}) });
        });
        root.__stx_disposers = disposeEffects;

        // Remove x-cloak after bindings are applied (prevents FOUC)
        root.removeAttribute('x-cloak');
        root.querySelectorAll('[x-cloak]').forEach(function(el) { el.removeAttribute('x-cloak'); });

        // Fire mount hooks
        // Through runMountCallbacks, so an onDestroy called inside one of
        // them lands here too rather than on the global queue (#1958).
        runMountCallbacks(localMountHooks, localDestroyHooks);

        // Store cleanup on element for auto-destroy
        root.__stx_destroy = localDestroyHooks;
      }

      var isRoutedMount = scriptEl && scriptEl.hasAttribute
        && scriptEl.hasAttribute('data-stx-page');
      if (document.readyState === 'loading' || isRoutedMount) {
        mountQueue.push(doMount);
      }
else {
        doMount();
      }
    }
  });

${SIGNALS_GLOBALS_RUNTIME}
${SIGNALS_DEVTOOLS_RUNTIME}
${SIGNALS_DOM_READY_RUNTIME}
${SIGNALS_SCOPE_DISPOSAL_RUNTIME}
${SIGNALS_HYDRATION_AUDIT_RUNTIME}
${SIGNALS_CONTAINER_CLEANUP_RUNTIME}
${SIGNALS_SPA_LOAD_CONTROL_RUNTIME}
${SIGNALS_SPA_LOAD_RUNTIME}
${SIGNALS_SCOPE_TRAVERSAL_RUNTIME}
})();
`
}

// =============================================================================
// Default Export
// =============================================================================

export default {
  state,
  derived,
  effect,
  batch,
  onMount,
  onDestroy,
  isSignal,
  isDerived,
  untrack,
  peek,
  generateSignalsRuntime,
  generateSignalsRuntimeDev
}
