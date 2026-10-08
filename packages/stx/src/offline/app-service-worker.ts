/**
 * An app that keeps working without a network.
 *
 * The PWA module (../pwa) builds a service worker for a static site: precache
 * the built files, serve them. A server-rendered stx app is different. Its
 * router swaps fragments (`X-STX-Router: true`) rather than loading
 * documents, its pages talk to an API with a bearer token, and every deploy
 * changes the build its fragments must match. This worker is for that app:
 *
 * - Pages and fragments: network first, with a short timeout, and the last
 *   copy when the network is not there. The screens named in `pages` are
 *   fetched when the worker installs, so they open offline even before they
 *   were visited, with the stylesheets and scripts they link to. Kept per
 *   build: a fragment from another build would make the router reload into
 *   nothing.
 * - Dynamic screens named in `routes` (`/m/workout/:id`): one never opened is
 *   answered offline with the route's kept page, its params swapped for the
 *   ones asked for. For a page drawn on the device from the API, every value
 *   shares the page, so a session the phone never showed still opens.
 * - The build's own files (`/_stx/…`) and public assets: the cached copy at
 *   once, refreshed behind.
 * - API reads (`apiPrefix`, GET only): network first, the last answer offline.
 *   Cached per signed-in token, so one account never reads another's copy on a
 *   shared device; `clearOfflineData()` (on sign-out) drops them all.
 * - Writes are never cached or replayed here. The page queues them itself
 *   (`useOutbox`), where it can tell the person what happened.
 */

export interface OfflineAppConfig {
  /** Turn the worker on. */
  enabled: boolean
  /** Screens fetched when the worker installs, so they open offline before they were visited. */
  pages?: string[]
  /** Path prefix of the app's API, whose GET answers are kept for offline. Default '/api/'. */
  apiPrefix?: string
  /** How long a request may take before the cached copy is used instead, ms. Default 3500. */
  networkTimeoutMs?: number
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

/** The tag every page carries so the worker is installed. */
export const OFFLINE_REGISTER_SCRIPT = `<script data-stx-offline>if('serviceWorker' in navigator){addEventListener('load',function(){navigator.serviceWorker.register('${OFFLINE_WORKER_PATH}',{scope:'/'}).catch(function(){})})}</script>`

/** The worker itself, for one build. */
export function generateOfflineWorker(config: OfflineAppConfig, buildId: string): string {
  const settings = {
    build: String(buildId || 'dev'),
    pages: Array.from(new Set((config.pages || []).filter(page => typeof page === 'string' && page.startsWith('/')))),
    api: config.apiPrefix || '/api/',
    timeout: Math.max(500, Number(config.networkTimeoutMs) || 3500),
    fallback: config.fallback || (config.pages && config.pages[0]) || null,
    routes: (config.routes || []).map(offlineRoute).filter(Boolean),
    exclude: ['/_stx/hmr', OFFLINE_WORKER_PATH, ...(config.exclude || [])],
    mediaMax: Math.max(10 * 1024 * 1024, Number(config.mediaMaxBytes) || 600 * 1024 * 1024),
  }
  return `/* stx offline worker, build ${settings.build} */
'use strict';
var S = ${JSON.stringify(settings)};
var SHELL = 'stx-shell-' + S.build;
var ASSETS = 'stx-assets';
var DATA = 'stx-data';
var MEDIA = 'stx-media';
var MEDIA_INDEX = '/__stx_media_index__';
var FRAGMENT = 'X-STX-Router';

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

function hashOf(text) {
  if (!text) return Promise.resolve('anon');
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buffer) {
    return Array.from(new Uint8Array(buffer)).slice(0, 12).map(function (byte) { return byte.toString(16).padStart(2, '0'); }).join('');
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
function keepAssetsOf(response) {
  return response.text().then(function (html) {
    var urls = [];
    var match;
    ASSET_REF.lastIndex = 0;
    while ((match = ASSET_REF.exec(html))) {
      if (urls.indexOf(match[1]) === -1) urls.push(match[1]);
    }
    return caches.open(ASSETS).then(function (cache) {
      return Promise.all(urls.map(function (url) {
        // A page and its fragment link the same files: one fetch each.
        if (!keepingAssets[url]) {
          keepingAssets[url] = cache.match(url).then(function (hit) {
            if (hit) return;
            return fetch(url, { credentials: 'same-origin' }).then(function (asset) {
              if (asset.status === 200) return cache.put(url, asset);
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
          return Promise.all([cache.put(page.key(fragment), response), keepAssetsOf(copy)]);
        }).catch(function () {});
      }));
    }));
  });
}

self.addEventListener('install', function (event) {
  event.waitUntil(precache().then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key.indexOf('stx-shell-') === 0 && key !== SHELL; }).map(function (key) { return caches.delete(key); }));
  }).then(function () { return self.clients.claim(); }));
});

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
    event.waitUntil(Promise.all([caches.delete(DATA), caches.delete(MEDIA)]));
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

function pageResponse(request) {
  var fragment = isFragment(request);
  var key = variantUrl(request.url, fragment);
  var dynamic = routeOf(new URL(request.url).pathname);
  var network = fetch(request).then(function (response) {
    // Only a page that is what was asked for: a redirect (to a sign-in page)
    // or an error is not kept as this screen.
    if (response.status === 200 && !response.redirected && response.type === 'basic') {
      var copy = response.clone();
      var routeCopy = dynamic ? response.clone() : null;
      caches.open(SHELL).then(function (cache) {
        return Promise.all([cache.put(key, copy), routeCopy && cache.put(routeKey(dynamic.route, fragment), routeCopy)]);
      }).catch(function () {});
    }
    return response;
  });
  return withTimeout(network, S.timeout).catch(function () {
    return caches.open(SHELL).then(function (cache) {
      return cache.match(key).then(function (hit) {
        if (hit) return hit;
        // Slower than the timeout but still coming: wait for it rather than fail.
        return network.catch(function () {
          var route = dynamic ? cache.match(routeKey(dynamic.route, fragment)) : Promise.resolve(null);
          return route.then(function (kept) {
            if (kept) return withParams(kept, dynamic.params);
            if (!S.fallback || fragment) return Response.error();
            return cache.match(variantUrl(S.fallback, false)).then(function (fallback) { return fallback ? markFallback(fallback) : Response.error(); });
          });
        });
      });
    });
  });
}

function assetResponse(request) {
  return caches.open(ASSETS).then(function (cache) {
    return cache.match(request).then(function (hit) {
      var network = fetch(request).then(function (response) {
        if (response.status === 200 && response.type === 'basic') cache.put(request, response.clone()).catch(function () {});
        return response;
      });
      if (hit) {
        network.catch(function () {});
        return hit;
      }
      return network;
    });
  });
}

function apiResponse(request) {
  return hashOf(request.headers.get('Authorization') || '').then(function (who) {
    var u = new URL(request.url);
    u.searchParams.set('__stx_who', who);
    var key = u.toString();
    var network = fetch(request).then(function (response) {
      if (response.status === 200) {
        var copy = response.clone();
        caches.open(DATA).then(function (cache) { return cache.put(key, copy); }).catch(function () {});
      }
      return response;
    });
    return withTimeout(network, S.timeout).catch(function () {
      return caches.open(DATA).then(function (cache) {
        return cache.match(key).then(function (hit) {
          return hit || network;
        });
      });
    });
  });
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
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
    event.respondWith(apiResponse(request));
    return;
  }
  if (url.pathname.indexOf('/_stx/') === 0 || url.pathname.indexOf('/assets/') === 0 || /\\.(?:js|css|woff2?|png|jpe?g|webp|avif|svg|ico)$/.test(url.pathname)) {
    event.respondWith(assetResponse(request));
    return;
  }
  var accept = request.headers.get('Accept') || '';
  if (request.mode === 'navigate' || isFragment(request) || accept.indexOf('text/html') !== -1) {
    event.respondWith(pageResponse(request));
  }
});
`
}
