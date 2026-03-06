import type { ApiRoute, HttpMethod } from './types'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

/**
 * Convert a file path to an API route path.
 * Examples:
 *   api/posts/[id].ts -> /api/posts/:id
 *   api/users.ts -> /api/users
 *   api/posts/[id]/comments.ts -> /api/posts/:id/comments
 */
export function filePathToRoutePath(filePath: string, prefix = '/api'): string {
  let route = filePath
    .replace(/\.(ts|js)$/, '')
    .replace(/\/index$/, '')

  // Convert [param] to :param
  route = route.replace(/\[([^\]]+)\]/g, ':$1')

  // Normalize slashes
  route = `/${route}`.replace(/\/+/g, '/')

  // Prepend prefix if the route doesn't already start with it
  if (prefix && !route.startsWith(prefix)) {
    route = `${prefix}${route}`
  }

  return route
}

function collectFiles(dir: string, base: string): string[] {
  const files: string[] = []

  if (!existsSync(dir))
    return files

  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...collectFiles(fullPath, base))
    }
    else if (entry.endsWith('.ts') || entry.endsWith('.js')) {
      files.push(fullPath)
    }
  }

  return files
}

export async function scanApiRoutes(apiDir: string, prefix = '/api'): Promise<ApiRoute[]> {
  const routes: ApiRoute[] = []
  const files = collectFiles(apiDir, apiDir)

  for (const filePath of files) {
    const relativePath = relative(apiDir, filePath)
    const routePath = filePathToRoutePath(relativePath, prefix)

    try {
      const mod = await import(filePath)

      for (const method of HTTP_METHODS) {
        if (mod[method]) {
          routes.push({
            path: routePath,
            method,
            handler: mod[method],
            filePath,
          })
        }
      }
    }
    catch {
      // Skip files that can't be imported
    }
  }

  return routes
}
