import fs from 'node:fs'
import path from 'node:path'
import type { Route, RouteMatch, RouterConfig } from './types'
import { generateRouteTypes, generateRouteManifest } from './codegen'
import { filePathToPattern, patternToRegex } from './matcher'
import { resolveLayoutChain } from './nested-layouts'

function scanDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = []

  if (!fs.existsSync(dir)) {
    return files
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) {
        continue
      }
      files.push(...scanDirectory(fullPath, extensions))
    }
    else if (entry.isFile()) {
      const ext = path.extname(entry.name)
      if (extensions.includes(ext)) {
        // Skip layout files from being routes themselves
        if (entry.name.startsWith('_') && entry.name !== '_layout.stx') {
          continue
        }
        // Don't register _layout.stx as a route
        if (entry.name === '_layout.stx') {
          continue
        }
        files.push(fullPath)
      }
    }
  }

  return files
}

export class Router {
  routes: Route[]
  private pagesDir: string
  private pagesDirs: string[]
  private config: RouterConfig

  constructor(baseDir: string, config: RouterConfig = {}) {
    this.config = config

    // Resolve the stack of page roots. `pagesDirs` wins when both are
    // set; otherwise fall back to the single-root `pagesDir`. Each
    // entry is resolved relative to `baseDir`.
    const rawDirs = (config.pagesDirs && config.pagesDirs.length > 0)
      ? config.pagesDirs
      : [config.pagesDir || 'pages']
    this.pagesDirs = rawDirs.map(d => path.resolve(baseDir, d))
    // For backwards compatibility, `pagesDir` keeps pointing at the
    // first root — that's the user-facing root for codegen output.
    this.pagesDir = this.pagesDirs[0]

    const extensions = config.extensions || ['.stx']

    // Scan each root and bucket files by their resulting URL pattern.
    // Earlier roots win, so a user's `resources/views/cart.stx` shadows
    // the framework's `storage/framework/defaults/resources/views/cart.stx`.
    const seenPatterns = new Set<string>()
    this.routes = []
    for (const dir of this.pagesDirs) {
      const files = scanDirectory(dir, extensions)
      for (const filePath of files) {
        const pattern = filePathToPattern(filePath, dir)
        if (seenPatterns.has(pattern))
          continue
        seenPatterns.add(pattern)

        const { regex, params } = patternToRegex(pattern)
        const layouts = config.layouts !== false ? resolveLayoutChain(filePath, dir) : []

        this.routes.push({
          pattern,
          regex,
          params,
          filePath,
          isDynamic: params.length > 0,
          layout: layouts.length > 0 ? layouts[layouts.length - 1] : undefined,
        })
      }
    }

    // Sort: static before dynamic, more segments first
    this.routes.sort((a, b) => {
      if (!a.isDynamic && b.isDynamic) return -1
      if (a.isDynamic && !b.isDynamic) return 1
      const aSegments = a.pattern.split('/').length
      const bSegments = b.pattern.split('/').length
      if (aSegments !== bSegments) return bSegments - aSegments
      return a.pattern.localeCompare(b.pattern)
    })

    // Generate type declarations and route manifest into .stx/
    const stxDir = path.join(baseDir, '.stx')
    generateRouteTypes(this.routes, stxDir)
    generateRouteManifest(this.routes, stxDir, this.pagesDir)
  }

  match(pathname: string): RouteMatch | null {
    const normalizedPath = pathname === '' ? '/' : pathname

    for (const route of this.routes) {
      const m = normalizedPath.match(route.regex)
      if (m) {
        const params: Record<string, string> = {}
        route.params.forEach((name, index) => {
          params[name] = m[index + 1]
        })
        return { route, params }
      }
    }

    return null
  }

  resolve(name: string, params?: Record<string, string>): string {
    const route = this.routes.find(r => r.pattern === name || r.filePath.includes(name))
    if (!route) return '#not-found'

    let resolved = route.pattern
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        resolved = resolved.replace(`:${key}`, encodeURIComponent(value))
      }
    }
    return resolved
  }

  addRoute(route: Route): void {
    this.routes.push(route)
    this.routes.sort((a, b) => {
      if (!a.isDynamic && b.isDynamic) return -1
      if (a.isDynamic && !b.isDynamic) return 1
      return a.pattern.localeCompare(b.pattern)
    })
  }

  getLayout(route: Route): string | null {
    return route.layout ?? null
  }
}

export function createRouter(baseDir: string, config?: RouterConfig): Router {
  return new Router(baseDir, config)
}

export function findErrorPage(pagesDir: string, statusCode: number): string | null {
  const candidates = [`${statusCode}.stx`, 'error.stx']
  for (const candidate of candidates) {
    const filePath = path.join(pagesDir, candidate)
    if (fs.existsSync(filePath)) return filePath
  }
  return null
}

export function formatRoutes(routes: Route[], baseDir: string): string[] {
  return routes.map((route) => {
    const relativePath = path.relative(baseDir, route.filePath)
    const dynamicLabel = route.isDynamic ? ' (dynamic)' : ''
    return `${route.pattern} → ${relativePath}${dynamicLabel}`
  })
}
