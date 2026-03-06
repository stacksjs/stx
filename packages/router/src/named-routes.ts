interface RouteDefinition {
  path: string
  name?: string
  params?: Record<string, any>
}

const routes: Record<string, RouteDefinition> = {}
let appUrl: string = ''

export function setAppUrl(url: string): void {
  appUrl = url.replace(/\/$/, '')
}

export function defineRoute(name: string, routePath: string, params: Record<string, any> = {}): void {
  routes[name] = { path: routePath, name, params }
}

export function defineRoutes(routeDefinitions: Record<string, string | RouteDefinition>): void {
  for (const [name, definition] of Object.entries(routeDefinitions)) {
    if (typeof definition === 'string') {
      routes[name] = { path: definition, name }
    }
    else {
      routes[name] = { ...definition, name }
    }
  }
}

export function route(
  name: string,
  params: Record<string, any> = {},
  absolute = false,
): string {
  const r = routes[name]

  if (!r) {
    console.warn(`Route [${name}] not defined.`)
    return '#undefined-route'
  }

  const mergedParams = { ...r.params, ...params }
  let routePath = r.path

  routePath = routePath.replace(/:(\w+)/g, (_, paramName) => {
    const value = mergedParams[paramName]

    if (value === undefined) {
      console.warn(`Missing parameter [${paramName}] for route [${name}].`)
      return `:${paramName}`
    }

    delete mergedParams[paramName]
    return encodeURIComponent(String(value))
  })

  const remainingParams = Object.entries(mergedParams)
  if (remainingParams.length > 0) {
    const queryString = remainingParams
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')

    routePath += (routePath.includes('?') ? '&' : '?') + queryString
  }

  return absolute && appUrl ? `${appUrl}${routePath}` : routePath
}

export function resetRoutes(): void {
  for (const key of Object.keys(routes)) {
    delete routes[key]
  }
  appUrl = ''
}
