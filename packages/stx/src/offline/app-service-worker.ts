/**
 * An app that keeps working without a network, and opens like a native one.
 *
 * The PWA module (../pwa) builds a service worker for a static site: precache
 * the built files, serve them. A server-rendered stx app is different. Its
 * router swaps fragments (`X-STX-Router: true`) rather than loading
 * documents, its pages talk to an API with a bearer token, and every deploy
 * changes the build its fragments must match. This worker is for that app:
 *
 * - Pages and fragments: the kept copy at once, and the network asked behind
 *   it (stale-while-revalidate). When the answer differs from what was shown,
 *   the copy is replaced and every open page hears `stx:updated`
 *   { url, kind: 'page' }, so a screen can redraw rather than the person
 *   waiting on a round trip for every tap. Only a screen never kept waits for
 *   the network, and only `networkTimeoutMs` before a dynamic route's kept
 *   page stands in. The screens named in `pages` are fetched when the worker
 *   installs, so they open offline even before they were visited, with the
 *   stylesheets and scripts they link to. Kept per build: a fragment from
 *   another build would make the router reload into nothing.
 * - Dynamic screens named in `routes` (`/m/workout/:id`): one never opened is
 *   answered offline with the route's kept page, its params swapped for the
 *   ones asked for. For a page drawn on the device from the API, every value
 *   shares the page, so a session the phone never showed still opens.
 * - The build's own files (`/_stx/…`) and public assets: the cached copy at
 *   once, refreshed behind. Ones no kept page of the current build links to
 *   are pruned when a new build takes over.
 * - API reads (`apiPrefix`, GET only): stale-while-revalidate like pages, with
 *   `stx:updated` { url, kind: 'api' } when the answer changed. Cached per
 *   signed-in token, so one account never reads another's copy on a shared
 *   device; `clearOfflineData()` (on sign-out) drops them all. A copy kept
 *   before the app's last write is not answered at once (the write would
 *   seem not to have happened), nor is one for a request made with
 *   `cache: 'no-cache'` (a pull to refresh) or under a `networkFirst` prefix.
 * - Writes are never cached or replayed here. The page queues them itself
 *   (`useOutbox`), where it can tell the person what happened.
 * - A new build installs beside the running one and waits. It takes over when
 *   no page of the app is on screen, or when the app starts cold, never under
 *   a person mid-task; the page can ask for it sooner (`applyOfflineUpdate()`).
 *   The running build's kept screens stay until then.
 */

export interface OfflineAppConfig {
  /** Turn the worker on. */
  enabled: boolean
  /** Screens fetched when the worker installs, so they open offline before they were visited. */
  pages?: string[]
  /** Path prefix of the app's API, whose GET answers are kept for offline. Default '/api/'. */
  apiPrefix?: string
  /**
   * How long a screen or API read that was never kept (or one asked for
   * network first) waits for the network before a kept stand-in is used, ms.
   * Default 1500. A kept copy is answered at once and does not wait at all.
   */
  networkTimeoutMs?: number
  /**
   * Paths (prefixes) answered network first rather than from the kept copy:
   * the kept copy is used only when the network does not answer in
   * `networkTimeoutMs`. For a read whose stale copy would mislead, such as a
   * balance or a live score.
   */
  networkFirst?: string[]
  /**
   * Whether an app started cold while a new build waits opens on the new
   * build, going to the network for its first screen, rather than on the kept
   * one. Off by default: the app opens at once on the build it has, the way a
   * native app keeps running the version it has while the next downloads,
   * and the new build takes over the next time the app is not on screen. On
   * costs a round trip on the first launch after every deploy.
   */
  updateOnColdStart?: boolean
  /** Where a page that was never cached goes offline (one of `pages`). Default: the first of `pages`. */
  fallback?: string
  /**
   * Dynamic screens whose page is the same for every value, drawn on the
   * device from the API: `/m/workout/:id` or `/m/workout/[id]`. One that was
   * never opened is answered offline with the route's kept page, its route
   * params replaced by the ones asked for. The route's page is fetched when
   * the worker installs (each param as `0`) and refreshed by every visit.
   * Leave out a route whose server renders the value's own data.
   */
  routes?: string[]
  /** Paths the worker leaves alone entirely (prefixes). */
  exclude?: string[]
  /**
   * Most bytes of media (videos, audio) the page may ask to keep for offline
   * with `cacheMedia()`. The oldest are dropped past it. Default 600 MB.
   */
  mediaMaxBytes?: number
  /**
   * Most files other than stylesheets and scripts (images, fonts) kept in the
   * asset cache. The least recently fetched go first when a new build takes
   * over. Default 500.
   */
  assetsMaxEntries?: number
}

export const OFFLINE_WORKER_PATH = '/_stx/sw.js'

interface OfflineRoute {
  /** The route as configured, which names its kept page. */
  path: string
  /** Matches a path of this route, one group per param. */
  re: string
  names: string[]
  /** The path fetched when the worker installs. */
  sample: string
}

/** `/m/workout/:id` and `/m/workout/[id]` as a matcher the worker can carry. */
export function offlineRoute(path: string): OfflineRoute | null {
  if (typeof path !== 'string' || !path.startsWith('/')) return null
  const names: string[] = []
  const sample: string[] = []
  const parts = path.replace(/\/+$/, '').split('/').slice(1).map((segment) => {
    const param = /^:(\w+)$/.exec(segment) || /^\[(\w+)\]$/.exec(segment)
    if (param) {
      names.push(param[1]!)
      sample.push('0')
      return '([^/]+)'
    }
    sample.push(segment)
    return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  })
  if (!names.length) return null
  return { path, re: `^/${parts.join('/')}/?$`, names, sample: `/${sample.join('/')}` }
}


/**
 * What the register tag runs on every page. Closure-free: it is shipped as its
 * own source (`OFFLINE_REGISTER_SCRIPT`), and exported so it can be tested.
 *
 * - Registers the worker after the first frame on a return visit (a cheap
 *   update check), and only after `load` on the first one, whose install
 *   fetches every kept screen and would compete with the page's own files.
 *   It never sits in front of first paint either way.
 * - Turns the worker's `stx:updated` messages into a window event of the same
 *   name, { url, kind, fragment }, for the router and for queries to redraw.
 * - A new build waits (see the worker). The page says when it is safe to take
 *   over: when it is hidden, or when it loaded with nothing else of the app
 *   open; the worker checks that no page of the app is on screen. When one is
 *   waiting, `window.stxOffline.updateReady` turns true and the window hears
 *   `stx:offline-update-ready`, so an app can offer "Update" and call
 *   `window.stxOffline.applyUpdate()`, which takes over now and reloads.
 */
export function registerOfflineWorker(path: string): void {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator) || !navigator.serviceWorker)
    return
  const sw = navigator.serviceWorker
  const w = window as any
  if (w.stxOffline)
    return
  let registration: ServiceWorkerRegistration | null = null
  let reloadOnTakeOver = false
  const waitingCallbacks: Array<() => void> = []
  const api = {
    updateReady: false,
    registration: (): ServiceWorkerRegistration | null => registration,
    onUpdateReady(callback: () => void): () => void {
      if (api.updateReady) {
        try { callback() }
        catch {}
      }
      else { waitingCallbacks.push(callback) }
      return () => {
        const at = waitingCallbacks.indexOf(callback)
        if (at !== -1)
          waitingCallbacks.splice(at, 1)
      }
    },
    applyUpdate(): boolean {
      const waiting = registration && registration.waiting
      if (!waiting)
        return false
      reloadOnTakeOver = true
      waiting.postMessage({ type: 'stx:activate-update', force: true })
      return true
    },
  }
  w.stxOffline = api

  const ready = (reg: ServiceWorkerRegistration): void => {
    // The first install has no build to replace: nothing to update.
    if (!reg.waiting || !sw.controller || api.updateReady)
      return
    api.updateReady = true
    const callbacks = waitingCallbacks.splice(0)
    for (const callback of callbacks) {
      try { callback() }
      catch {}
    }
    try { window.dispatchEvent(new CustomEvent('stx:offline-update-ready')) }
    catch {}
  }

  sw.addEventListener('message', (event: MessageEvent) => {
    const data = event.data || {}
    if (data.type === 'stx:updated') {
      try { window.dispatchEvent(new CustomEvent('stx:updated', { detail: { url: data.url, kind: data.kind, fragment: !!data.fragment } })) }
      catch {}
    }
  })
  sw.addEventListener('controllerchange', () => {
    if (reloadOnTakeOver) {
      reloadOnTakeOver = false
      location.reload()
    }
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && registration && registration.waiting)
      registration.waiting.postMessage({ type: 'stx:activate-update', reason: 'hidden' })
  })

  const register = (): void => {
    sw.register(path, { scope: '/' }).then((reg) => {
      registration = reg
      if (reg.waiting) {
        ready(reg)
        // Opened with no other page of the app: the worker takes over if
        // nothing else is on screen, before this page has anything to lose.
        reg.waiting.postMessage({ type: 'stx:activate-update', reason: 'load' })
      }
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing)
          return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed')
            ready(reg)
        })
      })
    }).catch(() => {})
  }
  const afterPaint = (): void => {
    const later = (fn: () => void): void => { setTimeout(fn, 0) }
    if (typeof requestAnimationFrame === 'function')
      requestAnimationFrame(() => later(register))
    else later(register)
  }
  if (!sw.controller) {
    if (document.readyState === 'complete')
      afterPaint()
    else addEventListener('load', afterPaint)
  }
  else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', afterPaint)
  }
  else {
    afterPaint()
  }
}

function registerScriptSource(): string {
  const source = `(${registerOfflineWorker.toString()})(${JSON.stringify(OFFLINE_WORKER_PATH)})`
  // It rides inline on every document: whitespace is bytes on every page.
  try {
    return new Bun.Transpiler({ loader: 'js', minifyWhitespace: true }).transformSync(source).trim().replace(/;$/, '')
  }
  catch {
    return source
  }
}

/** The tag every page carries so the worker is installed. */
export const OFFLINE_REGISTER_SCRIPT = `<script data-stx-offline>${registerScriptSource()}</script>`

/** The worker itself, for one build. */
export function generateOfflineWorker(config: OfflineAppConfig, buildId: string): string {
  const settings = {
    build: String(buildId || 'dev'),
    pages: Array.from(new Set((config.pages || []).filter(page => typeof page === 'string' && page.startsWith('/')))),
    api: config.apiPrefix || '/api/',
    timeout: Math.max(500, Number(config.networkTimeoutMs) || 1500),
    networkFirst: (config.networkFirst || []).filter(path => typeof path === 'string' && path.startsWith('/')),
    updateOnColdStart: config.updateOnColdStart === true,
    fallback: config.fallback || (config.pages && config.pages[0]) || null,
    routes: (config.routes || []).map(offlineRoute).filter(Boolean),
    exclude: ['/_stx/hmr', OFFLINE_WORKER_PATH, ...(config.exclude || [])],
    mediaMax: Math.max(10 * 1024 * 1024, Number(config.mediaMaxBytes) || 600 * 1024 * 1024),
    assetsMax: Math.max(50, Number(config.assetsMaxEntries) || 500),
  }
  return `/* stx offline worker, build ${settings.build} */
'use strict';
var S = ${JSON.stringify(settings)};
var SHELL = 'stx-shell-' + S.build;
var ASSETS = 'stx-assets';
var DATA = 'stx-data';
var MEDIA = 'stx-media';
var MEDIA_INDEX = '/__stx_media_index__';
var LAST_WRITE = '/__stx_last_write__';
var FRAGMENT = 'X-STX-Router';
// Stamped on every kept copy: when it was kept, and a fingerprint of its body,
// so revalidating can tell a changed answer from the same one sent again.
var KEPT_AT = 'X-STX-Kept-At';
var KEPT_HASH = 'X-STX-Hash';

function variantUrl(url, fragment) {
  var u = new URL(url, self.location.origin);
  u.hash = '';
  if (fragment) u.searchParams.set('__stx_fragment', '1');
  return u.toString();
}

function isFragment(request) {
  return request.headers.get(FRAGMENT) === 'true';
}

function withTimeout(promise, ms) {
  return new Promise(function (resolve, reject) {
    var timer = setTimeout(function () { reject(new Error('timeout')); }, ms);
    promise.then(function (value) { clearTimeout(timer); resolve(value); }, function (error) { clearTimeout(timer); reject(error); });
  });
}

function hex(buffer) {
  return Array.from(new Uint8Array(buffer)).slice(0, 12).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
}

function hashOf(text) {
  if (!text) return Promise.resolve('anon');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(hex);
}

// Keep the background work of a fetch alive past its answer: the worker may
// otherwise be stopped before the revalidated copy is stored.
function keepAlive(event, promise) {
  var settled = promise.catch(function () {});
  try { if (event && event.waitUntil) event.waitUntil(settled); }
  catch (error) {}
  return settled;
}

// Whether this request wants the network before any kept copy: a pull to
// refresh asks with cache: 'no-cache', and some paths are configured so.
function wantsNetworkFirst(request, pathname) {
  if (request.cache === 'no-cache' || request.cache === 'reload' || request.cache === 'no-store') return true;
  for (var i = 0; i < S.networkFirst.length; i++) {
    if (pathname.indexOf(S.networkFirst[i]) === 0) return true;
  }
  return false;
}

// Only what was asked for, whole and from this origin, is ever kept: not a
// redirect (to a sign-in page), an error, or a partial answer.
function noStore(response) {
  return /(?:^|,)\\s*no-store\\s*(?:,|$)/i.test(response.headers.get('Cache-Control') || '');
}
function keepable(response) {
  return response.status === 200 && !response.redirected && response.type === 'basic' && !noStore(response);
}

// A page's body changes on every render where it carries a CSP nonce or a
// CSRF token. Those are left out of its fingerprint, or every visit would
// look like new content.
var VOLATILE = /\\snonce="[^"]*"|<meta\\s+name="csrf-token"[^>]*>/g;
function fingerprint(response) {
  var type = response.headers.get('Content-Type') || '';
  return response.arrayBuffer().then(function (body) {
    var bytes = body;
    if (type.indexOf('html') !== -1) bytes = new TextEncoder().encode(new TextDecoder().decode(body).replace(VOLATILE, ''));
    return crypto.subtle.digest('SHA-256', bytes).then(function (digest) { return { body: body, hash: hex(digest) }; });
  });
}

function stamped(response, body, hash) {
  var headers = new Headers(response.headers);
  // The body read here is already decoded: a compressed answer's encoding and
  // length no longer describe it, and a browser trusting them cut it short.
  headers.delete('Content-Encoding');
  headers.delete('Content-Length');
  headers.set(KEPT_AT, String(Date.now()));
  if (hash) headers.set(KEPT_HASH, hash);
  return new Response(body, { status: response.status, statusText: response.statusText, headers: headers });
}

// Keep a copy under each key, stamped. Resolves with its fingerprint.
function store(cache, keys, response) {
  return fingerprint(response).then(function (print) {
    return Promise.all(keys.map(function (key) { return cache.put(key, stamped(response, print.body, print.hash)); })).then(function () { return print; });
  });
}

function keptHash(hit) {
  var known = hit.headers.get(KEPT_HASH);
  if (known) return Promise.resolve(known);
  // Kept by an earlier worker, before copies were stamped.
  return fingerprint(hit.clone()).then(function (print) { return print.hash; });
}

// The same content as the kept copy: a matching validator says so without
// reading the body; otherwise the fingerprints decide.
function unchanged(hit, response, hash) {
  var a = hit.headers.get('ETag');
  var b = response.headers.get('ETag');
  if (a && b && a === b) return Promise.resolve(true);
  var c = hit.headers.get('Last-Modified');
  var d = response.headers.get('Last-Modified');
  if (c && d && c === d && !a && !b) return Promise.resolve(true);
  return keptHash(hit).then(function (known) { return known === hash; });
}

// Every open page of the app hears what changed, so it can redraw.
function announce(message) {
  if (!self.clients || !self.clients.matchAll) return Promise.resolve();
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    list.forEach(function (client) {
      try { client.postMessage(message); }
      catch (error) {}
    });
  });
}

// Ask the network behind a kept copy that was already answered. A different
// answer replaces the copy and is announced; the same one only refreshes
// when it was kept.
function revalidate(request, cache, keys, hit, kind) {
  return fetch(request).then(function (response) {
    if (noStore(response)) return Promise.all(keys.map(function (key) { return cache.delete(key); }));
    if (!keepable(response)) return;
    return store(cache, keys, response).then(function (print) {
      return unchanged(hit, response, print.hash).then(function (same) {
        if (same) return;
        var url = new URL(request.url);
        url.hash = '';
        return announce({ type: 'stx:updated', url: url.toString(), kind: kind, fragment: isFragment(request) });
      });
    });
  });
}

// A dynamic route's kept page, under a key no real path has.
function routeKey(route, fragment) {
  return variantUrl('/__stx_route__' + route.path, fragment);
}

function routeOf(pathname) {
  for (var i = 0; i < S.routes.length; i++) {
    var match = new RegExp(S.routes[i].re).exec(pathname);
    if (!match) continue;
    var params = {};
    S.routes[i].names.forEach(function (name, at) {
      try { params[name] = decodeURIComponent(match[at + 1]); }
      catch (error) { params[name] = match[at + 1]; }
    });
    return { route: S.routes[i], params: params };
  }
  return null;
}

// The route's kept page with the params asked for in its params script, so
// useRoute().params reads the value that was opened, not the one kept.
var PARAMS_SCRIPT = /(<script\\b[^>]*data-stx-route-params[^>]*>\\(function\\(\\)\\{var p=)[\\s\\S]*?(;window\\.__stx_rp)/;
function withParams(response, params) {
  return response.text().then(function (html) {
    var json = JSON.stringify(params).replace(/</g, '\\\\u003C').replace(/\\u2028/g, '\\\\u2028').replace(/\\u2029/g, '\\\\u2029');
    var body = html.replace(PARAMS_SCRIPT, function (all, open, close) { return open + json + close; });
    var headers = new Headers(response.headers);
    headers.delete('Content-Length');
    return new Response(body, { status: 200, headers: headers });
  });
}

// The stylesheets and scripts a kept page links to. Each page has its own
// generated CSS, fetched only when the page is shown: a screen kept at
// install but never opened online came up offline without its styles.
var keepingAssets = {};
var ASSET_REF = /<(?:link|script)\\b[^>]*?\\s(?:href|src)="(\\/[^"]+\\.(?:css|js))"/g;
function assetRefs(html) {
  var urls = [];
  var match;
  ASSET_REF.lastIndex = 0;
  while ((match = ASSET_REF.exec(html))) {
    if (urls.indexOf(match[1]) === -1) urls.push(match[1]);
  }
  return urls;
}

function keepAsset(cache, request, response) {
  return response.blob().then(function (body) { return cache.put(request, stamped(response, body, null)); });
}

function keepAssetsOf(response) {
  return response.text().then(function (html) {
    var urls = assetRefs(html);
    return caches.open(ASSETS).then(function (cache) {
      return Promise.all(urls.map(function (url) {
        // A page and its fragment link the same files: one fetch each.
        if (!keepingAssets[url]) {
          keepingAssets[url] = cache.match(url).then(function (hit) {
            if (hit) return;
            return fetch(url, { credentials: 'same-origin' }).then(function (asset) {
              if (asset.status === 200) return keepAsset(cache, url, asset);
            });
          }).catch(function () {});
        }
        return keepingAssets[url];
      }));
    });
  }).catch(function () {});
}

function precache() {
  var wanted = S.pages.map(function (page) { return { url: page, key: function (fragment) { return variantUrl(page, fragment); } }; })
    .concat(S.routes.map(function (route) { return { url: route.sample, key: function (fragment) { return routeKey(route, fragment); } }; }));
  return caches.open(SHELL).then(function (cache) {
    return Promise.all(wanted.map(function (page) {
      return Promise.all([false, true].map(function (fragment) {
        var headers = fragment ? { 'X-STX-Router': 'true', 'Accept': 'text/html' } : { 'Accept': 'text/html' };
        return fetch(page.url, { headers: headers, credentials: 'same-origin' }).then(function (response) {
          if (response.status !== 200 || response.redirected) return;
          var copy = response.clone();
          return Promise.all([store(cache, [page.key(fragment)], response), keepAssetsOf(copy)]);
        }).catch(function () {});
      }));
    }));
  });
}

// Stylesheets and scripts no kept screen of this build links to, and that
// nothing fetched lately, are an earlier build's: dropped when this build
// takes over. Other files (images, fonts) are capped, least recently fetched
// first. Fetching refreshes a file's stamp, so one in use is never the oldest.
var ASSET_GRACE_MS = 24 * 60 * 60 * 1000;
function pruneAssets() {
  return Promise.all([caches.open(SHELL), caches.open(ASSETS)]).then(function (opened) {
    var shell = opened[0];
    var assets = opened[1];
    return shell.keys().then(function (pages) {
      return Promise.all(pages.map(function (page) {
        return shell.match(page).then(function (hit) { return hit ? hit.text() : ''; }).catch(function () { return ''; });
      }));
    }).then(function (htmls) {
      var linked = {};
      htmls.forEach(function (html) {
        assetRefs(html).forEach(function (url) { linked[new URL(url, self.location.origin).toString()] = true; });
      });
      return assets.keys().then(function (requests) {
        return Promise.all(requests.map(function (request) {
          return assets.match(request).then(function (hit) { return { request: request, at: hit ? Number(hit.headers.get(KEPT_AT) || 0) : 0 }; });
        }));
      }).then(function (entries) {
        var now = Date.now();
        var drops = [];
        var others = [];
        entries.forEach(function (entry) {
          var url = entry.request.url;
          if (/\\.(?:css|js)$/.test(new URL(url).pathname)) {
            // With no screen kept there is nothing to judge by: keep them.
            if (htmls.length && !linked[url] && now - entry.at > ASSET_GRACE_MS) drops.push(entry.request);
          }
          else others.push(entry);
        });
        if (others.length > S.assetsMax) {
          others.sort(function (a, b) { return a.at - b.at; });
          others.slice(0, others.length - S.assetsMax).forEach(function (entry) { drops.push(entry.request); });
        }
        return Promise.all(drops.map(function (request) { return assets.delete(request); }));
      });
    });
  }).catch(function () {});
}

// A new build waits for the one running to be let go (see 'message'), rather
// than taking over under a page that is on screen: its fragments would not
// match the page's build, and the router would reload under the person.
self.addEventListener('install', function (event) {
  event.waitUntil(precache());
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key.indexOf('stx-shell-') === 0 && key !== SHELL; }).map(function (key) { return caches.delete(key); }));
  }).then(pruneAssets).then(function () { return self.clients.claim(); }));
});

// When a page may let this build take over: asked outright (an "Update"
// button), the app starting cold, or no page of the app on screen.
function mayTakeOver(data) {
  if (data.force || data.reason === 'cold-start') return Promise.resolve(true);
  if (!self.clients || !self.clients.matchAll) return Promise.resolve(false);
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    if (data.reason === 'load' && list.length <= 1) return true;
    return !list.some(function (client) { return client.visibilityState === 'visible'; });
  });
}

// --- Media kept for offline: videos a page asked for (cacheMedia()) ---
// Stored whole and answered here, ranges included: a player seeks with Range
// requests, and the network may not be there to answer them. The index (url
// -> bytes, when) lives in the same cache, so eviction can go oldest first.
function mediaKey(url) {
  var u = new URL(url, self.location.origin);
  u.hash = '';
  return u.toString();
}

function readMediaIndex(cache) {
  return cache.match(MEDIA_INDEX).then(function (hit) { return hit ? hit.json() : {}; }).catch(function () { return {}; });
}

function writeMediaIndex(cache, index) {
  return cache.put(MEDIA_INDEX, new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } }));
}

function keepMedia(urls) {
  return caches.open(MEDIA).then(function (cache) {
    return readMediaIndex(cache).then(function (index) {
      var wanted = urls.map(mediaKey);
      var chain = Promise.resolve();
      wanted.forEach(function (key) {
        chain = chain.then(function () {
          if (index[key]) { index[key].at = Date.now(); return; }
          // Already stored by the page (cacheMedia downloads while the app is
          // open), so only its size is wanted. Otherwise fetched here.
          return cache.match(key).then(function (stored) {
            if (stored) return stored;
            return fetch(key, { credentials: 'same-origin' }).then(function (response) {
              if (response.status !== 200 || !response.body) return null;
              var type = response.headers.get('Content-Type') || 'application/octet-stream';
              // Streamed into the cache, never held whole: a coach's 300 MB
              // upload read into one blob was enough for iOS to end the worker
              // part way, and nothing was kept.
              return cache.put(key, new Response(response.body, { headers: { 'Content-Type': type, 'Accept-Ranges': 'bytes' } })).then(function () {
                return cache.match(key);
              });
            });
          }).then(function (kept) {
            if (!kept) return;
            return kept.blob().then(function (blob) { index[key] = { bytes: blob.size, at: Date.now() }; });
          }).catch(function () {});
        });
      });
      return chain.then(function () {
        // Oldest first, until what is kept fits.
        var total = 0;
        var keys = Object.keys(index).sort(function (a, b) { return index[b].at - index[a].at; });
        var drops = [];
        keys.forEach(function (key) {
          total += index[key].bytes;
          if (total > S.mediaMax && wanted.indexOf(key) === -1) drops.push(key);
        });
        return Promise.all(drops.map(function (key) { delete index[key]; return cache.delete(key); }));
      }).then(function () { return writeMediaIndex(cache, index); }).then(function () { return Object.keys(index); });
    });
  });
}

function mediaResponse(request) {
  return caches.open(MEDIA).then(function (cache) {
    return cache.match(mediaKey(request.url)).then(function (hit) {
      if (!hit) return null;
      var range = request.headers.get('Range');
      if (!range) return hit;
      return hit.blob().then(function (blob) {
        var match = /bytes=(\\d*)-(\\d*)/.exec(range);
        var size = blob.size;
        var start = match && match[1] ? Number(match[1]) : 0;
        var end = match && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
        if (match && !match[1] && match[2]) { start = Math.max(0, size - Number(match[2])); end = size - 1; }
        if (start >= size || start > end) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
        return new Response(blob.slice(start, end + 1), {
          status: 206,
          headers: {
            'Content-Type': hit.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
            'Content-Length': String(end - start + 1),
            'Accept-Ranges': 'bytes',
          },
        });
      });
    });
  });
}

self.addEventListener('message', function (event) {
  var data = event.data || {};
  if (data.type === 'stx:clear-offline-data') {
    lastWrite = null;
    event.waitUntil(Promise.all([caches.delete(DATA), caches.delete(MEDIA)]));
  }
  if (data.type === 'stx:activate-update') {
    // Sent to the waiting worker. One already running ignores it: skipWaiting
    // does nothing once active.
    event.waitUntil(mayTakeOver(data).then(function (yes) { if (yes) return self.skipWaiting(); }));
  }
  if (data.type === 'stx:cache-media' && Array.isArray(data.urls)) {
    var reply = event.ports && event.ports[0];
    event.waitUntil(keepMedia(data.urls.filter(function (url) { return typeof url === 'string'; })).then(function (kept) {
      if (reply) reply.postMessage({ ok: true, kept: kept });
    }, function () {
      if (reply) reply.postMessage({ ok: false, kept: [] });
    }));
  }
});

// The fallback screen stands in for one this device has not kept whole. It
// says so, and the router then asks for the screen that was wanted as a
// fragment: one reached inside the app was kept that way.
function markFallback(response) {
  return response.text().then(function (html) {
    var head = html.indexOf('<head');
    var at = head === -1 ? -1 : html.indexOf('>', head) + 1;
    var mark = '<meta name="stx-offline-fallback" content="1">';
    var body = at > 0 ? html.slice(0, at) + mark + html.slice(at) : mark + html;
    var headers = new Headers(response.headers);
    headers.delete('Content-Length');
    return new Response(body, { status: 200, headers: headers });
  });
}

// The app starting cold (a navigation with no other page of it open) while a
// new build waits, with updateOnColdStart on: the new build takes over now, and
// this navigation goes to the network so it opens on the new build rather than
// the kept old one. Off, it opens at once on the kept build.
function coldStartUpdate(request) {
  var registration = self.registration;
  if (!S.updateOnColdStart || request.mode !== 'navigate' || !registration || !registration.waiting || !self.clients || !self.clients.matchAll) return Promise.resolve(false);
  return self.clients.matchAll({ type: 'window' }).then(function (list) {
    if (list.length > 1 || !registration.waiting) return false;
    registration.waiting.postMessage({ type: 'stx:activate-update', reason: 'cold-start' });
    return true;
  }).catch(function () { return false; });
}

function pageResponse(request, event) {
  var fragment = isFragment(request);
  var key = variantUrl(request.url, fragment);
  var dynamic = routeOf(new URL(request.url).pathname);
  var keys = dynamic ? [key, routeKey(dynamic.route, fragment)] : [key];
  return Promise.all([caches.open(SHELL), coldStartUpdate(request)]).then(function (opened) {
    var cache = opened[0];
    var networkFirst = opened[1] || wantsNetworkFirst(request, new URL(request.url).pathname);
    return cache.match(key).then(function (hit) {
      if (hit && !networkFirst) {
        keepAlive(event, revalidate(request, cache, keys, hit, 'page'));
        return hit;
      }
      var network = fetch(request).then(function (response) {
        if (keepable(response)) keepAlive(event, store(cache, keys, response.clone()));
        return response;
      });
      // What stands in when the network is not there, or slow: the kept copy,
      // then a dynamic route's kept page, then the fallback screen.
      var standIn = function (offline) {
        if (hit) return Promise.resolve(hit);
        var route = dynamic ? cache.match(routeKey(dynamic.route, fragment)) : Promise.resolve(null);
        return route.then(function (kept) {
          if (kept) return withParams(kept, dynamic.params);
          if (!offline) return null;
          if (!S.fallback || fragment) return Response.error();
          return cache.match(variantUrl(S.fallback, false)).then(function (fallback) { return fallback ? markFallback(fallback) : Response.error(); });
        });
      };
      return withTimeout(network, S.timeout).catch(function () {
        return standIn(false).then(function (kept) {
          if (kept) {
            keepAlive(event, network);
            return kept;
          }
          // Slower than the timeout, nothing kept to show: wait for it rather than fail.
          return network.catch(function () { return standIn(true); });
        });
      });
    });
  });
}

function assetResponse(request, event) {
  return caches.open(ASSETS).then(function (cache) {
    return cache.match(request).then(function (hit) {
      var network = fetch(request).then(function (response) {
        if (keepable(response)) keepAlive(event, keepAsset(cache, request, response.clone()));
        return response;
      });
      if (hit) {
        keepAlive(event, network);
        return hit;
      }
      return network;
    });
  });
}

// When the app last wrote to its API (any request but a GET). A copy kept
// before it is not answered at once: it would show the screen as if the
// write had not happened. Kept in the data cache so a restarted worker knows.
var lastWrite = null;
function lastWriteAt() {
  if (!lastWrite) {
    lastWrite = caches.open(DATA).then(function (cache) { return cache.match(LAST_WRITE); })
      .then(function (hit) { return hit ? hit.text() : '0'; })
      .then(function (text) { return Number(text) || 0; })
      .catch(function () { return 0; });
  }
  return lastWrite;
}
function noteWrite() {
  var at = Date.now();
  lastWrite = Promise.resolve(at);
  return caches.open(DATA).then(function (cache) { return cache.put(LAST_WRITE, new Response(String(at))); }).catch(function () {});
}

function apiResponse(request, event) {
  return hashOf(request.headers.get('Authorization') || '').then(function (who) {
    var u = new URL(request.url);
    u.searchParams.set('__stx_who', who);
    var key = u.toString();
    return Promise.all([caches.open(DATA), lastWriteAt()]).then(function (opened) {
      var cache = opened[0];
      return cache.match(key).then(function (hit) {
        var stale = hit && opened[1] > 0 && Number(hit.headers.get(KEPT_AT) || 0) <= opened[1];
        if (hit && !stale && !wantsNetworkFirst(request, u.pathname)) {
          keepAlive(event, revalidate(request, cache, [key], hit, 'api'));
          return hit;
        }
        var network = fetch(request).then(function (response) {
          if (noStore(response)) keepAlive(event, cache.delete(key));
          if (keepable(response)) keepAlive(event, store(cache, [key], response.clone()));
          return response;
        });
        return withTimeout(network, S.timeout).catch(function () {
          return hit || network;
        });
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') {
    // Writes go straight to the network; only when they happened is noted.
    if (url.pathname.indexOf(S.api) === 0) keepAlive(event, noteWrite());
    return;
  }
  // Live status and other explicitly uncached reads must never be answered
  // from offline storage, including when the network fails.
  if (request.cache === 'no-store') {
    event.respondWith(fetch(request));
    return;
  }
  // Media kept for offline is answered from the device, a range included;
  // anything else asking for a range is the browser's to answer, since a
  // cache cannot hold a partial response.
  if (request.headers.has('Range') || /\\.(?:mp4|m4v|mov|webm|m3u8|mp3|m4a)$/i.test(url.pathname)) {
    event.respondWith(mediaResponse(request).then(function (kept) { return kept || fetch(request); }));
    return;
  }
  for (var i = 0; i < S.exclude.length; i++) {
    if (url.pathname.indexOf(S.exclude[i]) === 0) return;
  }
  if (url.pathname.indexOf(S.api) === 0) {
    event.respondWith(apiResponse(request, event));
    return;
  }
  if (url.pathname.indexOf('/_stx/') === 0 || url.pathname.indexOf('/assets/') === 0 || /\\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|ico)$/.test(url.pathname)) {
    event.respondWith(assetResponse(request, event));
    return;
  }
  var accept = request.headers.get('Accept') || '';
  if (request.mode === 'navigate' || isFragment(request) || accept.indexOf('text/html') !== -1) {
    event.respondWith(pageResponse(request, event));
  }
});
`
}
