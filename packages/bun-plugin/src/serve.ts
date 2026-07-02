#!/usr/bin/env bun
/* eslint-disable style/max-statements-per-line */

/**
 * stx serve command
 * Serves .stx, .md, and .html files directly without manual build step
 *
 * Usage:
 *   serve pages/*.stx
 *   serve pages/*.md
 *   serve pages/*.html
 *   serve pages/ --port 3000
 *   serve pages/home.stx pages/about.md pages/index.html
 */

import { serve as bunServe, Glob } from 'bun'
import { watch as fsWatch } from 'node:fs'
import nodeFs from 'node:fs/promises'
import nodePath from 'node:path'
import process from 'node:process'
import { loadConfig } from 'bunfig'
import { deriveLayoutGroup } from 'stx-router/layout-metadata'

// Hoisted lazy import promise for @stacksjs/stx — kicked off once at module
// load instead of inside every request handler. The promise is cached, so the
// many `await stxModule` reads downstream cost a microtask each, not a full
// resolution roundtrip.
//
// Callers can override this by passing `stxModule` in ServeOptions — useful
// when the calling app vendors a newer stx (e.g. a `pantry/` directory) that
// the bare-specifier resolver wouldn't find, because Bun walks `node_modules`
// from the importer's location and a stale copy there beats the vendored one.
const defaultStxModule = import('@stacksjs/stx')

/**
 * Build the candidate regexes for a dynamic route file (stacksjs/stx#1927).
 *
 * `fileRouteBase` is the route path with the file extension already
 * stripped (e.g. `judges/[id]/profile/index`). Returns one regex per
 * acceptable URL shape:
 *   - the literal path with `[param]` → `([^/]+)`
 *   - the same with a trailing `/index` removed, so
 *     `judges/[id]/profile/index` also matches `judges/35/profile`
 *     (without this, nested dynamic routes 404 on hard reload)
 *   - both of the above again with a leading `pages/` stripped, for
 *     projects that nest routable views under `pages/`
 */
export function buildDynamicRouteRegexes(fileRouteBase: string): RegExp[] {
  const toPattern = (p: string): string => p
    .replace(/\[([^\]]+)\]/g, '([^/]+)') // [param] → capture group
    .replace(/\//g, '\\/') // escape slashes

  const patterns: RegExp[] = [new RegExp(`^${toPattern(fileRouteBase)}$`)]

  const noIndex = fileRouteBase.replace(/\/index$/, '')
  if (noIndex !== fileRouteBase)
    patterns.push(new RegExp(`^${toPattern(noIndex)}$`))

  if (fileRouteBase.startsWith('pages/')) {
    const pretty = fileRouteBase.slice(6)
    patterns.push(new RegExp(`^${toPattern(pretty)}$`))
    const prettyNoIndex = pretty.replace(/\/index$/, '')
    if (prettyNoIndex !== pretty)
      patterns.push(new RegExp(`^${toPattern(prettyNoIndex)}$`))
  }

  return patterns
}

export interface ServeOptions {
  patterns: string[]
  port?: number
  componentsDir?: string
  layoutsDir?: string
  partialsDir?: string
  /**
   * Public directory served at the URL root, like Nuxt/Vite/Next/Astro.
   * Any file under this directory is reachable at the matching URL path —
   * `public/images/hero.jpg` → `GET /images/hero.jpg`.
   *
   * Resolution order: this option → `stx.config.ts` `publicDir` → `'public'`.
   */
  publicDir?: string
  quiet?: boolean
  /**
   * When the requested `port` is already in use, probe the next ports
   * in sequence (`port + 1`, `port + 2`, …) and bind to the first one
   * that's free — matching Vite / Next dev-server behaviour.
   *
   * Set to `false` to fail fast with a clear error instead. The number
   * of additional ports to try (default: `10`) can be passed as the
   * value, e.g. `autoIncrementPort: 20`.
   *
   * Default: `true` (10 attempts).
   */
  autoIncrementPort?: boolean | number
  /**
   * Pre-resolved `@stacksjs/stx` module. When set, `serve()` uses this
   * instead of the bare-specifier `import('@stacksjs/stx')` it would
   * normally do. Callers should pass this when they ship a vendored stx
   * (e.g. a `pantry/@stacksjs/stx` copy) that lives outside the importer's
   * `node_modules` chain — Bun resolves bare specifiers relative to the
   * file doing the import, so a stale `node_modules/@stacksjs/stx` would
   * otherwise win against the vendored copy. Accepts a module object or
   * a Promise of one (e.g. `import('/abs/path/to/stx')`).
   */
  stxModule?: typeof import('@stacksjs/stx') | Promise<typeof import('@stacksjs/stx')>

  /**
   * Multi-locale i18n config. Pass a `ResolvedI18n` (obtained via
   * `resolveI18n(site)` from `@stacksjs/stx/site-builder`) to enable
   * locale-prefix routing + automatic `{t:key}` substitution in
   * rendered HTML.
   *
   * If `site` is also passed, this is derived automatically from
   * `site.i18n` — explicit `i18n` here wins if both are set.
   */
  i18n?: import('@stacksjs/stx').ResolvedI18n

  /**
   * Site config object (the `defineSiteConfig({…})` default export of
   * a project's `site.config.ts`). When set, every rendered HTML
   * response runs through the same site-builder injectors that
   * `buildStaticSite()` uses for the production build, so dev mode
   * matches prod:
   *
   * 1. `injectThemeBootstrap(html, site)` — FOUC-free dark/light toggle
   *    + the click handler the `<ThemeToggle />` component depends on.
   * 2. `injectSeo(html, site, page, path)` — per-page `<title>`,
   *    description, OpenGraph, Twitter, hreflang. Page meta is read
   *    from `site.pages[path]` keyed by the request's normalized path.
   * 3. `applyTranslations(html, i18n, locale)` — same as `i18n` above,
   *    derived from `site.i18n` if `i18n` isn't explicitly passed.
   *
   * Apps that don't have a `site.config.ts` (or want the legacy
   * "untouched HTML" behaviour) leave this unset; serve() falls back
   * to the i18n-only path or no post-processing at all.
   */
  site?: import('@stacksjs/stx').SiteConfig

  /** Custom route handlers — checked before page routes */
  routes?: Record<string, (req: Request) => Response | Promise<Response>>
  /**
   * Custom request handler — called for every request. Return a Response to
   * short-circuit the default pipeline; return `null` / `undefined` (sync or
   * async) to fall through to the rest of the routing chain.
   *
   * The async-fall-through shape (`Promise<Response | null>`) is the natural
   * way to write proxies / chainable handlers like `handleImageRequest`:
   *
   *   async onRequest(req) {
   *     if (!isApiRequest(req)) return null  // not mine, fall through
   *     return await proxyToApi(req)
   *   }
   *
   * The runtime awaits the return and only short-circuits on a truthy value,
   * so both sync and async null/undefined behave identically.
   */
  onRequest?: (req: Request) =>
  | Response
  | null
  | undefined
  | Promise<Response | null | undefined>

  /**
   * **Page middleware.** Modelled on Laravel's named-route middleware.
   *
   * stx pages opt into middleware with frontmatter:
   *
   * ```stx
   * <script server>
   *   definePageMeta({ middleware: ['auth', 'verified'] })
   * </script>
   * ```
   *
   * Discovery scans every `.stx`/`.md`/`.html` page once at startup,
   * extracts the `middleware:` list, and at request time runs them in
   * declaration order before SSR. The first middleware that returns a
   * `Response` (e.g. a redirect) short-circuits the chain — same
   * contract as Laravel's `handle($request, $next)`.
   *
   * `globalMiddleware` runs on every page request.
   * `groups` lets you alias a list of names (Laravel's middleware groups,
   * e.g. `web` / `api`).
   *
   * Two middleware names ship by default — `auth` and `guest` — wired
   * to `auth.cookieName` / `auth.redirectTo` so the most common app
   * shape (gate authed pages → /login, redirect logged-in users away
   * from /login → /) needs zero registration.
   */
  middleware?: Record<string, MiddlewareHandler>

  /** Names that run on every page request, before per-page middleware. */
  globalMiddleware?: string[]

  /** Aliases — `web: ['session', 'csrf']` lets pages declare `middleware: ['web']`. */
  middlewareGroups?: Record<string, string[]>

  /**
   * Convenience knobs for the bundled `auth` and `guest` middleware.
   * Set to `false` to opt out of the bundled middleware entirely.
   */
  auth?: false | {
    /** Cookie that signals "logged in". Default: `auth-token`. */
    cookieName?: string
    /** Where to send unauthenticated users hitting `auth` pages. Default: `/login`. */
    redirectTo?: string
    /** Where to send already-logged-in users hitting `guest` pages. Default: `/`. */
    home?: string
    /**
     * Extra prefixes to gate without needing `definePageMeta` — useful
     * for proxied paths or static files served by `routes`.
     */
    protectedPaths?: string[]
  }
}

/**
 * Middleware handler — a Laravel-style gate that either passes through
 * (returns `void`/`null`/`undefined`) or terminates the pipeline by
 * returning a `Response`.
 *
 * The third argument is the colon-separated arg list, so a page that
 * declares `middleware: ['auth:admin']` invokes the `auth` handler
 * with `args = ['admin']` — the same shape as Laravel's
 * `handle($request, $next, ...$args)`.
 */
export type MiddlewareHandler = (
  req: Request,
  ctx: MiddlewareContext,
  ...args: string[]
) => Response | null | undefined | void | Promise<Response | null | undefined | void>

export interface MiddlewareContext {
  /** Current URL pathname, e.g. `/host/dashboard`. */
  path: string
  /** Parsed URL — useful for query strings, hash, etc. */
  url: URL
  /** Path params extracted from a dynamic segment, e.g. `{ id: 'tesla-…' }`. */
  params: Record<string, string>
  /** Cookies already parsed from the request. */
  cookies: Record<string, string>
  /** Build a 302 to `to`, preserving the original target as `?next=…`. */
  redirect: (to: string, status?: number) => Response
}

// Default STX config for serving - matches @stacksjs/stx defaults
const defaultStxConfig = {
  partialsDir: 'partials',
  componentsDir: 'components',
  layoutsDir: 'layouts',
  publicDir: 'public',
  ssr: true as boolean | undefined,
  defaultTitle: 'stx App' as string | undefined,
}

/**
 * MIME types for static file serving. Used by both the legacy /assets/*
 * handler and the publicDir handler. Add new entries here once and they
 * apply everywhere.
 */
const staticContentTypes: Record<string, string> = {
  // Code
  css: 'text/css',
  js: 'application/javascript',
  mjs: 'application/javascript',
  json: 'application/json',
  // Markup / docs
  html: 'text/html; charset=utf-8',
  txt: 'text/plain',
  xml: 'application/xml',
  pdf: 'application/pdf',
  // Images
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  avif: 'image/avif',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  bmp: 'image/bmp',
  // Audio / video
  mp4: 'video/mp4',
  webm: 'video/webm',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  // Fonts
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
}

const bundledAssetExtensions = new Set(['ts', 'tsx', 'mts', 'cts'])

function isBundledAssetExtension(ext: string | undefined): ext is string {
  return Boolean(ext && bundledAssetExtensions.has(ext))
}

function getAssetExtension(pathname: string): string | undefined {
  return pathname.split('.').pop()?.toLowerCase()
}

function isSafeAssetPath(pathname: string): boolean {
  if (pathname.includes('\0'))
    return false

  return !pathname
    .split('/')
    .some(segment => segment === '..')
}

function assetRequestPaths(pathname: string): string[] {
  const paths = [
    pathname,
    pathname.replace(/^\/assets\//, '/resources/assets/'),
    pathname.replace(/^\/resources\/assets\//, '/assets/'),
  ]

  return [...new Set(paths)]
}

export async function bundleBrowserAsset(entrypoint: string): Promise<Response> {
  const result = await Bun.build({
    entrypoints: [entrypoint],
    format: 'esm',
    minify: false,
    packages: 'bundle',
    sourcemap: 'inline',
    target: 'browser',
  })

  if (!result.success) {
    const message = result.logs.map(log => log.message).join('\n') || 'Unable to build TypeScript asset'

    return new Response(message, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  return new Response(await result.outputs[0].text(), {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'no-store',
    },
  })
}

/**
 * Start the STX development server
 * @param options Server options with patterns and port
 */
export async function serve(options: ServeOptions): Promise<void> {
  // Load STX config via bunfig - supports stx.config.ts, .stx.config.ts, etc.
  const stxConfig = await loadConfig({
    name: 'stx',
    alias: ['ui'],
    cwd: process.cwd(),
    defaultConfig: defaultStxConfig,
    checkEnv: false,
    verbose: false,
  }) as Record<string, any>

  // Plugin discovery is a separate concern: stx's own `loadStxConfig`
  // is the function that processes the `plugins` array and populates
  // `_pluginComponentDirs` on the loaded config. Bunfig's `loadConfig`
  // above only reads the raw object, so without this second call the
  // component resolver never gets a search-dir entry for plugin-
  // contributed tags (e.g. `<Notification>` from a stx shim around
  // `@stacksjs/components`). Merge the resulting plugin dirs onto
  // `stxConfig` so the existing config-forwarding logic picks them up.
  try {
    const stxMod = options.stxModule ? options.stxModule : await defaultStxModule
    if (stxMod && typeof (stxMod as any).loadStxConfig === 'function') {
      const pluginLoaded = await (stxMod as any).loadStxConfig() as Record<string, any>
      if (pluginLoaded?._pluginComponentDirs)
        stxConfig._pluginComponentDirs = pluginLoaded._pluginComponentDirs
      if (pluginLoaded?._pluginPageDirs)
        stxConfig._pluginPageDirs = pluginLoaded._pluginPageDirs
      // A plugin's setup() can mutate the loaded config — e.g. an analytics
      // plugin sets `analytics.{enabled,driver,custom}` so injectAnalytics
      // runs. bunfig's loadConfig above returns the RAW object (pre-setup), so
      // carry the plugin-mutated analytics across, else the tracker is silently
      // dropped on this serve path.
      if (pluginLoaded?.analytics)
        stxConfig.analytics = pluginLoaded.analytics
    }
    // Preload the default icon collection so <Icon name="..." /> resolves on
    // the FIRST page render. Without this preload, the IconBuiltin returns
    // `<!-- Icon: collection "lucide" not loaded -->` for the initial
    // request and only starts emitting SVGs after the async load completes —
    // which can take longer than a typical request cycle. ssg.ts does this
    // for production builds; mirror it for the dev server here.
    if (stxMod && typeof (stxMod as any).preloadIconCollection === 'function')
      await (stxMod as any).preloadIconCollection('lucide')
  }
  catch { /* best-effort — fall through with what bunfig gave us */ }

  // Options passed directly take precedence, then bunfig config, then defaults
  const componentsDir = options.componentsDir ?? stxConfig.componentsDir ?? defaultStxConfig.componentsDir
  const layoutsDir = options.layoutsDir ?? stxConfig.layoutsDir ?? defaultStxConfig.layoutsDir
  const partialsDir = options.partialsDir ?? stxConfig.partialsDir ?? defaultStxConfig.partialsDir
  const publicDir = options.publicDir ?? stxConfig.publicDir ?? 'public'

  // The stx module to use for processDirectives / extractVariables / etc.
  // When the caller passed an explicit override, prefer it — it's how a
  // framework with a vendored copy (pantry, etc.) makes sure we use *its*
  // stx instead of whatever the bare-specifier resolver finds first.
  const stxModule = options.stxModule
    ? Promise.resolve(options.stxModule)
    : defaultStxModule

  // Synchronously-reachable handle to the resolved stx module, so the file
  // watcher can clear stx's framework-level dev caches without awaiting.
  // Stays null until the module resolves at startup (well before the first
  // edit), and every use is optional-chained — so the worst case is a no-op,
  // never a regression (stacksjs/stx#1745 item C).
  let resolvedStxModule: { clearDevCaches?: () => void } | null = null
  void Promise.resolve(stxModule).then((m) => { resolvedStxModule = m as { clearDevCaches?: () => void } }).catch(() => {})

  const { patterns, port = 3456 } = options

  if (patterns.length === 0) {
    console.error('Usage: serve <files...> [--port 3000]')
    console.error('\nExamples:')
    console.error('  serve pages/*.stx')
    console.error('  serve pages/*.md')
    console.error('  serve pages/*.html')
    console.error('  serve pages/ --port 3000')
    console.error('  serve index.stx about.md page.html')
    console.error('\nAfter installing: bun add bun-plugin-stx')
    throw new Error('No file patterns provided')
  }

  // Lazy-load: Cache for processed templates
  const routes = new Map<string, string>()
  let sourceFiles: string[] | null = null
  /** Route paths derived from discovered `.stx` views — used to rewrite `<a href>` for non-default locales. */
  let discoveredPagePaths: Set<string> | null = null
  let assetsInitialized = false

  // Rendered-HTML cache. Declared here (rather than inside the route handler)
  // so the file watcher above it can clear the cache on every source change —
  // the signature-mtime check is still authoritative on a hit, but clearing
  // up front means a missed dependency in the previous render can never
  // produce a stale response.
  interface HtmlCacheEntry {
    html: string
    signature: Map<string, number>
  }
  const htmlCache = new Map<string, HtmlCacheEntry>()
  // Rendered-HTML cache is OFF in the dev server (stacksjs/stx#1926).
  // `templateSignatureFresh` compares dependency mtimes, but transitive
  // `@include`s sometimes don't get registered into the dependency set
  // during `processDirectives` — so editing a deeply-included partial
  // intermittently served stale HTML on alternating reloads. The dev
  // server must be the source of truth on every request; a fresh render
  // is ~50ms, which is a fine price for correctness. Flip this to `true`
  // only if the dependency-tracking gap is fully closed.
  const ENABLE_HTML_CACHE = false
  // Crosswind-generated CSS cache, keyed by sorted class-set. Lives here for
  // the same reason as `htmlCache`: so the watcher can wipe it on a source
  // edit and pick up a new utility's CSS the next render.
  const crosswindCssCache = new Map<string, string>()

  // ── HMR: live-reload via Server-Sent Events. ────────────────────────
  //
  // We hold an open `text/event-stream` per connected browser and push a
  // `{type:'reload'}` message every time the watcher sees a source change.
  // The injected client script reloads the page. No bundler integration,
  // no module graph — full page reload is enough for the stx model where
  // every request re-runs the template pipeline anyway. Belt-and-suspenders
  // with the htmlCache signature check: even if a dependency slipped past
  // the dep-tracker, the cache also gets cleared on every watch event.
  type HmrEvent = { type: 'reload', file?: string } | { type: 'css', file?: string }
  const hmrClients = new Set<ReadableStreamDefaultController<Uint8Array>>()
  const hmrEncoder = new TextEncoder()
  function broadcastHmr(event: HmrEvent): void {
    const payload = hmrEncoder.encode(`data: ${JSON.stringify(event)}\n\n`)
    for (const c of hmrClients) {
      try { c.enqueue(payload) }
      catch { hmrClients.delete(c) }
    }
  }
  // Client-side HMR. Single-init via `__stxHmr` so a SPA fragment swap that
  // executes this script again doesn't open a second EventSource. For
  // `type:'reload'` events we just reload. For `type:'css'` we walk
  // `<link rel=stylesheet>` and rewrite the `?v=` query string so the
  // browser re-fetches without dropping JS state. EventSource auto-reconnects
  // for transient failures; the `onerror` guard also reloads if the server
  // restarted entirely (readyState transitions to CLOSED).
  const HMR_CLIENT_SCRIPT = `<script data-stx-hmr>(()=>{if(window.__stxHmr)return;window.__stxHmr=1;function bust(){var ls=document.querySelectorAll('link[rel="stylesheet"]');for(var i=0;i<ls.length;i++){var l=ls[i];var u=new URL(l.href,location.href);u.searchParams.set('v',Date.now().toString(36));l.href=u.toString()}}var es=new EventSource('/_stx/hmr');es.onmessage=function(e){try{var m=JSON.parse(e.data);if(m.type==='reload')location.reload();else if(m.type==='css')bust()}catch(_){}};es.onerror=function(){if(es.readyState===2){setTimeout(function(){location.reload()},400)}}})()</script>`
  // Append the HMR client just before </body>. Uses `lastIndexOf` per
  // CLAUDE.md item 24 — the first `</body>` in the document can live inside
  // a `<script>` string (e.g. the router/runtime bundle) and `replace` would
  // inject into the middle of that script.
  function injectHmrClient(html: string): string {
    if (!html) return html
    const closeBody = html.lastIndexOf('</body>')
    if (closeBody === -1) {
      // No `</body>` (fragment / non-document response). Append.
      return html + HMR_CLIENT_SCRIPT
    }
    return html.slice(0, closeBody) + HMR_CLIENT_SCRIPT + html.slice(closeBody)
  }

  // Watch pattern directories so adding/removing a view file (e.g. a brand
  // new `resources/views/<feature>/index.stx`) invalidates the discovered-
  // files cache without a server restart. Without this, the file glob
  // is cached at startup and new pages 404 until the user kills the dev
  // server. We also clear `routes` so any stale rendered HTML for a now-
  // missing file is dropped, AND fire an HMR reload event so any open
  // browser session refreshes without the user lifting a finger.
  const watchersStarted = new Set<string>()
  const startWatcher = (dir: string) => {
    if (watchersStarted.has(dir)) return
    try {
      const watcher = fsWatch(dir, { recursive: true }, (_event, filename) => {
        if (!filename) return
        const f = String(filename)
        // Source files that affect rendered HTML.
        const isStxLike = f.endsWith('.stx') || f.endsWith('.md') || f.endsWith('.html')
        // Asset files served straight to the browser. They don't change
        // server-rendered HTML, so we skip the routes/htmlCache reset for
        // them — but we still need to fire HMR so the browser drops its
        // cached copy and re-fetches.
        const isCss = f.endsWith('.css')
        const isAsset = isCss
          || f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx')
          || f.endsWith('.mts') || f.endsWith('.cts')
          || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
          || f.endsWith('.gif') || f.endsWith('.svg') || f.endsWith('.webp') || f.endsWith('.avif')
          || f.endsWith('.woff') || f.endsWith('.woff2') || f.endsWith('.ttf') || f.endsWith('.otf')
        if (!isStxLike && !isAsset) return

        if (isStxLike) {
          sourceFiles = null
          routes.clear()
          // Wipe the rendered-HTML cache and Crosswind CSS cache too. The
          // signature check should catch most edits, but it relies on every
          // dependency being tracked correctly during the previous render —
          // a single missed dep is enough for a page to render stale. Clearing
          // on watch is the simple, correct fallback for dev.
          htmlCache.clear()
          crosswindCssCache.clear()
          // Also wipe stx's framework-level caches (fileContentCache, signals
          // runtime, router script). The app-render caches above are cleared
          // on every edit, but the framework caches previously survived until
          // a full process restart — so a stale `@include`d partial whose
          // transitive dependency slipped past the mtime tracker (the #1926
          // failure class) could outlive an edit. Optional-chained: a missing
          // module/method is a no-op (stacksjs/stx#1745 item C).
          resolvedStxModule?.clearDevCaches?.()
        }
        // For CSS-only changes, prefer a stylesheet hot-swap over a full
        // reload — the script side just re-fingerprints `<link>` hrefs.
        broadcastHmr(isCss && !isStxLike ? { type: 'css', file: f } : { type: 'reload', file: f })
      })
      watcher.on('error', () => { /* ignore — best-effort */ })
      watchersStarted.add(dir)
    }
    catch { /* directory missing or unwatchable — ignore */ }
  }

  // Eagerly watch the auxiliary source roots. The pattern dirs are watched
  // lazily inside `discoverFiles()` — but edits in these auxiliary dirs are
  // exactly what users complain about when "HMR doesn't work": you change a
  // class inside a component or edit a CSS file under `resources/assets/`,
  // hit reload, and the page still shows the old markup. Wiring the
  // watchers up front (best-effort — silently skipped if the dir doesn't
  // exist) closes that gap.
  //
  // `resources/assets` is the Stacks/Laravel-style asset root the
  // smart-asset handler below reads from when a request hits `/assets/*`
  // or `/resources/assets/*`. The dir itself isn't a config option (the
  // asset paths are URL-shaped, resolved at request time), so we watch
  // the conventional location directly. We deliberately do NOT also
  // watch `resources/` — `componentsDir`/`layoutsDir`/`partialsDir`
  // already cover the .stx subdirs under it, and overlapping recursive
  // watchers fire duplicate events for every nested edit.
  for (const dir of [
    componentsDir,
    layoutsDir,
    partialsDir,
    publicDir,
    'resources/assets',
  ]) {
    if (!dir) continue
    startWatcher(dir)
  }

  // ── Page middleware registry ─────────────────────────────────────────
  //
  // Mirrors Laravel's named middleware + middleware-group pattern. Each
  // page declares which named middleware it needs via `definePageMeta`.
  // Discovery extracts the list once and stores it per route, so the
  // request hot path is just an O(1) lookup + a quick chain run.

  /** Static `/host/dashboard` → ['auth'], etc. */
  const pageMiddlewareByPath = new Map<string, string[]>()
  /** Dynamic `/book/[id]` → { regex, paramNames, middleware }. */
  const pageMiddlewarePatterns: { re: RegExp, names: string[], middleware: string[] }[] = []

  function compileRoutePattern(urlPath: string): { re: RegExp, names: string[] } {
    const names: string[] = []
    const re = urlPath.split('/').map((seg) => {
      if (!seg) return ''
      const catchAll = seg.match(/^\[\.\.\.(.+)\]$/)
      if (catchAll) {
        names.push(catchAll[1])
        return '(.+)'
      }
      const param = seg.match(/^\[(.+)\]$/)
      if (param) {
        names.push(param[1])
        return '([^/]+)'
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }).join('/')
    return { re: new RegExp(`^${re}/?$`), names }
  }

  function urlPathFromFile(file: string): string {
    let rel = file
    for (const pattern of patterns) {
      const base = pattern.replace(/\/$/, '')
      if (rel.startsWith(`${base}/`)) {
        rel = rel.slice(base.length + 1)
        break
      }
    }
    rel = rel.replace(/\.(stx|md|html)$/, '')
    if (rel === 'index' || rel.endsWith('/index')) rel = rel.replace(/\/?index$/, '')
    return rel.startsWith('/') ? rel : `/${rel}`
  }

  /**
   * Scan a page source for `definePageMeta({ middleware: [...] })` and
   * record the named middleware for that route. Cheap regex parse —
   * runs once at startup, not on every request.
   */
  async function detectPageMiddleware(file: string) {
    try {

      const src = await nodeFs.readFile(file, 'utf-8')
      const meta = src.match(/definePageMeta\s*\(\s*\{[\s\S]*?\}\s*\)/)
      if (!meta) return
      const mw = meta[0].match(/middleware\s*:\s*(\[[^\]]*\]|['"][^'"]+['"])/)
      if (!mw) return
      const names = mw[1].startsWith('[')
        ? Array.from(mw[1].matchAll(/['"]([^'"]+)['"]/g)).map(m => m[1])
        : [mw[1].replace(/['"]/g, '')]
      if (names.length === 0) return
      const urlPath = urlPathFromFile(file)
      if (urlPath.includes('[')) {
        const { re, names: paramNames } = compileRoutePattern(urlPath)
        pageMiddlewarePatterns.push({ re, names: paramNames, middleware: names })
      }
      else {
        pageMiddlewareByPath.set(urlPath, names)
      }
    }
    catch { /* unreadable file — skip */ }
  }

  function resolveRouteMiddleware(path: string): { names: string[], params: Record<string, string> } {
    const exact = pageMiddlewareByPath.get(path)
    if (exact) return { names: exact, params: {} }
    const trimmed = path.replace(/\/$/, '')
    if (trimmed !== path) {
      const exactTrim = pageMiddlewareByPath.get(trimmed)
      if (exactTrim) return { names: exactTrim, params: {} }
    }
    for (const entry of pageMiddlewarePatterns) {
      const m = entry.re.exec(path)
      if (m) {
        const params: Record<string, string> = {}
        entry.names.forEach((n, i) => { params[n] = decodeURIComponent(m[i + 1] ?? '') })
        return { names: entry.middleware, params }
      }
    }
    return { names: [], params: {} }
  }

  // ── Cookie + redirect helpers ────────────────────────────────────────
  function parseCookies(req: Request): Record<string, string> {
    const out: Record<string, string> = {}
    const header = req.headers.get('cookie') || ''
    if (!header) return out
    for (const part of header.split(/;\s*/)) {
      const eq = part.indexOf('=')
      if (eq === -1) continue
      const k = part.slice(0, eq)
      if (!k) continue
      try { out[k] = decodeURIComponent(part.slice(eq + 1)) }
      catch { out[k] = part.slice(eq + 1) }
    }
    return out
  }

  function redirectWithNext(target: string, originalPath: string, search = ''): Response {
    const sep = target.includes('?') ? '&' : '?'
    const next = encodeURIComponent(originalPath + search)
    return Response.redirect(`${target}${sep}next=${next}`, 302)
  }

  // ── Bundled middleware (auth, guest) ─────────────────────────────────
  // Mirrors Laravel's `Authenticate` and `RedirectIfAuthenticated` —
  // ships out of the box, fully replaceable by passing your own handler
  // under `options.middleware.auth` / `options.middleware.guest`.
  const authConfig = options.auth === false ? null : (options.auth ?? {})
  const authCookieName = authConfig?.cookieName ?? 'auth-token'
  const authRedirectTo = authConfig?.redirectTo ?? '/login'
  const authHome = authConfig?.home ?? '/'
  const extraProtectedPrefixes = authConfig?.protectedPaths ?? []

  /** Locale for the in-flight SSR pass (`/en/...` prefix). STX server scripts run in
   *  a `new Function()` scope and do not inherit AsyncLocalStorage — inject `t`/`locale`
   *  into the extractVariables context instead. */
  let activeServeLocale: string | null = null
  /** Query string for the in-flight SSR pass — pagination/filter pages must not share htmlCache entries. */
  let activeServeSearch: string = ''

  function injectServeLocaleContext(context: Record<string, any>) {
    if (!activeServeLocale)
      return
    const loc = activeServeLocale
    context.locale = loc
    context.t = (key: string, values?: Record<string, unknown>) => {
      const translate = (globalThis as { t?: (k: string, v?: Record<string, unknown>, l?: string) => string }).t
      return typeof translate === 'function' ? translate(key, values, loc) : key
    }
  }

  /** Expose the current request query string to `<script server>` blocks. */
  function injectServeRequestContext(context: Record<string, any>) {
    if (!activeServeSearch)
      return
    context.__stxServeSearch = activeServeSearch
    ;(globalThis as { __stxServeSearch?: string }).__stxServeSearch = activeServeSearch
  }

  /** Render cache must vary by locale — same `.stx` file serves different `t()` output per prefix. */
  function htmlCacheKey(filePath: string): string {
    const loc = i18nConfig ? (activeServeLocale ?? i18nConfig.defaultLocale) : ''
    const search = activeServeSearch || ''
    if (!loc && !search)
      return filePath
    return `${filePath}\0${loc}\0${search}`
  }

  const builtInMiddleware: Record<string, MiddlewareHandler> = authConfig === null ? {} : {
    auth: (_req, ctx) => {
      const tok = ctx.cookies[authCookieName]
      if (!tok) return ctx.redirect(authRedirectTo)
      return null
    },
    guest: (_req, ctx) => {
      const tok = ctx.cookies[authCookieName]
      if (tok) return Response.redirect(authHome, 302)
      return null
    },
  }

  const middlewareRegistry: Record<string, MiddlewareHandler> = {
    ...builtInMiddleware,
    ...(options.middleware ?? {}),
  }

  function expandMiddlewareNames(names: string[]): string[] {
    const out: string[] = []
    const groups = options.middlewareGroups ?? {}
    const seen = new Set<string>()
    const visit = (name: string) => {
      if (seen.has(name)) return
      seen.add(name)
      const group = groups[name]
      if (group) group.forEach(visit)
      else out.push(name)
    }
    names.forEach(visit)
    return out
  }

  const globalMiddlewareNames = options.globalMiddleware ?? []

  function stxViewFileToRoutePath(filePath: string): string | null {
    const normalized = filePath.replace(/\\/g, '/')
    for (const pattern of patterns) {
      const normPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
      if (!normalized.startsWith(`${normPattern}/`))
        continue
      let rel = normalized.slice(normPattern.length + 1).replace(/\.(stx|md|html)$/, '')
      if (rel.includes('['))
        return null
      if (rel === 'index' || rel === '')
        return '/'
      if (rel.endsWith('/index'))
        rel = rel.slice(0, -6) || 'index'
      return rel === 'index' ? '/' : `/${rel}`
    }
    return null
  }

  function rebuildDiscoveredPagePaths(files: string[]) {
    const known = new Set<string>(['/'])
    for (const filePath of files) {
      const routePath = stxViewFileToRoutePath(filePath)
      if (routePath)
        known.add(routePath)
    }
    const pages = options.site?.pages as Record<string, unknown> | undefined
    if (pages) {
      for (const p of Object.keys(pages))
        known.add(p.startsWith('/') ? p : `/${p}`)
    }
    discoveredPagePaths = known
  }

  async function discoverFiles() {
    if (sourceFiles !== null)
      return sourceFiles

    const files: string[] = []
    const supportedExtensions = ['.stx', '.md', '.html']

    for (const pattern of patterns) {
      try {

        const stat = await nodeFs.stat(pattern).catch(() => null)

        if (stat?.isDirectory()) {
          // Watch this directory tree once so subsequent file changes
          // invalidate the cache (recursive watch picks up new sub-dirs).
          startWatcher(pattern)
          // Directories to exclude from page routing — these contain non-page .stx files
          const excludeDirs = ['layouts', 'components', 'partials']
          if (layoutsDir) excludeDirs.push(layoutsDir.replace(/^.*\//, ''))
          if (componentsDir) excludeDirs.push(componentsDir.replace(/^.*\//, ''))
          if (partialsDir) excludeDirs.push(partialsDir.replace(/^.*\//, ''))

          for (const ext of ['.stx', '.md', '.html']) {
            const glob = new Glob(`**/*${ext}`)
            const discovered = await Array.fromAsync(glob.scan({ cwd: pattern, followSymlinks: true }))
            files.push(...discovered
              .filter(f => !excludeDirs.some(dir => f.startsWith(`${dir}/`)))
              .map(f => `${pattern}/${f}`.replace(/\/+/g, '/')))
          }
        }
        else if (pattern.includes('*')) {
          const glob = new Glob(pattern)
          const basePath = pattern.split('*')[0].replace(/\/$/, '')
          const discovered = await Array.fromAsync(glob.scan({ cwd: basePath || '.', followSymlinks: true }))
          files.push(...discovered.map(f => basePath ? `${basePath}/${f}` : f))
        }
        else if (supportedExtensions.some(ext => pattern.endsWith(ext))) {
          files.push(pattern)
        }
      }
      catch (error) {
        console.error(`Error processing pattern "${pattern}":`, error)
      }
    }

    sourceFiles = files
    rebuildDiscoveredPagePaths(files)

    // Build the page-middleware index (Laravel-style named middleware).
    pageMiddlewareByPath.clear()
    pageMiddlewarePatterns.length = 0
    await Promise.all(files.map(f => detectPageMiddleware(f)))

    // Generate route manifest and type declarations into .stx/.
    // Pass ALL patterns as a stack of page roots so frameworks can ship
    // default views (e.g. cart, checkout, orders) and apps can override
    // any of them by dropping a file with the same path into their own
    // `resources/views`. The first matching root wins per pattern.
    try {
      const { Router } = await import('stx-router')
      const pagesDirs = patterns.map(p => p.replace(/\/$/, '')).filter(Boolean)
      const router = new Router(process.cwd(), { pagesDirs })
      if (!options.quiet)
        console.log(`[stx] Generated ${router.routes.length} routes → .stx/routes.ts`)
    }
    catch (e) {
      // Non-fatal — route generation is optional
    }

    return files
  }

  // Lazy asset copy function
  async function ensureAssets() {
    if (assetsInitialized)
      return

    assetsInitialized = true

    const assetsDir = './resources/assets'
    const targetAssetsDir = './.stx/assets'

    try {
      const assetsExist = await nodeFs.stat(assetsDir).then(() => true).catch(() => false)
      if (assetsExist) {
        await nodeFs.rm(targetAssetsDir, { recursive: true, force: true })
        await nodeFs.cp(assetsDir, targetAssetsDir, { recursive: true })
      }
    }
    catch {
      // Silently ignore
    }
  }

  // ── Rendered-HTML cache (static routes only). ───────────────────────
  //
  // `htmlCache` itself is declared with the other top-level caches above
  // (alongside `routes`/`crosswindCssCache`) so the file watcher can wipe
  // it on every source change. Keyed by template file path; each entry
  // remembers the mtimes of the template AND every dependency it
  // accumulated during the last render (layout, components, partials).
  // On every request we re-stat that signature; any mismatch — including
  // a deleted file — busts the cache and forces a fresh render.
  //
  // Skipped for `processTemplateDynamic` (routes like `/cars/[id]`) since
  // those depend on per-request URL params, not just file content. Pages
  // that read fully-dynamic data in `<script server>` (e.g. live DB rows
  // that change between requests with no file edit) can opt out with
  // `definePageMeta({ cache: false })` — the user script sets
  // `context.__stx_skip_cache` and we honour it before storing.

  async function templateSignatureFresh(sig: Map<string, number>): Promise<boolean> {
    for (const [p, expected] of sig) {
      const stat = await nodeFs.stat(p).catch(() => null)
      if (!stat || stat.mtimeMs !== expected)
        return false
    }
    return true
  }

  async function buildTemplateSignature(filePath: string, deps: Set<string>): Promise<Map<string, number>> {
    const sig = new Map<string, number>()
    // Stat the entry template + all accumulated dependencies in parallel —
    // a single round of fs.stat() per file, fanned out concurrently.
    const allPaths = [filePath, ...deps]
    const stats = await Promise.all(allPaths.map(p => nodeFs.stat(p).catch(() => null)))
    for (let i = 0; i < allPaths.length; i++) {
      const stat = stats[i]
      if (stat)
        sig.set(allPaths[i], stat.mtimeMs)
    }
    return sig
  }

  // Crosswind CSS lazy loading
  let crosswindModule: { CSSGenerator: any, config: any } | null = null
  let crosswindLoadAttempted = false

  // Crosswind user config cache. Process lifetime is the invalidation
  // boundary for the *config* itself (config changes require a restart).
  let crosswindUserConfigPromise: Promise<Record<string, any>> | null = null
  // `crosswindCssCache` itself (sorted class-set → CSS) lives with the
  // other top-level caches above so the file watcher wipes it on every
  // source change. Re-running the generator for a touched template picks
  // up newly added utility classes that weren't in the previous render.

  async function loadCrosswind(): Promise<{ CSSGenerator: any, config: any } | null> {
    if (crosswindLoadAttempted)
      return crosswindModule
    crosswindLoadAttempted = true

    try {
      // Try the npm package first
      const mod = await import('@cwcss/crosswind')
      crosswindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
      return crosswindModule
    }
    catch {
      try {
        // Fallback to local development path

        const localPath = nodePath.join(process.env.HOME || '', 'Code/Tools/crosswind/packages/crosswind/src/index.ts')
        const mod = await import(localPath)
        crosswindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
        return crosswindModule
      }
      catch {
        return null
      }
    }
  }

  async function generateCrosswindCSS(htmlContent: string): Promise<string> {
    try {
      const cw = await loadCrosswind()
      if (!cw)
        return ''

      // Scan class="" attributes for utility class names
      const classRegex = /class\s*=\s*["']([^"']+)["']/gi
      const classes = new Set<string>()
      let match = classRegex.exec(htmlContent)
      while (match !== null) {
        for (const cls of match[1].split(/\s+/)) {
          if (cls.trim()) classes.add(cls.trim())
        }
        match = classRegex.exec(htmlContent)
      }

      // Scan x-class / :class expressions — extract quoted string literals
      // Use [^"]+ for double-quoted attrs (content may have single quotes)
      const dynRegex = /(?:x-class|:class)\s*=\s*"([^"]+)"/gi
      let dynMatch = dynRegex.exec(htmlContent)
      while (dynMatch !== null) {
        // Extract all single-quoted string literals from the expression
        const strLiterals = dynMatch[1].match(/'([^']+)'/g)
        if (strLiterals) {
          for (const lit of strLiterals) {
            const unquoted = lit.slice(1, -1)
            for (const cls of unquoted.split(/\s+/)) {
              if (cls.trim()) classes.add(cls.trim())
            }
          }
        }
        dynMatch = dynRegex.exec(htmlContent)
      }

      if (classes.size === 0)
        return ''

      // Load user crosswind config via bunfig — picks up `config/crosswind.ts`,
      // `crosswind.config.ts`, `.config/crosswind.ts`, and other standard
      // bunfig locations. Cached for the lifetime of the dev process; bun's
      // --watch process restart bust the cache when the config file changes.
      if (!crosswindUserConfigPromise) {
        crosswindUserConfigPromise = loadConfig({
          name: 'crosswind',
          cwd: process.cwd(),
          defaultConfig: {} as Record<string, any>,
          checkEnv: false,
          verbose: false,
        }) as Promise<Record<string, any>>
      }
      const userConfig = await crosswindUserConfigPromise

      if (userConfig.safelist) {
        for (const cls of userConfig.safelist) classes.add(cls)
      }

      // Cache key — sorted class names plus the safelist (already folded in
      // above). Same set → same CSS, so we can short-circuit the entire
      // generator pipeline below for repeat renders of the same template.
      const cacheKey = [...classes].sort().join(' ')
      const cached = crosswindCssCache.get(cacheKey)
      if (cached !== undefined)
        return cached

      // Merge user shortcuts into the generator config
      const generatorConfig: Record<string, any> = { ...cw.config, preflight: true, minify: false }
      if (userConfig.shortcuts) {
        generatorConfig.shortcuts = { ...(generatorConfig.shortcuts || {}), ...userConfig.shortcuts }
      }
      if (userConfig.theme) {
        generatorConfig.theme = { ...(generatorConfig.theme || {}), ...userConfig.theme }
      }

      const generator = new cw.CSSGenerator(generatorConfig)
      for (const className of classes) {
        generator.generate(className)
      }

      // Generate shortcut CSS rules — CSSGenerator doesn't natively output
      // grouped .shortcut-name { ... } rules, so we build them manually
      let shortcutCSS = ''
      const shortcuts = generatorConfig.shortcuts || {}
      for (const [name, classStr] of Object.entries(shortcuts)) {
        if (!classes.has(name)) continue
        // Generate all utility classes the shortcut references
        const parts = (classStr as string).split(/\s+/).filter(Boolean)
        for (const p of parts) generator.generate(p)
      }
      const baseCss = generator.toCSS(true, false)

      // Now extract the declarations for each shortcut and build grouped rules
      for (const [name, classStr] of Object.entries(shortcuts)) {
        if (!classes.has(name)) continue
        const parts = (classStr as string).split(/\s+/).filter(Boolean)
        const decls: string[] = []
        const darkDecls: string[] = []
        for (const cls of parts) {
          const isDark = cls.startsWith('dark:')
          const actualCls = isDark ? cls.slice(5) : cls
          const escaped = actualCls.replace(/[/:.[\]%()]/g, c => `\\${c}`)
          const re = new RegExp(`\\.${escaped}\\s*\\{([^}]+)\\}`)
          const m = baseCss.match(re)
          if (m) {
            if (isDark) darkDecls.push(m[1].trim())
            else decls.push(m[1].trim())
          }
        }
        if (decls.length) shortcutCSS += `.${name} { ${decls.join(' ')} }\n`
        if (darkDecls.length) shortcutCSS += `@media (prefers-color-scheme: dark) { .dark .${name} { ${darkDecls.join(' ')} } }\n`
      }

      const finalCss = baseCss + shortcutCSS
      crosswindCssCache.set(cacheKey, finalCss)
      return finalCss
    }
    catch (error) {
      console.warn('Failed to generate Crosswind CSS:', error)
      return ''
    }
  }

  // Lazy template processing function
  async function processTemplate(filePath: string): Promise<string> {
    const content = await Bun.file(filePath).text()
    const skipCacheHint = /(?:^|[^\w$])__stx_skip_cache\s*=\s*true/.test(content)

    // Cache fast path — if every dependency mtime matches the previous
    // render, return the cached HTML. The stat fan-out is ~1ms total for a
    // typical 5-dep page; a fresh render is ~50ms, so even on miss we only
    // pay the stat cost once. Query-driven pages opt out entirely.
    if (ENABLE_HTML_CACHE && !skipCacheHint) {
      const cacheKey = htmlCacheKey(filePath)
      const cachedEntry = htmlCache.get(cacheKey)
      if (cachedEntry && await templateSignatureFresh(cachedEntry.signature))
        return cachedEntry.html
    }

    // Extract server script bodies for variable extraction, and remove only
    // server scripts from the template. Client scripts (including <script client>
    // with signals) must remain in the template for processDirectives to transform.
    const serverScriptRegex = /<script\b([^>]*)\bserver\b[^>]*>([\s\S]*?)<\/script>/gi
    const serverScripts: string[] = []
    let scriptMatch: RegExpExecArray | null

    while ((scriptMatch = serverScriptRegex.exec(content)) !== null) {
      serverScripts.push(scriptMatch[2])
    }

    // Only remove server scripts from template — client scripts stay for processDirectives
    let templateContent = content.replace(/<script\b[^>]*\bserver\b[^>]*>[\s\S]*?<\/script>/gi, '')

    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: nodePath.dirname(filePath),
    }

    const { processDirectives, extractVariables, defaultConfig, generateSpaShell, injectRouterScript, resetHead } = await stxModule
    // Fresh head state per request — server scripts may call useHead() to set
    // a per-page <title>/meta. We reset BEFORE extracting so each request
    // starts clean, then mark the context so processDirectives doesn't reset
    // again and wipe what useHead just populated.
    resetHead()
    injectServeLocaleContext(context)
    injectServeRequestContext(context)
    for (const scriptBody of serverScripts) {
      await extractVariables(scriptBody, context, filePath)
    }
    context.__stx_head_preset = true

    // Merge custom options with default config and stx.config.ts settings.
    // Only forward known directive-processing keys from stxConfig — dumping
    // the whole object (apiRoutes, css path, etc.) into processDirectives
    // causes unexpected behavior.
    const config = {
      ...defaultConfig,
      ...(componentsDir && { componentsDir }),
      ...(layoutsDir && { layoutsDir }),
      ...(partialsDir && { partialsDir }),
      autoShell: true,
      ssr: stxConfig.ssr ?? defaultStxConfig.ssr ?? true,
      app: stxConfig.app || {},
      ...('strict' in stxConfig && { strict: stxConfig.strict }),
      ...('router' in stxConfig && { router: stxConfig.router }),
      // Forward SEO/head defaults so stx.config.ts can suppress the auto-injected
      // "stx Project" fallback tags and override the project-wide title/description/image.
      ...('skipDefaultSeoTags' in stxConfig && { skipDefaultSeoTags: stxConfig.skipDefaultSeoTags }),
      ...('defaultTitle' in stxConfig && { defaultTitle: stxConfig.defaultTitle }),
      ...('defaultDescription' in stxConfig && { defaultDescription: stxConfig.defaultDescription }),
      ...('defaultImage' in stxConfig && { defaultImage: stxConfig.defaultImage }),
      ...('seo' in stxConfig && { seo: stxConfig.seo }),
      // Forward analytics so injectAnalytics runs on this serve path too —
      // both native providers (fathom/GA/…) and plugin-injected trackers (the
      // plugin-mutated analytics is merged onto stxConfig above).
      ...('analytics' in stxConfig && { analytics: stxConfig.analytics }),
      // Forward plugin-registered component dirs so renderComponentWithSlot
      // can resolve tags exposed by stx plugins (e.g. `<Notification>` from
      // `@stacksjs/components` via a stx plugin shim). Populated by
      // `loadStxConfig` when each plugin is loaded.
      ...('_pluginComponentDirs' in stxConfig && { _pluginComponentDirs: stxConfig._pluginComponentDirs }),
      ...('_pluginPageDirs' in stxConfig && { _pluginPageDirs: stxConfig._pluginPageDirs }),
    }

    // When SSR is disabled, serve a client-side SPA shell instead of processing directives
    if (config.ssr === false || stxConfig.ssr === false) {
      return generateSpaShell({
        template: templateContent,
        context,
        title: stxConfig.defaultTitle ?? 'stx App',
      })
    }

    let output = templateContent
    const dependencies = new Set<string>()
    output = await processDirectives(output, context, filePath, config, dependencies)

    // Inject the SPA router (auto-initializes, guards against double-init)
    output = await injectRouterScript(output, getRouterInjectOptions())

    // Strip plain <template> wrapper tags - browsers don't render template content
    // STX uses <template> in source but output should be renderable HTML
    // PRESERVE <template> tags with reactive directives — those are client-side
    // templates processed by the signals runtime (x-for, x-if, @for, @if, :for, :if)
    const directiveTemplateRe = /@for|:for|@if|:if|x-for|x-if/
    const hasDirectiveTemplates = /<template\s[^>]*(?:@for|:for|@if|:if|x-for|x-if)/.test(output)
    if (hasDirectiveTemplates) {
      // Only strip <template> tags that don't have directive attributes
      output = output.replace(/<template(?:\s[^>]*)?>|<\/template>/gi, (match) => {
        if (directiveTemplateRe.test(match)) return match
        if (match === '</template>') return match
        return ''
      })
    }
    else {
      output = output.replace(/<template[^>]*>/gi, '').replace(/<\/template>/gi, '')
    }

    // Client scripts remain in the template (not stripped) so processDirectives()
    // transforms <script client> into <script data-stx-scoped> with stx.mount().

    // Crosswind CSS is already injected by processDirectives() (injectCrosswindCSS at top level).
    // Do NOT generate it again here — duplicate Preflight resets would strip all utility styles.

    // Store in the render cache unless the page opted out (e.g. a server
    // script that reads request-specific or fully-dynamic data set
    // `context.__stx_skip_cache = true`). The dependency set was populated
    // by processDirectives — every layout / component / partial it pulled
    // in is now part of the invalidation signature.
    if (ENABLE_HTML_CACHE && !context.__stx_skip_cache && !skipCacheHint) {
      const signature = await buildTemplateSignature(filePath, dependencies)
      htmlCache.set(htmlCacheKey(filePath), { html: output, signature })
    }

    return output
  }

  // Function to get or create route
  async function getRoute(requestPath: string): Promise<string | null> {
    // Dev mode: never cache — always re-process templates so file changes are reflected
    // Production caching is handled by the production server, not the dev serve path

    // Discover files if needed
    const files = await discoverFiles()

    // Normalize the request path
    let normalizedPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath

    // Try to find matching file with various strategies
    const possibleFiles: string[] = []

    // Strategy 1: Direct path match (e.g., /pages/home.stx -> pages/home.stx)
    for (const ext of ['.stx', '.md', '.html', '']) {
      const directPath = normalizedPath.endsWith(ext) ? normalizedPath : `${normalizedPath}${ext}`
      possibleFiles.push(directPath)
    }

    // Strategy 2: Look for index files in directory
    // For root path (empty normalizedPath), use index.* directly without leading slash
    if (normalizedPath === '') {
      possibleFiles.push('index.stx')
      possibleFiles.push('index.md')
      possibleFiles.push('index.html')
    }
    else {
      possibleFiles.push(`${normalizedPath}/index.stx`)
      possibleFiles.push(`${normalizedPath}/index.md`)
      possibleFiles.push(`${normalizedPath}/index.html`)
    }

    // Strategy 3: Simple filename match (legacy behavior)
    const filename = nodePath.basename(normalizedPath, nodePath.extname(normalizedPath))
    if (filename && !normalizedPath.includes('/')) {
      possibleFiles.push(`${filename}.stx`)
      possibleFiles.push(`${filename}.md`)
      possibleFiles.push(`${filename}.html`)
    }

    // Find a matching file from discovered files. Match by *relative* path
    // (after stripping the pattern dir) so a request for `/relocations`
    // doesn't accidentally serve `host/relocations.stx` via a suffix match.
    // Previously a `endsWith('/${possible}')` fallback meant any deeper file
    // whose basename matched would win — we now require an exact path match
    // relative to the configured `patterns` directories.
    for (const possible of possibleFiles) {
      for (const filePath of files) {
        const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

        // Compute the file's path relative to whichever pattern dir contains
        // it, so `resources/views/relocations/index.stx` becomes
        // `relocations/index.stx` for matching against `possibleFiles`.
        let relativeFilePath = normalizedFilePath
        for (const pattern of patterns) {
          const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
          if (normalizedFilePath.startsWith(`${normalizedPattern}/`)) {
            relativeFilePath = normalizedFilePath.slice(normalizedPattern.length + 1)
            break
          }
        }

        if (normalizedFilePath === possible || relativeFilePath === possible) {
          // Process template on every request (dev mode — no caching)
          const output = await processTemplate(filePath)
          return output
        }
      }
    }

    // Strategy 4: Try finding by relative path within any pattern directory
    for (const filePath of files) {
      const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

      // For absolute paths, extract the relative portion from the pattern
      // e.g., /Users/.../dashboard/pages/home.stx with pattern /Users/.../dashboard
      //       becomes pages/home.stx
      let relativeFilePath = normalizedFilePath
      for (const pattern of patterns) {
        const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
        if (normalizedFilePath.startsWith(`${normalizedPattern}/`)) {
          relativeFilePath = normalizedFilePath.slice(normalizedPattern.length + 1)
          break
        }
      }

      // Check if this file matches by extracting route from file path
      // e.g., pages/library/components.stx -> /pages/library/components or /library/components
      const fileRoute = relativeFilePath.replace(/\.(stx|md|html)$/, '')

      // Check various possible route formats
      // Special case: index files should map to root path
      const isIndexFile = fileRoute === 'index' || fileRoute.endsWith('/index')
      const isRootRequest = requestPath === '/' || normalizedPath === ''

      if (`/${fileRoute}` === requestPath ||
      fileRoute === normalizedPath ||
      `/${fileRoute}.stx` === requestPath ||
      `/${fileRoute}.md` === requestPath ||
      `/${fileRoute}.html` === requestPath ||
      (isIndexFile && isRootRequest)) {
        const output = await processTemplate(filePath)
        routes.set(requestPath, output)
        return output
      }

      // Strategy 5: Pretty routes - strip 'pages/' prefix for cleaner URLs
      // e.g., /home -> pages/home.stx, /library/components -> pages/library/components.stx
      if (fileRoute.startsWith('pages/')) {
        const prettyRoute = fileRoute.slice(6) // Remove 'pages/' prefix
        if (`/${prettyRoute}` === requestPath ||
        prettyRoute === normalizedPath) {
          const output = await processTemplate(filePath)
          routes.set(requestPath, output)
          return output
        }
      }
    }

    // Strategy 6: Dynamic route segments - [param].stx files
    // e.g., /data/product -> pages/data/[model].stx or data/[model].stx
    for (const filePath of files) {
      const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

      // Check if this file has a dynamic segment like [param]
      if (!normalizedFilePath.includes('['))
        continue

      // Extract the relative path from patterns
      let relativeFilePath = normalizedFilePath
      for (const pattern of patterns) {
        const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
        if (normalizedFilePath.startsWith(`${normalizedPattern}/`)) {
          relativeFilePath = normalizedFilePath.slice(normalizedPattern.length + 1)
          break
        }
      }

      // Convert dynamic route file to regex pattern
      // e.g., pages/data/[model].stx -> ^pages/data/([^/]+)$
      // Build candidate regexes (incl. the `/index`-stripped variant so
      // nested dynamic routes resolve on hard reload — stacksjs/stx#1927).
      const fileRouteBase = relativeFilePath.replace(/\.(stx|md|html)$/, '')
      const regexPatterns = buildDynamicRouteRegexes(fileRouteBase)

      for (const regex of regexPatterns) {
        const match = normalizedPath.match(regex)
        if (match) {
          // Extract param names and values
          const paramNames = [...fileRouteBase.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
          const paramValues = match.slice(1)

          // Process template with dynamic params in context
          const output = await processTemplateDynamic(filePath, paramNames, paramValues, normalizedPath)
          routes.set(requestPath, output)
          return output
        }
      }
    }

    return null
  }

  // Process template with dynamic route parameters
  async function processTemplateDynamic(
    filePath: string,
    paramNames: string[],
    paramValues: string[],
    routePath: string,
  ): Promise<string> {

    const content = await Bun.file(filePath).text()

    // Extract server scripts only — client scripts stay for processDirectives to transform
    const serverScriptRegex = /<script\b([^>]*)\bserver\b[^>]*>([\s\S]*?)<\/script>/gi
    const dynServerScripts: string[] = []
    let dynScriptMatch: RegExpExecArray | null

    while ((dynScriptMatch = serverScriptRegex.exec(content)) !== null) {
      dynServerScripts.push(dynScriptMatch[2])
    }

    // Only remove server scripts from template — client scripts stay for processDirectives
    const templateContent = content.replace(/<script\b[^>]*\bserver\b[^>]*>[\s\S]*?<\/script>/gi, '')

    // Build context with dynamic params
    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: nodePath.dirname(filePath),
      __route: routePath,
    }

    // Add each param to context
    for (let i = 0; i < paramNames.length; i++) {
      context[paramNames[i]] = paramValues[i]
    }

    const { processDirectives, extractVariables, defaultConfig, injectRouterScript: injectRouter, resetHead: resetHeadDyn } = await stxModule
    // Fresh head state per request (see static-route handler above for rationale)
    resetHeadDyn()
    injectServeLocaleContext(context)
    for (const scriptBody of dynServerScripts) {
      await extractVariables(scriptBody, context, filePath)
    }
    context.__stx_head_preset = true

    const config = {
      ...defaultConfig,
      ...(componentsDir && { componentsDir }),
      ...(layoutsDir && { layoutsDir }),
      ...(partialsDir && { partialsDir }),
      autoShell: true,
      ssr: stxConfig.ssr ?? defaultStxConfig.ssr ?? true,
      app: stxConfig.app || {},
      ...('strict' in stxConfig && { strict: stxConfig.strict }),
      ...('router' in stxConfig && { router: stxConfig.router }),
      ...('skipDefaultSeoTags' in stxConfig && { skipDefaultSeoTags: stxConfig.skipDefaultSeoTags }),
      ...('defaultTitle' in stxConfig && { defaultTitle: stxConfig.defaultTitle }),
      ...('defaultDescription' in stxConfig && { defaultDescription: stxConfig.defaultDescription }),
      ...('defaultImage' in stxConfig && { defaultImage: stxConfig.defaultImage }),
      ...('seo' in stxConfig && { seo: stxConfig.seo }),
      // Forward analytics so injectAnalytics runs on this serve path too —
      // both native providers (fathom/GA/…) and plugin-injected trackers (the
      // plugin-mutated analytics is merged onto stxConfig above).
      ...('analytics' in stxConfig && { analytics: stxConfig.analytics }),
      // Mirror the static-route config: forward plugin-registered component
      // dirs so dynamic routes also resolve `<Notification>` etc.
      ...('_pluginComponentDirs' in stxConfig && { _pluginComponentDirs: stxConfig._pluginComponentDirs }),
      ...('_pluginPageDirs' in stxConfig && { _pluginPageDirs: stxConfig._pluginPageDirs }),
    }

    let output = templateContent
    const dependencies = new Set<string>()
    output = await processDirectives(output, context, filePath, config, dependencies)

    // Inject route params for client-side useRoute().params
    if (paramNames.length > 0) {
      const paramsObj: Record<string, string> = {}
      for (let i = 0; i < paramNames.length; i++) {
        paramsObj[paramNames[i]] = paramValues[i]
      }
      const paramsScript = `<script>if(window.stx)window.stx._rp=${JSON.stringify(paramsObj)};else window.__stx_rp=${JSON.stringify(paramsObj)};</script>`
      if (output.includes('</head>')) {
        output = output.replace('</head>', `${paramsScript}\n</head>`)
      }
      else {
        output = `${paramsScript}\n${output}`
      }
    }

    // Inject the SPA router
    output = await injectRouter(output, getRouterInjectOptions())

    // Strip SFC <template> wrappers but preserve client-side directive templates
    const directiveTemplateRe2 = /@for|:for|@if|:if|x-for|x-if/
    output = output.replace(/<template(?:\s[^>]*)?>|<\/template>/gi, (match) => {
      if (directiveTemplateRe2.test(match)) return match
      if (match === '</template>') return match
      return ''
    })

    // Client scripts are already handled by processDirectives (transformed into data-stx-scoped)
    // Crosswind CSS is already injected by processDirectives() — no duplicate injection needed.

    return output
  }

  // Start server immediately - processing happens on-demand
  const startTime = performance.now()

  // Discover files and generate routes before printing banner
  await discoverFiles()

  // CORS headers for cross-origin requests (needed for Craft WebView)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // ── Site-aware response post-processing ────────────────────────
  // When `options.site` (or `options.i18n`) is set, we run the same
  // injector chain `buildStaticSite()` uses for prod builds against
  // every text/html response — so dev mode renders identically to a
  // built+served page (theme bootstrap, per-page SEO, locale-prefixed
  // routing, `{t:key}` substitution). When neither option is set,
  // everything below is a no-op and HTML ships untouched.
  const siteConfig = options.site
  const siteStxPromise: Promise<typeof import('@stacksjs/stx')> | null = (siteConfig || options.i18n)
    ? (options.stxModule ? Promise.resolve(options.stxModule) : defaultStxModule)
    : null

  // Resolve i18n once at startup. Explicit `options.i18n` wins; else
  // we derive from site.i18n via `resolveI18n` (returns null when
  // site has no i18n block, which is fine).
  let i18nConfig: import('@stacksjs/stx').ResolvedI18n | null = options.i18n ?? null
  if (!i18nConfig && siteConfig && siteStxPromise) {
    try {
      const { resolveI18n } = await siteStxPromise
      i18nConfig = resolveI18n(siteConfig) ?? null
    }
    catch { /* fall through — no translations */ }
  }

  // Strip a locale prefix from a path and return both. Falls back to
  // `defaultLocale` when no prefix matches — that way every page gets
  // translated (untouched markers would leak `{t:nav.home}` text).
  function localeFromPath(pathname: string): { locale: string, path: string } {
    if (!i18nConfig) return { locale: 'en', path: pathname }
    for (const loc of i18nConfig.locales) {
      if (pathname === `/${loc}` || pathname === `/${loc}/`)
        return { locale: loc, path: '/' }
      if (pathname.startsWith(`/${loc}/`))
        return { locale: loc, path: pathname.slice(loc.length + 1) }
    }
    return { locale: i18nConfig.defaultLocale, path: pathname }
  }

  /** SPA router defaults for static sites — merged with site.config + stx.config. */
  function getRouterInjectOptions(): { router: Record<string, unknown> } {
    return {
      router: {
        interceptAllLinks: true,
        container: 'main',
        ...(siteConfig?.router ?? {}),
        ...(stxConfig.router ?? {}),
      },
    }
  }

  /** Ensure `window.__stxRouterConfig` is present (older @stacksjs/stx builds may omit it). */
  function ensureRouterConfig(html: string): string {
    const routerOpts = getRouterInjectOptions().router
    const block = `<script>window.__stxRouterConfig=${JSON.stringify(routerOpts)};</script>\n`
    // Match only the dedicated config tag — the inlined router bundle mentions
    // `window.__stxRouterConfig` in comments, which must not short-circuit us.
    const configTagRe = /<script>window\.__stxRouterConfig=\{[^<]*\}<\/script>\s*/i
    if (configTagRe.test(html))
      return html.replace(configTagRe, block)
    if (/<\/body>/i.test(html))
      return html.replace(/<\/body>/i, `${block}</body>`)
    return `${html}\n${block}`
  }

  async function applyI18nToResponse(res: Response, locale: string, normalizedPath: string): Promise<Response> {
    if (!siteStxPromise) return res
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) return res

    const stx = await siteStxPromise
    let html = await res.text()

    // Theme bootstrap — FOUC guard + dark-mode toggle handler. The
    // <ThemeToggle /> component's click handler is part of this
    // injection; without it, the button is a no-op.
    if (siteConfig && stx.injectThemeBootstrap)
      html = stx.injectThemeBootstrap(html, siteConfig)

    // Per-page SEO — <title>, description, OG, hreflang. Page meta
    // comes from site.pages[normalizedPath]; defaults gracefully when
    // the path isn't registered.
    if (siteConfig && stx.injectSeo) {
      const pageMeta = (siteConfig.pages ?? {})[normalizedPath] ?? {}
      html = stx.injectSeo(html, siteConfig, pageMeta, normalizedPath)
    }

    // Lang-picker bootstrap — wires `data-lang="<code>"` button clicks
    // inside `#lang-picker` to navigate between locales (no `@click`
    // handlers in the component itself; this script intercepts via
    // event delegation). Without this, the language picker is a
    // visual-only no-op. Inject before `</body>` so the picker DOM
    // exists when the script runs.
    if (i18nConfig && stx.buildLangPickerScript) {
      const pickerScript = stx.buildLangPickerScript(i18nConfig, locale)
      html = /<\/body>/i.test(html)
        ? html.replace(/<\/body>/i, `${pickerScript}\n</body>`)
        : html + pickerScript
    }

    // Tag each rendered page with its locale via the SPA router's
    // "layout group" meta. When the user clicks the lang picker and
    // navigates from /about to /de/about, the router sees the group
    // change ('en' → 'de') and triggers a full-body swap instead of
    // the default container-only swap — so <nav> and <footer> (which
    // hold `{t:key}` text the server already translated on the new
    // request) get swapped in too. Without this, only `<main>` would
    // update and the chrome would keep displaying the previous
    // locale until a hard reload.
    if (i18nConfig) {
      const groupMeta = `<meta name="stx-layout-group" content="i18n:${locale}">`
      if (/<meta name="stx-layout-group"[^>]*>/i.test(html))
        html = html.replace(/<meta name="stx-layout-group"[^>]*>/i, groupMeta)
      else if (/<\/head>/i.test(html))
        html = html.replace(/<\/head>/i, `${groupMeta}\n</head>`)
      else
        html = `${groupMeta}\n${html}`
    }

    // Localize internal links — without this every <a href="/about">
    // in a /de page still points at /about (the English page), so
    // clicking any nav link kicks the visitor out of their locale.
    // Mirrors `localizeInternalLinks` from build.ts. Only rewrites
    // paths the project declared in `site.pages` so we don't
    // accidentally prefix static assets or unknown deep links.
    const knownPaths = discoveredPagePaths ?? new Set<string>()
    if (i18nConfig && locale !== i18nConfig.defaultLocale && knownPaths.size > 0) {
      html = html.replace(
        /<a\b([^>]*?)\bhref="(\/[^"]*)"([^>]*)>/gi,
        (full, before, href, after) => {
          if (href.startsWith('//')) return full
          if (href === `/${locale}` || href === `/${locale}/` || href.startsWith(`/${locale}/`)) return full
          const m = href.match(/^(\/[^?#]*)(.*)$/)
          if (!m) return full
          const [, pathOnly, rest] = m
          const normalized = pathOnly === '/' ? '/' : pathOnly.replace(/\/$/, '')
          if (!knownPaths.has(normalized)) return full
          const localized = normalized === '/' ? `/${locale}/` : `/${locale}${normalized}`
          return `<a${before}href="${localized}${rest}"${after}>`
        },
      )
    }

    // Translations — applied LAST so {t:key} markers inside any
    // injected content (e.g. SEO tags reading from translations)
    // resolve.
    if (i18nConfig && stx.applyTranslations)
      html = stx.applyTranslations(html, i18nConfig, locale)

    html = ensureRouterConfig(html)

    const headers = new Headers(res.headers)
    headers.delete('content-length')
    return new Response(html, {
      status: res.status,
      statusText: res.statusText,
      headers,
    })
  }

  // Allow callers to disable port auto-increment (Vite-style) — when the
  // requested port is in use, probe `port + 1`, `port + 2`, … and bind to
  // the first free one. Defaults to 10 attempts.
  const portAutoIncrement = options.autoIncrementPort ?? true
  const maxPortAttempts = portAutoIncrement === false
    ? 1
    : (typeof portAutoIncrement === 'number' ? Math.max(1, portAutoIncrement) : 10)

  let actualPort = port
  let _server: ReturnType<typeof bunServe> | undefined
  let lastServeError: unknown
  for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
    try {
      _server = bunServe({
        port: actualPort,
        // Disable Bun's per-request idle timeout. The HMR SSE stream is the
        // primary case — it sits open for the lifetime of the dev session
        // and the default 10s idle kills it with
        // `ERR_INCOMPLETE_CHUNKED_ENCODING`. Other long-lived dev requests
        // (debug websockets, slow downloads) benefit too. A dev server has
        // no good reason to enforce request timeouts.
        idleTimeout: 0,
        async fetch(req) {
          const url = new URL(req.url)
          let path = url.pathname

          // Dev proxy — forward matching paths to a backend before any routing.
          // Configured (Vite-style) in stx.config.ts:
          //   server: { proxy: { '/api': 'http://localhost:8000' } }
          // or per-rule: { '/api': { target, changeOrigin?, rewrite? } }.
          // Keys are matched by path prefix; the full path+query is forwarded
          // (or `rewrite(path)` when given). Lets an stx app talk to a separate
          // API server in dev without CORS — the parity gap vs Nuxt's
          // `vite.server.proxy` / `nitro.devProxy`.
          const proxyRules = (stxConfig as any).server?.proxy as
            | Record<string, string | { target: string, changeOrigin?: boolean, rewrite?: (p: string) => string }>
            | undefined
          if (proxyRules) {
            for (const [prefix, rule] of Object.entries(proxyRules)) {
              if (path !== prefix && !path.startsWith(prefix))
                continue
              const ruleCfg = typeof rule === 'string' ? { target: rule } : rule
              const outPath = ruleCfg.rewrite ? ruleCfg.rewrite(path) : path
              const target = new URL(ruleCfg.target)
              const outUrl = new URL(outPath + url.search, target)
              const headers = new Headers(req.headers)
              if (ruleCfg.changeOrigin !== false)
                headers.set('host', target.host)
              try {
                return await fetch(outUrl, {
                  method: req.method,
                  headers,
                  body: req.body,
                  redirect: 'manual',
                  ...(req.body ? { duplex: 'half' } : {}),
                } as RequestInit)
              }
              catch (err) {
                return new Response(`[stx dev proxy] ${prefix} → ${ruleCfg.target} failed: ${err instanceof Error ? err.message : String(err)}`, { status: 502 })
              }
            }
          }

          // i18n: detect + strip locale prefix BEFORE any other routing
          // decision so downstream sees the unprefixed path. Records the
          // resolved locale so the post-render translation pass below uses
          // the right table. /api/** and other non-page routes pass through
          // because the prefix wouldn't match them.
          let i18nLocale: string | null = null
          if (i18nConfig && !url.pathname.startsWith('/api/')) {
            const stripped = localeFromPath(url.pathname)
            i18nLocale = stripped.locale
            if (stripped.path !== url.pathname) {
              // Rewrite the Request so downstream routing (route table,
              // discoverFiles, page resolution) sees the unprefixed path.
              const rewritten = new URL(req.url)
              rewritten.pathname = stripped.path
              const headers = new Headers(req.headers)
              headers.set('x-stx-locale', stripped.locale)
              req = new Request(rewritten, { headers, method: req.method, body: req.body, redirect: req.redirect, duplex: 'half' } as RequestInit)
              path = stripped.path
            }
            else if (i18nLocale) {
              const headers = new Headers(req.headers)
              headers.set('x-stx-locale', i18nLocale)
              req = new Request(req, { headers })
            }
          }

          // Wrap the rest of the handler in an IIFE so we can post-process
          // its Response (translation pass) at a single exit point. When
          // i18n is disabled, the IIFE body is the original handler 1:1
          // and `applyI18nToResponse` returns the response untouched.
          const _i18nResp: Response = await (async (): Promise<Response> => {
            activeServeLocale = i18nLocale
            activeServeSearch = url.search
            try {

              // Handle CORS preflight
              if (req.method === 'OPTIONS') {
                return new Response(null, { headers: corsHeaders })
              }

              // ── HMR event stream ────────────────────────────────────────────
              // The injected HMR client (see `HMR_CLIENT_SCRIPT` below) opens an
              // EventSource against this URL on every page load. We keep the
              // controller around and the file watcher pushes `data: …` lines into
              // every connected stream when a source file changes. The browser
              // either does `location.reload()` or swaps `<link rel=stylesheet>`
              // hrefs in place — see the client below for which.
              if (path === '/_stx/hmr') {
                let controller: ReadableStreamDefaultController<Uint8Array> | undefined
                let keepalive: ReturnType<typeof setInterval> | undefined
                const stream = new ReadableStream<Uint8Array>({
                  start(c) {
                    controller = c
                    hmrClients.add(c)
                    // Initial line — proves the connection is live to the browser
                    // and gives the readyState a definite "open" before any change.
                    c.enqueue(hmrEncoder.encode('data: {"type":"connected"}\n\n'))
                    // Keepalive ping. Without traffic, the stream idles and gets
                    // killed by Bun.serve's `idleTimeout` (default 10s) — the browser
                    // sees `ERR_INCOMPLETE_CHUNKED_ENCODING` and falls into a
                    // reconnect loop that mostly hides the HMR being broken. A
                    // 15s comment line (the leading `:` is the SSE comment syntax,
                    // ignored by the EventSource API) is well under any sane idle
                    // timeout (Bun's, reverse proxy's, browser's) and costs nothing.
                    keepalive = setInterval(() => {
                      try { c.enqueue(hmrEncoder.encode(': keepalive\n\n')) }
                      catch { /* stream closed — cancel handler clears the timer */ }
                    }, 15_000)
                  },
                  cancel() {
                    if (keepalive) clearInterval(keepalive)
                    if (controller) hmrClients.delete(controller)
                  },
                })
                return new Response(stream, {
                  headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache, no-transform',
                    'Connection': 'keep-alive',
                    'X-Accel-Buffering': 'no', // proxies (rpx, nginx) — don't buffer
                  },
                })
              }

              // Custom onRequest handler — short-circuits if a Response is returned
              if (options.onRequest) {
                const customResponse = await options.onRequest(req)
                if (customResponse) return customResponse
              }

              // ── Page middleware pipeline ────────────────────────────────────
              //
              // Resolves the named middleware for this route (global +
              // page-declared + extra `auth.protectedPaths`), expands any
              // middleware groups, then runs the handlers in order. The first
              // one that returns a `Response` short-circuits the chain — the
              // same shape Laravel's `handle($request, $next)` produces.
              const route = resolveRouteMiddleware(path)
              const extraNames = extraProtectedPrefixes.some(p => path === p || path.startsWith(p.endsWith('/') ? p : `${p}/`))
                ? ['auth']
                : []
              const requested = [...globalMiddlewareNames, ...route.names, ...extraNames]
              if (requested.length > 0) {
                const expanded = expandMiddlewareNames(requested)
                const cookies = parseCookies(req)
                const ctx: MiddlewareContext = {
                  path,
                  url,
                  params: route.params,
                  cookies,
                  redirect: (to, status = 302) => {
                    const sep = to.includes('?') ? '&' : '?'
                    const next = encodeURIComponent(path + (url.search || ''))
                    return new Response(null, {
                      status,
                      headers: { Location: `${to}${sep}next=${next}` },
                    })
                  },
                }
                for (const entry of expanded) {
                  // Laravel-style `auth:admin,owner` → handler('auth') called
                  // with args = ['admin', 'owner'].
                  const colon = entry.indexOf(':')
                  const name = colon === -1 ? entry : entry.slice(0, colon)
                  const args = colon === -1 ? [] : entry.slice(colon + 1).split(',')
                  const handler = middlewareRegistry[name]
                  if (!handler) {
                    console.warn(`[stx serve] unknown middleware "${name}" on ${path}`)
                    continue
                  }
                  const result = await handler(req, ctx, ...args)
                  if (result instanceof Response) return result
                }
              }
              // Silence the `redirectWithNext` helper unused-warning — kept
              // around as part of the public-ish surface for callers that
              // want the same shape from a custom onRequest hook.
              void redirectWithNext

              // Custom route handlers — matched by exact path
              if (options.routes) {
                const routeHandler = options.routes[path]
                if (routeHandler) {
                  return routeHandler(req)
                }
              }

              // Serve async components — renders a component and returns HTML fragment
              if (path.startsWith('/_stx/component/')) {
                const componentName = decodeURIComponent(path.slice('/_stx/component/'.length))
                if (componentName) {
                  try {
                    const { processDirectives, defaultConfig } = await stxModule
                    const componentTemplate = `<${componentName} />`
                    const componentOpts = {
                      ...defaultConfig,
                      ...(componentsDir && { componentsDir }),
                      ...(layoutsDir && { layoutsDir }),
                      ...(partialsDir && { partialsDir }),
                      autoShell: false,
                    }
                    const html = await processDirectives(componentTemplate, {}, `${componentsDir}/${componentName}.stx`, componentOpts, new Set())
                    return new Response(html, {
                      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
                    })
                  }
                  catch (e: any) {
                    return new Response(`<div class="stx-async-error">${e.message}</div>`, {
                      status: 500,
                      headers: { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders },
                    })
                  }
                }
              }

              // Handle API routes for data operations
              if (path.startsWith('/api/data/') && req.method === 'POST') {
                try {
                  const tableName = path.replace('/api/data/', '').split('/')[0]
                  if (!tableName) {
                    return new Response(JSON.stringify({ error: 'Table name required' }), {
                      status: 400,
                      headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    })
                  }

                  // Validate table name to prevent SQL injection (allow only alphanumeric and underscores)
                  if (!/^[a-zA-Z_]\w*$/.test(tableName)) {
                    return new Response(JSON.stringify({ error: 'Invalid table name' }), {
                      status: 400,
                      headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    })
                  }

                  const body = await req.json()

                  // Import bun:sqlite for database operations
                  const { Database } = await import('bun:sqlite')
                  const dbPath = nodePath.resolve(process.cwd(), 'database/stacks.sqlite')
                  const db = new Database(dbPath)

                  try {
                    // Get column info to validate fields (table name validated above)
                    const tableInfo = db.query(`PRAGMA table_info("${tableName}")`).all() as Array<{ name: string, type: string, notnull: number, dflt_value: any }>
                    const validColumns = tableInfo.map((c: any) => c.name).filter((n: string) => n !== 'id' && n !== 'created_at' && n !== 'updated_at')

                    // Build INSERT query with only valid columns that have values
                    const columns: string[] = []
                    const placeholders: string[] = []
                    const values: any[] = []

                    for (const col of validColumns) {
                      if (body[col] !== undefined && body[col] !== '') {
                        columns.push(col)
                        placeholders.push('?')
                        values.push(body[col])
                      }
                    }

                    // Add timestamps
                    const now = new Date().toISOString()
                    if (tableInfo.some((c: any) => c.name === 'created_at')) {
                      columns.push('created_at')
                      placeholders.push('?')
                      values.push(now)
                    }
                    if (tableInfo.some((c: any) => c.name === 'updated_at')) {
                      columns.push('updated_at')
                      placeholders.push('?')
                      values.push(now)
                    }

                    if (columns.length === 0) {
                      return new Response(JSON.stringify({ error: 'No valid fields provided' }), {
                        status: 400,
                        headers: { 'Content-Type': 'application/json', ...corsHeaders },
                      })
                    }

                    const query = `INSERT INTO "${tableName}" (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`
                    const stmt = db.prepare(query)
                    const result = stmt.run(...values)

                    return new Response(JSON.stringify({
                      success: true,
                      id: result.lastInsertRowid,
                      message: 'Record created successfully',
                    }), {
                      status: 201,
                      headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    })
                  }
                  catch (error: any) {
                    console.error('API Error:', error)
                    return new Response(JSON.stringify({
                      error: error.message || 'Failed to create record',
                    }), {
                      status: 500,
                      headers: { 'Content-Type': 'application/json', ...corsHeaders },
                    })
                  }
                  finally {
                    db.close()
                  }
                }
                catch { /* outer try — errors handled by inner catch */ }
              }

              // Normalize path
              if (path === '/index')
                path = '/'

              // Redirect root to /home if no index exists (dashboard pattern)
              if (path === '/') {
                const indexContent = await getRoute('/')
                if (!indexContent) {
                  // Try /home as default landing page
                  const homeContent = await getRoute('/home')
                  if (homeContent) {
                    return new Response(null, {
                      status: 302,
                      headers: {
                        'Location': '/home',
                        ...corsHeaders,
                      },
                    })
                  }
                }
              }

              // Try to serve the requested page (lazy load on demand)
              const content = await getRoute(path)
              if (content) {
                // SPA navigation: return only <main> content as fragment
                const isSpaNav = req.headers.get('X-STX-Router') === 'true'
                if (isSpaNav) {
                  // Detect layout from rendered content — extract @extends layout name
                  // If layout differs from the referrer's layout, return full HTML (not fragment)
                  // so the router does a full document swap instead of just swapping <main>
                  const layoutMatch = content.match(/<!-- stx-layout: ([^ ]+) -->/)
                  const pageLayout = layoutMatch ? layoutMatch[1] : 'default'
                  // Locale switches must report `i18n:<code>` so the router does a full-body
                  // swap (nav/footer translations live outside <main>). `applyI18nToResponse`
                  // injects the same meta after render; headers here must match.
                  const groupMetaMatch = content.match(/<meta\b[^>]*name=["']stx-layout-group["'][^>]*content=["']([^"']+)["'][^>]*>/i)
                  const pageLayoutGroup = (i18nConfig && i18nLocale)
                    ? `i18n:${i18nLocale}`
                    : (groupMetaMatch?.[1] || deriveLayoutGroup(pageLayout))

                  let fragment = content

                  // Extract styles from <head> AND body (Crosswind CSS, page styles, @push('styles'))
                  // The router's doFragSwap injects these into <head> during SPA swap
                  const headStyles: string[] = []
                  const headMatch = content.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)
                  if (headMatch) {
                    const headContent = headMatch[1]
                    let styleMatch: RegExpExecArray | null
                    const styleRe = /<style\b[^>]*>[\s\S]*?<\/style>/gi
                    while ((styleMatch = styleRe.exec(headContent)) !== null) {
                      if (styleMatch[0].includes('data-crosswind')) {
                        // Include Crosswind utility CSS WITHOUT the Preflight reset.
                        // The initial page load already has Preflight — fragments only need
                        // new utility classes for the navigated page.
                        const cssContent = styleMatch[0].replace(/<style[^>]*>/, '').replace(/<\/style>/, '')
                        // Strip everything before the first utility rule (after Preflight + CSS variables)
                        const hiddenRule = cssContent.indexOf('[hidden]')
                        if (hiddenRule !== -1) {
                          const afterPreflight = cssContent.indexOf('}', hiddenRule) + 1
                          const utilities = cssContent.slice(afterPreflight).trim()
                          if (utilities) {
                            headStyles.push(`<style data-crosswind="fragment">${utilities}</style>`)
                          }
                        }
                        continue
                      }
                      headStyles.push(styleMatch[0])
                    }
                  }

                  // Also extract styles that are siblings of <main> (from @push/@stack)
                  // These appear in the body but outside <main>, so they'd be lost in fragment extraction
                  const mainOpenMatch = fragment.match(/<main\b[^>]*>/i)
                  const mainCloseIdx = fragment.lastIndexOf('</main>')
                  if (mainOpenMatch && mainCloseIdx !== -1) {
                    // Look for styles between body start and <main> (e.g. from @stack('styles'))
                    const bodyMatch = content.match(/<body\b[^>]*>/i)
                    if (bodyMatch) {
                      const bodyStart = bodyMatch.index! + bodyMatch[0].length
                      const mainIdx = mainOpenMatch.index!
                      const beforeMain = content.slice(bodyStart, mainIdx)
                      let bodyStyleMatch: RegExpExecArray | null
                      const bodyStyleRe = /<style\b[^>]*>[\s\S]*?<\/style>/gi
                      while ((bodyStyleMatch = bodyStyleRe.exec(beforeMain)) !== null) {
                        headStyles.push(bodyStyleMatch[0])
                      }
                    }

                    // Extract only the <main> inner content (not sidebar, header, or layout)
                    const mainStart = mainOpenMatch.index! + mainOpenMatch[0].length
                    fragment = fragment.slice(mainStart, mainCloseIdx).trim()
                  }
                  // Extract ALL page-specific scripts from the full page response.
                  // These may be in <head> or before </body> — outside <main>.
                  // Includes: setup functions (__stx_setup_), partial scope IIFEs,
                  // and the reactive bridge (initScope calls).
                  // Excludes: signals runtime IIFE, x-element runtime, router script.
                  const pageSetupScripts: string[] = []
                  const allScriptRe = /<script\b[^>]*data-stx-scoped[^>]*>[\s\S]*?<\/script>/gi
                  let setupMatch: RegExpExecArray | null
                  while ((setupMatch = allScriptRe.exec(content)) !== null) {
                    const scriptContent = setupMatch[0]
                    // Skip the signals runtime (huge IIFE starting with early_mounts shim)
                    if (scriptContent.includes('__stx_early_mounts')) continue
                    // Skip the reactive bridge runtime definition (window.__stx_reactive)
                    if (scriptContent.includes('data-stx-reactive') && scriptContent.includes('window.__stx_reactive')) continue
                    pageSetupScripts.push(scriptContent)
                  }
                  // Also include reactive bridge initScope calls (they're in a separate script tag)
                  // eslint-disable-next-line no-super-linear-backtracking, regexp/no-super-linear-backtracking
                  const bridgeInitRe = /<script\b[^>]*data-stx-reactive[^>]*>(?![\s\S]*window\.__stx_reactive)[\s\S]*?<\/script>/gi
                  while ((setupMatch = bridgeInitRe.exec(content)) !== null) {
                    pageSetupScripts.push(setupMatch[0])
                  }

                  // Strip the signals runtime IIFE — keep only page-specific scripts
                  fragment = fragment.replace(
                    /<script data-stx-scoped>\s*;?\(function\(\)\s*\{[\s\S]*?<\/script>/g,
                    '',
                  )

                  // Clear stale _latestSetup from previous page, then append new page scripts
                  const clearStale = '<script data-stx-page>if(window.stx)window.stx._latestSetup=null;</script>'
                  fragment = `${headStyles.join('\n')}\n${fragment}\n${clearStale}\n${pageSetupScripts.join('\n')}`

                  return new Response(fragment, {
                    headers: {
                      'Content-Type': 'text/html; charset=utf-8',
                      'X-STX-Fragment': 'true',
                      'X-STX-Layout': pageLayout,
                      'X-STX-Layout-Group': pageLayoutGroup,
                      'Cache-Control': 'no-store',
                      ...corsHeaders,
                    },
                  })
                }
                // Strip duplicate signals runtime IIFEs from @extends pages.
                // The layout and page each generate a runtime — only the first is needed.
                // Match the IIFE by its unique start: (function(){'use strict';var cloakStyle
                // The code uses </scr'+'ipt> internally, so the first literal </script> is the real end.
                let cleaned = content
                let runtimeCount = 0
                cleaned = content.replace(
                  /<script data-stx-scoped>\(function\(\)\{'use strict';var cloakStyle[\s\S]*?<\/script>/g,
                  (match) => {
                    runtimeCount++
                    return runtimeCount === 1 ? match : '' // keep first, drop duplicates
                  },
                )
                return new Response(injectHmrClient(cleaned), {
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store',
                    ...corsHeaders,
                  },
                })
              }

              // Try without extension
              const contentWithExt = await getRoute(`${path}.html`)
              if (contentWithExt) {
                return new Response(injectHmrClient(contentWithExt), {
                  headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store',
                    ...corsHeaders,
                  },
                })
              }

              // Try to serve build artifacts (chunk files, CSS, etc.) from .stx
              if (path.startsWith('/chunk-') || path.endsWith('.js') || path.endsWith('.css')) {
                try {
                  const buildFile = Bun.file(`.stx${path}`)
                  if (await buildFile.exists()) {
                    const ext = path.split('.').pop()?.toLowerCase()
                    const contentType = ext === 'css' ? 'text/css' : ext === 'js' ? 'application/javascript' : 'text/plain'

                    return new Response(buildFile, {
                      headers: {
                        'Content-Type': contentType,
                        'Cache-Control': 'no-store', // Build artifacts change during dev
                      },
                    })
                  }
                }
                catch {
                  // Continue to other handlers
                }
              }

              // Smart asset serving - Laravel-style path resolution
              // Supports both /assets/* and /resources/assets/* paths
              if (path.startsWith('/assets/') || path.startsWith('/resources/assets/')) {
                // Ensure assets are copied on first request
                await ensureAssets()
                let assetPathname: string
                try {
                  assetPathname = decodeURIComponent(path)
                }
                catch {
                  return new Response('Invalid asset path', { status: 400 })
                }

                if (!isSafeAssetPath(assetPathname))
                  return new Response('Invalid asset path', { status: 400 })

                for (const assetPath of assetRequestPaths(assetPathname)) {
                  try {
                    const filePath = nodePath.resolve(process.cwd(), `.${assetPath}`)
                    const file = Bun.file(filePath)

                    if (await file.exists()) {
                      // Determine content type based on file extension
                      const ext = getAssetExtension(assetPath)

                      if (isBundledAssetExtension(ext))
                        return bundleBrowserAsset(filePath)

                      return new Response(file, {
                        headers: {
                          'Content-Type': staticContentTypes[ext || ''] || 'application/octet-stream',
                          // Dev mode: `no-cache` not `max-age=31536000`. The previous year-long
                          // cache header forced users to hard-reload (Cmd+Shift+R) after every
                          // edit to a stylesheet / asset under `resources/assets/` — the server
                          // re-read the source file on each request, but the browser served the
                          // stale copy from disk cache without revalidating. The build path (in
                          // `build-views.ts` / SSG) is what stamps long-lived cache headers on
                          // production output; the dev server should never set them.
                          'Cache-Control': 'no-store',
                        },
                      })
                    }
                  }
                  catch {
                    // Continue to next path
                    continue
                  }
                }
              }

              // Static files from publicDir (Nuxt/Vite/Next/Astro convention).
              // Anything under publicDir is served at the corresponding URL path:
              //   public/images/hero.jpg → GET /images/hero.jpg
              //   public/robots.txt      → GET /robots.txt
              //   public/favicon.ico     → GET /favicon.ico
              //
              // This runs after API routes and the /assets/* legacy handler but
              // BEFORE the page router and 404 fallback, so a public file can never
              // shadow a stx page (e.g. public/about.html doesn't override pages/about.stx
              // because the page handler runs first elsewhere — this fires only when
              // no page matched).
              if ((req.method === 'GET' || req.method === 'HEAD') && path !== '/') {

                const publicRoot = nodePath.resolve(process.cwd(), publicDir)
                // Decode URI components (e.g. %20 → space) and reject embedded NULs
                let safePathname: string
                try {
                  safePathname = decodeURIComponent(path)
                }
                catch {
                  safePathname = path
                }
                if (!safePathname.includes('\0')) {
                  // Resolve and verify the result is still inside publicRoot.
                  // path.resolve normalizes .. segments before the prefix check, which
                  // is the standard defense against directory traversal.
                  const resolvedPath = nodePath.resolve(publicRoot, `.${safePathname}`)
                  const isInsidePublicRoot = resolvedPath === publicRoot
                    || resolvedPath.startsWith(`${publicRoot}${nodePath.sep}`)

                  if (isInsidePublicRoot) {
                    try {
                      const file = Bun.file(resolvedPath)
                      if (await file.exists()) {
                        // Skip directories (Bun.file().exists() returns true for dirs in some versions)
                        const stat = await file.stat().catch(() => null)
                        if (stat && !stat.isDirectory()) {
                          const ext = resolvedPath.split('.').pop()?.toLowerCase()
                          return new Response(file, {
                            headers: {
                              'Content-Type': staticContentTypes[ext || ''] || 'application/octet-stream',
                              // Dev mode: `no-cache` so edits to anything in publicDir
                              // (favicons, hero images, robots.txt, fonts during a redesign)
                              // appear on the next normal reload. The previous `max-age=3600`
                              // meant up to an hour of stale assets after a swap. Production
                              // builds copy public/ to dist/ where a CDN stamps long caching.
                              'Cache-Control': 'no-store',
                            },
                          })
                        }
                      }
                    }
                    catch {
                      // File read failed — fall through to 404
                    }
                  }
                }
              }

              // /favicon.ico fallback — only fires if publicDir didn't have it.
              // Returns 204 instead of 404 so browsers stop nagging the dev server
              // when no favicon is configured.
              if (path === '/favicon.ico') {
                return new Response(null, { status: 204 })
              }

              // 404 page - discover files to show available routes
              const files = await discoverFiles()
              const availableRoutes: string[] = []

              for (const filePath of files) {
                // Normalize and create route from file path
                let normalizedPath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

                // For absolute paths, extract relative portion from patterns
                for (const pattern of patterns) {
                  const normalizedPattern = pattern.replace(/\\/g, '/').replace(/\/$/, '')
                  if (normalizedPath.startsWith(`${normalizedPattern}/`)) {
                    normalizedPath = normalizedPath.slice(normalizedPattern.length + 1)
                    break
                  }
                }

                // Strip extension and 'pages/' prefix for cleaner route display
                let route = normalizedPath.replace(/\.(stx|md|html)$/, '')
                if (route.startsWith('pages/')) {
                  route = route.slice(6) // Remove 'pages/' prefix
                }

                availableRoutes.push(`<li><a href="/${route}">/${route}</a></li>`)
              }

              const routesList = availableRoutes.join('\n')

              return new Response(injectHmrClient(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>404 - Not Found</title>
            <style>
              body {
                font-family: system-ui, sans-serif;
                max-width: 800px;
                margin: 4rem auto;
                padding: 2rem;
                text-align: center;
              }
              h1 { color: #e53e3e; }
              ul { list-style: none; padding: 0; margin: 2rem 0; }
              li { margin: 0.5rem 0; }
              a { color: #667eea; text-decoration: none; font-size: 1.1rem; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <h1>404 - Page Not Found</h1>
            <p>The page "${path}" doesn't exist.</p>
            <h2>Available pages:</h2>
            <ul>${routesList}</ul>
          </body>
        </html>
      `), {
                status: 404,
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
              })

            }
            finally {
              activeServeLocale = null
              activeServeSearch = ''
            }
          })() // ─── end IIFE — single exit for translation post-process
          return applyI18nToResponse(_i18nResp, i18nLocale ?? (i18nConfig?.defaultLocale ?? 'en'), path)
        },
      })
      break
    }
    catch (err) {
      lastServeError = err
      const code = (err as { code?: string } | null)?.code
      const message = String((err as { message?: string } | null)?.message ?? err ?? '')
      const portConflict = code === 'EADDRINUSE'
        || /EADDRINUSE/i.test(message)
        || /port \d+ (?:is |already )?in use/i.test(message)
        || /Failed to start server\. Is port \d+ in use\?/i.test(message)
      if (portConflict && attempt < maxPortAttempts - 1) {
        actualPort += 1
        continue
      }
      throw err
    }
  }
  if (!_server) {
    const tried = maxPortAttempts === 1
      ? `port ${port}`
      : `ports ${port}..${port + maxPortAttempts - 1}`
    console.error(`\x1b[31m[stx]\x1b[0m no free port available (tried ${tried}).`)
    console.error(`\x1b[2m       set autoIncrementPort to a larger value, or free the port (lsof -nP -i :${port})\x1b[0m`)
    throw lastServeError ?? new Error(`stx serve: no free port in range ${port}..${port + maxPortAttempts - 1}`)
  }
  if (actualPort !== port && !options.quiet) {
    console.warn(`\x1b[33m[stx]\x1b[0m port ${port} in use — using \x1b[1m${actualPort}\x1b[0m instead`)
  }

  // Print Bun-style startup banner
  if (!options.quiet) {
    const elapsed = (performance.now() - startTime).toFixed(0)
    const routeCount = (sourceFiles as string[] | null)?.length || 0
    const patternsStr = patterns.join(', ')

    console.log()
    console.log(`  \x1b[36m\x1b[1mstx\x1b[0m`)
    console.log()
    console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal\x1b[0m:   \x1b[36mhttp://localhost:${actualPort}/\x1b[0m`)
    console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mRoutes\x1b[0m:  \x1b[2m${routeCount} files from ${patternsStr}\x1b[0m`)
    console.log()
    console.log(`  \x1b[2mready in ${elapsed}ms\x1b[0m`)
    console.log()
    console.log(`  \x1b[2mPress\x1b[0m o + Enter \x1b[2mto open in browser\x1b[0m`)
    console.log(`  \x1b[2mPress\x1b[0m q + Enter \x1b[2mto quit\x1b[0m`)
    console.log()

    // Interactive keyboard shortcuts (like Bun's HTML dev server)
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false)
      const rl = await import('node:readline')
      const reader = rl.createInterface({ input: process.stdin })
      reader.on('line', (line: string) => {
        const cmd = line.trim().toLowerCase()
        if (cmd === 'o') {
          const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
          Bun.spawn([openCmd, `http://localhost:${actualPort}/`])
        }
        else if (cmd === 'q') {
          process.exit(0)
        }
      })
    }
  }

  // Keep the process running
  await Bun.sleep(Number.POSITIVE_INFINITY)
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2)

  // Remove 'serve' if it's the first argument (for compatibility)
  if (args[0] === 'serve') {
    args.shift()
  }
  const portIndex = args.indexOf('--port')
  const port = portIndex !== -1 && args[portIndex + 1] ? Number.parseInt(args[portIndex + 1]) : 3456

  // Get file patterns (everything that's not a flag)
  const patterns = args.filter(arg => !arg.startsWith('--') && arg !== args[portIndex + 1])

  // Call the exported serve function
  await serve({ patterns, port })
}

// Only run main() if this file is being executed directly (not imported)
if (import.meta.main) {
  main().catch(console.error)
}
