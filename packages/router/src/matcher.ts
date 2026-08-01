import path from 'node:path'

export function filePathToPattern(filePath: string, pagesDir: string): string {
  const relativePath = path.relative(pagesDir, filePath)
  let route = relativePath.replace(/\.(stx|md)$/, '')

  route = route.split(path.sep).join('/')

  if (route === 'index') {
    return '/'
  }
  if (route.endsWith('/index')) {
    route = route.slice(0, -6)
  }

  // Convert [[param]] to :param? (optional) — BEFORE required params
  route = route.replace(/\[\[([^\]]+)\]\]/g, ':$1?')

  // Convert [param] to :param
  route = route.replace(/\[([^\]]+)\]/g, ':$1')

  // Convert [...param] to :param* (catch-all)
  route = route.replace(/:\.\.\.([^/]+)/g, ':$1*')

  return `/${route}`
}

/**
 * Compile a route pattern into a regex and the parameter names its capture
 * groups correspond to.
 *
 * Single left-to-right pass, which is the whole point. Doing it as three
 * successive `.replace()` sweeps - optional, then catch-all, then required -
 * collects the names in *sweep* order while the capture groups end up in
 * *pattern* order, and the two disagree the moment one pattern mixes kinds.
 *
 * `/:owner/:repository/tree/:ref/:path*` collected as
 * `[path, owner, repository, ref]` against groups `(owner)(repository)(ref)(path)`,
 * so every value was bound to the wrong name: a repository browser given a URL
 * showed the root of a repository named after the branch. Nothing errored -
 * the regex matched and the page rendered - which is why it reads as a routing
 * mystery rather than an off-by-one.
 */
export function patternToRegex(pattern: string): { regex: RegExp, params: string[] } {
  const params: string[] = []
  let regexStr = ''
  let i = 0

  while (i < pattern.length) {
    const rest = pattern.slice(i)

    // An optional parameter swallows the slash in front of it, so `/a/:b?`
    // still matches `/a`.
    const optional = /^\/:([^/?*]+)\?/.exec(rest)
    if (optional) {
      params.push(optional[1]!)
      regexStr += '(?:/([^/]+))?'
      i += optional[0].length
      continue
    }

    // A catch-all spans separators; everything else stops at one.
    const catchAll = /^:([^/?*]+)\*/.exec(rest)
    if (catchAll) {
      params.push(catchAll[1]!)
      regexStr += '(.+)'
      i += catchAll[0].length
      continue
    }

    const required = /^:([^/?*]+)/.exec(rest)
    if (required) {
      params.push(required[1]!)
      regexStr += '([^/]+)'
      i += required[0].length
      continue
    }

    // Literal character, escaped so it cannot act as regex syntax.
    regexStr += pattern[i]!.replace(/[.+^${}()|[\]\\*?]/g, '\\$&')
    i += 1
  }

  return { regex: new RegExp(`^${regexStr}$`), params }
}

export function matchRoute(pathname: string, routes: { pattern: string, regex: RegExp, params: string[] }[]): { route: typeof routes[0], params: Record<string, string> } | null {
  const normalizedPath = pathname === '' ? '/' : pathname

  for (const route of routes) {
    const match = normalizedPath.match(route.regex)
    if (match) {
      const params: Record<string, string> = {}
      route.params.forEach((name, index) => {
        params[name] = match[index + 1]
      })
      return { route, params }
    }
  }

  return null
}

/**
 * Compile a *file-style* route path - the one with `[param]` brackets - into a
 * regex and its parameter names.
 *
 * File-based routers keep re-deriving this by hand, and the hand-rolled version
 * is always the same two lines:
 *
 *   paramNames = [...p.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
 *   regex      = p.replace(/\[([^\]]+)\]/g, '([^/]+)')
 *
 * which is correct for `[id]` and wrong for `[...path]` in two ways at once:
 * the name keeps its dots, so a lookup by `path` finds nothing, and the segment
 * compiles to `([^/]+)`, which cannot span a separator, so any multi-segment
 * URL simply fails to match. Both symptoms, one cause, and neither is obvious
 * from the outside - the route just quietly does not exist.
 *
 * Exported so nothing has to write those two lines again.
 */
export function bracketPathToRegex(routePath: string): { regex: RegExp, params: string[] } {
  // Reuse the one compiler rather than adding a fourth dialect: convert the
  // bracket spelling to the `:name` spelling, then hand it over.
  const pattern = routePath
    .replace(/\[\[([^\]]+)\]\]/g, ':$1?')
    .replace(/\[([^\]]+)\]/g, ':$1')
    .replace(/:\.\.\.([^/]+)/g, ':$1*')

  return patternToRegex(pattern)
}
