/* eslint-disable no-new-func */

/**
 * Laravel-like named routes system for STX
 *
 * This provides the ability to define routes with names and generate URLs for them,
 * similar to Laravel's route naming and the route() helper.
 */

interface RouteDefinition {
  path: string
  name?: string
  params?: Record<string, any>
}

// Store for registered routes
const routes: Record<string, RouteDefinition> = {}

// Domain config
let appUrl: string = ''

/**
 * Set the base URL for the application
 */
export function setAppUrl(url: string): void {
  appUrl = url.replace(/\/$/, '') // Remove trailing slash if present
}

/**
 * Register a route with a name
 */
export function defineRoute(name: string, path: string, params: Record<string, any> = {}): void {
  routes[name] = { path, name, params }
}

/**
 * Define multiple routes at once
 */
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

/**
 * Generate a URL for a named route with parameters
 */
export function route(
  name: string,
  params: Record<string, any> = {},
  absolute = false,
): string {
  const route = routes[name]

  if (!route) {
    console.warn(`Route [${name}] not defined.`)
    return '#undefined-route'
  }

  // Merge default params with provided params
  const mergedParams = { ...route.params, ...params }

  // Replace parameters in the path
  let path = route.path

  // Replace named parameters (:param)
  path = path.replace(/:(\w+)/g, (_, paramName) => {
    const value = mergedParams[paramName]

    if (value === undefined) {
      console.warn(`Missing parameter [${paramName}] for route [${name}].`)
      return `:${paramName}`
    }

    // Remove used parameter from the object
    delete mergedParams[paramName]

    return encodeURIComponent(String(value))
  })

  // Add remaining parameters as query string
  const remainingParams = Object.entries(mergedParams)
  if (remainingParams.length > 0) {
    const queryString = remainingParams
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&')

    path += (path.includes('?') ? '&' : '?') + queryString
  }

  // Return absolute or relative URL
  return absolute && appUrl ? `${appUrl}${path}` : path
}

/**
 * Create a route URL directive processor for STX templates
 */
export function processRouteDirectives(template: string): string {
  return template.replace(/@route\(\s*(['"])([^'"]+)\1(?:\s*,\s*(\{[^}]+\}))?\s*(?:,\s*(true|false)\s*)?\)/g, (_, quote, routeName, paramsJson, absolute) => {
    try {
      // Parse the params object if provided
      const params = paramsJson ? new Function(`return ${paramsJson}`)() : {}
      // Parse the absolute flag if provided
      const isAbsolute = absolute === 'true'

      return route(routeName, params, isAbsolute)
    }
    catch (error) {
      console.error(`Error processing @route directive: ${error}`)
      return '#route-error'
    }
  })
}

/**
 * Reset all routes (mainly for testing)
 */
export function resetRoutes(): void {
  Object.keys(routes).forEach((key) => {
    delete routes[key]
  })
  appUrl = ''
}
