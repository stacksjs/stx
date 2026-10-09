/**
 * Domain routes: a host whose home page is a page of the site.
 *
 * ```ts
 * serve({
 *   domains: {
 *     '{username}.example.com': '/{username}',
 *     'shop.example.com': '/store',
 *   },
 * })
 * ```
 *
 * `chris.example.com/` then renders exactly what `example.com/chris` renders
 * — the same file route, the same `route.params.username` — and the address
 * bar keeps saying `chris.example.com`. It is how a profile, a team or a shop
 * gets a domain of its own on a site that is otherwise one app, the way a
 * GitHub Pages or a Substack subdomain works.
 *
 * Only the host's root is routed. Every other path on that host — scripts,
 * styles, images, `/api`, the other pages a navigation bar links to — is the
 * site's own, answered as it would be on the main domain, so one page can be
 * given a domain without the rest of the site breaking under it.
 *
 * Unless the route says where the rest of the site lives:
 *
 * ```ts
 * domains: {
 *   '{username}.example.com': { to: '/{username}', elsewhere: 'https://example.com' },
 * }
 * ```
 *
 * Then a request for any other PAGE on that host is redirected there
 * (`chris.example.com/pricing` → `example.com/pricing`), while its assets,
 * `/api` and `public/` files are still answered in place, because the page
 * at its root needs them. A browser keeps a session per origin: without
 * this, signing in from a profile's own domain signs in to that domain, and
 * the visitor ends up using the whole app under someone else's name.
 *
 * A pattern is a hostname whose labels are either literal or `{name}`, which
 * matches exactly one DNS label (`{username}.example.com` matches
 * `chris.example.com`, not `a.b.example.com` and not the bare apex). Literal
 * patterns win over parameterised ones, then the one with more literal
 * labels, so `docs.example.com` can be carved out of `{username}.example.com`.
 * A parameter's value is placed in the target path URL-encoded.
 *
 * The host is read from `X-Forwarded-Host` before `Host`, because behind a
 * gateway the latter is the upstream's address. Trusting it is safe here: a
 * forged value can only choose which page of this same site renders for the
 * root path, which the requester could have asked for by its own path.
 */

/** One label of a compiled pattern. */
type Label = { literal: string } | { param: string }

export interface DomainRoute {
  /** The pattern as written, for boot output and errors. */
  pattern: string
  labels: Label[]
  /** The target path, with `{name}` placeholders. */
  to: string
  /** Where the host's other pages live, an origin like `https://example.com`. */
  elsewhere?: string
  /** How many labels are literal: more is more specific. */
  literals: number
}

export type DomainRoutesOption = Record<string, string | { to: string, elsewhere?: string }>

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/
const PARAM = /^\{([A-Za-z_]\w*)\}$/

/**
 * Compile `{ pattern: path }` into routes, most specific first. Invalid
 * entries are dropped with a warning rather than thrown: a malformed domain
 * route must not stop a site booting.
 */
export function compileDomainRoutes(input: DomainRoutesOption | undefined, warn: (message: string) => void = () => {}): DomainRoute[] {
  const routes: DomainRoute[] = []
  for (const [rawPattern, target] of Object.entries(input ?? {})) {
    const pattern = String(rawPattern).trim().toLowerCase().replace(/\.$/, '')
    const rawTo = typeof target === 'object' && target ? target.to : target
    const to = String(rawTo ?? '').trim()
    let elsewhere: string | undefined
    if (typeof target === 'object' && target?.elsewhere) {
      try {
        const url = new URL(String(target.elsewhere))
        if (url.protocol === 'https:' || url.protocol === 'http:')
          elsewhere = url.origin
      }
      catch {}
      if (!elsewhere) {
        warn(`[stx] domain route "${rawPattern}" ignored: elsewhere "${target.elsewhere}" is not an http(s) origin`)
        continue
      }
    }
    const parts = pattern.split('.')
    if (parts.length < 2 || !to.startsWith('/')) {
      warn(`[stx] domain route "${rawPattern}" -> "${rawTo}" ignored: a route is a hostname with a dot and a path starting with "/"`)
      continue
    }
    const labels: Label[] = []
    const params = new Set<string>()
    let valid = true
    for (const part of parts) {
      const param = PARAM.exec(part)
      if (param) {
        labels.push({ param: param[1]! })
        params.add(param[1]!)
      }
      else if (LABEL.test(part)) {
        labels.push({ literal: part })
      }
      else {
        valid = false
      }
    }
    const missing = [...to.matchAll(/\{(\w+)\}/g)].map(match => match[1]!).filter(name => !params.has(name))
    if (!valid || missing.length) {
      warn(`[stx] domain route "${rawPattern}" -> "${rawTo}" ignored: ${!valid ? 'a label is neither a hostname label nor {name}' : `the path uses {${missing.join('}, {')}} which the hostname does not capture`}`)
      continue
    }
    routes.push({ pattern, labels, to, ...(elsewhere ? { elsewhere } : {}), literals: labels.filter(label => 'literal' in label).length })
  }
  return routes.sort((a, b) => b.literals - a.literals || b.labels.length - a.labels.length)
}

/** The hostname a request was made to, without the port, lowercased. */
export function requestHost(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwarded || req.headers.get('host') || new URL(req.url).host
  return host.replace(/:\d+$/, '').replace(/\.$/, '').toLowerCase()
}

/** The params a host captures for a route, or null when it does not match. */
export function matchDomain(host: string, route: DomainRoute): Record<string, string> | null {
  const parts = host.split('.')
  if (parts.length !== route.labels.length)
    return null
  const params: Record<string, string> = {}
  for (let i = 0; i < parts.length; i++) {
    const label = route.labels[i]!
    const part = parts[i]!
    if ('literal' in label) {
      if (label.literal !== part)
        return null
    }
    else {
      if (!LABEL.test(part))
        return null
      params[label.param] = part
    }
  }
  return params
}

/**
 * The path a request to `host` at `pathname` should render, or null when no
 * domain route applies (a host that matches nothing, or a path other than
 * the root).
 */
export function resolveDomainRoute(host: string, pathname: string, routes: DomainRoute[]): string | null {
  if (!routes.length)
    return null
  if (pathname !== '/' && pathname !== '' && pathname !== '/index')
    return null
  for (const route of routes) {
    const params = matchDomain(host, route)
    if (!params)
      continue
    return route.to.replace(/\{(\w+)\}/g, (_, name: string) => encodeURIComponent(params[name] ?? ''))
  }
  return null
}

/**
 * Where a request for another page on a routed host belongs, or null to
 * answer it in place.
 *
 * Only for a route that names `elsewhere`, only for a host that matches it,
 * only for paths other than the root, and only for page requests: `isAsset`
 * is the server's own test for scripts, styles, `/api` and `public/` files,
 * which stay where the page at the root can load them.
 */
export function resolveDomainElsewhere(host: string, pathname: string, search: string, routes: DomainRoute[], isAsset: (pathname: string) => boolean): string | null {
  if (!routes.length || pathname === '/' || pathname === '' || pathname === '/index')
    return null
  for (const route of routes) {
    if (!matchDomain(host, route))
      continue
    if (!route.elsewhere || isAsset(pathname))
      return null
    return `${route.elsewhere}${pathname}${search}`
  }
  return null
}

/** One line for boot output: `{username}.example.com/ → /{username}`. */
export function describeDomainRoutes(routes: DomainRoute[]): string {
  return routes.map(route => `${route.pattern}/ → ${route.to}${route.elsewhere ? ` (other pages: ${route.elsewhere})` : ''}`).join(', ')
}
