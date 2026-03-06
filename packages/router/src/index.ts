// File-based router
export { createRouter, findErrorPage, formatRoutes, Router } from './file-router'

// Route pattern matching
export { filePathToPattern, matchRoute, patternToRegex } from './matcher'

// Named routes
export { defineRoute, defineRoutes, resetRoutes, route, setAppUrl } from './named-routes'

// Middleware system
export {
  abortNavigation,
  clearMiddleware,
  createClientCookieManager,
  createMiddlewareContext,
  createRouteLocation,
  createServerCookieManager,
  createStorageManager,
  defineMiddleware,
  getMiddleware,
  getMiddlewareNames,
  hasMiddleware,
  loadMiddlewareFromDirectory,
  navigateTo,
  registerMiddleware,
  runMiddleware,
} from './middleware'

// Nested layouts
export { resolveLayoutChain } from './nested-layouts'

// Route type generation
export { generateRouteTypes } from './codegen'

// Client-side SPA navigation
export { getRouterScript } from './client'

// Types
export type {
  AbortNavigationResult,
  CookieManager,
  CookieOptions,
  MiddlewareContext,
  MiddlewareMode,
  MiddlewareOptions,
  MiddlewareResult,
  NavigateToOptions,
  NavigateToResult,
  NavigationError,
  NavigationResult,
  Route,
  RouteLocation,
  RouteMatch,
  RouteMiddlewareDefinition,
  RouteMiddlewareHandler,
  RouterConfig,
  StorageManager,
} from './types'
