/**
 * STX File-Based Router
 *
 * Scans pages/ directory and creates routes from file structure.
 * Supports dynamic routes with [param] syntax.
 *
 * Examples:
 *   pages/index.stx       → /
 *   pages/about.stx       → /about
 *   pages/chat/index.stx  → /chat
 *   pages/chat/[id].stx   → /chat/:id (dynamic)
 */

import fs from 'node:fs'
import path from 'node:path'

export interface Route {
  /** The URL pattern (e.g., /chat/:id) */
  pattern: string
  /** The regex to match the route */
  regex: RegExp
  /** Parameter names extracted from dynamic segments */
  params: string[]
  /** Absolute path to the .stx file */
  filePath: string
  /** Whether this is a dynamic route */
  isDynamic: boolean
}

export interface RouteMatch {
  route: Route
  params: Record<string, string>
}

export interface RouterOptions {
  /** Directory containing page files (default: 'pages') */
  pagesDir?: string
  /** File extensions to consider as pages (default: ['.stx']) */
  extensions?: string[]
}

/**
 * Scans a directory recursively for page files
 */
function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      // Skip special directories
      if (entry.name.startsWith('_') || entry.name.startsWith('.')) {
        continue
      }
      files.push(...scanDirectory(fullPath, extensions))
    } else if (entry.isFile()) {
      // Check if it's a page file
      const ext = path.extname(entry.name)
      if (extensions.includes(ext)) {
        // Skip files starting with _ (partials/layouts)
        if (!entry.name.startsWith('_')) {
          files.push(fullPath)
        }
      }
    }
  }

  return files
}

/**
 * Converts a file path to a route pattern
 *
 * Examples:
 *   pages/index.stx       → /
 *   pages/about.stx       → /about
 *   pages/chat/index.stx  → /chat
 *   pages/chat/[id].stx   → /chat/:id
 *   pages/blog/[...slug].stx → /blog/:slug* (catch-all)
 */
function filePathToPattern(filePath: string, pagesDir: string): string {
  // Get relative path from pages directory
  const relativePath = path.relative(pagesDir, filePath)

  // Remove extension
  let route = relativePath.replace(/\.(stx|md)$/, '')

  // Convert path separators to URL separators
  route = route.split(path.sep).join('/')

  // Handle index files
  if (route === 'index') {
    return '/'
  }
  if (route.endsWith('/index')) {
    route = route.slice(0, -6)
  }

  // Convert [param] to :param
  route = route.replace(/\[([^\]]+)\]/g, ':$1')

  // Convert [...param] to :param* (catch-all)
  route = route.replace(/:\.\.\.([^/]+)/g, ':$1*')

  return `/${route}`
}

/**
 * Converts a route pattern to a regex and extracts param names
 */
function patternToRegex(pattern: string): { regex: RegExp; params: string[] } {
  const params: string[] = []

  // Escape special regex characters except : and *
  let regexStr = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&')

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

  // Add start/end anchors
  regexStr = `^${regexStr}$`

  return { regex: new RegExp(regexStr), params }
}

/**
 * Creates a router from a pages directory
 */
export function createRouter(baseDir: string, options: RouterOptions = {}): Route[] {
  const pagesDir = path.resolve(baseDir, options.pagesDir || 'pages')
  const extensions = options.extensions || ['.stx']

  // Scan for page files
  const files = scanDirectory(pagesDir, extensions)

  // Convert to routes
  const routes: Route[] = files.map((filePath) => {
    const pattern = filePathToPattern(filePath, pagesDir)
    const { regex, params } = patternToRegex(pattern)

    return {
      pattern,
      regex,
      params,
      filePath,
      isDynamic: params.length > 0,
    }
  })

  // Sort routes: static routes first, then by specificity (more segments = higher priority)
  routes.sort((a, b) => {
    // Static routes come before dynamic routes
    if (!a.isDynamic && b.isDynamic) return -1
    if (a.isDynamic && !b.isDynamic) return 1

    // More specific routes (more segments) come first
    const aSegments = a.pattern.split('/').length
    const bSegments = b.pattern.split('/').length
    if (aSegments !== bSegments) return bSegments - aSegments

    // Alphabetical order as tiebreaker
    return a.pattern.localeCompare(b.pattern)
  })

  return routes
}

/**
 * Matches a URL pathname against routes
 */
export function matchRoute(pathname: string, routes: Route[]): RouteMatch | null {
  // Normalize pathname
  const normalizedPath = pathname === '' ? '/' : pathname

  for (const route of routes) {
    const match = normalizedPath.match(route.regex)
    if (match) {
      // Extract params
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
 * Gets route params from a URL
 */
export function getRouteParams(pathname: string, routes: Route[]): Record<string, string> | null {
  const match = matchRoute(pathname, routes)
  return match ? match.params : null
}

/**
 * Pretty prints routes for console output
 */
export function formatRoutes(routes: Route[], baseDir: string): string[] {
  return routes.map((route) => {
    const relativePath = path.relative(baseDir, route.filePath)
    const dynamicLabel = route.isDynamic ? ' (dynamic)' : ''
    return `${route.pattern} → ${relativePath}${dynamicLabel}`
  })
}
