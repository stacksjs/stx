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

export function patternToRegex(pattern: string): { regex: RegExp, params: string[] } {
  const params: string[] = []

  let regexStr = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&')

  // Handle optional params (/:param?)
  regexStr = regexStr.replace(/\/:([^/]+)\?/g, (_, name) => {
    params.push(name)
    return '(?:/([^/]+))?'
  })

  // Handle catch-all params (:param*)
  regexStr = regexStr.replace(/:([^/]+)\*/g, (_, name) => {
    params.push(name)
    return '(.+)'
  })

  // Handle regular params (:param)
  regexStr = regexStr.replace(/:([^/]+)/g, (_, name) => {
    params.push(name)
    return '([^/]+)'
  })

  regexStr = `^${regexStr}$`

  return { regex: new RegExp(regexStr), params }
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
