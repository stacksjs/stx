/** Shared HTTP transport, hooks, errors, and CSRF support for the generated client runtime. */
export const SIGNALS_FETCH_TRANSPORT_RUNTIME = `  // Short, ref-free repr of a value for the mutation log (so the buffer holds no
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
  }`
