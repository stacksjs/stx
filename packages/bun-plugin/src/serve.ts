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

import type { CrosswindConfig } from '@cwcss/crosswind'
import type { SQLQueryBindings } from 'bun:sqlite'
import { serve as bunServe, Glob } from 'bun'
import { existsSync, watch as fsWatch, statSync } from 'node:fs'
import nodeFs from 'node:fs/promises'
import nodePath from 'node:path'
import process from 'node:process'
import { loadConfig } from 'bunfig'
import { BUILD_ID_HEADER, extractPageResponseStatus, findContainerRegion, FRAGMENT_CACHE_CONTROL, getBuildId, mergeCrosswindConfig, readResponseHeaders, readResponseStatus, SPA_NAV_HEADER, spaNavVaryHeaders, stateDir, stateDirName } from '@stacksjs/stx'
import { buildCodeFrame, locateFailureLine } from '@stacksjs/stx/build-message'
import { clearBundleFailures, getBundleFailures } from '@stacksjs/stx/client-script-bundler'
import { extractLayoutMetadata } from 'stx-router/layout-metadata'
import { actionRedirectResponse, compressResponse, runPageAction as sharedRunPageAction } from '@stacksjs/stx'

/**
 * A bundle failure on its way to the dev-server overlay (#1884 ask 2).
 *
 * Carries the position separately from the message so the overlay can draw the
 * code frame the issue asks for, rather than re-parsing a rendered string.
 */
interface BuildErrorPayload {
  file?: string
  line?: number
  column?: number
  message: string
  frame: Array<{ number: number, text: string, isError: boolean }>
}

/**
 * The slice of Crosswind this server calls, taken from the package's own types
 * rather than restated here.
 *
 * `CSSGenerator` has to be a constructor type, because it is `new`-ed below.
 * Widening it to `unknown` satisfies the no-explicit-any rule and still fails to
 * compile (`new (unknown)` is TS18046) — that is how d84349dd74 turned main red.
 * Restating the shape by hand is the other trap: a stale hand-written copy is
 * what made this hard to see in the first place (see the deleted
 * `cwcss-crosswind.d.ts`). `typeof import` cannot drift from the real engine.
 */
type CrosswindEngine = Pick<typeof import('@cwcss/crosswind'), 'CSSGenerator' | 'config'>

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

// Reactive-directive attributes whose `<template>` wrappers must SURVIVE the
// SFC template-stripping below. These templates are the sibling chain the
// signals runtime walks at runtime (findIfChain/bindIfChain for conditionals,
// bindFor for loops), so stripping them breaks client reactivity.
//
// `@else` also matches `@else-if`; `:else` matches `:else-if`; `x-else` matches
// `x-else-if`. The else forms MUST be here: `convertSignalDirectivesToAttributes`
// emits `<template @else>` / `<template @else-if>` as part of an `@if` chain, and
// the stripper keeps every `</template>` unconditionally — so omitting the else
// forms stripped the `<template @else>` OPENING while keeping its `</template>`,
// leaving unbalanced markup. A full page load hides it (the browser drops the
// orphan close tag), but the SPA router's innerHTML swap reproduces it verbatim,
// nesting a second `<main>` inside the container and aborting the view
// transition. See #1784. Kept as one source of truth so the two strip sites
// below can't drift (the drift is what caused #1784).
const REACTIVE_TEMPLATE_DIRECTIVE_RE = /@for|:for|@if|:if|@else|:else|x-for|x-if|x-else/

/**
 * Extract real top-level `<script server>` elements without matching tag-like
 * text inside HTML comments or another script body. A regex over the whole
 * template mistakes documentation such as `// moved from <script server>` in
 * a client script for a nested server block, then removes the rest of that
 * client script through its closing tag.
 */
export function extractServerScriptsFromTemplate(content: string): {
  serverScripts: string[]
  templateContent: string
} {
  const openRe = /<script\b([^>]*)>/gi
  const lower = content.toLowerCase()
  const serverScripts: string[] = []
  const retained: string[] = []
  let retainedFrom = 0
  let cursor = 0

  while (cursor < content.length) {
    openRe.lastIndex = cursor
    const match = openRe.exec(content)
    if (!match) break

    const commentStart = content.indexOf('<!--', cursor)
    if (commentStart !== -1 && commentStart < match.index) {
      const commentEnd = content.indexOf('-->', commentStart + 4)
      if (commentEnd === -1) break
      cursor = commentEnd + 3
      continue
    }

    const bodyStart = match.index + match[0].length
    const closeStart = lower.indexOf('</script>', bodyStart)
    if (closeStart === -1) break
    const end = closeStart + '</script>'.length

    if (/\bserver\b/i.test(match[1])) {
      retained.push(content.slice(retainedFrom, match.index))
      serverScripts.push(content.slice(bodyStart, closeStart))
      retainedFrom = end
    }

    cursor = end
  }

  retained.push(content.slice(retainedFrom))
  return { serverScripts, templateContent: retained.join('') }
}

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
/**
 * Snapshot of the in-flight request, threaded from the fetch handler down to
 * the `<script server>` render (stacksjs/stacks#1967).
 *
 * The module-level `activeServe*` singletons are NOT safe to read at render
 * time: a render can suspend at an `await` (onRequest hooks, DB queries in
 * server scripts) while a concurrent request — the HMR EventSource opens on
 * every page load — runs its own handler and resets the singletons in its
 * `finally`. Threading an immutable per-request snapshot removes that race;
 * the singletons remain only as a fallback for legacy call sites.
 */
export interface ServeRequestContext {
  /** Full request URL (`req.url`). */
  url: string
  /** Normalized request path (no query string). */
  path: string
  /** Query string including the leading `?`, or `''`. */
  search: string
  /** `Host` header, or `''`. */
  host: string
  /** Raw `Cookie` header, or `''`. */
  cookieHeader: string
  /** Parsed cookies — always an object. */
  cookies: Record<string, string>
  /** Best-effort client IP, or `''`. */
  ip: string
  /** Active locale for the SSR pass, when i18n is enabled. */
  locale: string | null
  /** Dynamic route params (`[id].stx` → `{ id }`) — set by the dynamic-route renderer. */
  params: Record<string, string>
  /** Uppercased HTTP method (`GET`, `POST`, …). */
  method: string
  /**
   * The live Request, for a page action to read its own form body.
   *
   * Deliberately the Request and not a pre-parsed body: reading the body
   * consumes it, and most requests never reach a page action at all. The parse
   * happens in `runPageAction`, only once an `action` is known to exist.
   */
  request?: Request
  /** Static HTTP response status declared by the matched page. */
  responseStatus?: number
  /**
   * Headers the page set while rendering, via `setResponseHeader`.
   *
   * Beside `responseStatus` rather than folded into it, because they are set
   * by the same kind of decision and have to travel together: a page that
   * answers 301 has said nothing useful until a `Location` goes with it.
   */
  responseHeaders?: Record<string, string>
  /**
   * Set by a page action that returned a redirect. The serve turns this into a
   * 303 See Other, which is what a POST must answer with so the browser follows
   * up with a GET and a reload does not resubmit.
   */
  actionRedirect?: string
  /**
   * `Set-Cookie` values a page action asked for (stacksjs/stx#1927).
   *
   * Attached to whichever response the request produces — the 303 on the
   * redirect path AND the re-rendered page on the validation-failure path, so
   * a session cookie is not set on success only.
   */
  actionCookies?: string[]
  /** Extra keys merged from a non-Response `onRequest` return (app-owned). */
  [key: string]: unknown
}

/**
 * The cookie name a double-submit CSRF check reads.
 *
 * Spelled here rather than imported, because stx does not depend on whatever
 * framework is doing the checking - it only has to agree on the name, and this
 * is the name every double-submit implementation in this ecosystem uses.
 */
export const CSRF_COOKIE = 'X-CSRF-Token'

/**
 * A token to mint for this request, or null to leave it alone.
 *
 * Safe methods only, and only when the request carries none already: anything
 * else is somebody's live session, and rotating their token mid-flight would
 * reject the very form they are about to submit.
 */
export function csrfTokenToMint(req: Request, cookies: Record<string, string>): string | null {
  const method = (req.method || 'GET').toUpperCase()
  if (method !== 'GET' && method !== 'HEAD')
    return null

  if (cookies[CSRF_COOKIE] || cookies['csrf-token'])
    return null

  // Only for a document request. A stylesheet or an image has no forms in it,
  // and minting on every asset would hand out a new token per request while
  // the page that matters embedded an older one.
  const accept = req.headers.get('accept') || ''
  if (accept && !accept.includes('text/html') && !accept.includes('*/*'))
    return null

  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)

  return [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

/** The `Set-Cookie` value for a minted token. Readable by script, as double-submit requires. */
export function csrfCookieHeader(token: string, secure: boolean): string {
  return [
    `${CSRF_COOKIE}=${token}`,
    'Path=/',
    'SameSite=Lax',
    'Max-Age=7200',
    secure ? 'Secure' : null,
  ].filter(Boolean).join('; ')
}

export function buildDynamicRouteRegexes(fileRouteBase: string): RegExp[] {
  // Catch-all first: `[...path]` has to become a group that spans separators,
  // and the ordinary rule below would otherwise turn it into `([^/]+)` - which
  // silently makes every multi-segment URL a 404.
  const toPattern = (p: string): string => p
    .replace(/\[\.\.\.([^\]]+)\]/g, '(.+)')
    .replace(/\[([^\]]+)\]/g, '([^/]+)')
    .replace(/\//g, '\\/')

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

/**
 * Rank a dynamic route file by specificity so the resolver can order candidates
 * most-specific-first and never let a catch-all (`[...x]`) or a broad `[param]`
 * shadow a more specific route (stacksjs/stx#1837).
 *
 * `discoverFiles` returns Bun glob order — where the catch-all frequently lands
 * first — and `getRoute` takes the FIRST regex match. Without ordering, `/foo/15`
 * matched `[...all].stx` (`^(.+)$`) before `foo/[id].stx`, so every dynamic
 * detail route 404'd. Higher score = more specific = tried first:
 *   - static segment       → +100   (strongly preferred)
 *   - `[param]` segment     →   +1   (weakly preferred)
 *   - `[...rest]` catch-all → -10000 (always last)
 */
export function routeSpecificity(fileRouteBase: string): number {
  const segments = fileRouteBase
    .replace(/^\.\//, '')
    .replace(/\\/g, '/')
    .replace(/\.(stx|md|html)$/, '')
    .split('/')
  let score = 0
  for (const segment of segments) {
    if (/\[\.\.\./.test(segment))
      score -= 10000
    else if (segment.includes('['))
      score += 1
    else
      score += 100
  }
  return score
}

/**
 * True when a request path is for a STATIC ASSET (a non-page file extension like
 * `.jpg`/`.css`/`.js`) rather than a page. Used so a catch-all page can never
 * shadow an asset request that publicDir should serve — `getRoute` runs before
 * the publicDir handler (stacksjs/stx#1841). Page extensions (`.stx`/`.md`/
 * `.html`) return false; those are routable.
 */
export function isStaticAssetPath(requestPath: string): boolean {
  return /\.[a-z0-9]+$/i.test(requestPath) && !/\.(?:stx|md|html)$/i.test(requestPath)
}

/**
 * Does a file actually exist under `publicDir` for this request path?
 *
 * The extension test above is a guess about intent, and it is the wrong
 * question to ask before dropping a catch-all: an app whose catch-all
 * legitimately serves paths that carry extensions - a file browser, a docs
 * site addressing `guide.md`, anything rendering a repository - has every
 * such page refused, because the guess says "asset" and the only route that
 * could answer is the one being dropped.
 *
 * Asking the disk instead keeps what stacksjs/stx#1841 was protecting (a real
 * `public/images/logo.jpg` still wins over `[...all].stx`) and costs one stat
 * on a path that was going to be looked up moments later anyway.
 *
 * Traversal is normalized before the prefix check, the same way the publicDir
 * handler does it, so `..` cannot walk out of the root and report on a file
 * that is none of the caller's business.
 */
export function publicFileExists(requestPath: string, publicDir: string): boolean {
  let decoded: string
  try {
    decoded = decodeURIComponent(requestPath)
  }
  catch {
    decoded = requestPath
  }

  if (decoded.includes('\0'))
    return false

  const publicRoot = nodePath.resolve(process.cwd(), publicDir)
  const resolved = nodePath.resolve(publicRoot, `.${decoded}`)
  const inside = resolved === publicRoot || resolved.startsWith(`${publicRoot}${nodePath.sep}`)
  if (!inside)
    return false

  try {
    return existsSync(resolved) && !statSync(resolved).isDirectory()
  }
  catch {
    return false
  }
}

/**
 * Escape a string for safe interpolation into HTML text/attribute context.
 * Used so a crafted request path can't inject markup into the 404 page
 * (reflected-XSS guard).
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Are we serving in production? In production the built-in 404 must not
 * enumerate the app's route list (information disclosure) and must not
 * inject the HMR client.
 *
 * Reuses the standard Stacks/Node signals — `NODE_ENV` / `APP_ENV`. serve.ts
 * has no pre-existing prod/dev flag threaded through its options, so these
 * env vars are the canonical signal (the same ones the wider stacks codebase
 * keys production behaviour off of).
 *
 * Safe by default: the browsable route list is a development-only affordance,
 * so we only treat a serve as development when it is EXPLICITLY marked so
 * (`development`/`dev`/`local`/`test`). A served app with no env configured —
 * the easy-to-hit misconfiguration — is therefore treated as production and
 * does NOT leak its route list. Local `buddy dev` already runs with
 * `NODE_ENV=development`, so it keeps the helpful list.
 */
export function isProductionServe(): boolean {
  const node = (process.env.NODE_ENV || '').toLowerCase()
  const app = (process.env.APP_ENV || '').toLowerCase()
  const devEnvs = new Set(['development', 'dev', 'local', 'test', 'testing'])
  return !(devEnvs.has(node) || devEnvs.has(app))
}

/**
 * `Cache-Control` for a file served straight out of `publicDir`.
 *
 * Development says `no-store`, so a swapped favicon or hero image appears on
 * the next reload rather than an hour later.
 *
 * Production does not: this server IS production for a server-rendered deploy,
 * with no CDN in front stamping cache headers on the way past. Sending
 * `no-store` there told every browser, proxy and link-preview crawler to
 * re-fetch every image on every request, and made messengers that cache a
 * preview by its headers throw the card away.
 *
 * An hour for ordinary assets, because they are replaced in place by a deploy
 * and a share card that changed with a copy edit should not be stale for a
 * year. A fingerprinted name (a content hash in it) can never change under a
 * given URL, so it gets the long immutable lifetime.
 */
export function staticCacheControl(pathname: string, production: boolean = isProductionServe()): string {
  if (!production)
    return 'no-store'

  const fingerprinted = /[.-][0-9a-f]{8,}\.[a-z0-9]+$/i.test(pathname)
  return fingerprinted ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
}

/**
 * Render the built-in fallback 404 page.
 *
 * - In development (`isProduction: false`) it lists the discovered routes as
 *   clickable links — a genuinely useful dev affordance — and reflects the
 *   requested path (HTML-escaped).
 * - In production (`isProduction: true`) it renders a clean, neutral, self-
 *   contained page with NO route list and NO reflected path, so nothing about
 *   the app's internal structure leaks to anonymous visitors.
 *
 * The page is a complete HTML document, styled inline (system font stack,
 * centered, light + dark via `prefers-color-scheme`, no external assets).
 * The caller is responsible for HMR injection (dev only) and the 404 status.
 */
export function render404Page(opts: {
  path: string
  routes?: string[]
  isProduction: boolean
}): string {
  const { path, routes = [], isProduction } = opts

  const baseStyles = `
      *, *::before, *::after { box-sizing: border-box; }
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        background: #ffffff;
        color: #1a202c;
        line-height: 1.5;
      }
      main { max-width: 32rem; width: 100%; text-align: center; }
      .code { font-size: 3.5rem; font-weight: 700; letter-spacing: -0.02em; margin: 0; }
      h1 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
      p { margin: 0.5rem 0; color: #4a5568; }
      a { color: #4a5568; }
      .home {
        display: inline-block;
        margin-top: 1.5rem;
        padding: 0.6rem 1.25rem;
        border-radius: 0.5rem;
        background: #1a202c;
        color: #ffffff;
        text-decoration: none;
        font-weight: 500;
        font-size: 0.95rem;
      }
      .home:hover { opacity: 0.85; }
      @media (prefers-color-scheme: dark) {
        body { background: #0f1115; color: #e2e8f0; }
        p { color: #a0aec0; }
        a { color: #a0aec0; }
        .home { background: #e2e8f0; color: #0f1115; }
      }`

  if (isProduction) {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>404 - Page Not Found</title>
    <style>${baseStyles}
    </style>
  </head>
  <body>
    <main>
      <p class="code">404</p>
      <h1>Page not found</h1>
      <p>The page you're looking for doesn't exist or may have moved.</p>
      <a class="home" href="/">Go to homepage</a>
    </main>
  </body>
</html>`
  }

  // Development: keep the helpful, browsable route list.
  const routesList = routes
    .map(route => `<li><a href="/${escapeHtml(route)}">/${escapeHtml(route)}</a></li>`)
    .join('\n            ')

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 - Not Found</title>
    <style>${baseStyles}
      main { max-width: 40rem; }
      .routes { list-style: none; padding: 0; margin: 2rem 0 0; text-align: left; }
      .routes li { margin: 0.35rem 0; }
      .routes a { color: #667eea; text-decoration: none; font-size: 1.05rem; }
      .routes a:hover { text-decoration: underline; }
      .dev-note { font-size: 0.85rem; margin-top: 1.5rem; opacity: 0.7; }
      @media (prefers-color-scheme: dark) { .routes a { color: #9aa8ff; } }
    </style>
  </head>
  <body>
    <main>
      <p class="code">404</p>
      <h1>Page not found</h1>
      <p>The page "${escapeHtml(path)}" doesn't exist.</p>
      <h2 style="font-size:1rem;margin-top:2rem;">Available pages</h2>
      <ul class="routes">${routesList ? `\n            ${routesList}\n          ` : ''}</ul>
      <p class="dev-note">This route list is shown in development only.</p>
    </main>
  </body>
</html>`
}

/**
 * A cache that forgets its coldest entry rather than growing forever.
 *
 * A plain `Map` iterates in insertion order, so deleting and re-inserting a key
 * on every read moves it to the end - which makes the first key the least
 * recently used one, and the whole of an LRU three lines long.
 *
 * Exported because the behaviour is worth testing without standing a server
 * up, the same reason `isRenderableCacheCandidate` is.
 */
export function boundedCache<T>(limit: number): {
  read: (key: string) => T | undefined
  remember: (key: string, value: T) => T
  clear: () => void
  readonly size: number
} {
  const entries = new Map<string, T>()
  // A limit below one would evict what was just written, so every read misses
  // and the cache costs memory and time to hold nothing.
  const ceiling = Math.max(1, Math.floor(limit))

  return {
    read(key) {
      const hit = entries.get(key)

      if (hit === undefined)
        return undefined

      entries.delete(key)
      entries.set(key, hit)

      return hit
    },
    remember(key, value) {
      entries.delete(key)
      entries.set(key, value)

      while (entries.size > ceiling) {
        const coldest = entries.keys().next().value

        if (coldest === undefined)
          break

        entries.delete(coldest)
      }

      return value
    },
    clear() {
      entries.clear()
    },
    get size() {
      return entries.size
    },
  }
}

export interface ServeOptions {
  patterns: string[]
  port?: number
  /**
   * Initial same-origin path opened by the `o + Enter` browser shortcut.
   * Defaults to `/`.
   */
  openPath?: string
  componentsDir?: string
  layoutsDir?: string
  /**
   * Layouts to fall back to when `layoutsDir` does not have the one a page
   * asks for, so a framework can ship defaults an app overrides by name.
   *
   * Stacks has been passing this since the views server was written; until
   * stx honoured it, it did nothing, and every page extending a framework
   * layout served a 200 with an empty body.
   */
  fallbackLayoutsDir?: string
  /** Where to look for a component `componentsDir` does not have. */
  fallbackComponentsDir?: string
  partialsDir?: string
  /**
   * Additional source directories that can affect rendered HTML.
   *
   * The server already watches pages, components, layouts, partials, public
   * assets, and `resources/assets`. Add application-specific roots here when
   * server scripts or client bundles read code or data elsewhere, such as
   * `functions/`, `stores/`, or a generated manifest directory.
   */
  watchDirs?: string[]
  /**
   * Cache rendered static routes between requests.
   *
   * Cache entries vary by the complete request context and are invalidated by
   * dependency signatures plus source watchers. Dynamic file routes and pages
   * that call `definePageMeta({ cache: false })` remain uncached.
   *
   * Default: `false`.
   */
  renderCache?: boolean
  /**
   * Choose what separates rendered cache entries.
   *
   * `request` varies by the complete request context and is the safe default
   * for server-rendered pages. `source` uses one entry per route file and is
   * intended for source-derived shells whose live data loads on the client.
   */
  renderCacheVary?: 'request' | 'source'

  /**
   * How many class sets' worth of generated CSS to keep. Defaults to 512.
   *
   * The cache is keyed by the class set of the *rendered page*, so a site
   * whose markup carries content-derived classes - a state pill, a label, a
   * language - produces a new entry per distinct combination. Unbounded, that
   * is a slow leak on any long-running server with real traffic; the limit
   * turns it into a working set. Raise it on a site with a lot of genuinely
   * different pages and a lot of memory.
   */
  crosswindCacheLimit?: number
  /**
   * Render every discovered static route in the background after startup.
   *
   * Requires `renderCache: true`. Pass a positive number to control worker
   * concurrency, or `true` for the default of four workers.
   */
  prewarmRenderCache?: boolean | number
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
   * Bind the listening socket with `SO_REUSEPORT` (Linux), letting a new
   * server instance share the port with one that's already serving — the
   * overlap zero-downtime deploy cutovers rely on (start new release,
   * health-gate it, stop old). Passed straight through to `Bun.serve`.
   * Pair with `autoIncrementPort: false` in production so a bind that
   * can't be shared fails loudly instead of drifting to another port.
   *
   * Default: `false`.
   */
  reusePort?: boolean
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
   * The runtime awaits the return and only short-circuits on a `Response`,
   * so both sync and async null/undefined behave identically.
   *
   * Returning a plain object instead merges it into the per-request context
   * that `<script server>` blocks see as `__stxServeContext` (and that is
   * mirrored on `globalThis.__stxServeContext` during the render). This is
   * the race-free channel for frameworks that authenticate/localize in
   * `onRequest` and need that state visible to server scripts — plain
   * globals set inside the hook can be clobbered by concurrent requests,
   * and AsyncLocalStorage `enterWith()` does not survive the hook's await
   * boundary (stacksjs/stacks#1967).
   */
  onRequest?: (req: Request) =>
  | Response
  | Record<string, unknown>
  | null
  | undefined
  | Promise<Response | Record<string, unknown> | null | undefined>

  /**
   * Custom response handler, run once on the finished response — the mirror
   * of `onRequest`, and the only place a caller can touch a response the
   * server itself produced (a rendered page, a static asset, a 404).
   *
   * Return a `Response` to replace it, or nothing to leave it alone.
   *
   * `onRequest` cannot do this job: returning a Response there *short-circuits*
   * the pipeline, so a hook that only wants to attach a header would have to
   * re-implement page rendering to get a response to attach it to. The
   * motivating case is a framework seeding a CSRF double-submit cookie on safe
   * requests — the token has to ride the HTML response that the form lives in,
   * so without this hook the page ships with no token and its first POST is
   * rejected by the framework's own CSRF check.
   *
   * @example
   * ```ts
   * serve({
   *   onResponse(req, res) {
   *     if (req.method === 'GET')
   *       res.headers.append('Set-Cookie', `X-CSRF-Token=${token}; Path=/; SameSite=Lax`)
   *   },
   * })
   * ```
   */
  onResponse?: (req: Request, response: Response) =>
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

export function resolveServeOpenUrl(port: number, openPath = '/'): string {
  const baseUrl = `http://localhost:${port}`

  try {
    const url = new URL(openPath || '/', `${baseUrl}/`)
    return url.origin === baseUrl ? url.toString() : `${baseUrl}/`
  }
  catch {
    return `${baseUrl}/`
  }
}

/**
 * Did rendering fail?
 *
 * processDirectives swallows a template error and returns an HTML comment as
 * the entire document. That was then served with the page's own status — 200 —
 * so a broken page looked healthy to every uptime check, CDN and browser cache
 * that saw it, and the only evidence was a comment in a blank page
 * (stacksjs/stx#1854).
 *
 * Both other stx servers already get this right: production-server.ts looks up
 * a /500 route and dev-server/serve-app.ts calls renderErrorPage(500).
 */
export function isRenderFailure(html: string): boolean {
  return html.includes('<!-- Template Processing failed:')
    || html.includes('<!-- stx rendering error -->')
}

export function isRenderableCacheCandidate(html: string): boolean {
  return !isRenderFailure(html)
}

/**
 * A rendered /500 page is usable as an error body only if it exists and did not
 * ITSELF fail to render — otherwise serving it swaps one blank failure comment
 * for another. Returns the page to serve, or null to fall through to the next
 * candidate / the marker body (#1854).
 */
export function usableErrorPage(rendered: string | null): string | null {
  return rendered && !isRenderFailure(rendered) ? rendered : null
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
  /*
   * The web app manifest, which is JSON under its own type.
   *
   * `.webmanifest` is the extension the spec names and the one every icon
   * generator writes, and without an entry here it was served as
   * `application/octet-stream` - which Chrome complains about in the console
   * and Firefox refuses outright, so an installable page quietly stops being
   * one.
   */
  webmanifest: 'application/manifest+json',
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
    minify: true,
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
  const production = isProductionServe()

  // Resolve `root` and the template directories through stx's own single
  // resolution pass (#1851). bunfig hands back the RAW object, and this path
  // used to consume the literal strings while `loadStxConfig` inferred a root
  // and prefixed the same keys with it — so `partialsDir: 'resources/partials'`
  // meant `resources/partials` here and `resources/resources/partials` on the
  // build path. Silent at 200 OK: the include just failed and its error text
  // was rendered into the page.
  try {
    const stxMod = options.stxModule ? options.stxModule : await defaultStxModule
    if (stxMod && typeof (stxMod as any).resolveStxDirectories === 'function')
      (stxMod as any).resolveStxDirectories(stxConfig, process.cwd())
  }
  catch { /* best-effort — fall through with the raw object */ }

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
  const fallbackLayoutsDir = options.fallbackLayoutsDir ?? stxConfig.fallbackLayoutsDir
  const fallbackComponentsDir = options.fallbackComponentsDir ?? stxConfig.fallbackComponentsDir
  const partialsDir = options.partialsDir ?? stxConfig.partialsDir ?? defaultStxConfig.partialsDir
  const publicDir = options.publicDir ?? stxConfig.publicDir ?? 'public'

  // Derive image placeholders for <StxImage>, which reads them synchronously
  // because a builtin renders in a synchronous pass. Two things have to be true
  // at once, and the obvious ordering gets one of them wrong each way:
  //
  //   - Nothing may be RENDERED before this finishes, or the page ships the
  //     flat-grey fallback. On a CDN-fronted site that is worse than it sounds:
  //     the grey copy is what gets cached, for as long as the document TTL.
  //   - The port must BIND immediately. Awaiting a cold derive here cost
  //     trifitla a failed deploy — 114 images took longer than the health
  //     window, systemd reported the unit active, and ts-cloud correctly called
  //     a service that never bound a failure.
  //
  // So: start it now, bind without it, and make the first request wait. After
  // that the promise is already settled and costs nothing. A restart is
  // milliseconds anyway — the derive is cached against mtime and size.
  //
  // The work itself starts AFTER the port is bound, further down. Not awaiting
  // it was not enough: decoding 114 images saturates the loop for long enough
  // that everything still queued behind it in this function — Crosswind, route
  // discovery, the bind itself — simply does not run. The deploy failed the
  // same way twice on that.
  let markPlaceholdersReady: () => void = () => {}
  const placeholdersReady = new Promise<void>((resolve) => {
    markPlaceholdersReady = resolve
  })

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
  /**
   * Narrow shape of the stx module, for the caches a file change invalidates.
   *
   * All three are optional-chained at the call site: an older stx resolves to a
   * module without them and a dev server should degrade to "restart to see that
   * change", not crash. The type listed only `clearDevCaches`, so the two added
   * for #1877 were type errors at every call.
   */
  interface DevCacheModule {
    clearDevCaches?: () => void
    clearStoreCache?: () => void
    clearComposableCache?: () => void
  }

  let resolvedStxModule: DevCacheModule | null = null
  void Promise.resolve(stxModule).then((m) => { resolvedStxModule = m as DevCacheModule }).catch(() => {})

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
    /**
     * The status the render settled on, so a cached hit answers what the
     * uncached render did. A page that calls `setResponseStatus` decides its
     * status inside a server script the cache fast path skips, so without
     * this a "not found" page would be served as 200 the moment it was
     * rendered twice - the kind of bug that only appears under load.
     */
    status: number
    /**
     * And the headers it settled on, for exactly the same reason.
     *
     * The status was cached without them, which is the half-fix that hurts
     * most under load: a redirect rendered once would be replayed with its 301
     * and no `Location`, so the first visitor was sent somewhere and every
     * visitor after them got a broken response.
     */
    headers?: Record<string, string>
  }
  const htmlCache = new Map<string, HtmlCacheEntry>()
  // Opt-in because generic server scripts may read external state that no
  // filesystem watcher can observe. For applications whose static views are
  // source-derived, the signature and watcher invalidation below provide a
  // fast path without weakening HMR.
  const ENABLE_HTML_CACHE = options.renderCache === true
  const RENDER_CACHE_VARY = options.renderCacheVary ?? 'request'
  /*
   * Crosswind-generated CSS, keyed by the page's sorted class set. Lives here
   * for the same reason as `htmlCache`: so the watcher can wipe it on a source
   * edit and pick up a new utility's CSS on the next render.
   *
   * **Bounded**, and that is not a precaution. The key is the *content's*
   * class set, not the template's: a page carrying `search-state-open` and one
   * carrying `search-state-closed` are two entries, as are two repository
   * pages whose pills differ. A public site being walked by a crawler
   * therefore produces effectively unlimited distinct keys, each holding a
   * full stylesheet - and this map only ever grew. On one deployed instance
   * the server climbed from 230MB to 2.1GB in about an hour of ordinary
   * traffic, at which point the kernel's memory ceiling throttled it into
   * answering nothing at all while still reporting itself healthy.
   */
  const crosswindCssCache = boundedCache<string>(options.crosswindCacheLimit ?? 512)

  // ── HMR: live-reload via Server-Sent Events. ────────────────────────
  //
  // We hold an open `text/event-stream` per connected browser and push a
  // `{type:'reload'}` message every time the watcher sees a source change.
  // The injected client script reloads the page. No bundler integration,
  // no module graph — full page reload is enough for the stx model where
  // every request re-runs the template pipeline anyway. Belt-and-suspenders
  // with the htmlCache signature check: even if a dependency slipped past
  // the dep-tracker, the cache also gets cleared on every watch event.
  type HmrEvent
   = | { type: 'reload', file?: string }
  | { type: 'css', file?: string }
  // Re-render the current route and swap the SPA container, keeping every
  // client signal on the page alive. A page-template edit does not need the
  // document thrown away (#1877 ask 5).
  | { type: 'fragment', file?: string }
  // Re-execute the store bundle and redefine stores in place, keeping their
  // state — the Pinia acceptHMRUpdate contract (#1877 ask 4).
  | { type: 'store', file?: string }
  // A client script would not bundle. The page still rendered — the bundler
  // ships the unbundled source so the dev server stays usable — but its
  // bindings quietly do nothing, which used to be visible only as a
  // console.warn scrolling past. An empty `errors` clears the overlay,
  // which is how a fixed build takes it down (#1884 ask 2).
  | { type: 'build-error', errors: BuildErrorPayload[] }
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
  // The build-error overlay (#1884 ask 2). Kept out of the one-liner below
  // because it is the only part anyone will need to read.
  //
  // This is a TEMPLATE LITERAL: no backticks anywhere, including in comments,
  // and `${` would interpolate at generation time. Same discipline as the
  // signals runtime (CLAUDE.md item 41).
  //
  // That is also why the string concatenation below is NOT converted to
  // template literals. `general/prefer-template` warns on two lines in here and
  // both warnings have to stay: satisfying the rule means typing a backtick,
  // which terminates this literal and breaks the build. Anyone running
  // `pickier --fix` over this file should confirm those two lines are unchanged.
  const HMR_OVERLAY_JS = `
function __stxEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function __stxOverlay(errs){
  var id='__stx_build_error';
  var el=document.getElementById(id);
  if(!errs||!errs.length){if(el&&el.parentNode)el.parentNode.removeChild(el);return}
  if(!el){el=document.createElement('div');el.id=id;document.body.appendChild(el)}
  el.setAttribute('style','position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;background:rgba(12,12,14,.98);color:#e8e8ea;font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;padding:40px 32px;overflow:auto');
  var w=0,i,j;
  for(i=0;i<errs.length;i++){var fr=errs[i].frame||[];for(j=0;j<fr.length;j++){var ln=String(fr[j].number).length;if(ln>w)w=ln}}
  var h='<div style="max-width:1040px;margin:0 auto">';
  h+='<div style="color:#ff6b6b;font-size:15px;font-weight:600;margin-bottom:6px">Client script failed to bundle</div>';
  h+='<div style="color:#8b8b95;margin-bottom:28px">The page rendered, but this script shipped unbundled &mdash; its imports did not resolve, so its bindings do nothing.</div>';
  for(i=0;i<errs.length;i++){
    var e=errs[i];
    var where=__stxEsc(e.file||'')+(e.line?':'+e.line+(e.column?':'+e.column:''):'');
    h+='<div style="margin-bottom:30px">';
    h+='<div style="color:#ff6b6b;margin-bottom:10px">&#10006; <span style="color:#f2f2f4">'+where+'</span>&nbsp;&nbsp;'+__stxEsc(e.message)+'</div>';
    var frame=e.frame||[];
    if(frame.length){
      h+='<pre style="margin:0;padding:14px 16px;background:#18181c;border-radius:6px;overflow-x:auto">';
      for(j=0;j<frame.length;j++){
        var f=frame[j];
        var n=String(f.number);while(n.length<w)n=' '+n;
        var style=f.isError?'color:#ffd7d7;background:#3b1e1e;display:block':'color:#8b8b95;display:block';
        h+='<span style="'+style+'">'+(f.isError?'&gt; ':'&nbsp;&nbsp;')+n+' | '+__stxEsc(f.text)+'</span>';
      }
      h+='</pre>';
    }
    h+='</div>';
  }
  h+='<div style="color:#6b6b75">This clears itself when the bundle succeeds.</div></div>';
  el.innerHTML=h;
}
`

  const HMR_CLIENT_SCRIPT = `<script data-stx-hmr>(()=>{if(window.__stxHmr)return;window.__stxHmr=1;${HMR_OVERLAY_JS}function bust(){var ls=document.querySelectorAll('link[rel="stylesheet"]');for(var i=0;i<ls.length;i++){var l=ls[i];var u=new URL(l.href,location.href);u.searchParams.set('v',Date.now().toString(36));l.href=u.toString()}}var es=new EventSource('/_stx/hmr');function swapFragment(){var r=window.stxRouter;if(r&&typeof r.refresh==='function'){try{return r.refresh().then(function(ok){if(!ok)location.reload()},function(){location.reload()})}catch(_){location.reload()}}else{location.reload()}}function reloadStores(){var s=window.stx;if(!s||typeof s.__hmrReplaceStores!=='function'){location.reload();return}fetch('/_stx/stores.js',{cache:'no-store'}).then(function(r){return r.ok?r.text():null}).then(function(code){if(code===null){location.reload();return}s.__hmrReplaceStores(code)}).catch(function(){location.reload()})}es.onmessage=function(e){try{var m=JSON.parse(e.data);if(m.type==='reload')location.reload();else if(m.type==='css')bust();else if(m.type==='fragment')swapFragment();else if(m.type==='store')reloadStores();else if(m.type==='build-error')__stxOverlay(m.errors)}catch(_){}};es.onerror=function(){if(es.readyState===2){setTimeout(function(){location.reload()},400)}}})()</script>`
  // Append the HMR client just before </body>. Uses `lastIndexOf` per
  // CLAUDE.md item 24 — the first `</body>` in the document can live inside
  // a `<script>` string (e.g. the router/runtime bundle) and `replace` would
  // inject into the middle of that script.
  function injectHmrClient(html: string): string {
    if (!html || production) return html
    // Whatever the render just recorded is what the overlay should show. Fired
    // and forgotten: the response must not wait on reading source files.
    void refreshBuildErrors()
    const closeBody = html.lastIndexOf('</body>')
    if (closeBody === -1) {
      // No `</body>` (fragment / non-document response). Append.
      return html + HMR_CLIENT_SCRIPT
    }
    return html.slice(0, closeBody) + HMR_CLIENT_SCRIPT + html.slice(closeBody)
  }

  /**
   * What the overlay is currently showing.
   *
   * Held so a browser that connects AFTER the failing render still sees it — on
   * a full page load the response is sent before the new EventSource exists, so
   * broadcasting alone would reach only the previous page's connection.
   */
  let currentBuildErrors: BuildErrorPayload[] = []

  /**
   * Drain the bundler's failure registry and push the result to every client.
   *
   * The registry is replaced rather than merged, so a render that bundles
   * cleanly takes the overlay down. That means loading a different page also
   * clears it — self-correcting, since returning to the broken page records the
   * failure again (the dev server does not cache processed templates).
   */
  async function refreshBuildErrors(): Promise<void> {
    const failures = getBundleFailures()
    clearBundleFailures()

    const errors: BuildErrorPayload[] = []
    for (const failure of failures) {
      const details = failure.details?.length
        ? failure.details
        : [{ file: failure.filePath, message: failure.message }]

      for (const detail of details) {
        let frame: BuildErrorPayload['frame'] = []
        // Bun's line counts lines in the bundler's temp entry, not in the .stx
        // file — see locateFailureLine. Corroborate it against the real source
        // or report no line at all; a confident wrong line is worse than none.
        let line: number | undefined
        if (detail.file) {
          try {
            const source = await Bun.file(detail.file).text()
            line = locateFailureLine(source, detail.lineText)
            if (line)
              frame = buildCodeFrame(source, line)
          }
          catch {
            // Unreadable or generated path — the message alone still helps.
          }
        }
        errors.push({
          file: detail.file,
          line,
          // The column is only meaningful next to a line we trust.
          column: line ? detail.column : undefined,
          message: detail.message,
          frame,
        })
      }
    }

    // Only talk when something changed, so a quiet dev server stays quiet.
    if (JSON.stringify(errors) === JSON.stringify(currentBuildErrors))
      return
    currentBuildErrors = errors
    broadcastHmr({ type: 'build-error', errors })
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
    if (production) return
    if (watchersStarted.has(dir)) return
    try {
      const watcher = fsWatch(dir, { recursive: true }, (_event, filename) => {
        if (!filename) return
        const f = String(filename)
        // Source files that affect rendered HTML.
        const isStxLike = f.endsWith('.stx') || f.endsWith('.md') || f.endsWith('.html')
        const isCode = f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.tsx')
          || f.endsWith('.mts') || f.endsWith('.cts')
        const isData = f.endsWith('.json')
        // Asset files served straight to the browser. They don't change
        // server-rendered HTML unless imported by a template, but we still
        // need to fire HMR so the browser drops its cached copy and re-fetches.
        const isCss = f.endsWith('.css')
        const isAsset = isCss
          || isCode
          || f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
          || f.endsWith('.gif') || f.endsWith('.svg') || f.endsWith('.webp') || f.endsWith('.avif')
          || f.endsWith('.woff') || f.endsWith('.woff2') || f.endsWith('.ttf') || f.endsWith('.otf')
        if (!isStxLike && !isAsset && !isData) return

        if (isStxLike || isCode || isData) {
          if (isStxLike)
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
          // The store and composable bundles are memoised separately from the
          // template caches, and nothing outside tests ever invalidated them —
          // so every store edit needed a server restart (#1877). Optional-chained
          // for the same reason as above: an older stx module is a no-op.
          resolvedStxModule?.clearStoreCache?.()
          resolvedStxModule?.clearComposableCache?.()
          // The layout union is only useful if it tracks the directory, so
          // regenerate when a layout is added or renamed (#1879).
          if (layoutsDir && f.endsWith('.stx') && nodePath.resolve(f).startsWith(nodePath.resolve(layoutsDir)))
            void writeLayoutTypes()
        }
        // Pick the narrowest update that can carry the change.
        //
        // CSS re-fingerprints <link> hrefs. A store edit re-executes just the
        // store bundle (#1877 ask 4). A page/component template re-renders the
        // route and swaps the SPA container, which keeps every client signal on
        // the page alive — a one-character edit used to reload the document and
        // reset date-range, filter and drill-down state (#1877 ask 5).
        //
        // Layout edits still reload: the swap replaces the container's contents,
        // so chrome rendered OUTSIDE it would keep the old markup and the page
        // would look updated while being half-stale.
        // `filename` from fs.watch is relative to the WATCHED directory, not to
        // cwd — resolving it against cwd silently classified every store edit
        // as a generic reload.
        const resolved = nodePath.resolve(dir, f)
        const isStore = resolved.startsWith(nodePath.resolve(storesDir))
          || composableDirs.some(d => resolved.startsWith(nodePath.resolve(d)))
        const isLayout = !!layoutsDir && resolved.startsWith(nodePath.resolve(layoutsDir))

        if (isCss && !isStxLike)
          broadcastHmr({ type: 'css', file: f })
        else if (isStore)
          broadcastHmr({ type: 'store', file: f })
        else if (isStxLike && !isLayout)
          broadcastHmr({ type: 'fragment', file: f })
        else
          broadcastHmr({ type: 'reload', file: f })
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
  //
  // `storesDir` and `composablesDir` were absent from this list, so a store or
  // composable edit fired no event at all — combined with a memo nothing
  // invalidated, that made a server restart the only way to see the change
  // (#1877). Both are resolved under `root`, the way their loaders resolve
  // them, and the conventional `functions/` alias for composables is watched
  // too since the loader probes for it.
  // Type the layout names, so `definePageMeta({ layout })` rejects one with no
  // layout behind it (#1879). Regenerated on every start and whenever a layout
  // is added or removed — the union is only useful if it tracks the directory.
  const writeLayoutTypes = async (): Promise<void> => {
    try {
      // `resolvedStxModule` is populated asynchronously, so reading it here
      // would usually find null — await the module instead.
      const stxMod = (options.stxModule ? options.stxModule : await defaultStxModule) as any
      stxMod?.generateLayoutTypes?.(layoutsDir, stxMod?.stateDir?.(process.cwd()))
    }
    catch { /* best-effort — a declaration file is a convenience */ }
  }
  await writeLayoutTypes()

  const storesDir = nodePath.resolve(stxConfig.root || '.', stxConfig.storesDir || 'stores')
  const composableDirs = stxConfig.composablesDir
    ? [nodePath.resolve(stxConfig.root || '.', stxConfig.composablesDir)]
    : ['composables', 'functions'].map(d => nodePath.resolve(stxConfig.root || '.', d))

  for (const dir of [
    componentsDir,
    layoutsDir,
    partialsDir,
    publicDir,
    'resources/assets',
    storesDir,
    ...composableDirs,
    ...(options.watchDirs ?? []),
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
  /**
   * `Host` header for the in-flight SSR pass, exposed to `<script server>`
   * blocks as the ambient `host` variable — the same mechanism as
   * `activeServeSearch`/`__stxServeSearch`. Lets a page branch on the
   * requested hostname (e.g. serving different content for a customer's
   * custom domain vs. the app's own default domain) without needing a
   * distinct route per host.
   */
  let activeServeHost: string = ''
  /**
   * Parsed `Cookie` header for the in-flight SSR pass, exposed as the
   * ambient `cookies` object — lets a page gate content per-visitor (e.g.
   * a password-protected page checking an unlock cookie) without a
   * dedicated route/middleware. Always an object (never undefined) so
   * `cookies.foo` reads cleanly with no truthy-guard needed at the call
   * site, unlike `host`/`__stxServeSearch` which are plain strings.
   *
   * SECURITY: the raw cookie header is folded into htmlCacheKey whenever
   * present. Two visitors with different cookies (e.g. one unlocked, one
   * not) must never share a cached render — that would leak gated content
   * to an anonymous visitor or serve a stale locked page to one who just
   * unlocked. This trades cache hit-rate for correctness on any page that
   * reads cookies at all; pages that never read cookies are unaffected
   * since ordinary anonymous traffic sends no Cookie header.
   */
  let activeServeCookies: Record<string, string> = {}
  let activeServeCookieHeader: string = ''
  /**
   * Best-effort client IP for the in-flight SSR pass, exposed as the
   * ambient `ip` variable — lets a page implement an IP allowlist. From
   * `server.requestIP()` (the actual socket peer), falling back to the
   * left-most `X-Forwarded-For` entry when running behind a reverse proxy
   * (rpx, a CDN, ...) since the socket peer is the proxy itself in that
   * case, not the real visitor. The X-Forwarded-For fallback is spoofable
   * by anyone who can reach this process directly — only trust it in a
   * deployment where an actual trusted proxy is guaranteed to be the only
   * thing that can reach this process.
   */
  let activeServeIp: string = ''

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

  /**
   * Expose the current request (query string, Host, cookies, IP, url, locale,
   * route params) to `<script server>` blocks. Prefers the threaded per-request
   * snapshot over the module singletons — the singletons can be clobbered by a
   * concurrent request while this render is suspended at an await
   * (stacksjs/stacks#1967); the snapshot cannot.
   */
  function injectServeRequestContext(context: Record<string, any>, reqCtx?: ServeRequestContext) {
    const search = reqCtx ? reqCtx.search : activeServeSearch
    const host = reqCtx ? reqCtx.host : activeServeHost
    const cookies = reqCtx ? reqCtx.cookies : activeServeCookies
    const ip = reqCtx ? reqCtx.ip : activeServeIp

    // Unconditional: a query-less request must OVERWRITE the previous
    // request's value on the shared global, or stale search strings leak
    // across requests (the old `if (activeServeSearch)` guard did exactly
    // that — stacksjs/stacks#1967).
    context.__stxServeSearch = search
    ;(globalThis as { __stxServeSearch?: string }).__stxServeSearch = search

    // The query string as an object, the counterpart to `params`.
    //
    // File-based routing handed a server script its route parameters and then
    // left the query string reachable only through `__stxServeSearch` — an
    // internal, double-underscored name nobody would guess. So the ordinary
    // case of a filtered, paginated list page had no supported way to read
    // `?state=closed&page=2`.
    //
    // Always an object, like `params`, so `query.state` on a request with no
    // query string is undefined rather than a crash. A repeated key keeps its
    // last value, matching what `URLSearchParams.get` returns.
    context.query = Object.fromEntries(new URLSearchParams(search ?? ''))
    if (host)
      context.host = host
    context.cookies = cookies
    if (ip)
      context.ip = ip

    // The whole request in one object. As a context key it becomes an ambient
    // `__stxServeContext` binding inside `<script server>` (a per-render
    // snapshot, immune to global clobbering); the globalThis mirror serves
    // out-of-continuation readers — e.g. Stacks' `requestContext` fallback —
    // and is refreshed here, immediately before script execution, so it is
    // current for the synchronous prefix of every server script.
    const full: ServeRequestContext = reqCtx ?? {
      url: '',
      path: '',
      // No live request here — this fallback exists for readers outside the
      // request continuation. GET is the honest answer: a page action must
      // never run off a context that has no body to read.
      method: 'GET',
      search,
      host,
      cookieHeader: activeServeCookieHeader,
      cookies,
      ip,
      locale: activeServeLocale,
      params: {},
    }
    context.__stxServeContext = full
    ;(globalThis as { __stxServeContext?: ServeRequestContext }).__stxServeContext = full

    // The status, decided while rendering rather than declared in the source.
    //
    // `definePageMeta({ status })` is read out of the file before anything
    // runs, which is right for a page that is always an error page and no use
    // to a page that only sometimes is. A page addressed by a dynamic segment
    // - a repository, a user, an order - cannot know whether the thing exists
    // until it has looked, and until now it had no way to say so: it rendered
    // "no such repository" under a 200, which tells a crawler, a cache and a
    // monitor that the page is fine.
    //
    // Last call wins, so a page can decide late. Anything outside the HTTP
    // range is ignored rather than thrown, because a status is not worth
    // failing a rendered page over.
    context.setResponseStatus = (status: number): void => {
      if (Number.isInteger(status) && status >= 100 && status <= 599)
        full.responseStatus = status
    }

    /*
     * `notFound()` — the same decision, in the spelling a dynamic page reaches
     * for. Bound here rather than left to the engine default so all three
     * runtime calls share one sink: the default records on the render context,
     * and a page that called `notFound()` and then changed its mind with
     * `setResponseStatus(200)` would have written to two different places and
     * got whichever the serve read last, not the one it asked for last.
     *
     * Client-error-and-up only, so `notFound(200)` — which nobody means —
     * falls back to 404 rather than quietly asserting the page is fine.
     */
    context.notFound = (status: number = 404): void => {
      full.responseStatus = Number.isInteger(status) && status >= 400 && status <= 599 ? status : 404
    }

    /*
     * The headers, decided the same way and for the same reason.
     *
     * `setResponseStatus` shipped without this, and the pair is not optional:
     * a page that works out mid-render that a handle has moved can say 301 and
     * cannot say where to, so the response it produces is a redirect with no
     * destination - which is worse than the 404 it replaced. The name was
     * already declared in `STX_SERVER_CONTEXT` and already implemented by
     * every other host that renders stx, so a page calling it was not reaching
     * for something exotic; it threw a ReferenceError, took the rest of its
     * own server script down with it, and rendered its empty branch.
     *
     * Last call wins, like the status. A name that is not a string is ignored
     * rather than thrown, because a header is not worth failing a rendered
     * page over - the same trade the status makes one line up.
     */
    context.setResponseHeader = (name: string, value: string): void => {
      const header = String(name ?? '').trim()

      if (!header)
        return

      full.responseHeaders = { ...full.responseHeaders, [header]: String(value) }
    }
  }

  /** Render cache must vary by locale/host/cookies — same `.stx` file can serve different `t()`/host/cookie-gated output. */
  function htmlCacheKey(filePath: string, reqCtx?: ServeRequestContext): string {
    if (RENDER_CACHE_VARY === 'source')
      return filePath

    if (reqCtx) {
      // `onRequest` may merge arbitrary app-owned values into the request
      // context. Vary by the complete snapshot so an opt-in cache can never
      // cross user, host, query, IP, locale, or hook-derived boundaries.
      try {
        return `${filePath}\0${JSON.stringify(reqCtx)}`
      }
      catch {
        // A non-serializable hook value is not safely cacheable. Make this
        // request unique while preserving the normal render path.
        return `${filePath}\0uncacheable:${crypto.randomUUID()}`
      }
    }

    const loc = i18nConfig ? (activeServeLocale ?? i18nConfig.defaultLocale) : ''
    const search = activeServeSearch || ''
    const host = activeServeHost || ''
    const cookies = activeServeCookieHeader
    const ip = activeServeIp
    if (!loc && !search && !host && !cookies && !ip)
      return filePath
    return `${filePath}\0${loc}\0${search}\0${host}\0${cookies}\0${ip}`
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

    // Generate route manifest and type declarations into the state directory.
    // Pass ALL patterns as a stack of page roots so frameworks can ship
    // default views (e.g. cart, checkout, orders) and apps can override
    // any of them by dropping a file with the same path into their own
    // `resources/views`. The first matching root wins per pattern.
    try {
      const { Router } = await import('stx-router')
      const pagesDirs = patterns.map(p => p.replace(/\/$/, '')).filter(Boolean)
      const router = new Router(process.cwd(), { pagesDirs, stateDir: stateDirName() })
      if (!options.quiet)
        console.log(`[stx] Generated ${router.routes.length} routes → ${nodePath.join(stateDirName(), 'routes.ts')}`)
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
    const targetAssetsDir = stateDir(process.cwd(), 'assets')

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
  let crosswindModule: CrosswindEngine | null = null
  let crosswindLoadAttempted = false

  // Crosswind user config cache. Process lifetime is the invalidation
  // boundary for the *config* itself (config changes require a restart).
  let crosswindUserConfigPromise: Promise<Record<string, any>> | null = null
  // `crosswindCssCache` itself (sorted class-set → CSS) lives with the
  // other top-level caches above so the file watcher wipes it on every
  // source change. Re-running the generator for a touched template picks
  // up newly added utility classes that weren't in the previous render.

  async function loadCrosswind(): Promise<CrosswindEngine | null> {
    if (crosswindLoadAttempted)
      return crosswindModule
    crosswindLoadAttempted = true

    // The crosswind the SERVED PROJECT installed, nearest first. This is
    // tried before a bare import because `import('@cwcss/crosswind')`
    // resolves relative to this file and therefore always found the copy
    // hoisted next to bun-plugin-stx, ignoring the app's own — usually
    // newer — version. Since the engine version decides what a class
    // compiles to, that served CSS the app could not reproduce: arbitrary
    // filter values such as `blur-[50px]` came out as `blur(50pxpx)` and
    // `backdrop-saturate-[180%]` as `saturate(NaN)`, both of which a
    // browser drops, so the utility silently did nothing.
    let dir = process.cwd()
    while (dir !== nodePath.dirname(dir)) {
      for (const store of ['node_modules', 'pantry']) {
        for (const entry of ['dist/index.js', 'src/index.ts']) {
          const candidate = nodePath.join(dir, store, '@cwcss', 'crosswind', entry)
          try {
            if (!await Bun.file(candidate).exists())
              continue
            const mod = await import(candidate)
            if (mod?.CSSGenerator) {
              crosswindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
              return crosswindModule
            }
          }
          catch { /* try the next candidate */ }
        }
      }
      dir = nodePath.dirname(dir)
    }

    try {
      // bun-plugin-stx's own dependency
      const mod = await import('@cwcss/crosswind')
      crosswindModule = { CSSGenerator: mod.CSSGenerator, config: mod.config }
      return crosswindModule
    }
    catch {
      try {
        // Last resort: a checkout on this machine, so a stray clone can
        // never shadow a version the project or the plugin declares.
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

      // Same merge the dev-server path uses (#1867). This used to read only
      // `safelist`, `shortcuts` and `theme` — dropping `darkMode`,
      // `preflights`, `cssVariables`, `rules`, `blocklist` and `variants` — and
      // to shallow-spread `theme`, so a user's `colors` replaced the whole
      // stock palette here while the same key was ignored outright on the other
      // path. One config file, two meanings, decided by which binary rendered.
      const merged = mergeCrosswindConfig(cw.config as Record<string, any>, userConfig)
      const generatorConfig = merged.config
      const { includePreflight, minify, tokenCSS } = merged

      // The merged safelist, so a base-config safelist is honoured here too —
      // the dev-server path always generated those and this one never did.
      for (const cls of merged.safelist) classes.add(cls)

      // Cache key — sorted class names plus the safelist (already folded in
      // above). Same set → same CSS, so we can short-circuit the entire
      // generator pipeline below for repeat renders of the same template.
      const cacheKey = [...classes].sort().join(' ')
      const cached = crosswindCssCache.read(cacheKey)
      if (cached !== undefined)
        return cached

      // `mergeCrosswindConfig` returns a loose Dict, while the engine's
      // constructor asks for a fully-populated CrosswindConfig. The engine fills
      // its own defaults for anything absent, so the merged object is what it
      // wants at runtime — the cast names that gap instead of hiding it behind
      // an `any` on the module type, which is what the old stub did.
      const generator = new cw.CSSGenerator(generatorConfig as CrosswindConfig)
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
      // Honour the user's preflight/minify keys instead of pinning literals,
      // matching the dev-server path (#1822, #1867).
      const baseCss = generator.toCSS(includePreflight, minify)

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

      // Role-token values first, so the utilities below resolve against them and
      // an app's own stylesheet — which comes after — can still override (#1930).
      return crosswindCssCache.remember(cacheKey, tokenCSS + baseCss + shortcutCSS)
    }
    catch (error) {
      console.warn('Failed to generate Crosswind CSS:', error)
      return ''
    }
  }

  // Lazy template processing function
  /**
   * Run a page's own `action` for a non-GET request (stacksjs/stx#1847).
   *
   * The body of this lives in `@stacksjs/stx`'s `page-action` module, because
   * it shipped here only — so a form worked under `buddy dev` and silently did
   * nothing in production, where the request fell through to an ordinary render
   * and answered 200 with the pre-submit markup. This repo has been bitten
   * repeatedly by two hand-maintained copies of one rule drifting apart; this
   * wrapper exists only to move the redirect onto the request context the dev
   * server already threads through.
   */
  async function runPageAction(context: Record<string, any>, reqCtx?: ServeRequestContext): Promise<void> {
    if (!reqCtx)
      return

    const result = await sharedRunPageAction(context, {
      request: reqCtx.request,
      method: reqCtx.method,
      params: reqCtx.params ?? {},
      cookies: reqCtx.cookies ?? {},
    })

    if (result.redirect)
      reqCtx.actionRedirect = result.redirect
    if (result.cookies && result.cookies.length > 0)
      reqCtx.actionCookies = result.cookies
  }

  /**
   * Carry a finished render's status and headers onto the request context.
   *
   * `injectServeRequestContext` gives a page `setResponseStatus` and
   * `setResponseHeader` that write straight to `reqCtx`, but they are not the
   * only ways in: `notFound()` and the `@status(code)` directive record on the
   * render context instead, because they are implemented once in
   * `@stacksjs/stx` for every host rather than per-serve. This is where those
   * two arrive.
   *
   * Runs before the render cache stores the entry, so a cached "not found"
   * page answers 404 on its second request too — otherwise the status is
   * correct until the page is popular enough to be cached.
   */
  function applyRecordedResponse(context: Record<string, any>, reqCtx?: ServeRequestContext): void {
    if (!reqCtx)
      return

    const status = readResponseStatus(context)
    if (status !== undefined)
      reqCtx.responseStatus = status

    const headers = readResponseHeaders(context)
    if (headers)
      reqCtx.responseHeaders = { ...reqCtx.responseHeaders, ...headers }
  }

  async function processTemplate(filePath: string, reqCtx?: ServeRequestContext): Promise<string> {
    const content = await Bun.file(filePath).text()
    if (reqCtx)
      reqCtx.responseStatus = extractPageResponseStatus(content) ?? 200
    const skipCacheHint = /(?:^|[^\w$])__stx_skip_cache\s*=\s*true/.test(content)
    // A form POST must never be answered from cache. The key is path-based, so
    // a cached GET of the same URL would come back with the pre-submit HTML —
    // no errors, no repopulated values — which reads exactly like the action
    // never ran (#1847).
    const isMutating = !!reqCtx && reqCtx.method !== 'GET' && reqCtx.method !== 'HEAD'

    // Cache fast path — if every dependency mtime matches the previous
    // render, return the cached HTML. The stat fan-out is ~1ms total for a
    // typical 5-dep page; a fresh render is ~50ms, so even on miss we only
    // pay the stat cost once. Query-driven pages opt out entirely.
    if (ENABLE_HTML_CACHE && !skipCacheHint && !isMutating) {
      const cacheKey = htmlCacheKey(filePath, reqCtx)
      const cachedEntry = htmlCache.get(cacheKey)
      if (cachedEntry && await templateSignatureFresh(cachedEntry.signature)) {
        // Braced: two statements now, and a brace-less `if` would have run the
        // second unconditionally against a context that may not exist.
        if (reqCtx) {
          reqCtx.responseStatus = cachedEntry.status
          reqCtx.responseHeaders = cachedEntry.headers
        }
        return cachedEntry.html
      }
    }

    // Extract server script bodies for variable extraction, and remove only
    // server scripts from the template. Client scripts (including <script client>
    // with signals) must remain in the template for processDirectives to transform.
    const { serverScripts, templateContent } = extractServerScriptsFromTemplate(content)

    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: nodePath.dirname(filePath),
      __stx_runtime_head: {},
    }

    const { processDirectives, extractVariables, defaultConfig, generateSpaShell, injectRouterScript } = await stxModule
    injectServeLocaleContext(context)
    injectServeRequestContext(context, reqCtx)
    // Static routes have no dynamic segments — give server scripts the same
    // always-an-object `params` shape the dynamic path provides.
    context.params = reqCtx?.params ?? {}
    for (const scriptBody of serverScripts) {
      await extractVariables(scriptBody, context, filePath)
    }
    // After the block has run, so `action` is defined and can close over it;
    // before directives, so whatever it returns is in scope for the template.
    await runPageAction(context, reqCtx)
    context.__stx_head_preset = true

    // Merge custom options with default config and stx.config.ts settings.
    // Only forward known directive-processing keys from stxConfig — dumping
    // the whole object (apiRoutes, css path, etc.) into processDirectives
    // causes unexpected behavior.
    const config = {
      ...defaultConfig,
      // The project root the renderer resolves component conventions against
      // (`<root>/resources/views/components`, `<root>/src/components`, …). The
      // serve is always launched from the project root (every other path here
      // is likewise `process.cwd()`-relative), so without this `options.root`
      // is undefined in renderComponentWithSlot → `configuredRoot` is unset →
      // the convention fallbacks are skipped and `resolveBase` degrades to the
      // parent file's dir. For a layout-wrapped page that dir is the layouts
      // dir, so app components under `resources/views/components` were never
      // searched and `<MyComponent />` leaked into the output as a raw tag.
      root: process.cwd(),
      ...(componentsDir && { componentsDir }),
      ...(layoutsDir && { layoutsDir }),
      ...(fallbackLayoutsDir && { fallbackLayoutsDir }),
      ...(fallbackComponentsDir && { fallbackComponentsDir }),
      ...(partialsDir && { partialsDir }),
      autoShell: true,
      buildMode: 'serve' as const,
      ssr: stxConfig.ssr ?? defaultStxConfig.ssr ?? true,
      app: stxConfig.app || {},
      ...('strict' in stxConfig && { strict: stxConfig.strict }),
      ...('router' in stxConfig && { router: stxConfig.router }),
      // Forward debug so `debug: true` in stx.config.ts turns on the verbose
      // render/component/directive logs on the serve path (gated by
      // options.debug in the renderer, otherwise unreachable from a config).
      ...('debug' in stxConfig && { debug: stxConfig.debug }),
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
    applyRecordedResponse(context, reqCtx)

    // Inject the SPA router (auto-initializes, guards against double-init)
    output = await injectRouterScript(output, getRouterInjectOptions())

    // Strip plain <template> wrapper tags - browsers don't render template content
    // STX uses <template> in source but output should be renderable HTML
    // PRESERVE <template> tags with reactive directives — those are client-side
    // templates processed by the signals runtime (x-for, x-if, @for, @if, :for, :if)
    const directiveTemplateRe = REACTIVE_TEMPLATE_DIRECTIVE_RE
    const hasDirectiveTemplates = new RegExp(`<template\\s[^>]*(?:${REACTIVE_TEMPLATE_DIRECTIVE_RE.source})`).test(output)
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
    if (
      ENABLE_HTML_CACHE
        && !context.__stx_skip_cache
        && !skipCacheHint
      // Never store a mutating render. The key is path-based, so caching the
      // POST result would hand the next plain GET of the same URL somebody
      // else's validation errors and submitted values — worse than the stale
      // read the guard above prevents.
        && !isMutating
        && isRenderableCacheCandidate(output)
    ) {
      const signature = await buildTemplateSignature(filePath, dependencies)
      htmlCache.set(htmlCacheKey(filePath, reqCtx), { html: output, signature, status: reqCtx?.responseStatus ?? 200, headers: reqCtx?.responseHeaders })
    }

    return output
  }

  // Function to get or create route
  async function getRoute(requestPath: string, reqCtx?: ServeRequestContext): Promise<string | null> {
    // Dev mode: never cache — always re-process templates so file changes are reflected
    // Production caching is handled by the production server, not the dev serve path

    // Discover files if needed
    const files = await discoverFiles()

    // Normalize the request path
    let normalizedPath = requestPath.startsWith('/') ? requestPath.slice(1) : requestPath

    // A trailing slash names the same page. Without this, `/docs/` looked for
    // `docs//index.stx` and matched no dynamic regex either, so a link somebody
    // wrote with a slash on the end, or a browser that added one, 404'd on a
    // page that plainly exists. The root is already the empty string here, so
    // there is nothing to strip off it.
    normalizedPath = normalizedPath.replace(/\/+$/, '')

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
          const output = await processTemplate(filePath, reqCtx)
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
        const output = await processTemplate(filePath, reqCtx)
        routes.set(requestPath, output)
        return output
      }

      // Strategy 5: Pretty routes - strip 'pages/' prefix for cleaner URLs
      // e.g., /home -> pages/home.stx, /library/components -> pages/library/components.stx
      if (fileRoute.startsWith('pages/')) {
        const prettyRoute = fileRoute.slice(6) // Remove 'pages/' prefix
        if (`/${prettyRoute}` === requestPath ||
        prettyRoute === normalizedPath) {
          const output = await processTemplate(filePath, reqCtx)
          routes.set(requestPath, output)
          return output
        }
      }
    }

    // Strategy 6: Dynamic route segments - [param].stx files
    // e.g., /data/product -> pages/data/[model].stx or data/[model].stx
    //
    // Order candidates MOST-SPECIFIC-FIRST so a catch-all ([...all]) or a broad
    // [param] can never shadow a more specific route. discoverFiles returns Bun
    // glob order (the catch-all frequently lands first) and the loop below takes
    // the FIRST regex match — so unsorted, /article/15 matched [...all].stx via
    // ^(.+)$ before article/[id].stx, and EVERY dynamic detail route 404'd.
    // routeSpecificity ranks catch-alls last (see its docs, stacksjs/stx#1837).
    // A catch-all ([...x]) must ALSO never shadow a static-asset request — e.g.
    // /images/logo.jpg — because getRoute runs before the publicDir handler. When
    // the path carries a non-page file extension, drop catch-all candidates so
    // the request falls through to publicDir (and then the real 404 page).
    // Specific routes may still match (rare, but legitimate). stacksjs/stx#1841.
    // A dynamic route is dropped when publicDir really holds this file,
    // rather than whenever the path merely looks like an asset: the extension
    // is a guess about intent, and it refuses every legitimate page whose
    // path carries a dot (see publicFileExists).
    //
    // **Every** dynamic route, not only catch-alls. Restricting it to `[...x]`
    // assumed a shallow route tree, and an app whose routes start at the root
    // does not have one: a forge serving `[owner]/[repository]` claims every
    // two-segment path and `[owner]` claims every one-segment path, so
    // `/js/mermaid.js` and `/favicon.ico` both rendered a page and the whole
    // publicDir was unreachable. A real file at exactly this path is a
    // stronger signal than any route pattern.
    const isAssetRequest = publicFileExists(`/${normalizedPath}`, publicDir)
    const dynamicFiles = files
      .filter((f) => {
      const nf = f.replace(/^\.\//, '').replace(/\\/g, '/')
      if (!nf.includes('['))
        return false
      if (isAssetRequest)
        return false
      return true
    })
      .sort((a, b) => routeSpecificity(b) - routeSpecificity(a))
    for (const filePath of dynamicFiles) {
      const normalizedFilePath = filePath.replace(/^\.\//, '').replace(/\\/g, '/')

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
          // `[...path]` is written with dots; the parameter is called `path`.
          // Keeping them means params.path is undefined while the value sits
          // under a key nobody would think to read.
          const paramNames = [...fileRouteBase.matchAll(/\[([^\]]+)\]/g)]
            .map(m => m[1].replace(/^\.\.\./, ''))
          const paramValues = match.slice(1)

          // Process template with dynamic params in context
          const output = await processTemplateDynamic(filePath, paramNames, paramValues, normalizedPath, reqCtx)
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
    reqCtx?: ServeRequestContext,
  ): Promise<string> {

    const content = await Bun.file(filePath).text()
    if (reqCtx)
      reqCtx.responseStatus = extractPageResponseStatus(content) ?? 200

    // Extract server scripts only — client scripts stay for processDirectives to transform
    const { serverScripts: dynServerScripts, templateContent } = extractServerScriptsFromTemplate(content)

    // Build context with dynamic params
    const context: Record<string, any> = {
      __filename: filePath,
      __dirname: nodePath.dirname(filePath),
      __route: routePath,
      __stx_runtime_head: {},
    }

    // Name→value map of the dynamic segments, URL-decoded (path segments
    // arrive percent-encoded; scripts want `café`, not `caf%C3%A9`). Single
    // source of truth for the ambient bindings below, the server-script
    // `params` object, and the client-side `window.stx._rp` injection.
    const paramsObj: Record<string, string> = {}
    for (let i = 0; i < paramNames.length; i++) {
      let value = paramValues[i] ?? ''
      try {
        value = decodeURIComponent(value)
      }
      catch {
        // malformed escape — keep the raw segment
      }
      paramsObj[paramNames[i]] = value
    }

    // Add each param to context as a bare identifier (`[id].stx` → `id`)...
    for (const name of paramNames) {
      context[name] = paramsObj[name]
    }
    // ...and as the documented `params` object — @stacksjs/stx's
    // variable-extractor plumbs `context.params` into every server script,
    // but the serve path never set it, so `params.id` was always `{}`
    // (stacksjs/stacks#1967).
    context.params = paramsObj
    if (reqCtx)
      reqCtx.params = paramsObj

    const { processDirectives, extractVariables, defaultConfig, injectRouterScript: injectRouter } = await stxModule
    injectServeLocaleContext(context)
    // Dynamic ([param].stx-style) routes need the same query/host/cookies/
    // IP ambient context as static routes — this was missed when `host`
    // was first added (only the static-route path called
    // injectServeRequestContext), so every dynamic route silently never
    // saw `host`/`cookies`/`ip`/`__stxServeSearch` until this fix.
    injectServeRequestContext(context, reqCtx)
    for (const scriptBody of dynServerScripts) {
      await extractVariables(scriptBody, context, filePath)
    }
    context.__stx_head_preset = true

    const config = {
      ...defaultConfig,
      // See the static-route config above: without `root` the component
      // convention fallbacks are skipped and `<MyComponent />` leaks as a raw
      // tag. Dynamic ([param].stx) routes render app components too, so they
      // need the same project root.
      root: process.cwd(),
      ...(componentsDir && { componentsDir }),
      ...(layoutsDir && { layoutsDir }),
      ...(fallbackLayoutsDir && { fallbackLayoutsDir }),
      ...(fallbackComponentsDir && { fallbackComponentsDir }),
      ...(partialsDir && { partialsDir }),
      autoShell: true,
      buildMode: 'serve' as const,
      ssr: stxConfig.ssr ?? defaultStxConfig.ssr ?? true,
      app: stxConfig.app || {},
      ...('strict' in stxConfig && { strict: stxConfig.strict }),
      ...('router' in stxConfig && { router: stxConfig.router }),
      ...('debug' in stxConfig && { debug: stxConfig.debug }),
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
    applyRecordedResponse(context, reqCtx)

    // Inject route params for client-side useRoute().params — the same
    // decoded paramsObj the server script saw, so both sides agree.
    if (paramNames.length > 0) {
      const serializedParams = JSON.stringify(paramsObj)
        .replace(/</g, '\\u003C')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')
      const paramsScript = `<script data-stx-route-params>(function(){var p=${serializedParams};window.__stx_rp=p;if(window.stx){window.stx._rp=p;if(window.stx.setRouteParams)window.stx.setRouteParams(p)}})()</script>`
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
    const directiveTemplateRe2 = REACTIVE_TEMPLATE_DIRECTIVE_RE
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
    'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With',
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
  function getRouterInjectOptions(): { buildMode: 'serve', router: Record<string, unknown> } {
    return {
      buildMode: 'serve',
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
    // "layout group" meta, so a language switch swaps <nav>/<footer>
    // along with the container. Shared with the static build — see
    // `stampLocaleLayoutGroup`.
    if (i18nConfig && stx.stampLocaleLayoutGroup)
      html = stx.stampLocaleLayoutGroup(html, locale)

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
        // SO_REUSEPORT opt-in for zero-downtime deploy overlaps — see the
        // ServeOptions doc.
        reusePort: options.reusePort ?? false,
        // Disable Bun's per-request idle timeout. The HMR SSE stream is the
        // primary case — it sits open for the lifetime of the dev session
        // and the default 10s idle kills it with
        // `ERR_INCOMPLETE_CHUNKED_ENCODING`. Other long-lived dev requests
        // (debug websockets, slow downloads) benefit too. A dev server has
        // no good reason to enforce request timeouts.
        idleTimeout: production ? 30 : 0,
        async fetch(req, server) {
          // See `placeholdersReady`: the port is already bound, and this is
          // where the wait actually belongs — before anything renders, not
          // before anything listens. Settled after the first request.
          await placeholdersReady

          // Compression at the boundary, so it covers all thirty-nine exits from
          // this handler rather than the one that happens to converge. Hot reload
          // streams over text/event-stream, which compressResponse never buffers.
          return compressResponse(req, await (async () => {
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
            // Declared outside the IIFE so the response step below can attach the
            // same token the render embedded.
            let mintedCsrfToken: string | null = null

            const _i18nResp: Response = await (async (): Promise<Response> => {
              activeServeLocale = i18nLocale
              activeServeSearch = url.search
              activeServeHost = req.headers.get('host') || ''
              activeServeCookieHeader = req.headers.get('cookie') || ''
              activeServeCookies = parseCookies(req)
              activeServeIp = server.requestIP(req)?.address || (req.headers.get('x-forwarded-for') || '').split(',')[0]!.trim()

              // A CSRF token the page can embed, minted before the render.
              //
              // The usual pattern seeds this cookie on the way *out*, which
              // works for a single-page app: it reads the cookie and echoes the
              // header on its next request. It is too late for a server-rendered
              // page with forms in it. The page is what has to embed the token,
              // and on a visitor's very first request it renders before any
              // cookie exists - so its forms carry nothing and their first
              // submit is rejected. That is the submit most likely to belong to
              // somebody trying the application for the first time.
              //
              // Minted here, put into the cookies the render reads, and attached
              // to the response below - the same value in both places, because
              // two independent tokens fail exactly like having none and are far
              // harder to see.
              mintedCsrfToken = csrfTokenToMint(req, activeServeCookies)
              if (mintedCsrfToken)
                activeServeCookies[CSRF_COOKIE] = mintedCsrfToken
              // Immutable-per-request snapshot threaded down to the render.
              // The singletons above can be reset by a concurrent request's
              // `finally` while this render is suspended at an await; this
              // object cannot (stacksjs/stacks#1967).
              const reqCtx: ServeRequestContext = {
                url: req.url,
                path,
                search: activeServeSearch,
                host: activeServeHost,
                cookieHeader: activeServeCookieHeader,
                cookies: activeServeCookies,
                ip: activeServeIp,
                locale: activeServeLocale,
                params: {},
                method: (req.method || 'GET').toUpperCase(),
                request: req,
              }
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
                  if (production)
                    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } })

                  let controller: ReadableStreamDefaultController<Uint8Array> | undefined
                  let keepalive: ReturnType<typeof setInterval> | undefined
                  const stream = new ReadableStream<Uint8Array>({
                    start(c) {
                      controller = c
                      hmrClients.add(c)
                      // Initial line — proves the connection is live to the browser
                      // and gives the readyState a definite "open" before any change.
                      c.enqueue(hmrEncoder.encode('data: {"type":"connected"}\n\n'))
                      // Replay the current build errors. On a full page load the
                      // response is sent before this EventSource exists, so a
                      // broadcast alone reaches only the PREVIOUS page's
                      // connection — the overlay would never appear on the very
                      // load that failed, which is the one that matters.
                      if (currentBuildErrors.length > 0) {
                        c.enqueue(hmrEncoder.encode(
                          `data: ${JSON.stringify({ type: 'build-error', errors: currentBuildErrors })}\n\n`,
                        ))
                      }
                      // Keepalive ping. Without traffic, the stream idles and gets
                      // killed by Bun.serve's `idleTimeout` (default 10s) or a reverse
                      // proxy's read timeout — the browser then sees
                      // `ERR_INCOMPLETE_CHUNKED_ENCODING` and falls into a reconnect
                      // loop that mostly hides the HMR being broken. The ping MUST fire
                      // faster than the shortest such timeout: 15s was longer than Bun's
                      // 10s default, so the connection died before the first ping ever
                      // arrived. 5s comfortably beats Bun's 10s and typical proxy (rpx,
                      // nginx) read timeouts. The leading `:` is SSE comment syntax
                      // (ignored by the EventSource API) and costs nothing.
                      keepalive = setInterval(() => {
                        try { c.enqueue(hmrEncoder.encode(': keepalive\n\n')) }
                        catch { /* stream closed — cancel handler clears the timer */ }
                      }, 5_000)
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

                // Shared STX client assets. Serve mode references these from
                // every rendered document instead of inlining the same runtime
                // and router payload on every page. ETag revalidation keeps
                // package changes correct across dev-server restarts.
                if (path === '/_stx/runtime.js' || path === '/_stx/router.js') {
                  const stx = await stxModule
                  const content = path === '/_stx/runtime.js'
                    ? await stx.getCachedSignalsRuntime(stxConfig.debug === true)
                    : await stx.getCachedRouterScript()
                  const etag = `"${Bun.hash(content).toString(16)}"`
                  const headers = {
                    'Content-Type': 'application/javascript; charset=utf-8',
                    'Cache-Control': production
                      ? 'public, max-age=3600, stale-while-revalidate=86400'
                      : 'public, max-age=0, must-revalidate',
                    'ETag': etag,
                    ...corsHeaders,
                  }
                  if (req.headers.get('if-none-match') === etag)
                    return new Response(null, { status: 304, headers })
                  if (req.method === 'HEAD')
                    return new Response(null, { headers })
                  return new Response(content, { headers })
                }

                // The store bundle on its own, for store HMR (#1877 ask 4). It is
                // normally inlined into the page; the HMR client needs it as a
                // standalone fetch so an edit can be applied without a reload.
                // No-store: the whole point is that it changed.
                if (path === '/_stx/stores.js') {
                  const stx = await stxModule
                  const code = typeof (stx as any).getStoreScript === 'function'
                    ? await (stx as any).getStoreScript()
                    : null
                  return new Response(code ?? '', {
                    status: code === null ? 404 : 200,
                    headers: {
                      'Content-Type': 'application/javascript; charset=utf-8',
                      'Cache-Control': 'no-store',
                      ...corsHeaders,
                    },
                  })
                }

                const crosswindAsset = path.match(/^\/_stx\/crosswind\.([a-f0-9]{16})\.css$/)
                if (crosswindAsset) {
                  const stx = await stxModule
                  const content = stx.getCrosswindServeAsset(crosswindAsset[1]!)
                  if (content === undefined)
                    return new Response('Crosswind asset not found', { status: 404 })
                  const headers = {
                    'Content-Type': 'text/css; charset=utf-8',
                    'Cache-Control': 'public, max-age=31536000, immutable',
                    ...corsHeaders,
                  }
                  if (req.method === 'HEAD')
                    return new Response(null, { headers })
                  return new Response(content, { headers })
                }

                // Custom onRequest handler — short-circuits if a Response is
                // returned. A plain-object return is merged into the request
                // context instead, giving the hook a race-free way to hand
                // state (auth cookies, locale, a user object, ...) to
                // `<script server>` blocks — see the onRequest option docs.
                if (options.onRequest) {
                  const hookResult = await options.onRequest(req)
                  if (hookResult instanceof Response)
                    return hookResult
                  if (hookResult && typeof hookResult === 'object')
                    Object.assign(reqCtx, hookResult)
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
                        ...(fallbackLayoutsDir && { fallbackLayoutsDir }),
                        ...(fallbackComponentsDir && { fallbackComponentsDir }),
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
                      const tableInfo = db.query(`PRAGMA table_info("${tableName}")`).all() as Array<{ name: string, type: string, notnull: number, dflt_value: unknown }>
                      const validColumns = tableInfo.map((c: any) => c.name).filter((n: string) => n !== 'id' && n !== 'created_at' && n !== 'updated_at')

                      // Build INSERT query with only valid columns that have values
                      const columns: string[] = []
                      const placeholders: string[] = []
                      // Typed as what sqlite actually accepts. `unknown[]` does
                      // not satisfy `run(...)`, and widening it there would only
                      // move the same question to runtime.
                      const values: SQLQueryBindings[] = []

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
                  const indexContent = await getRoute('/', reqCtx)
                  if (!indexContent) {
                    // Try /home as default landing page
                    const homeContent = await getRoute('/home', reqCtx)
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
                const content = await getRoute(path, reqCtx)

                // A page action asked for a redirect (#1847). 303 rather than 302:
                // it is the status that tells the browser to follow up with a GET,
                // so the POST is not repeated on reload or Back — the whole point
                // of the POST/redirect/GET shape a form action exists to support.
                if (reqCtx.actionRedirect) {
                  // Built by the shared helper rather than a second literal:
                  // this copy had already drifted, missing the
                  // `Cache-Control: no-store` the production one sets, so a
                  // redirect answering a submission was cacheable in dev only.
                  // Page headers travel with the redirect too (#1943). This
                  // path dropped them in dev as well as production, so unlike
                  // the rest of that issue it was not a divergence — it was
                  // missing on both sides, and fixing only production would
                  // have created one.
                  const redirectResponse = actionRedirectResponse(reqCtx.actionRedirect, reqCtx.actionCookies, reqCtx.responseHeaders)
                  for (const [key, value] of Object.entries(corsHeaders))
                    redirectResponse.headers.set(key, value)
                  return redirectResponse
                }

                if (content) {
                  const responseStatus = reqCtx.responseStatus ?? 200
                  // SPA navigation: return only <main> content as fragment
                  const isSpaNav = req.headers.get(SPA_NAV_HEADER) === 'true'
                  if (isSpaNav) {
                    // Detect layout from rendered content — extract @extends layout name.
                    // If layout differs from the referrer's layout, return full HTML (not
                    // fragment) so the router does a full document swap instead of just
                    // swapping <main>.
                    //
                    // Read through the SHARED helper rather than a local regex, because the
                    // router client decides "did the layout change?" by comparing what these
                    // headers say against what it reads off the live document, and the two
                    // sides have to name the no-layout case identically. This used to report
                    // `default` for a page with no layout while the client, finding no
                    // `<meta name="stx-layout">` at all, called the same state `app` — so
                    // every @nolayout page (one that writes its own <html>) looked like a
                    // layout change on EVERY navigation. The router fetched the fragment,
                    // concluded the group had changed, fetched the whole page again and
                    // full-reloaded: SPA routing silently off, two requests per click, and
                    // the discarded fragment fetch landing on the page's own url — which is
                    // what a CDN in front of it then cached (stacksjs/stx#1958).
                    const layoutMetadata = extractLayoutMetadata(content)
                    const pageLayout = layoutMetadata.layout
                    // Locale switches must report `i18n:<code>` so the router does a full-body
                    // swap (nav/footer translations live outside <main>). `applyI18nToResponse`
                    // injects the same meta after render; headers here must match.
                    const pageLayoutGroup = (i18nConfig && i18nLocale)
                      ? `i18n:${i18nLocale}`
                      : layoutMetadata.group

                    let fragment = content
                    let containerAttrs = ''
                    let mainContentStart = -1
                    let mainContentEnd = -1

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

                      const crosswindLinkRe = /<link\b[^>]*\bdata-crosswind=(?:"generated"|'generated')[^>]*>/gi
                      let crosswindLinkMatch: RegExpExecArray | null
                      while ((crosswindLinkMatch = crosswindLinkRe.exec(headContent)) !== null) {
                        headStyles.push(crosswindLinkMatch[0])
                      }
                    }

                    // Also extract styles that are siblings of <main> (from @push/@stack)
                    // These appear in the body but outside <main>, so they'd be lost in fragment extraction
                    // The container is resolved with the SAME selector the client
                    // uses, instead of being hardcoded to <main>. Configuring
                    // `router: { container: '[data-stx-content]' }` used to produce
                    // a <main>-shaped fragment that the client then injected
                    // somewhere else, duplicating the page chrome. See #1853.
                    const containerSelector = (stxConfig as any)?.router?.container || 'main'
                    const containerRegion = findContainerRegion(fragment, containerSelector)
                    if (!containerRegion) {
                      // Previously this fell through silently and the WHOLE body
                      // shipped as the "fragment", which the client could not swap
                      // — so every link on the page did a full document load, at
                      // HTTP 200, with nothing said. The rule was structural and
                      // unenforced, so apps encoded it as prose in their layouts.
                      console.warn(
                        `[stx] No SPA swap container matching "${containerSelector}" in ${new URL(req.url).pathname}. `
                        + `SPA navigation is disabled for links on this page; the full document will load instead. `
                        + `Add a matching element, or point router.container at one this page has.`,
                      )
                    }
                    const mainOpenMatch = containerRegion
                      ? { 0: containerRegion.openTag, index: containerRegion.openIndex } as unknown as RegExpMatchArray
                      : null
                    const mainCloseIdx = containerRegion ? containerRegion.end : -1
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

                      // Capture the destination <main>'s own attributes. The fragment
                      // carries only the container's INNER content, so a page whose
                      // layout lives on <main> itself (e.g. a <main> carrying
                      // flex, min-h-[100dvh] and centring utilities) would otherwise
                      // be injected into the persistent, attribute-less container and
                      // lose its layout entirely on SPA navigation. The router applies
                      // these to the container during the swap.
                      // Strip the resolved tag name, not a hardcoded `main` — the
                      // container can be any element now.
                      containerAttrs = mainOpenMatch[0]
                        .replace(new RegExp(`^<${containerRegion!.tagName}\\b`, 'i'), '')
                        .replace(/\/?>$/, '')
                        .trim()

                      // Extract only the <main> inner content (not sidebar, header, or layout)
                      const mainStart = mainOpenMatch.index! + mainOpenMatch[0].length
                      mainContentStart = mainStart
                      mainContentEnd = mainCloseIdx
                      fragment = fragment.slice(mainStart, mainCloseIdx).trim()
                    }
                    // Extract ALL page-specific scripts from the full page response.
                    // These may be in <head> or before </body> — outside <main>.
                    // Includes: setup functions (__stx_setup_), partial scope IIFEs,
                    // the dynamic route params, and the reactive bridge (initScope calls).
                    // Excludes: signals runtime IIFE, x-element runtime, router script.
                    const pageSetupScripts: string[] = []
                    const pageSetupScriptOffsets = new Set<number>()
                    const appendOutsideMainScript = (match: RegExpExecArray): void => {
                      const offset = match.index
                      const insideMain = mainContentStart !== -1
                        && offset >= mainContentStart
                        && offset < mainContentEnd
                      if (insideMain || pageSetupScriptOffsets.has(offset))
                        return
                      pageSetupScriptOffsets.add(offset)
                      pageSetupScripts.push(match[0])
                    }
                    const routeParamsRe = /<script\b[^>]*data-stx-route-params[^>]*>[\s\S]*?<\/script>/gi
                    let setupMatch: RegExpExecArray | null
                    while ((setupMatch = routeParamsRe.exec(content)) !== null) {
                      appendOutsideMainScript(setupMatch)
                    }
                    const allScriptRe = /<script\b[^>]*data-stx-scoped[^>]*>[\s\S]*?<\/script>/gi
                    while ((setupMatch = allScriptRe.exec(content)) !== null) {
                      const scriptContent = setupMatch[0]
                      // Skip the signals runtime (huge IIFE starting with early_mounts shim)
                      if (scriptContent.includes('__stx_early_mounts')) continue
                      // Skip the reactive bridge runtime definition (window.__stx_reactive)
                      if (scriptContent.includes('data-stx-reactive') && scriptContent.includes('window.__stx_reactive')) continue
                      appendOutsideMainScript(setupMatch)
                    }
                    // Also include reactive bridge initScope calls (they're in a separate script tag)
                    // eslint-disable-next-line no-super-linear-backtracking, regexp/no-super-linear-backtracking
                    const bridgeInitRe = /<script\b[^>]*data-stx-reactive[^>]*>(?![\s\S]*window\.__stx_reactive)[\s\S]*?<\/script>/gi
                    while ((setupMatch = bridgeInitRe.exec(content)) !== null) {
                      appendOutsideMainScript(setupMatch)
                    }

                    // Strip the signals runtime IIFE — keep only page-specific scripts
                    fragment = fragment.replace(
                      /<script data-stx-scoped>\s*;?\(function\(\)\s*\{[\s\S]*?<\/script>/g,
                      '',
                    )

                    // Clear stale _latestSetup from previous page, then append new page scripts
                    const clearStale = '<script data-stx-page>if(window.stx)window.stx._latestSetup=null;</script>'
                    const componentFactoryScripts = pageSetupScripts.filter(script => script.includes('data-stx-component-factories'))
                    const trailingPageScripts = pageSetupScripts.filter(script => !script.includes('data-stx-component-factories'))
                    // Component instance calls can live inside <main>, while their
                    // request-scoped factory prelude is normally emitted in the
                    // document head. Keep the prelude ahead of fragment content so
                    // calls never run before the shared factory is registered.
                    fragment = `${headStyles.join('\n')}\n${componentFactoryScripts.join('\n')}\n${fragment}\n${clearStale}\n${trailingPageScripts.join('\n')}`

                    // Carry the page <title> (from the full page, before it was
                    // reduced to the <main> fragment) so the SPA router can keep
                    // document.title in sync on swap. URI-encoded for header safety.
                    const titleMatch = content.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
                    const pageTitle = titleMatch ? titleMatch[1].trim() : ''

                    // Whether the destination needs the signals runtime — read off
                    // the FULL page, since the runtime script lives in <head> and
                    // the fragment above is only the container's inner content.
                    // The router cannot work this out from the fragment: a page
                    // with reactive syntax but no setup function carries no marker
                    // at all inside <main> (stacksjs/stx#1827). Mirrors
                    // pageShipsSignalsRuntime in stx's runtime-injection.ts —
                    // inlined rather than imported because '@stacksjs/stx'
                    // resolves to dist here, which lags src.
                    const shipsRuntime = content.includes('data-stx-runtime')

                    // Same rule on the SPA path. A 200 here is worse than on a
                    // full load: the router swaps the failure into the live page
                    // and the user keeps navigating around a broken shell (#1854).
                    return new Response(fragment, {
                      status: isRenderFailure(content) ? 500 : responseStatus,
                      headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'X-STX-Fragment': 'true',
                        'X-STX-Layout': pageLayout,
                        'X-STX-Layout-Group': pageLayoutGroup,
                        'X-STX-Runtime': shipsRuntime ? 'true' : 'false',
                        ...(pageTitle && { 'X-STX-Title': encodeURIComponent(pageTitle) }),
                        // Which build rendered this fragment. A watch-mode
                        // restart changes it, letting the router notice that the
                        // runtime already loaded in the page predates it (#1772).
                        [BUILD_ID_HEADER]: getBuildId(),
                        ...(containerAttrs && { 'X-STX-Container-Attrs': encodeURIComponent(containerAttrs) }),
                        // This url answers two different bodies depending on the
                        // request header above, so it has to say so. Without the
                        // `Vary`, a shared cache stores whichever it saw first
                        // and serves it to everyone: when that is the fragment,
                        // every visitor gets a headless page with no doctype,
                        // stylesheet or nav until the entry expires (#1958).
                        ...spaNavVaryHeaders(),
                        'Cache-Control': FRAGMENT_CACHE_CONTROL,
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
                  // A render failure is a 500, whatever status the page asked
                  // for. Serving it as 200 is what made this invisible: the
                  // response looked healthy to uptime checks and caches while
                  // the body was an HTML comment (#1854).
                  const pageRenderFailed = isRenderFailure(cleaned)
                  if (pageRenderFailed) {
                    console.error(`[stx] render failed for ${new URL(req.url).pathname} — serving 500`)

                    // The body was still the blank failure comment. Mirror
                    // production-server.ts (#1722) and the /404 lookup below: if
                    // the app ships a /500 page, render THAT as the body so a
                    // visitor gets a real error page, not an empty one. Rendered
                    // once — getRoute produces a string, it does not re-enter this
                    // HTTP handler — and if the /500 page ITSELF fails to render,
                    // fall through to the marker body rather than loop.
                    for (const custom500 of ['/500', '/errors/500']) {
                      try {
                        const errorPage = usableErrorPage(await getRoute(custom500, reqCtx))
                        if (errorPage) {
                          const isProd = isProductionServe()
                          return new Response(isProd ? errorPage : injectHmrClient(errorPage), {
                            status: 500,
                            headers: {
                              'Content-Type': 'text/html; charset=utf-8',
                              'Cache-Control': 'no-store',
                              ...corsHeaders,
                            },
                          })
                        }
                      }
                      catch {
                        // Custom 500 render failed — try the next location, then
                        // fall through to the marker body below.
                      }
                    }
                  }

                  const pageHeaders = new Headers({
                    'Content-Type': 'text/html; charset=utf-8',
                    // The same url also answers a fragment (see the SPA branch
                    // above), so the document half declares the cache key too.
                    // Marking only the fragment leaves the mirror-image bug: a
                    // cache holding the document hands it back to the router,
                    // which swaps a whole <html> tree inside the container.
                    ...spaNavVaryHeaders(),
                    'Cache-Control': 'no-store',
                    ...corsHeaders,
                  })
                  // What the page asked for, last so it can correct the
                  // defaults above: a page answering 301 needs its own
                  // `Cache-Control`, and the whole point of the call is that
                  // the page knows something this scope does not.
                  for (const [name, value] of Object.entries(reqCtx.responseHeaders ?? {}))
                    pageHeaders.set(name, value)
                  // A validation failure redraws the form, and that response is
                  // the one that has to carry a rotated CSRF token or a cleared
                  // session (#1927). `append`, since several are legitimate.
                  for (const cookie of reqCtx.actionCookies ?? [])
                    pageHeaders.append('Set-Cookie', cookie)

                  return new Response(injectHmrClient(cleaned), {
                    status: pageRenderFailed ? 500 : responseStatus,
                    headers: pageHeaders,
                  })
                }

                // Try an implicit HTML extension only for page-like paths.
                // Appending `.html` to a public asset request turns
                // `/images/favicon.svg` into `/images/favicon.svg.html`, which
                // is page-like again and lets a catch-all route shadow the
                // public file before the publicDir handler can serve it.
                if (!isStaticAssetPath(path)) {
                  const contentWithExt = await getRoute(`${path}.html`, reqCtx)
                  if (contentWithExt) {
                    return new Response(injectHmrClient(contentWithExt), {
                      status: reqCtx.responseStatus ?? 200,
                      headers: {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Cache-Control': 'no-store',
                        ...corsHeaders,
                      },
                    })
                  }
                }

                // Try to serve build artifacts (chunk files, CSS, etc.) from the
                // state directory
                if (path.startsWith('/chunk-') || path.endsWith('.js') || path.endsWith('.css')) {
                  try {
                    const buildFile = Bun.file(stateDir(process.cwd(), path))
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
                                'Cache-Control': staticCacheControl(resolvedPath),
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

                // 404 handling.
                const isProd = isProductionServe()

                // (1) Custom-app override: if the app ships a 404 page at a
                // conventional location, render THAT (works in both dev and
                // prod). Reuses the same getRoute() resolution machinery the
                // normal page pipeline uses, so `.stx` / `.md` / `.html` and
                // index-file conventions all just work.
                for (const custom404 of ['/404', '/errors/404']) {
                  try {
                    const customContent = await getRoute(custom404, reqCtx)
                    if (customContent) {
                      return new Response(
                        isProd ? customContent : injectHmrClient(customContent),
                        {
                          status: 404,
                          headers: { 'Content-Type': 'text/html; charset=utf-8' },
                        },
                      )
                    }
                  }
                  catch {
                    // Custom 404 render failed — fall through to the built-in page.
                  }
                }

                // (2) Built-in fallback. In production we do NOT enumerate the
                // route list (information disclosure) and do NOT inject HMR.
                let availableRoutes: string[] | undefined
                if (!isProd) {
                  const files = await discoverFiles()
                  availableRoutes = []
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

                    availableRoutes.push(route)
                  }
                }

                const notFoundHtml = render404Page({ path, routes: availableRoutes, isProduction: isProd })

                return new Response(isProd ? notFoundHtml : injectHmrClient(notFoundHtml), {
                  status: 404,
                  headers: { 'Content-Type': 'text/html; charset=utf-8' },
                })

              }
              finally {
                activeServeLocale = null
                activeServeSearch = ''
                activeServeHost = ''
                activeServeCookieHeader = ''
                activeServeCookies = {}
                activeServeIp = ''
              }
            })() // ─── end IIFE — single exit for translation post-process
            // Awaited, not passed through: `onResponse` is handed a Response,
            // never a pending Promise of one.
            let _finalResp = await applyI18nToResponse(_i18nResp, i18nLocale ?? (i18nConfig?.defaultLocale ?? 'en'), path)

            // The token the render embedded, sent to the browser. Appended so it
            // coexists with any cookie the page set itself; failing to attach it
            // is not worth failing the response over, since the page still
            // rendered and the next request mints another.
            if (mintedCsrfToken) {
              try {
                _finalResp.headers.append('Set-Cookie', csrfCookieHeader(mintedCsrfToken, req.url.startsWith('https://')))
              }
              catch {
                const headers = new Headers(_finalResp.headers)
                headers.append('Set-Cookie', csrfCookieHeader(mintedCsrfToken, req.url.startsWith('https://')))
                _finalResp = new Response(_finalResp.body, {
                  status: _finalResp.status,
                  statusText: _finalResp.statusText,
                  headers,
                })
              }
            }

            // Post-response hook — the mirror of `onRequest`, and the only
            // place a caller can touch a response the server itself produced.
            // See the `onResponse` option docs for why that matters.
            if (options.onResponse) {
              const hooked = await options.onResponse(req, _finalResp)
              if (hooked instanceof Response)
                return hooked
            }
            return _finalResp
          })())
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

  // Now that the socket is listening, derive the image placeholders. Ordering
  // is the whole point: the health check only asks whether something is bound,
  // and the first request waits on `placeholdersReady` anyway — so this costs
  // nothing a visitor sees, and no longer costs the deploy.
  void (async () => {
    try {
      const { warmImagePlaceholders } = await import('@stacksjs/stx')
      const derived = await warmImagePlaceholders(nodePath.resolve(process.cwd(), publicDir), {
        cachePath: stateDir(process.cwd(), 'image-placeholders.json'),
      })
      if (derived > 0 && !production)
        console.log(`[stx] derived ${derived} image placeholder(s)`)
    }
    catch {
      // No codec or no public directory. <StxImage> falls back to a flat colour.
    }
    finally {
      markPlaceholdersReady()
    }
  })()

  if (ENABLE_HTML_CACHE && options.prewarmRenderCache) {
    const requestedConcurrency = typeof options.prewarmRenderCache === 'number'
      ? Math.floor(options.prewarmRenderCache)
      : 4
    const concurrency = Math.max(1, requestedConcurrency)

    // Warm through the real HTTP pipeline so request hooks, middleware,
    // fragment handling, and response hooks behave exactly as they do for a
    // browser request. Source-varying caches make the loopback Host irrelevant;
    // request-varying caches still benefit callers that use this origin.
    void (async () => {
      const files = await discoverFiles()
      const pending = [...new Set(
        files
          .map(stxViewFileToRoutePath)
          .filter((routePath): routePath is string => routePath !== null),
      )]
      let nextIndex = 0

      await Promise.all(Array.from({ length: Math.min(concurrency, pending.length) }, async () => {
        while (nextIndex < pending.length) {
          const routePath = pending[nextIndex++]
          try {
            const response = await fetch(`http://127.0.0.1:${actualPort}${routePath}`)
            await response.arrayBuffer()
          }
          catch {
            // Prewarming is opportunistic. A normal request still renders and
            // populates the same cache entry if a route fails during startup.
          }
        }
      }))
    })().catch(() => {})
  }

  // Graceful drain, auto-enabled with reusePort (i.e. exactly the
  // zero-downtime deploy setup): when the supervisor SIGTERMs the OLD
  // release's instance after the new one is healthy, stop accepting new
  // connections but let in-flight requests finish — without this, a
  // request being served at the kill instant gets a connection reset.
  // Bounded by SHUTDOWN_GRACE_MS (default 15s) so a stuck keep-alive
  // can't outlive the supervisor's own kill timeout mid-request. Scoped
  // to reusePort so a plain dev server never hooks process signals.
  if (options.reusePort) {
    const graceMs = Number(process.env.SHUTDOWN_GRACE_MS) || 15_000
    process.once('SIGTERM', () => {
      setTimeout(() => process.exit(0), graceMs).unref()
      Promise.resolve(_server?.stop()).then(() => process.exit(0))
    })
  }

  // Print Bun-style startup banner
  if (!options.quiet) {
    const elapsed = (performance.now() - startTime).toFixed(0)
    const routeCount = (sourceFiles as string[] | null)?.length || 0
    const patternsStr = patterns.join(', ')
    const openUrl = resolveServeOpenUrl(actualPort, options.openPath)

    console.log()
    console.log(`  \x1b[36m\x1b[1mstx\x1b[0m`)
    console.log()
    console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal\x1b[0m:   \x1b[36m${openUrl}\x1b[0m`)
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
          Bun.spawn([openCmd, openUrl])
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
