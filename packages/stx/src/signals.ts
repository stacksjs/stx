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
import { SIGNALS_EXPRESSION_RUNTIME } from './client/signals-expression-runtime'
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
import { SIGNALS_PROXY_RUNTIME } from './client/signals-proxy-runtime'
import { SIGNALS_REF_RUNTIME } from './client/signals-ref-runtime'
import { SIGNALS_SCOPE_DISPOSAL_RUNTIME } from './client/signals-scope-disposal-runtime'
import { SIGNALS_SCOPE_TRAVERSAL_RUNTIME } from './client/signals-scope-traversal-runtime'
import { SIGNALS_SHOW_RUNTIME } from './client/signals-show-runtime'
import { SIGNALS_SPA_LOAD_CONTROL_RUNTIME } from './client/signals-spa-load-control-runtime'
import { SIGNALS_SPA_LOAD_RUNTIME } from './client/signals-spa-load-runtime'
import { SIGNALS_STATE_RUNTIME } from './client/signals-state-runtime'
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

  // Compiled expression functions, by parameter list and body. A binding was
  // compiled with new Function on every evaluation: a page with a few hundred
  // names in scope rebuilt a function of a few hundred parameters for every
  // binding of every row, every time a row re-rendered. Opening a 386-message
  // conversation took seven seconds in WebKit, the window frozen meanwhile.
  // A Function built this way closes over nothing, so one can be reused.
  const __stxCompiled = new Map();
  function __stxCompile(params, body) {
    const key = params.join(',') + '\\x01' + body;
    let fn = __stxCompiled.get(key);
    if (!fn) {
      fn = new Function(...params, body);
      // Bounded: expressions are finite per page, but SPA navigation adds more.
      if (__stxCompiled.size >= 5000) __stxCompiled.clear();
      __stxCompiled.set(key, fn);
    }
    return fn;
  }

  // The names an expression mentions, by its text.
  const __stxIdentifiers = new Map();
  function __stxNamesIn(body) {
    let names = __stxIdentifiers.get(body);
    if (!names) {
      names = Array.from(new Set(body.match(/[A-Za-z_$][\\w$]*/g) || []));
      if (__stxIdentifiers.size >= 5000) __stxIdentifiers.clear();
      __stxIdentifiers.set(body, names);
    }
    return names;
  }

  // Compile an expression over just the names in scope it mentions.
  //
  // It was compiled over every name in scope and called with every value,
  // read through the auto-unwrap proxy. Reading a signal subscribes the
  // running effect, so every binding depended on every signal on the page:
  // changing one unrelated value re-ran every binding of every row. The proxy
  // also tested each signal against the expression with fresh regexes. Now an
  // expression sees, reads and subscribes to what it names; a mention inside
  // a string only widens that, never narrows it.
  function __stxCompileScoped(scope, extraParams, body) {
    const keys = [];
    const names = __stxNamesIn(body);
    for (let i = 0; i < names.length; i++) {
      if (Object.prototype.propertyIsEnumerable.call(scope, names[i])) keys.push(names[i]);
    }
    const fn = __stxCompile(extraParams.length ? keys.concat(extraParams) : keys, body);
    // The cache keys on the parameter list, so a function always has these keys.
    fn.__stxKeys = keys;
    return fn;
  }

  function __stxArgs(fn, scope) {
    const keys = fn.__stxKeys;
    const args = new Array(keys.length);
    for (let i = 0; i < keys.length; i++) args[i] = scope[keys[i]];
    return args;
  }

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
  // Short, ref-free repr of a value for the mutation log (so the buffer holds no
  // live references and big objects don't bloat it).
  function __stxShort(v) {
    try {
      if (typeof v === 'string') return v.length > 40 ? (v.slice(0, 40) + '…') : v;
      if (v === null || typeof v !== 'object') return v;
      var s = JSON.stringify(v);
      return s.length > 60 ? (s.slice(0, 60) + '…') : s;
    } catch (e) { return '[unserializable]'; }
  }
  // Wraps fetch with timing + a timeline record (the data layer's queries).
  // Turn a non-ok Response into an Error, reading the body FIRST.
  //
  // Every data primitive threw a synthesized 'HTTP nnn: statusText' before
  // touching the body, so whatever the server actually said — a validation
  // map, a rate-limit reason, an auth message — was unreachable from any stx
  // primitive, with no escape hatch (stacksjs/stx#1848). That is the single
  // most cited reason an app keeps writing raw fetch() calls.
  //
  // The body is attached rather than only interpolated: err.data is what a
  // caller needs to render field errors, and err.status is what it needs to
  // tell 401 from 500 without parsing the message.
  function __stxRawBody(body) {
    return (typeof FormData !== 'undefined' && body instanceof FormData)
      || (typeof Blob !== 'undefined' && body instanceof Blob)
      || (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams)
      || (typeof ArrayBuffer !== 'undefined' && (body instanceof ArrayBuffer || ArrayBuffer.isView(body)));
  }

  async function __stxHttpError(response) {
    var body = null;
    var text = '';
    try { text = await response.text(); } catch (e) { text = ''; }
    if (text) {
      try { body = JSON.parse(text); } catch (e) { body = text; }
    }
    var detail = '';
    if (body && typeof body === 'object') detail = body.message || body.error || '';
    else if (typeof body === 'string') detail = body.slice(0, 200);
    var message = 'HTTP ' + response.status;
    if (response.statusText) message += ': ' + response.statusText;
    if (detail) message += ' - ' + detail;
    var err = new Error(message);
    err.status = response.status;
    err.statusText = response.statusText;
    err.data = body;
    err.response = response;
    return err;
  }

  // One place an app can reach the data layer. Every stx data primitive goes
  // through __stxFetch, the only fetch call in this runtime, so a single pair
  // of hooks covers useFetch, useQuery and useMutation (#1855).
  //
  // Without it there is no way to attach an Authorization header or notice a
  // 401 in one place, which is the reason an app keeps hand-written fetch
  // calls sitting next to the primitives that were meant to replace them.
  //
  // Hooks mutate the context they are handed and their return value is
  // ignored — the ofetch shape most people will already know. Throwing from a
  // hook fails the request, which is what a token-refresh flow wants.
  var __stxFetchHooks = { onRequest: null, onResponse: null, onResponseError: null };

  // Double-submit CSRF, echoed for every same-origin unsafe request. A server
  // using the pattern (Stacks does, by default, on every POST/PUT/PATCH/DELETE)
  // plants a readable cookie and rejects any unsafe request whose header does
  // not repeat it. Nothing here repeated it, so a form posting through
  // useMutation - or the framework's own CMS form block - got 403 "CSRF token
  // mismatch" on a stock install. The same thing axios does for XSRF-TOKEN.
  // Only same-origin: the token must never leave for another host.
  var __stxCsrf = { cookie: 'X-CSRF-Token', header: 'X-CSRF-Token' };

  function __stxCookie(name) {
    if (typeof document === 'undefined' || !document.cookie) return null;
    var parts = document.cookie.split(';');
    for (var i = 0; i < parts.length; i++) {
      var at = parts[i].indexOf('=');
      if (at === -1) continue;
      if (parts[i].slice(0, at).trim() !== name) continue;
      var value = parts[i].slice(at + 1).trim();
      try { return value ? decodeURIComponent(value) : null; } catch (e) { return value || null; }
    }
    return null;
  }

  // Whether this request should carry the token: unsafe, and same-origin.
  function __stxWantsCsrf(url, opts) {
    if (!__stxCsrf) return false;
    var method = String((opts && opts.method) || 'GET').toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return false;
    // A path is same-origin by definition; only an absolute URL needs its
    // origin compared, and one that cannot be parsed is not trusted.
    var target = String(url);
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.slice(0, 2) === '//') {
      if (typeof location === 'undefined') return false;
      try {
        if (new URL(target).origin !== location.origin) return false;
      } catch (e) { return false; }
    }
    return true;
  }

  // Fetch the cookie before the first unsafe request, when the page did not
  // bring one. A page served from a CDN cache cannot: the edge strips
  // Set-Cookie from a cached response, or it would hand one visitor's token to
  // everyone. So the only pages that could post a form were the ones nobody
  // cached. \`csrf.prime\` names a same-origin GET that sets the cookie (any
  // safe Stacks route does); one request, shared by concurrent callers, and
  // only when the cookie is missing.
  var __stxCsrfPriming = null;
  async function __stxPrimeCsrf(url, opts) {
    if (!__stxCsrf || !__stxCsrf.prime || !__stxWantsCsrf(url, opts)) return;
    if (__stxCookie(__stxCsrf.cookie)) return;
    if (!__stxCsrfPriming) {
      __stxCsrfPriming = fetch(__stxCsrf.prime, { credentials: 'same-origin', headers: { Accept: 'application/json' } })
        .then(function () {}, function () {})
        .then(function () { __stxCsrfPriming = null; });
    }
    await __stxCsrfPriming;
  }

  function __stxApplyCsrf(url, opts) {
    if (!__stxWantsCsrf(url, opts)) return;
    var token = __stxCookie(__stxCsrf.cookie);
    if (!token) return;
    var headers = __stxHeaders(opts.headers);
    var wanted = __stxCsrf.header.toLowerCase();
    for (var key in headers) {
      // A token the caller set on purpose wins.
      if (key.toLowerCase() === wanted) return;
    }
    headers[__stxCsrf.header] = token;
    opts.headers = headers;
  }

  function configureFetch(cfg) {
    cfg = cfg || {};
    // Unlike the hooks below, CSRF settings persist unless named: an app that
    // installs an Authorization hook has not asked to stop sending the token.
    // \`csrf: false\` turns it off; \`{ cookie, header }\` renames either side.
    if (Object.prototype.hasOwnProperty.call(cfg, 'csrf')) {
      __stxCsrf = cfg.csrf === false || cfg.csrf === null
        ? null
        : { cookie: (cfg.csrf && cfg.csrf.cookie) || 'X-CSRF-Token', header: (cfg.csrf && (cfg.csrf.header || cfg.csrf.cookie)) || 'X-CSRF-Token', prime: (cfg.csrf && typeof cfg.csrf.prime === 'string' && cfg.csrf.prime) || null };
    }
    // Replace rather than stack: a module re-evaluated by hot reload or by a
    // SPA script re-run must not end up with the same interceptor installed
    // twice, sending two Authorization headers or counting a 401 twice.
    __stxFetchHooks.onRequest = typeof cfg.onRequest === 'function' ? cfg.onRequest : null;
    __stxFetchHooks.onResponse = typeof cfg.onResponse === 'function' ? cfg.onResponse : null;
    // Fires for a non-ok response and for a thrown fetch (network error). If it
    // returns a Response, that Response replaces the original — this is how a
    // 401 -> refresh -> retry is expressed once instead of per call site. The
    // retry itself belongs to the hook: it should refresh the token and re-issue
    // the request with a plain fetch() (not this data layer) so it does not
    // re-enter the hook and loop. Returning nothing lets the error stand.
    __stxFetchHooks.onResponseError = typeof cfg.onResponseError === 'function' ? cfg.onResponseError : null;
  }

  // headers may be a function, so it can be evaluated per request rather than
  // captured once — a token that changes between calls. Object spread over a
  // function copies no own enumerable properties, so passing one used to
  // contribute nothing at all, in silence.
  function __stxHeaders(h) {
    return (typeof h === 'function' ? h() : h) || {};
  }

  async function __stxFetch(source, url, opts) {
    var t0 = __stxDevtoolsNow();
    opts = opts || {};
    // Before the hooks, so an onRequest hook sees (and may override) it.
    await __stxPrimeCsrf(url, opts);
    __stxApplyCsrf(url, opts);
    if (__stxFetchHooks.onRequest) {
      // Normalised first so a hook can write ctx.options.headers.Authorization
      // without having to create the bag itself.
      opts.headers = __stxHeaders(opts.headers);
      var reqCtx = { source: source, url: String(url), options: opts };
      await __stxFetchHooks.onRequest(reqCtx);
      // Reassignable, so a hook can prefix a baseURL or swap the options
      // wholesale instead of only mutating them.
      if (reqCtx.url) url = reqCtx.url;
      opts = reqCtx.options || opts;
    }
    var method = (opts && opts.method) || 'GET';
    // A hook may hand back a Response to use in place of the original. Anything
    // else (a truthy non-Response, undefined) leaves the outcome unchanged.
    function __stxIsResponse(v) { return !!v && typeof v.ok === 'boolean'; }
    try {
      var r = await fetch(url, opts);
      __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: r.status, ok: r.ok, ms: __stxDevtoolsNow() - t0 });
      if (__stxFetchHooks.onResponse) {
        await __stxFetchHooks.onResponse({ source: source, url: String(url), options: opts, response: r });
      }
      if (!r.ok && __stxFetchHooks.onResponseError) {
        var recovered = await __stxFetchHooks.onResponseError({ source: source, url: String(url), options: opts, response: r, error: null });
        if (__stxIsResponse(recovered)) {
          __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: recovered.status, ok: recovered.ok, retried: true, ms: __stxDevtoolsNow() - t0 });
          return recovered;
        }
      }
      return r;
    } catch (e) {
      __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: 0, ok: false, error: String((e && e.message) || e), ms: __stxDevtoolsNow() - t0 });
      // A network-level failure (no Response) also reaches the hook, so a retry
      // can cover a dropped connection, not only an auth status.
      if (__stxFetchHooks.onResponseError) {
        var recoveredErr = await __stxFetchHooks.onResponseError({ source: source, url: String(url), options: opts, response: null, error: e });
        if (__stxIsResponse(recoveredErr)) {
          __stxDevtoolsRecordQuery({ source: source, url: String(url), method: method, status: recoveredErr.status, ok: recoveredErr.ok, retried: true, ms: __stxDevtoolsNow() - t0 });
          return recoveredErr;
        }
      }
      throw e;
    }
  }
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
  // skipChildren: this element's bindings only, because something else already
  // knows where the rest are. The manifest path passes it for every entry, so
  // the tree is never walked; see processFromManifest.
  function processElement(el, scope = componentScope, skipChildren) {
    // Lazy hydration: if this element has stx-hydrate and hasn't been hydrated
    // yet, defer its subtree processing until the trigger fires.
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute && el.hasAttribute('stx-hydrate') && !el.__stx_hydrated) {
      var trigger = el.getAttribute('stx-hydrate') || 'idle';
      deferHydration(el, trigger, scope);
      return;
    }
    if (el.nodeType === Node.ELEMENT_NODE
      && el.hasAttribute
      && el.hasAttribute('data-stx-scope')
      && hasPendingAncestorLoopBoundary(el)) {
      preserveDeferredParentComponentProps(el);
      // Even when the component is itself a loop root, an ancestor loop must
      // create its caller item scope first. The ancestor's bindFor pass will
      // clone and hydrate this component with that scope, then its own loop can
      // evaluate expressions such as group.resources.
      return;
    }

    if (el.nodeType === Node.ELEMENT_NODE && el.tagName === 'BUTTON' && el.hasAttribute && el.hasAttribute('@click')) {

    }
    if (el.nodeType === Node.ELEMENT_NODE && el.hasAttribute) {
      // x-data elements: the reactive bridge has registered their scope into window.stx._scopes.
      // Merge that scope into the processing scope and continue — we handle all directives.
      // Server renames x-data → data-stx-xdata, so check both.
      if (el.hasAttribute('x-data') || el.hasAttribute('data-stx-xdata') || el.__stx_scope) {
        var xdScope = el.__stx_scope || (findElementScope(el) || {});
        if (xdScope && Object.keys(xdScope).length > 0) {
          scope = { ...scope, ...xdScope };
        }
      }
      // v-memo / @memo — skip re-processing if dependency values haven't changed
      if (el.hasAttribute('data-stx-memo')) {
        var memoExpr = el.getAttribute('data-stx-memo');
        try {
          var memoScope = { ...globalHelpers, ...scope, ...(findElementScope(el) || {}) };
          var memoFn = __stxCompileScoped(memoScope, [], 'return ' + memoExpr);
          var memoVals = JSON.stringify(memoFn(...__stxArgs(memoFn, memoScope)));
          if (el.__stx_memo_prev === memoVals) {
            return; // Dependencies unchanged — skip re-processing
          }
          el.__stx_memo_prev = memoVals;
        } catch(e) {}
      }
    }
    // Normalize a signal returned by an interpolation expression before the
    // DOM coerces it to text. The proxy handles ordinary signal references,
    // but a helper or pipe can return the signal function itself.
    const maybeUnwrapSignal = (v) => {
      if (v && typeof v === 'function' && (v._isSignal || v._isDerived)) return v();
      return v;
    };
    if (el.nodeType === Node.TEXT_NODE) {
      // DOM textContent is specified as a string, but lightweight DOM
      // implementations and user-created nodes can retain a numeric value
      // assigned by a binding. Normalize before interpolation detection.
      const text = el.textContent == null ? '' : String(el.textContent);
      if (text && text.includes('{{')) {
        const parts = text.split(/(\\{\\{[\\s\\S]+?\\}\\})/g);
        if (parts.length > 1) {
          const fragment = document.createDocumentFragment();
          const parentEl = el.parentNode;
          // Capture scope NOW before effects run asynchronously
          // Use the passed scope parameter (not global componentScope) to preserve context
          // through nested @if/@for processing where componentScope may be restored
          const capturedScope = { ...globalHelpers, ...scope, ...(findElementScope(parentEl) || {}) };
          parts.forEach(part => {
            const match = part.match(/^\\{\\{\\s*([\\s\\S]+?)\\s*\\}\\}$/);
            if (match) {
              const expr = match[1];
              // Skip placeholder expressions like __TITLE__ (build-time placeholders)
              if (/^__[A-Z_]+__$/.test(expr.trim())) {
                fragment.appendChild(document.createTextNode(part));
                return;
              }
              // Native text-only elements cannot contain the span wrapper used
              // for general interpolation. Bind a text node there so options,
              // titles, and textareas retain valid DOM and accessible labels.
              const isTextOnlyParent = parentEl
                && (parentEl.tagName === 'OPTION' || parentEl.tagName === 'TITLE' || parentEl.tagName === 'TEXTAREA');
              const bindingNode = isTextOnlyParent
                ? document.createTextNode('')
                : document.createElement('span');
              fragment.appendChild(bindingNode);
              // Use captured scope, not dynamic lookup
              effect(() => {
                try {
                  // Check for pipe syntax (Feature #2)
                  const pipeResult = parsePipeExpression(expr, capturedScope);
                  if (pipeResult) {
                    const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
                    bindingNode.textContent = maybeUnwrapSignal(
                      executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope),
                    );
                  }
else {
                    // Use auto-unwrap proxy (Feature #1)
                    const unwrapScope = createExpressionAutoUnwrapProxy(capturedScope, expr);
                    const fn = __stxCompileScoped(capturedScope, [], 'return ' + expr);
                    bindingNode.textContent = maybeUnwrapSignal(fn(...__stxArgs(fn, unwrapScope)));
                  }
                }
catch (e) {
                  // Auto-unwrap can break explicit signal calls like errorData().message
                  // because it converts the signal to its value before the expression runs.
                  // Retry without auto-unwrap so signal functions remain callable.
                  try {
                    const fn = __stxCompileScoped(capturedScope, [], 'return ' + expr);
                    bindingNode.textContent = maybeUnwrapSignal(fn(...__stxArgs(fn, capturedScope)));
                  }
catch (e2) {
                    if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expr, e2);
                    bindingNode.textContent = '';
                  }
                }
              });
            }
else if (part) {
              fragment.appendChild(document.createTextNode(part));
            }
          });
          el.replaceWith(fragment);
        }
      }
      return;
    }

    if (el.nodeType !== Node.ELEMENT_NODE) return;
    if (isForeignToLoopRow(el, scope)) return;

    // <stx-link> handling removed — StxLink builtin now produces <a> directly
    // with data-stx-link attribute. The router handles SPA click interception.

    // <Suspense> boundary — coordinate descendant suspense queries (#1742).
    if (el.hasAttribute('data-stx-suspense') && !el.__stx_suspense_bound) {
      bindSuspense(el, scope);
      // bindSuspense processes the content subtree itself; don't double-process.
      return;
    }

    // Handle @for / :for / x-for first (reactive list)
    var hasColonForLoop = el.hasAttribute(':for') && isForDirectiveExpression(el.getAttribute(':for'));
    if (el.hasAttribute('@for') || hasColonForLoop || el.hasAttribute('x-for')) {
      var forAttr = hasColonForLoop ? ':for' : el.hasAttribute('x-for') ? 'x-for' : '@for';
      bindFor(el, scope, forAttr);
      return;
    }

    // x-else / x-else-if are owned by their preceding x-if chain (#1734).
    // An inactive chain member reached via the parent's snapshot child-
    // iteration must be skipped. Connectivity cannot identify inactivity:
    // an active inner branch is also disconnected while an outer conditional
    // temporarily detaches its parent. bindIfChain owns explicit branch state
    // so nested structural effects can still hydrate active detached subtrees.
    if (el.__stx_chain_member && !el.__stx_chain_active) return;

    // An else/else-if with no preceding if is an orphan. Match Vue: warn,
    // strip the attribute, and render it as a plain element (fall through).
    if (!el.__stx_chain_member) {
      var orphanElse = getElseAttrInfo(el);
      if (orphanElse) {
        console.warn('[STX] ' + orphanElse.name + ' has no matching preceding x-if/:if/@if sibling; rendering as a plain element.');
        el.removeAttribute(orphanElse.name);
      }
    }

    // Handle @if / :if / x-if (conditional rendering)
    if (el.hasAttribute('@if') || el.hasAttribute(':if') || el.hasAttribute('x-if')) {
      var ifAttr = el.hasAttribute(':if') ? ':if' : el.hasAttribute('x-if') ? 'x-if' : '@if';

      // If else/else-if siblings follow, drive the whole chain with one
      // mutually-exclusive effect; otherwise the single-element fast path.
      var ifChain = findIfChain(el, ifAttr);
      console.log('[stx] :if dispatch on', el.tagName, ifAttr + '="' + el.getAttribute(ifAttr) + '"', 'chainLen:', ifChain.length, 'branches:', ifChain.map(function(c) { return c.attr; }).join(','));
      if (ifChain.length > 1) bindIfChain(ifChain, scope);
      else bindIf(el, scope, ifAttr);
      return;
    }

    // Handle @show / :show / x-show (visibility toggle - keeps element in DOM)
    var isNativeModal = el.tagName === 'MODAL';
    if ((el.hasAttribute('@show') && !isNativeModal)
      || el.hasAttribute(':show') || el.hasAttribute('x-show')) {
      var showAttr = el.hasAttribute(':show') ? ':show' : el.hasAttribute('x-show') ? 'x-show' : '@show';
      bindShow(el, el.getAttribute(showAttr), scope, showAttr);
    }

    // Handle @model / :model / x-model (two-way binding)
    var modelBinding = getModelBinding(el);
    if (modelBinding) {
      bindModel(el, modelBinding.expression, scope, modelBinding.name);
    }

    // Capture scope once for all attribute bindings on this element
    // Use the passed scope parameter to preserve context through nested processing
    const attrCapturedScope = { ...globalHelpers, ...scope, ...(findElementScope(el) || {}) };

    // Keep the conditional owners captured while the element is in the tree.
    // Walking parents on each update loses an outer owner when an inner :if
    // detaches its own root. These signals suspend writes while either owner
    // is hidden and refresh the latest value AFTER reinsertion, even when the
    // attribute's source did not change on that show.
    const attrVisibility = [];
    for (var attrAncestor = el; attrAncestor; attrAncestor = attrAncestor.parentNode) {
      if (attrAncestor.__stx_if_visible) attrVisibility.push(attrAncestor.__stx_if_visible);
    }
    function attributesVisible() {
      return attrVisibility.every(function(visible) { return visible(); });
    }

    // Post-eval unwrap: if the expression result is a signal function (e.g.
    // step was resolved via identifier lookup, not via the auto-unwrap
    // proxy — happens when a client script declares const step = state(...)
    // at script-realm scope, making it accessible to new Function but not
    // appearing in the Proxy Object.keys), call it to get the value.
    // Without this, :text="step" sets textContent to the stringified
    // signal function instead of the value.
    const evalAttrExpr = (rawExpr, evaluationScope) => {
      const activeScope = evaluationScope || attrCapturedScope;
      // Decode HTML entities that browsers may encode in attribute values
      // e.g. :text="a > b" may be stored as :text="a &gt; b" in HTML
      var expr = rawExpr.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#x27;/g,"'");
      try {
        if (/^__[A-Z_]+__$/.test(expr.trim())) return expr;

        // Check for pipe syntax (Feature #2)
        const pipeResult = parsePipeExpression(expr, activeScope);
        if (pipeResult) {
          const unwrapScope = createExpressionAutoUnwrapProxy(activeScope, expr);
          var piped = maybeUnwrapSignal(executePipeExpression(pipeResult.valueExpr, pipeResult.pipes, unwrapScope));
          noteExprSuccess(expr);
          return piped;
        }

        // Use auto-unwrap proxy (Feature #1)
        const unwrapScope = createExpressionAutoUnwrapProxy(activeScope, expr);
        const fn = __stxCompileScoped(unwrapScope, [], 'return (' + expr + ')');
        var value = maybeUnwrapSignal(fn(...__stxArgs(fn, unwrapScope)));
        noteExprSuccess(expr);
        return value;
      }
catch (e) {
        // Auto-unwrap can break explicit signal calls like errorData().message
        // Retry without auto-unwrap so signal functions remain callable
        try {
          const fn = __stxCompileScoped(activeScope, [], 'return (' + expr + ')');
          var retried = maybeUnwrapSignal(fn(...__stxArgs(fn, activeScope)));
          noteExprSuccess(expr);
          return retried;
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Attribute expression error:', expr, e2);
          // ReferenceError/TypeError stay unlogged HERE on purpose: a signal
          // may not exist yet on an effect's first pass, and warning on every
          // one of those trains people to ignore the console. Instead the
          // failure is recorded and cleared the moment the same expression
          // evaluates successfully, so only expressions that are STILL broken
          // when hydration finishes get reported — by the audit (#1773).
          else noteExprFailure(expr, e2);
          return '';
        }
      }
    };

    // Known directive names to exclude from generic :attr binding
    var DIRECTIVE_NAMES = ${runtimeDirectiveNamesLiteral()};

    // A bound value cannot introduce a URL scheme the page did not ask for.
    // This is the client half of url-safety.ts: the server refuses a scheme
    // substituted into an href, and x-href over a signal reaches the same
    // attribute by another road. Same policy, same unsafe: prefix, so a page
    // behaves the same whether the value arrived at render or at runtime.
    var URL_NAV_ATTR = {href:1, 'xlink:href':1, action:1, formaction:1, ping:1, cite:1, manifest:1, data:1, to:1};
    var URL_FETCH_ATTR = {src:1, srcset:1, poster:1, background:1};
    var urlRefusalWarned = false;
    function safeUrlAttr(attrName, value) {
      var navigable = URL_NAV_ATTR[attrName];
      if (!navigable && !URL_FETCH_ATTR[attrName]) return value;
      if (typeof value !== 'string' || !value) return value;
      // Browsers ignore ASCII whitespace and controls inside a scheme and match
      // it case-insensitively, so the spellings collapse before the test.
      var probe = value.replace(/[\\u0000-\\u0020\\u00a0\\u2000-\\u200f\\u2028\\u2029\\ufeff]+/g, '').toLowerCase();
      var refused = /^(?:javascript|vbscript|livescript|mocha|view-source):/.test(probe)
        || (navigable
          ? /^data:(?:text\\/html|text\\/xml|application\\/xhtml\\+xml|application\\/xml|image\\/svg\\+xml)/.test(probe)
          : /^data:(?:text\\/html|application\\/xhtml\\+xml)/.test(probe));
      if (!refused) return value;
      if (!urlRefusalWarned) {
        urlRefusalWarned = true;
        console.warn('[stx] refused a ' + attrName + ' value whose scheme can run script: ' + probe.slice(0, 24));
      }
      return 'unsafe:' + value;
    }
    // SVG attributes are case-sensitive, but the HTML parser lowercases
    // prefixed attribute names — ':viewBox' arrives as ':viewbox' because
    // the spec's "adjust SVG attributes" step only covers unprefixed names.
    // Without restoring the canonical casing, setAttribute('viewbox') creates
    // a dead duplicate attribute and the real viewBox never updates.
    var SVG_ATTR_CASE = {attributename:'attributeName', attributetype:'attributeType', basefrequency:'baseFrequency', baseprofile:'baseProfile', calcmode:'calcMode', clippathunits:'clipPathUnits', diffuseconstant:'diffuseConstant', edgemode:'edgeMode', filterunits:'filterUnits', glyphref:'glyphRef', gradienttransform:'gradientTransform', gradientunits:'gradientUnits', kernelmatrix:'kernelMatrix', kernelunitlength:'kernelUnitLength', keypoints:'keyPoints', keysplines:'keySplines', keytimes:'keyTimes', lengthadjust:'lengthAdjust', limitingconeangle:'limitingConeAngle', markerheight:'markerHeight', markerunits:'markerUnits', markerwidth:'markerWidth', maskcontentunits:'maskContentUnits', maskunits:'maskUnits', numoctaves:'numOctaves', pathlength:'pathLength', patterncontentunits:'patternContentUnits', patterntransform:'patternTransform', patternunits:'patternUnits', pointsatx:'pointsAtX', pointsaty:'pointsAtY', pointsatz:'pointsAtZ', preservealpha:'preserveAlpha', preserveaspectratio:'preserveAspectRatio', primitiveunits:'primitiveUnits', refx:'refX', refy:'refY', repeatcount:'repeatCount', repeatdur:'repeatDur', requiredextensions:'requiredExtensions', requiredfeatures:'requiredFeatures', specularconstant:'specularConstant', specularexponent:'specularExponent', spreadmethod:'spreadMethod', startoffset:'startOffset', stddeviation:'stdDeviation', stitchtiles:'stitchTiles', surfacescale:'surfaceScale', systemlanguage:'systemLanguage', tablevalues:'tableValues', targetx:'targetX', targety:'targetY', textlength:'textLength', viewbox:'viewBox', viewtarget:'viewTarget', xchannelselector:'xChannelSelector', ychannelselector:'yChannelSelector', zoomandpan:'zoomAndPan'};
    var SVG_NS = 'http://www.w3.org/2000/svg';
    var EVENT_RE = ${runtimeEventRegexLiteral()};
    var KEY_MAP = {enter:'Enter', tab:'Tab', escape:'Escape', space:' ', up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight', 'delete':'Delete', backspace:'Backspace'};

    // Handle attributes
    getElementAttributes(el).forEach(attr => {
      const name = attr.name;
      const value = attr.value;
      if (!name) return;

      /*
       * A doubled colon escapes the prefix, the way a doubled at-sign does in
       * a directive: @@if renders @if, so ::foo renders :foo.
       *
       * It was excluded from the generic attribute path, which is why it was
       * never evaluated as an expression -- but a name beginning with two
       * colons also begins with one, so the event catch-all below claimed it,
       * registered a listener for an event named :foo, and removed the
       * attribute. The author got neither a binding nor their attribute: it
       * disappeared, silently, and nothing took its place.
       *
       * Unescaped here rather than on the server, because an unescaped :foo
       * reaching this pass is indistinguishable from one the author wrote and
       * would be bound as an event. The attributes were snapshotted before
       * this loop, so the one written now is not revisited.
       */
      if (name.startsWith('::')) {
        el.removeAttribute(name);
        el.setAttribute(name.slice(1), value);
        return;
      }

      // Dynamic attribute binding: @bind:attr, x-bind:attr, :attr, OR x-attr
      // x-attr (e.g. x-class, x-style, x-href, x-src) is the canonical binding prefix.
      // :attr still works for backward compat but is reserved for structural directives.
      // x-text, x-html, x-model, x-show, x-if, x-for, x-cloak, x-ref, x-data are
      // handled by their own code paths below — exclude them here.
      var X_HANDLED = ${runtimeHandledXAttrsLiteral()};
      if (name.startsWith('@bind:') || name.startsWith('x-bind:')
          || (name.startsWith(':') && !name.startsWith('::') && !DIRECTIVE_NAMES[name.slice(1).split('.')[0]] && !EVENT_RE.test(name.slice(1)))
          || (name.startsWith('x-') && !X_HANDLED[name.split('.')[0]] && !X_HANDLED[name])) {
        let attrName = name.startsWith('@bind:') ? name.slice(6) : name.startsWith('x-bind:') ? name.slice(7) : name.startsWith('x-') ? name.slice(2) : name.slice(1);
        if (el.namespaceURI === SVG_NS && SVG_ATTR_CASE[attrName]) attrName = SVG_ATTR_CASE[attrName];
        var parentBindingNames = (el.getAttribute && el.getAttribute('data-stx-parent-bindings') || '').split(/\\s+/);
        var bindingScope = el.__stx_parent_scope && parentBindingNames.includes(attrName)
          ? el.__stx_parent_scope
          : attrCapturedScope;
        effect(() => {
          if (!attributesVisible()) return;
          const v = evalAttrExpr(value, bindingScope);
          // Form control values are live DOM properties. Setting only the HTML
          // attribute does not update a <select>'s chosen option and can leave
          // inputs displaying stale text after a reactive update.
          if (attrName === 'value' && 'value' in el) {
            var controlValue = v;
            if (typeof v === 'object' && v !== null) {
              try { controlValue = JSON.stringify(v); }
              catch (e) { controlValue = String(v); }
            }
            controlValue = v === false || v === null || v === undefined ? '' : String(controlValue);
            el.__stx_bound_value = controlValue;
            var applyControlValue = function() {
              if (!attributesVisible()) return;
              var desiredValue = el.__stx_bound_value == null ? '' : String(el.__stx_bound_value);
              el.value = desiredValue;
              if (desiredValue === '' && el.tagName !== 'OPTION') el.removeAttribute(attrName);
              else if (el.getAttribute(attrName) !== desiredValue) el.setAttribute(attrName, desiredValue);
              if (typeof el.__stx_model_sync === 'function') el.__stx_model_sync();
            };
            applyControlValue();

            // A select's value binding is processed before its child
            // directives. When a nested :for creates the matching options
            // afterward, the browser otherwise leaves the first option
            // selected. Keep the desired value and reapply it whenever the
            // option tree changes, including later reactive list updates.
            if (el.tagName === 'SELECT' && !el.__stx_value_observer && typeof window.MutationObserver !== 'undefined') {
              el.__stx_value_observer = new window.MutationObserver(applyControlValue);
              el.__stx_value_observer.observe(el, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['value'],
              });
              el.__stx_destroy = el.__stx_destroy || [];
              el.__stx_destroy.push(function() {
                if (el.__stx_value_observer) el.__stx_value_observer.disconnect();
                el.__stx_value_observer = null;
              });
            }
            return;
          }
          // Checked, selected, and indeterminate are live DOM properties, just like value.
          // Updating only the HTML attribute leaves a user-touched checkbox or
          // radio in its previous state because the property becomes dirty.
          // Indeterminate has no corresponding effective HTML attribute at all.
          if ((attrName === 'checked' || attrName === 'selected' || attrName === 'indeterminate') && attrName in el) {
            var selectedState = Boolean(v);
            el[attrName] = selectedState;
            if (attrName === 'indeterminate') {
              el.removeAttribute(attrName);
            }
            else if (selectedState) {
              el.setAttribute(attrName, '');
            }
            else {
              el.removeAttribute(attrName);
            }
            return;
          }
          if (attrName.startsWith('aria-') && typeof v === 'boolean') {
            stxHost.setAttribute(el, attrName, String(v));
          }
          else if (typeof v === 'boolean') {
            stxHost.setAttribute(el, attrName, v);
          }
          else if (v === null || v === undefined) {
            stxHost.removeAttribute(el, attrName);
          }
else {
            var attrValue = v;
            if (typeof v === 'object') {
              try { attrValue = JSON.stringify(v); }
              catch (e) { attrValue = String(v); }
            }
            var attrValueSafe = safeUrlAttr(attrName, attrValue);
            // Keep structured values structured for non-DOM hosts. The DOM
            // host serializes them at its boundary, preserving web output.
            var hostValue = (typeof v === 'object' && v !== null) ? v : attrValueSafe;
            // Writing the value an attribute already has is not nothing: a
            // frame given its own src again loads again (an entry in the
            // page's history each time) and a video restarts. A player whose
            // rest and next set share a video re-set it on every step.
            if (el.getAttribute(attrName) === String(attrValueSafe)) return;
            // A frame already on the page that is pointed somewhere else
            // navigates, and every navigation is an entry in the page's own
            // history: a player showing a video per step left one per step,
            // and Back had to be tapped through all of them before it left
            // the screen. Out of the page and back in, the frame starts afresh
            // (its first load adds no entry, and its old entries go with it).
            var parentNode = el.parentNode;
            if (attrName === 'src' && el.tagName === 'IFRAME' && parentNode && el.isConnected
              && el.hasAttribute('src') && el.getAttribute('src') !== String(attrValueSafe)) {
              var nextSibling = el.nextSibling;
              parentNode.removeChild(el);
              stxHost.setAttribute(el, attrName, hostValue);
              parentNode.insertBefore(el, nextSibling);
            }
            else {
              stxHost.setAttribute(el, attrName, hostValue);
            }
          }
        });
        el.removeAttribute(name);
      }
else if (name === '@class' || name === ':class' || name === 'x-class') {
        bindClass(el, value, scope, attributesVisible);
        el.removeAttribute(name);
      }
else if (name === '@style' || name === ':style' || name === 'x-style') {
        bindStyle(el, value, scope, attributesVisible);
        el.removeAttribute(name);
      }
else if (name === '@text' || name === ':text' || name === 'x-text') {
        effect(() => {
          stxHost.setText(el, evalAttrExpr(value));
        });
        el.removeAttribute(name);
      }
else if (name === '@html' || name === ':html' || name === 'x-html') {
        effect(() => {
          // Coerce null/undefined to '' so a missing/unresolved binding renders
          // nothing rather than the literal string "undefined" (#1767).
          var markup = evalAttrExpr(value) ?? '';
          if (stxHost.isNative && stxHost.setMarkup) stxHost.setMarkup(el, markup);
          else el.innerHTML = markup;
        });
        el.removeAttribute(name);
      }
else if (name === 'ref' || name === ':ref' || name === 'x-ref' || name === 'data-stx-ref') {
        // A page ref can be projected through a component whose own $refs
        // replaced the compatibility scope's map. The compiler retains the
        // receiver boundary so named and signal refs use the same caller.
        var refRoot = stxHost.scopeOf(el);
        var refCaller = el.getAttribute('data-stx-ref-caller');
        var refOwnerScope = findElementScope(el);
        if (refCaller) {
          var receiver = refRoot;
          while (receiver && receiver.getAttribute('data-stx-scope') !== refCaller
            && receiver.getAttribute('data-stx-template-scope') !== refCaller) {
            receiver = stxHost.scopeOf(receiver, true);
          }
          refOwnerScope = receiver && receiver.__stx_parent_scope;
        }
        // Only projected refs may reach outside their component. Caller
        // snapshots exclude unrelated, previously hydrated siblings.
        if (refCaller && refOwnerScope) {
          if (refOwnerScope.$refs) refOwnerScope.$refs[value] = el;
        }
        else {
          if (scope.$refs) scope.$refs[value] = el;
          if (componentScope.$refs) componentScope.$refs[value] = el;
        }
        // Also fill a same-named signal declared in the script block, so the
        // documented ref() + x-ref pair works and reading the signal returns
        // the element. Without this the signal stayed empty and every read of
        // it silently returned undefined.
        var refTarget = refCaller && refOwnerScope
          ? refOwnerScope[value]
          : (scope && scope[value]) || componentScope[value];
        if (refTarget && typeof refTarget === 'function' && refTarget._isSignal && typeof refTarget.set === 'function') {
          refTarget.set(el);
        }
      }
      else if (name.startsWith('@') || name.startsWith(':')) {
        // Event handlers: @click, :click, @submit.prevent, :keydown.enter, etc.
        const parts = name.slice(1).split('.');
        // HTML folds attribute names to lowercase; the forwarding metadata
        // retains the declared event spelling (e.g. update:modelValue).
        const parentEventNames = (el.getAttribute && el.getAttribute('data-stx-parent-events') || '').split(/\\s+/);
        const eventName = parentEventNames.find(function(event) {
          return event.toLowerCase() === parts[0].toLowerCase();
        }) || parts[0];
        const modifiers = parts.slice(1);

        // Native Modal uses @show as a lifecycle event. On ordinary elements
        // it remains the visibility directive, so keep that browser behavior.
        const isNativeModalLifecycleEvent = eventName === 'show'
          && el.tagName === 'MODAL';
        // Skip special directives (already handled above or in processElement)
        if (['if', 'for', 'show', 'model', 'class', 'style', 'text', 'html', 'ref'].includes(eventName)
          && !isNativeModalLifecycleEvent) {
          return;
        }

        // Prevent duplicate event binding on the same element
        var eventKey = '__stx_evt_' + eventName + '_' + value.substring(0, 20);
        if (el[eventKey]) { el.removeAttribute(name); return; }
        el[eventKey] = true;

        // Capture scope at setup time so @for loop variables are available when event fires
        const isForwardedComponentEvent = !!(el.__stx_parent_scope && parentEventNames.includes(eventName));
        let eventCapturedScope = isForwardedComponentEvent
          ? { ...globalHelpers, ...el.__stx_parent_scope }
          : { ...globalHelpers, ...scope, ...(findElementScope(el) || {}) };

        stxHost.listen(el, eventName, (event) => {
          // A forwarded handler belongs to the caller, whose scope can be
          // resolved again after this listener is bound: a component inside
          // another component's :if, in a dialog, was bound against the
          // page's scope and only later handed its real caller, so
          // @pick="pickFromBank" found nothing and did nothing. Read it now.
          if (isForwardedComponentEvent && el.__stx_parent_scope)
            eventCapturedScope = { ...globalHelpers, ...el.__stx_parent_scope };
          // Vue-style component listeners fall through to the rendered native
          // root unless the child emits the same event. Signal components use
          // a scope wrapper, so native events arrive here from a descendant.
          // Ignore that native event only after defineEmits() has declared or
          // emitted the same name, preventing submit/click handlers from
          // firing once for the native event and again for the CustomEvent.
          var componentEmits = el.__stx_component_emits;
          if (isForwardedComponentEvent && event.target !== el
            && componentEmits && componentEmits[eventName]) return;

          // Vue-style component handlers receive the emitted payload directly.
          // Native root events still receive the Event object so server-only
          // components can forward clicks and other browser events.
          var handlerEvent = isForwardedComponentEvent && event instanceof CustomEvent
            ? event.detail
            : event;

          // Skip an opener click that reaches UI which just became visible in
          // this frame. A click whose target is inside the revealed subtree is
          // a real interaction and must not be discarded, especially for
          // async lists whose controls are usable as soon as they render.
          if (eventName === 'click') {
            var ancestor = el;
            while (ancestor) {
              if (ancestor.__stx_shown_at
                && (performance.now() - ancestor.__stx_shown_at) < 50
                && !(ancestor.contains && ancestor.contains(event.target))) return;
              ancestor = ancestor.parentElement;
            }
          }
          // System key modifiers
          if (modifiers.includes('self') && event.target !== el) return;
          if (modifiers.includes('ctrl') && !event.ctrlKey) return;
          if (modifiers.includes('alt') && !event.altKey) return;
          if (modifiers.includes('shift') && !event.shiftKey) return;
          if (modifiers.includes('meta') && !event.metaKey) return;
          // Key modifiers
          for (var mi = 0; mi < modifiers.length; mi++) {
            if (KEY_MAP[modifiers[mi]] && event.key !== KEY_MAP[modifiers[mi]]) return;
          }
          if (modifiers.includes('prevent')) event.preventDefault();
          if (modifiers.includes('stop')) event.stopPropagation();
          // Execute with captured scope (includes @for loop variables)
          // For x-data scopes, expressions like "mobileOpen = !mobileOpen" need to
          // read the signal value AND write back through the signal's setter.
          try {
            if (!value || /^__[A-Z_]+__$/.test(value.trim())) return;
            var shorthandFn = parseEventShorthand(value, eventCapturedScope);
            if (shorthandFn) { shorthandFn(handlerEvent); return; }
            // Check if any scope values are signals (x-data pattern)
            var hasSignals = Object.values(eventCapturedScope).some(function(v) {
              return v && typeof v === 'function' && v._isSignal;
            });
            // Only use signal read/write proxy for DIRECT assignment expressions
            // like "count = count + 1" or "open = !open". Function calls like
            // "openModal()" handle their own signal.set() internally — the writeback
            // would RESET signals to their pre-handler values.
            var isDirectAssignment = hasSignals && /^[a-zA-Z_$]\\w*\\s*=/.test(value.trim()) && !value.trim().startsWith('==');
            if (isDirectAssignment) {
              var getVars = Object.keys(eventCapturedScope).map(function(k) {
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && __s["' + k + '"]._isSignal ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var setVars = Object.keys(eventCapturedScope).filter(function(k) {
                var v = eventCapturedScope[k];
                return v && typeof v === 'function' && v._isSignal;
              }).map(function(k) {
                return 'if(' + k + ' !== __s["' + k + '"]()) __s["' + k + '"].set(' + k + ')';
              }).join(';');
              var body = getVars + ';' + value + ';' + setVars;
              var fn2 = __stxCompile(['__s', '$event'], body);
              fn2(eventCapturedScope, handlerEvent);
            } else if (hasSignals) {
              // Function calls with signals in scope keep any signal used through
              // its object API as a raw signal function, and unwrap the rest for
              // primitive reads.
              var unwrapVars = Object.keys(eventCapturedScope).map(function(k) {
                var v = eventCapturedScope[k];
                // A :for item is a signal only as an implementation detail, so
                // that keyed rows can update in place. Its \`.value\` is a field
                // on the item, never the signal compatibility API — the same
                // rule createAutoUnwrapProxy states for binding expressions.
                // Without the carve-out, expressionUsesSignalApi sees
                // \`option.value\` and hands the handler the raw signal, so a
                // handler like \`pick(option.value)\` receives the whole item.
                // It is not an error, so it lands silently: the wrong value is
                // stored and only surfaces much later.
                if (v && typeof v === 'function' && v._isSignal && !v._isStxLoopItem
                  && (expressionCallsSignal(value, k) || expressionUsesSignalApi(value, k))) {
                  return 'var ' + k + ' = __s["' + k + '"]';
                }
                return 'var ' + k + ' = __s["' + k + '"] && typeof __s["' + k + '"] === "function" && __s["' + k + '"]._isSignal ? __s["' + k + '"]() : __s["' + k + '"]';
              }).join(';');
              var fn3 = __stxCompile(['__s', '$event'], unwrapVars + ';' + value);
              fn3(eventCapturedScope, handlerEvent);
            } else {
              var fn = __stxCompileScoped(eventCapturedScope, ['$event'], value);
              fn(...__stxArgs(fn, eventCapturedScope), handlerEvent);
            }
          }
catch (e) {
            // See #1694: dropping the TypeError/ReferenceError carve-out for inline
            // handlers — same reason as executeHandler above. Silencing these hid
            // the substring-detector bug (auto-unwrap missing .set( inside helper
            // calls) for ~30min of bisecting in the field.
            console.warn('[STX] Handler error:', value, e);
          }
        }, {
          capture: modifiers.includes('capture'),
          // A touch or wheel listener that is not passive holds every scroll
          // starting on the element until this thread has run it. Passive
          // unless .prevent needs preventDefault() or .nonpassive asks.
          passive: modifiers.includes('passive')
            || (/^(touchstart|touchmove|wheel|mousewheel)$/i.test(eventName)
              && !modifiers.includes('prevent') && !modifiers.includes('nonpassive')),
          once: modifiers.includes('once')
        });
        el.removeAttribute(name);
      }
    });

    // Process children (skip script/style elements — their text content is not template markup)
    // Skip elements that are roots of nested stx.mount() components — those have their own scope
    if (!skipChildren && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
      var children = Array.from(el.childNodes);
      children.forEach(function(child) {
        if (child.nodeType !== Node.ELEMENT_NODE) { processElement(child, scope); return; }
        // Skip script elements entirely
        if (child.tagName === 'SCRIPT') return;
        // Skip elements already processed by stx.mount() — they have their own scope and effects
        if (child.__stx_scope) return;
        // Skip data-stx-scope elements — they are managed by the reactive (x-data) runtime
        if (child.hasAttribute && child.hasAttribute('data-stx-scope')) return;
        processElement(child, scope);
      });
    }
  }

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
  const detachedBranches = new Set();
  function resumeDetachedBranches() {
    if (!detachedBranches.size) return;
    Array.from(detachedBranches).forEach(function(resume) {
      if (!resume.el.isConnected) return;
      detachedBranches.delete(resume);
      resume();
    });
  }

  function bindIf(el, passedScope = componentScope, attrName = '@if') {
    // Guard: prevent double-binding on the same element
    if (el.__stx_if_bound) { console.log('[stx] bindIf SKIPPED (already bound):', el.getAttribute(attrName) || '(attr removed)', 'on', el.tagName); return; }
    el.__stx_if_bound = true;

    const expr = el.getAttribute(attrName);
    let parent = el.parentNode;

    // Guard: if element has no parent, it's detached - skip processing
    if (!parent) {
      console.warn('[STX] bindIf: element has no parent, skipping');
      return;
    }

    const placeholder = stxHost.anchor('stx-if');
    // Marks where this branch's rendered content ENDS (stacksjs/stx#1955).
    // Hiding used to remove only the cloned nodes, but a structural directive
    // directly inside the template renders its own output as siblings that are
    // not among those clones -- a <template :for> at the top level of a
    // <template :if> left every row on screen after the branch went false.
    // Only the template branch needs it; the single-element branch owns exactly
    // the node it was bound to.
    let endMarker = null;
    let isInserted = true;

    // Handle <template> elements specially - clone their content
    const isTemplate = el.tagName === 'TEMPLATE';
    if (!isTemplate) el.__stx_if_visible = state(true);
    const componentSetupSiblings = isTemplate ? [] : findConditionalComponentSetupSiblings(el);
    let currentNodes = isTemplate ? [] : [el, ...componentSetupSiblings];

    // Capture BOTH element scope AND passedScope NOW before anything changes
    // passedScope may contain @for iteration variables or parent component signals
    const capturedElementScope = findElementScope(el);
    const capturedComponentScope = { ...passedScope };

    preserveConditionalComponentScopes(el, capturedComponentScope);
    stxHost.insert(parent, placeholder, el);
    el.removeAttribute(attrName);

    if (isTemplate) {
      // Nothing is cloned until the condition holds: the effect below clones
      // template.content on the first true and binds it then. Every branch
      // used to be cloned and inserted up front and the false ones removed, so
      // a false branch still built its elements - in WebKit a <video> or
      // <audio> sets up a media player as it is created.
      isInserted = false;
      stxHost.remove(el); // Remove the template element itself
    }

    // Helper to evaluate with captured scope (auto-unwraps signals).
    // A with-scope resolves only identifiers the expression actually references,
    // so the conditional subscribes narrowly instead of reading every signal
    // in a component scope. That broad subscription made an unrelated ref
    // update re-enter structural removal while the real condition was already
    // removing the same subtree. First try the auto-unwrap proxy (so a bare
    // comparison like count > 5 reads the signal value), then retry with the
    // raw scope so call syntax like count() === 0 still works (#1733).
    const evalExpr = (expression) => {
      // Skip placeholder expressions like __TITLE__ (build-time placeholders)
      if (/^__[A-Z_]+__$/.test(expression.trim())) {
        return expression;
      }
      try {
        const scope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
        const unwrapScope = createExpressionAutoUnwrapProxy(scope, expression);
        const fn = __stxCompileScoped(unwrapScope, [], 'return ' + expression + '');
        return fn(...__stxArgs(fn, unwrapScope));
      }
catch (e1) {
        try {
          // Retry without the unwrap proxy so call-syntax (signal()) works.
          const scope2 = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
          const fn2 = __stxCompileScoped(scope2, [], 'return ' + expression + '');
          return fn2(...__stxArgs(fn2, scope2));
        }
catch (e2) {
          if (!(e2 instanceof ReferenceError) && !(e2 instanceof TypeError)) console.warn('[STX] Expression error:', expression, e2);
          return '';
        }
      }
    };

    // Track if children have been processed
    let childrenProcessed = false;

    // Helper to process children with captured scope
    const processChildrenWithScope = () => {
      // Build the combined scope for children - no need to modify global componentScope
      // Just pass the scope explicitly to processElement
      const childScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };


      Array.from(el.childNodes).forEach(child => processElement(child, childScope));

      childrenProcessed = true;
    };

    // A <template :if> inserts clones of template.content rather than the
    // template element itself. Those clones still need the normal directive
    // and interpolation pass. Previously the initially-visible branch was
    // inserted and left inert, so bindings such as :text and {{ expression }}
    // leaked into the rendered UI until the condition toggled.
    const processTemplateNodes = (nodes) => {
      const childScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
      // Components compiled inside a <template :if> carry setup scripts in the
      // template content. Browser-cloned scripts are inert, so register their
      // scopes and forwarded props before walking the inserted branch. This is
      // the same component hydration path used by <template :for>.
      hydrateComponentScopes(nodes, childScope);
      nodes.forEach(node => {
        if (!node.__stx_disposers && node.tagName !== 'SCRIPT')
          node.__stx_effect_disposers = trackEffects(function() { processElement(node, childScope); });
        if (node.nodeType === 1) {
          node.removeAttribute('x-cloak');
          node.querySelectorAll('[x-cloak]').forEach(c => c.removeAttribute('x-cloak'));
        }
      });
      resumeDetachedBranches();
    };

    // Evaluate the :if expression — use direct signal read for simple refs,
    // falling back to evalExpr for complex expressions
    const fullScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
    const directSignal = fullScope[expr];

    effect(() => {
      parent = followPlaceholder(placeholder, parent, currentNodes);
      var value;
      if (directSignal && (directSignal._isSignal || directSignal._isDerived)) {
        value = directSignal();
        console.log('[stx] bindIf effect (direct):', expr, '→', value, 'isInserted:', isInserted);
      } else {
        value = evalExpr(expr);
      }

      if (isTemplate) {
        if (value && !isInserted) {
          // Re-insert cloned content
          currentNodes = Array.from(el.content.childNodes).map(n => stxHost.clone(n));
          const insertionAnchor = placeholder.nextSibling;
          currentNodes.forEach(node => stxHost.insert(parent, node, insertionAnchor));
          // Bound AFTER the clones, so hiding can remove whatever a nested
          // structural directive rendered as their sibling (#1955).
          if (!endMarker) endMarker = stxHost.anchor('stx-if-end');
          stxHost.insert(parent, endMarker, insertionAnchor);
          processTemplateNodes(currentNodes);
          childrenProcessed = true;
          // Stamp insertion time for click propagation guard
          currentNodes.forEach(function(n) { if (n.nodeType === 1) n.__stx_shown_at = performance.now(); });
          isInserted = true;
        }
else if (!value && isInserted) {
          // Remove all current nodes. Do NOT disposeSubtreeScopes — :if is a
          // toggle, not a permanent unmount; see the single-element branch
          // below and #1737. Effects are disposed, though: these clones are never
          // reused, and a re-show clones afresh, so leaving them bound only
          // accumulates work (#1954).
          //
          // Everything between the placeholder and the end marker goes, not
          // just the clones: a nested :for or :if renders siblings of its own
          // that no clone list contains (#1955).
          // Only walk the range when THIS binding inserted the content and
          // left its marker. Without that guard the walk ran to the end of the
          // parent and took a sibling <template :if> with it -- the initial
          // server-rendered state has no marker to stop at.
          if (endMarker && endMarker.parentNode === parent) {
            var leaving = [];
            for (var cursor = placeholder.nextSibling; cursor && cursor !== endMarker; cursor = cursor.nextSibling) leaving.push(cursor);
            suspendSubtreeScopes(leaving);
            var doomed = placeholder.nextSibling;
            while (doomed && doomed !== endMarker) {
              var nextDoomed = doomed.nextSibling;
              disposeSubtreeEffects(doomed);
              stxHost.remove(doomed);
              doomed = nextDoomed;
            }
            stxHost.remove(endMarker);
          }
          suspendSubtreeScopes(currentNodes.filter(node => node.parentNode));
          currentNodes.forEach(node => { disposeSubtreeEffects(node); stxHost.remove(node); });
          currentNodes = [];
          isInserted = false;
          childrenProcessed = false;
        }
        else if (value && isInserted && !childrenProcessed) {
          // Initial template content is cloned before the effect runs. Process
          // it after the condition is confirmed so hidden branches stay inert.
          // Keep hydration synchronous so the outer scope walk cannot bind
          // caller-owned slot expressions first, while peek() prevents child
          // reads from subscribing to this conditional effect.
          childrenProcessed = true;
          peek(function() {
            if (isInserted) processTemplateNodes(currentNodes);
          });
        }
      }
else {
        // Native hosts keep a view hierarchy rather than a DOM subtree. Route
        // the conditional through the same visibility contract as :show so a
        // false branch is hidden in the first render and in every loop row;
        // the structural remove/insert below still preserves browser and
        // native lifecycle behaviour when the branch changes.
        if (stxHost.isNative) stxHost.setVisible(el, !!value);
        if (value && !isInserted) {
          console.log('[stx] bindIf INSERTING element for :if=' + expr);
          const insertionAnchor = placeholder.nextSibling;
          currentNodes.forEach(node => stxHost.insert(parent, node, insertionAnchor));
          if (parent && parent.__stx_detached_if) currentNodes.forEach(node => parent.__stx_detached_if.delete(node));
          el.__stx_if_visible.set(true);
          el.__stx_shown_at = performance.now();
          isInserted = true;
          // A previously hydrated parent skips hydrateShownBranch on re-show.
          // Its children may have become visible while it was detached, so
          // resume their pending bindings now that the subtree is connected.
          peek(resumeDetachedBranches);
          // Shown before, so the components in it mounted and were suspended
          // when it hid. They mount again now -- in a microtask, the same
          // moment their first mount ran, and only if still shown by then.
          if (childrenProcessed) {
            queueMicrotask(function() {
              if (isInserted) peek(function() { resumeSubtreeScopes(currentNodes); });
            });
          }
        }
else if (!value && isInserted) {
          console.log('[stx] bindIf REMOVING element for :if=' + expr, 'el.isConnected:', el.isConnected, 'parent:', parent.tagName);
          el.__stx_if_visible.set(false);
          // Unmounted, not disposed: the components in it release what they
          // hold while their markup is still on the page, and keep their scopes.
          suspendSubtreeScopes(currentNodes);
          // Do NOT disposeSubtreeScopes here. :if is a TOGGLE — the element is
          // re-shown when the condition flips back — not a permanent unmount.
          // A nested data-stx-scope inside this subtree is created once by its
          // setup IIFE at page load and stored in window.stx._scopes; deleting
          // it on hide left re-show unable to recreate it, so nested scoped
          // components under reactive conditionals rendered all branches at
          // once (#1737). Permanent disposal stays in bindFor (item removal)
          // and cleanupContainer (SPA navigation). The double-bind guards make
          // re-show idempotent, so toggling doesn't leak.
          currentNodes.forEach(node => stxHost.remove(node));
          // Detached nodes are out of reach of a DOM walk, so an ancestor row or
          // branch removed while this is hidden could not dispose their effects
          // (#1954). Record them on the parent that keeps the placeholder.
          if (parent) {
            if (!parent.__stx_detached_if) parent.__stx_detached_if = new Set();
            currentNodes.forEach(node => parent.__stx_detached_if.add(node));
          }
          isInserted = false;
          console.log('[stx] bindIf REMOVED, el.isConnected:', el.isConnected);
        }
        // Process the entire subtree when element is visible and not yet processed.
        // peek() keeps child effects from subscribing to this bindIf's tracked
        // signals. Use capturedComponentScope (not global componentScope) so
        // iteration variables from an enclosing for-loop remain in scope.
        // Process the element itself, not just children, so sibling directives
        // on the same element (e.g. text binding alongside if) fire too. The if
        // attribute was already removed, so no recursion.
        //
        // Synchronously when the branch is on the page, as the template and
        // if/else-chain branches already are. This pass used to wait for a
        // timer, so every :if (and each :for inside one) filled in a frame
        // after the rest of the page was bound: a screen opened from a tab bar
        // showed its sections arriving one after another.
        if (value && isInserted && !childrenProcessed) {
          childrenProcessed = true;
          // Until this pass runs, the shown subtree still holds literal {{ }}.
          // Flag it so the hydration audit doesn't report those as a binding
          // miss when the pass is deferred (#1773).
          el.__stx_if_pending = true;
          var hydrateShownBranch = function() {
            // Removed with its row, or hidden again, before this ran. Hydrating
            // a detached element now creates effects nothing will dispose
            // (#1954). Leave it unprocessed so the next show schedules the pass.
            if (!el.isConnected) {
              childrenProcessed = false;
              el.__stx_if_pending = false;
              // Hidden by an ancestor rather than by this condition (a page :if
              // around a component whose own :if queued this pass), the branch
              // comes back without this effect running, and a component shown
              // again kept its :for rows as raw markup.
              var resume = function() {
                if (!isInserted || childrenProcessed) return;
                childrenProcessed = true;
                el.__stx_if_pending = true;
                peek(hydrateShownBranch);
              };
              resume.el = el;
              detachedBranches.add(resume);
              return;
            }
            var childScope = { ...globalHelpers, ...capturedComponentScope, ...(capturedElementScope || {}) };
            // A false single-element conditional is detached before the
            // DOMContentLoaded component-scope pass. When it becomes visible,
            // hydrate any component roots in the restored subtree first so
            // projected slot bindings and component-local directives receive
            // the same lifecycle as components inserted by template :if.
            var wasTrackedBeforeConditionalHydration = !!el.__stx_disposers;
            hydrateComponentScopes(currentNodes, childScope);
            // Tracked on its own property so an ancestor row or branch removal
            // reaches these effects too (#1954). This runs after the enclosing
            // tracker has closed, so nothing else would collect them.
            if (wasTrackedBeforeConditionalHydration || !el.__stx_disposers)
              el.__stx_if_disposers = trackEffects(function() { processElement(el, childScope); });
            // Remove x-cloak from the inserted subtree — the initial
            // cloak removal (after processElement on the root) already
            // ran before this deferred processing, so newly-inserted
            // :if children still have x-cloak and stay hidden.
            el.removeAttribute('x-cloak');
            el.querySelectorAll('[x-cloak]').forEach(function(c) { c.removeAttribute('x-cloak'); });
            // Deferred bind complete — the audit may inspect this subtree now.
            el.__stx_if_pending = false;
            // Branches inside this one that were hidden with it can bind now.
            resumeDetachedBranches();
          };
          // In a microtask, not inside this effect's own run: child effects
          // created while it is running saw the data mid-change (a screen
          // swapping workouts) and recorded expressions that had never
          // evaluated. A microtask still runs before the browser paints, so
          // the branch is bound in the first frame all the same. A branch
          // shown while detached (inside content not on the page yet) waits a
          // macrotask, when it has been placed.
          if (el.isConnected) {
            // A native host sends the insertion as soon as its current
            // mutation turn ends. Hydrating in a later microtask would put the
            // handler registration in a second batch, leaving a same-turn tap
            // with the source expression instead of a native handler id.
            if (stxHost.isNative) peek(hydrateShownBranch);
            else queueMicrotask(function() { peek(hydrateShownBranch); });
          }
          else setTimeout(hydrateShownBranch, 0);
        }
      }
    });
  }

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

    // Component composition API (Phase 4)
    defineProps: function(definitions) {
      var props = window.__STX_CURRENT_PROPS__ || {};
      if (!definitions) return props;
      var result = Object.assign({}, props);
      for (var key in definitions) {
        if (!definitions.hasOwnProperty(key)) continue;
        var def = definitions[key];
        var opts = (typeof def === 'function' || Array.isArray(def)) ? { type: def } : (def || {});
        if (result[key] === undefined && opts['default'] !== undefined) {
          result[key] = typeof opts['default'] === 'function' ? opts['default']() : opts['default'];
        }
      }
      return result;
    },
    withDefaults: function(props, defaults) {
      var result = Object.assign({}, props);
      for (var key in defaults) {
        if (!defaults.hasOwnProperty(key)) continue;
        if (result[key] === undefined) {
          result[key] = typeof defaults[key] === 'function' ? defaults[key]() : defaults[key];
        }
      }
      return result;
    },
    defineEmits: function(events) {
      var el = window.__STX_CURRENT_ELEMENT__ || null;
      var declaredEvents = Array.isArray(events)
        ? events
        : (events && typeof events === 'object' ? Object.keys(events) : []);
      if (el && declaredEvents.length) {
        el.__stx_component_emits = el.__stx_component_emits || Object.create(null);
        declaredEvents.forEach(function(event) {
          el.__stx_component_emits[event] = true;
        });
      }
      return function(event, payload) {
        var target = el || document.body;
        if (el) {
          el.__stx_component_emits = el.__stx_component_emits || Object.create(null);
          el.__stx_component_emits[event] = true;
        }
        target.dispatchEvent(new CustomEvent(event, { detail: payload, bubbles: true, cancelable: true }));
      };
    },
    defineExpose: function(exposed) {
      var el = window.__STX_CURRENT_ELEMENT__;
      if (el) el.__stx_exposed = exposed;
    },
    defineSlots: function() {
      return window.__STX_CURRENT_SLOTS__ || {};
    },
    // Vue spells the same lookup useSlots(); it was auto-imported with no
    // implementation behind it (#1804).
    useSlots: function() {
      return window.__STX_CURRENT_SLOTS__ || {};
    },

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

    // ── Store System ──
    // Pinia-inspired, signals-based. Stores survive SPA navigation.

    defineStore: function(id, setupOrOptions, storeOptions) {
      console.log('[stx:store] defineStore called:', id, 'type:', typeof setupOrOptions === 'function' ? 'setup' : 'options', 'persist:', !!(storeOptions && storeOptions.persist));
      // Return existing store if already defined.
      //
      // During a store HMR pass the definition is deliberately re-run, so the
      // cached instance must NOT short-circuit it (#1877 ask 4).
      if (window.stx._stores.has(id) && !window.stx.__hmrStoreReplacing) {
        console.log('[stx:store] returning existing store:', id);
        return window.stx._stores.get(id);
      }

      // Determine setup function
      var setupFn;
      if (typeof setupOrOptions === 'function') {
        // Setup style: defineStore('id', () => { ... })
        setupFn = setupOrOptions;
      } else {
        // Options style: defineStore('id', { state, getters, actions })
        var opts = setupOrOptions;
        setupFn = function() {
          var result = {};
          // Convert state to signals
          var initialState = typeof opts.state === 'function' ? opts.state() : (opts.state || {});
          var stateSignals = {};
          for (var key in initialState) {
            stateSignals[key] = state(initialState[key]);
            result[key] = stateSignals[key];
          }
          // Convert getters to derived signals
          if (opts.getters) {
            for (var gKey in opts.getters) {
              (function(getterKey, getterFn) {
                result[getterKey] = derived(function() {
                  // Build state snapshot for getter
                  var snapshot = {};
                  for (var sk in stateSignals) { snapshot[sk] = stateSignals[sk](); }
                  return getterFn(snapshot);
                });
              })(gKey, opts.getters[gKey]);
            }
          }
          // An action that mutates state in place — this.list.push(x),
          // this.list[i] = x, delete this.map[k] — never went through set(),
          // so nothing that read the list re-ran. A detail page upserting the
          // record it had just fetched kept rendering "not found" until some
          // unrelated action happened to reassign the whole list.
          //
          // So an array or plain object read through this comes back as a
          // view that notifies its signal on write. The view is shallow:
          // elements read through it are the raw ones, so identity checks
          // (includes, indexOf, ===) still hold.
          var mutatingArrayMethods = { push: 1, pop: 1, shift: 1, unshift: 1, splice: 1, sort: 1, reverse: 1, fill: 1, copyWithin: 1 };
          var viewRaw = new WeakMap();
          var viewCache = new WeakMap();
          var unwrapView = function(v) {
            return (v && typeof v === 'object' && viewRaw.has(v)) ? viewRaw.get(v) : v;
          };
          var isPlainContainer = function(v) {
            if (!v || typeof v !== 'object') return false;
            if (Array.isArray(v)) return true;
            var proto = Object.getPrototypeOf(v);
            return proto === Object.prototype || proto === null;
          };
          var mutableView = function(sig, raw) {
            var cached = viewCache.get(raw);
            if (cached && cached.sig === sig) return cached.view;
            var view = new Proxy(raw, {
              get: function(target, p) {
                if (Array.isArray(target) && typeof p === 'string' && mutatingArrayMethods[p]) {
                  // One notification per call, not one per index it writes.
                  return function() {
                    var args = Array.prototype.map.call(arguments, unwrapView);
                    var out = Array.prototype[p].apply(target, args);
                    sig.trigger();
                    return out === target ? view : out;
                  };
                }
                return Reflect.get(target, p, target);
              },
              set: function(target, p, v) {
                target[p] = unwrapView(v);
                sig.trigger();
                return true;
              },
              deleteProperty: function(target, p) {
                var had = Object.prototype.hasOwnProperty.call(target, p);
                delete target[p];
                if (had) sig.trigger();
                return true;
              }
            });
            viewRaw.set(view, raw);
            viewCache.set(raw, { sig: sig, view: view });
            return view;
          };
          // Bind actions with proxy for this.propName access
          if (opts.actions) {
            for (var aKey in opts.actions) {
              (function(actionKey, actionFn) {
                result[actionKey] = function() {
                  var proxy = new Proxy({}, {
                    get: function(_, p) {
                      if (result[p] && result[p]._isSignal) {
                        var current = result[p]();
                        return (typeof result[p].trigger === 'function' && isPlainContainer(current))
                          ? mutableView(result[p], current)
                          : current;
                      }
                      if (result[p]) return result[p];
                      return undefined;
                    },
                    set: function(_, p, v) {
                      if (result[p] && result[p]._isSignal) { result[p].set(unwrapView(v)); return true; }
                      return false;
                    }
                  });
                  return actionFn.apply(proxy, arguments);
                };
              })(aKey, opts.actions[aKey]);
            }
          }
          return result;
        };
      }

      // Run setup with store-safe effect tracking (effects are global, not element-scoped)
      var prevDisposers = activeDisposers;
      activeDisposers = null;

      var result;
      try {
        result = setupFn();
      } finally {
        activeDisposers = prevDisposers;
      }

      // Log what the setup returned
      var signalKeys = [];
      var actionKeys = [];
      for (var dk in result) {
        if (result[dk] && result[dk]._isSignal) signalKeys.push(dk);
        else if (typeof result[dk] === 'function') actionKeys.push(dk);
      }
      console.log('[stx:store] setup complete:', id, 'signals:', signalKeys, 'actions:', actionKeys);

      // Capture initial values for $reset
      var _initialValues = {};
      for (var k in result) {
        if (result[k] && result[k]._isSignal) {
          _initialValues[k] = result[k]();
        }
      }

      // Store metadata
      result.$id = id;
      result.$reset = function() {
        batch(function() {
          for (var rk in _initialValues) {
            if (result[rk] && result[rk]._isSignal) result[rk].set(_initialValues[rk]);
          }
        });
      };
      result.$patch = function(partial) {
        batch(function() {
          for (var pk in partial) {
            if (result[pk] && result[pk]._isSignal) result[pk].set(partial[pk]);
          }
        });
      };
      result.$subscribe = function(cb) {
        var unsubs = [];
        for (var sk in result) {
          if (result[sk] && result[sk]._isSignal && result[sk].subscribe) {
            unsubs.push(result[sk].subscribe(function() {
              var snapshot = {};
              for (var ssk in result) {
                if (result[ssk] && result[ssk]._isSignal) snapshot[ssk] = result[ssk]();
              }
              cb(snapshot);
            }));
          }
        }
        return function() { unsubs.forEach(function(u) { u(); }); };
      };
      result.$dispose = function() {
        window.stx._stores.delete(id);
        if (window.__STX_STORES__) delete window.__STX_STORES__[id];
      };

      // Hydration: restore state from SSR
      var hydrationData = window.__STX_STORE_STATE__ && window.__STX_STORE_STATE__[id];
      if (hydrationData) {
        console.log('[stx:store] hydrating from SSR:', id, Object.keys(hydrationData));
        batch(function() {
          for (var hk in hydrationData) {
            if (result[hk] && result[hk]._isSignal) result[hk].set(hydrationData[hk]);
          }
        });
      }

      // Persistence
      var persistCfg = storeOptions && storeOptions.persist;
      if (persistCfg) {
        var pOpts = persistCfg === true ? {} : persistCfg;
        var storageKey = pOpts.key || ('stx-store-' + id);
        var pick = pOpts.pick || null;

        // Three additions, all of which apps previously had to hand-roll outside
        // the store entirely (#1872):
        //
        //   keys        map a field to its OWN storage key, and optionally its own
        //               backend, instead of folding everything into one JSON blob
        //   serialize   / deserialize — the codec was hardcoded to JSON, so a
        //               persisted string came back quoted. A signed-out token
        //               stored as '""' is two characters and TRUTHY, which is a
        //               real class of auth bug, and a legacy raw value could not
        //               be read at all
        //   cookie      a backend the SERVER can read. Server-rendered,
        //               owner-scoped pages authenticate from a cookie and cannot
        //               see localStorage, so this previously meant a second
        //               persisted signal plus a hand-written mirroring effect
        var fieldMap = pOpts.keys || null;
        var defaultSerialize = pOpts.serialize || function(value) { return JSON.stringify(value); };
        var defaultDeserialize = pOpts.deserialize || function(raw) { return JSON.parse(raw); };

        // 'local' and 'localStorage' both accepted; the old code only recognised
        // 'sessionStorage', so 'session' silently fell through to localStorage.
        // Resolved through window when the bare global is absent, so persist also
        // works where the runtime is evaluated outside a page's global scope
        // (component test harnesses, embedded runtimes).
        function _backendFor(kind) {
          if (kind === 'cookie') return 'cookie';
          var scope = typeof window !== 'undefined' ? window : null;
          if (kind === 'session' || kind === 'sessionStorage')
            return typeof sessionStorage !== 'undefined' ? sessionStorage : (scope && scope.sessionStorage);
          return typeof localStorage !== 'undefined' ? localStorage : (scope && scope.localStorage);
        }
        var storageType = _backendFor(pOpts.storage);

        // Resolved config for a field that has its own key, or null if it belongs
        // in the shared blob.
        function _mappedConfig(field) {
          if (!fieldMap || !Object.prototype.hasOwnProperty.call(fieldMap, field)) return null;
          var cfg = fieldMap[field];
          if (typeof cfg === 'string') cfg = { key: cfg };
          cfg = cfg || {};
          return {
            key: cfg.key || field,
            backend: _backendFor(cfg.storage === undefined ? pOpts.storage : cfg.storage),
            cookieOpts: cfg,
            serialize: cfg.serialize || defaultSerialize,
            deserialize: cfg.deserialize || defaultDeserialize
          };
        }

        // A mapped field owns its key, so it must NOT also be written into the
        // blob — otherwise it round-trips through two places that can disagree.
        function _inBlob(field) {
          if (pick && pick.indexOf(field) === -1) return false;
          return !_mappedConfig(field);
        }

        // Read persisted state (overrides hydration)
        try {
          var saved = storageType === 'cookie' ? null : storageType.getItem(storageKey);
          if (saved) {
            var parsed = defaultDeserialize(saved);
            console.log('[stx:store] restoring persisted state:', id, 'key:', storageKey, Object.keys(parsed));
            batch(function() {
              for (var pk in parsed) {
                if (result[pk] && result[pk]._isSignal && _inBlob(pk)) {
                  result[pk].set(parsed[pk]);
                }
              }
            });
          } else {
            console.log('[stx:store] no persisted state found:', id, 'key:', storageKey);
          }
        } catch(e) { console.warn('[stx:store] persistence read error:', id, e); }

        // Per-field persistence: own key, own backend, own codec.
        //
        // The disposer swap is the same trick the blob effect below uses — these
        // effects must outlive the component that happened to instantiate the
        // store, or persistence would stop the first time that component
        // unmounted.
        var prevFieldDisposers = activeDisposers;
        activeDisposers = null;
        if (fieldMap) {
          for (var fk in fieldMap) {
            if (!Object.prototype.hasOwnProperty.call(fieldMap, fk)) continue;
            if (!result[fk] || !result[fk]._isSignal) {
              console.warn('[stx:store] persist.keys names a field that is not a signal:', id, fk);
              continue;
            }
            (function(field, cfg, signal) {
              if (cfg.backend === 'cookie') {
                // useCookie owns path / max-age / SameSite / Secure, so cookie
                // attributes do not have to be reimplemented here. It is a
                // string-valued signal, hence serialize on the way out.
                var cookieSignal = useCookie(cfg.key, cfg.cookieOpts);
                var initialCookie = cookieSignal();
                if (initialCookie !== '' && initialCookie != null) {
                  try { signal.set(cfg.deserialize(initialCookie)); }
                  catch(e) { console.warn('[stx:store] persist read error:', id, field, e); }
                }
                effect(function() {
                  var next = signal();
                  try { cookieSignal.set(next == null ? '' : String(cfg.serialize(next))); }
                  catch(e) { console.warn('[stx:store] persist write error:', id, field, e); }
                });
                return;
              }
              try {
                var rawValue = cfg.backend.getItem(cfg.key);
                if (rawValue !== null) signal.set(cfg.deserialize(rawValue));
              } catch(e) { console.warn('[stx:store] persist read error:', id, field, e); }
              effect(function() {
                var value = signal();
                try { cfg.backend.setItem(cfg.key, String(cfg.serialize(value))); }
                catch(e) { console.warn('[stx:store] persist write error:', id, field, e); }
              });
            })(fk, _mappedConfig(fk), result[fk]);
          }
        }
        activeDisposers = prevFieldDisposers;

        // Write on change (debounced)
        var writeTimer = null;
        var prevPersistDisposers = activeDisposers;
        activeDisposers = null;
        effect(function() {
          var snapshot = {};
          var wrote = false;
          for (var wk in result) {
            if (result[wk] && result[wk]._isSignal && _inBlob(wk)) {
              snapshot[wk] = result[wk]();
              wrote = true;
            }
          }
          // With every field mapped to its own key there is no blob left, and
          // writing an empty object would clobber whatever else owns that key.
          if (!wrote || storageType === 'cookie') return;
          if (writeTimer) clearTimeout(writeTimer);
          writeTimer = setTimeout(function() {
            console.log('[stx:store] persisting:', id, 'key:', storageKey, Object.keys(snapshot));
            try { storageType.setItem(storageKey, String(defaultSerialize(snapshot))); } catch(e) { console.warn('[stx:store] persist write error:', id, e); }
          }, 100);
        });
        activeDisposers = prevPersistDisposers;
      }

      // Marker so the template-scope auto-unwrap proxy knows to recursively
      // unwrap signal-valued properties on this object. Script-level callers
      // still see the bare store (so existing patterns like store.someSignal()
      // keep working); only template expression evaluation auto-unwraps.
      result._isStxStore = true;

      // Carry state across a hot replacement.
      //
      // The NEW store object is kept rather than patching the old one: a
      // setup-style store's actions close over the signals created in that
      // same run, so keeping the old signals would leave the new actions
      // writing to signals nothing is watching — an edit that appears to do
      // nothing, which is worse than the reload this replaces. Seeding the new
      // signals with the old values keeps state and behaviour consistent, and
      // the caller re-renders afterwards so components rebind to this object.
      var seed = window.stx.__hmrStoreSeed && window.stx.__hmrStoreSeed[id];
      if (seed) {
        for (var seedKey in seed) {
          var target = result[seedKey];
          if (target && target._isSignal && typeof target.set === 'function' && !target._isDerived) {
            try { target.set(seed[seedKey]); }
            catch (e) { /* shape changed across the edit — keep the new default */ }
          }
        }
      }

      // Register globally
      window.stx._stores.set(id, result);
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      window.__STX_STORES__[id] = result;

      console.log('[stx:store] registered:', id, 'total stores:', window.stx._stores.size);
      return result;
    },

    // Replace the store definitions in place, keeping their state — the
    // acceptHMRUpdate contract (#1877 ask 4). Called by the dev server's HMR
    // client when a file under storesDir changes, instead of reloading the
    // document and throwing away everything the SPA exists to preserve.
    __hmrReplaceStores: function(code) {
      var seed = {};
      window.stx._stores.forEach(function(store, id) {
        var values = {};
        for (var key in store) {
          var value = store[key];
          // Derived values recompute from state, so seeding them would fight
          // their own recomputation.
          if (value && value._isSignal && !value._isDerived) {
            try { values[key] = value.peek ? value.peek() : value(); }
            catch (e) { /* unreadable — let the new default stand */ }
          }
        }
        seed[id] = values;
      });

      window.stx.__hmrStoreSeed = seed;
      window.stx.__hmrStoreReplacing = true;
      var ok = true;
      try {
        // Indirect eval, so the bundle evaluates at global scope the way it
        // does when inlined into the page.
        (0, eval)(code);
      }
      catch (e) {
        ok = false;
        console.error('[stx:hmr] store bundle failed to evaluate:', e);
      }
      finally {
        window.stx.__hmrStoreReplacing = false;
        window.stx.__hmrStoreSeed = null;
      }

      if (!ok) return false;

      // Components captured the PREVIOUS store object from useStore(), so
      // re-render the route to rebind them. Still not a document reload: the
      // swap keeps every non-store signal on the page alive.
      if (window.stxRouter && typeof window.stxRouter.refresh === 'function') {
        try { window.stxRouter.refresh(); }
        catch (e) { /* a refresh that cannot run is not worth a reload here */ }
      }
      return true;
    },

    registerStoresClient: function(stores) {
      window.__STX_STORES__ = window.__STX_STORES__ || {};
      var names = Object.keys(stores || {});
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        window.__STX_STORES__[name] = stores[name];
      }
      window.dispatchEvent(new CustomEvent('stx:stores-ready', { detail: names }));
    },

    useStore: function(id) {
      var store = window.stx._stores.get(id);
      if (!store && window.__STX_STORES__) {
        store = window.__STX_STORES__[id];
      }
      if (!store) {
        console.error('[stx:store] Store not found:', id, 'available:', Array.from(window.stx._stores.keys()));
        throw new Error('[stx] Store "' + id + '" not found. Define it with defineStore() first.');
      }
      console.log('[stx:store] useStore:', id);
      return store;
    },

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
