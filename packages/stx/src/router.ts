// Re-export from stx-router
import { matchRoute, Router as _Router } from 'stx-router'
import type { Route, RouterConfig } from 'stx-router'

export type { Route, RouteMatch } from 'stx-router'
export { findErrorPage, formatRoutes, generateRouteTypes, matchRoute } from 'stx-router'

// Backwards-compatible createRouter that returns Route[] (original signature)
export interface RouterOptions {
  pagesDir?: string
  extensions?: string[]
}

export function createRouter(baseDir: string, options: RouterOptions = {}): Route[] {
  const router = new _Router(baseDir, options as RouterConfig)
  return router.routes
}

export function getRouteParams(pathname: string, routes: Route[]): Record<string, string> | null {
  const result = matchRoute(pathname, routes)
  return result ? result.params : null
}
