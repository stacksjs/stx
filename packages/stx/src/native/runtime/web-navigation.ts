/**
 * The web's ways of going somewhere, on a native screen.
 *
 * A web view moves on with a link (`<a href>`, `<StxLink to>`), with
 * `navigate()` (which asks `window.stxRouter`), and with `location` and
 * `history`. On a phone each of them is Craft navigation, by the same web
 * path: `/plans/12` opens the screen the app maps to `/plans/12`, as the
 * browser opens that page. There is no `/m` or other native prefix; the
 * app's routes are its web paths.
 *
 * - A path of the app, or a URL of the app's own site (`craft.app.url`),
 *   is `craft.navigation.open(path)`; a replacing move (`navigate(url, {
 *   replace: true })`, `location.replace`) is `navigation.replace(path)`.
 * - Another site, `mailto:` or `tel:` goes to the system (`craft.linking`).
 * - A fragment (`#top`) and `javascript:` go nowhere.
 */

type AnyRecord = Record<string, any> // eslint-disable-line ts/no-explicit-any

/** Where an href goes: a path of the app, a URL for the system, or nowhere. */
export type NativeLinkTarget = { path: string } | { url: string } | null

const SYSTEM_SCHEMES = /^(?:https?|mailto|tel|sms):/i

/** Resolve an href as the browser on `base` would, then say where it goes. */
export function nativeLinkTarget(href: unknown, base: string, appURL?: string): NativeLinkTarget {
  const value = typeof href === 'string' ? href.trim() : ''
  if (!value || value.startsWith('#') || /^javascript:/i.test(value)) return null
  const URLClass = (globalThis as AnyRecord).URL
  let resolved: AnyRecord
  try {
    resolved = new URLClass(value, base)
  }
  catch {
    return value.startsWith('/') ? { path: value } : null
  }
  const site = appURL ? (() => { try { return new URLClass(appURL) } catch { return null } })() : null
  const own = resolved.origin === new URLClass(base).origin || (site && resolved.origin === site.origin)
  if (own && /^https?:$/.test(resolved.protocol)) return { path: `${resolved.pathname}${resolved.search}${resolved.hash}` }
  if (SYSTEM_SCHEMES.test(resolved.href)) return { url: resolved.href }
  return null
}

/** A `location`, read from the screen's route and moved by Craft navigation. */
function createNativeLocation(read: () => string, go: (href: string, replace: boolean) => void, reload: () => void): AnyRecord {
  const URLClass = (globalThis as AnyRecord).URL
  const part = (name: string) => () => new URLClass(read())[name]
  const location: AnyRecord = {
    assign: (href: string) => go(String(href), false),
    replace: (href: string) => go(String(href), true),
    reload,
    toString: () => read(),
  }
  for (const name of ['origin', 'protocol', 'host', 'hostname', 'port', 'pathname', 'search', 'hash'])
    Object.defineProperty(location, name, { enumerable: true, get: part(name) })
  Object.defineProperty(location, 'href', {
    enumerable: true,
    get: read,
    set: (href: unknown) => go(String(href), false),
  })
  return location
}

export interface NativeNavigationOptions {
  /** The screen's address as the host opened it (`/plans/12?week=2`), if it said. */
  routeURL?: string
  /** The app's site (`craft.app.url`). */
  appURL?: string
}

/**
 * Follow `href` with Craft navigation. Returns false when it goes nowhere.
 * `replace` replaces this screen rather than pushing another.
 */
export function followNativeLink(craft: AnyRecord, href: unknown, base: string, options: { replace?: boolean, appURL?: string } = {}): boolean {
  const target = nativeLinkTarget(href, base, options.appURL)
  if (!target) return false
  if ('url' in target) {
    const open = craft.linking?.openURL ?? craft.openURL
    if (typeof open !== 'function') {
      console.error(`[stx native] this app cannot open ${target.url}`)
      return false
    }
    Promise.resolve(open(target.url)).catch((error: unknown) => console.error(`[stx native] could not open ${target.url}: ${error instanceof Error ? error.message : String(error)}`))
    return true
  }
  if (options.replace) craft.navigation.replace(target.path)
  else craft.navigation.open(target.path)
  return true
}

/**
 * Install `stxRouter`, `location` and `history` for a native screen. Only
 * for a native realm: a browser renderer keeps the browser's own. Returns
 * the function a pressed link follows (native-host's default action).
 */
const followers = new WeakMap<object, (href: unknown) => boolean>()

/** The link follower `installNativeNavigation` made for this `craft`, if any. */
export function nativeLinkFollower(craft: AnyRecord): ((href: unknown) => boolean) | undefined {
  return followers.get(craft)
}

export function installNativeNavigation(target: AnyRecord, craft: AnyRecord, options: NativeNavigationOptions): (href: unknown) => boolean {
  const site = (() => {
    try { return options.appURL ? new target.URL(options.appURL).origin : 'https://app.invalid' }
    catch { return 'https://app.invalid' }
  })()
  const routeURL = options.routeURL || '/'
  const here = (): string => {
    try { return new target.URL(routeURL, site).href }
    catch { return `${site}/` }
  }
  const go = (href: unknown, replace = false): boolean => followNativeLink(craft, href, here(), { replace, appURL: options.appURL })
  followers.set(craft, href => go(href))

  // `navigate()` asks the router first (signals-navigation-runtime.ts).
  if (!target.stxRouter) {
    target.stxRouter = {
      navigate: (url: string, routed: AnyRecord = {}) => { go(url, !!routed?.replace) },
      // A screen's data is its own to reload: there is no page to fetch again.
      refresh: () => Promise.resolve(false),
      invalidate: () => {},
    }
  }
  const stub = target.location
  if (!stub || typeof stub.assign !== 'function') {
    target.location = createNativeLocation(here, (href, replace) => { go(href, replace) }, () => {
      const at = new target.URL(here())
      craft.navigation.replace(`${at.pathname}${at.search}${at.hash}`)
    })
  }
  const history = target.history
  if (history && typeof history.back === 'function') {
    history.back = () => { craft.navigation.back() }
    history.go = (delta: number) => { if (Number(delta) < 0) craft.navigation.back() }
  }
  return go
}

/** `/plans/` and `/plans` are one path. */
function normalPath(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path
}

/**
 * Whether a link points at the screen being shown, by the web router's rule
 * (packages/router `linkState`): `active` for its path or a path under it,
 * `exact` for its path alone; a link with a query is current only where each
 * param it names has that value, and one without is exact only where there
 * is no query. `also` (`data-stx-active-match`) names more path prefixes that
 * make it current. Null for a link that is not the app's.
 */
export function nativeLinkState(href: unknown, here: string, also?: string | null): { active: boolean, exact: boolean } | null {
  if (typeof href !== 'string' || !href || href.startsWith('#')) return null
  const URLClass = (globalThis as AnyRecord).URL
  let link: AnyRecord
  let current: AnyRecord
  try {
    current = new URLClass(here)
    link = new URLClass(href, here)
  }
  catch {
    return null
  }
  if (link.origin !== current.origin) return null
  const path = normalPath(link.pathname)
  const at = normalPath(current.pathname)
  const have = new URLClass(`https://stx.invalid/${current.search}`).searchParams
  let query = true
  let linkHasQuery = false
  link.searchParams.forEach((value: string, name: string) => {
    linkHasQuery = true
    if (!have.getAll(name).includes(value)) query = false
  })
  const matched = String(also ?? '').split(/\s+/).some((prefix) => {
    const normal = normalPath(prefix)
    return !!normal && (at === normal || at.startsWith(`${normal}/`))
  })
  return {
    exact: query && (linkHasQuery || !current.search) && path === at,
    active: (query && (path === '/' ? at === '/' : at === path || at.startsWith(`${path}/`))) || matched,
  }
}

/**
 * A file-routed view's params from the address it is shown at: the view
 * `views/plans/[id].stx` at `/plans/12` is `{ id: '12' }`, as the web's
 * server hands them to `useRoute().params`. Segments are matched from the
 * end, so the directory the views live in does not matter; an `index` file
 * is its directory's page, and a final catch-all (`[...slug]`) takes what
 * follows the fixed segment before it.
 */
export function nativeRouteParams(source: string, pathname: string): Record<string, string> {
  const segments = source.replace(/\\/g, '/').replace(/\.stx$/, '').split('/').filter(Boolean)
  if (segments[segments.length - 1] === 'index') segments.pop()
  const parts = pathname.split('/').filter(Boolean)
  const params: Record<string, string> = {}
  const decode = (value: string): string => {
    try { return decodeURIComponent(value) }
    catch { return value }
  }
  for (let fromEnd = 0; fromEnd < segments.length; fromEnd++) {
    const segment = segments[segments.length - 1 - fromEnd]!
    const name = /^\[(\.\.\.)?([\w-]+)\]$/.exec(segment)
    if (!name) continue
    if (name[1]) {
      // A final catch-all takes what follows the fixed segment before it
      // (`docs/[...slug]` at `/docs/a/b` is `a/b`).
      const before = segments[segments.length - 2 - fromEnd]
      const at = fromEnd === 0 && before && !before.startsWith('[') ? parts.lastIndexOf(before) : -1
      if (at !== -1) params[name[2]!] = parts.slice(at + 1).map(decode).join('/')
      continue
    }
    const part = parts[parts.length - 1 - fromEnd]
    if (part !== undefined) params[name[2]!] = decode(part)
  }
  return params
}
