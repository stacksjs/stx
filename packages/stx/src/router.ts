// Re-export from @stacksjs/router
import { matchRoute, Router as _Router } from '@stacksjs/router'
import type { Route, RouterConfig } from '@stacksjs/router'

export type { Route, RouteMatch } from '@stacksjs/router'
export { findErrorPage, formatRoutes, generateRouteTypes, matchRoute } from '@stacksjs/router'

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
