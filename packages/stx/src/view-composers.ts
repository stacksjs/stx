/**
 * View Composers functionality for stx templating
 * Similar to Laravel's View Composers, this allows registering
 * callbacks that should run whenever a specific view is rendered.
 */

/**
 * Type definition for view composer callback function
 */
export type ViewComposerCallback = (context: Record<string, any>, filePath: string) => void | Promise<void>

/**
 * Store for all registered view composers
 */
interface ComposerStore {
  // Pattern composers match on any view that matches the given pattern
  patterns: Array<{
    pattern: RegExp
    callback: ViewComposerCallback
  }>

  // Exact composers only match on the exact view name
  exact: Record<string, ViewComposerCallback[]>
}

// Store for all registered view composers
const composers: ComposerStore = {
  patterns: [],
  exact: {},
}

/**
 * Register a composer for a specific view
 */
export function composer(view: string, callback: ViewComposerCallback): void {
  if (!composers.exact[view]) {
    composers.exact[view] = []
  }
  composers.exact[view].push(callback)
}

/**
 * Register a composer for all views matching a pattern
 */
export function composerPattern(pattern: string | RegExp, callback: ViewComposerCallback): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  composers.patterns.push({ pattern: regex, callback })
}

/**
 * Execute all composers for a given view
 */
export async function runComposers(filePath: string, context: Record<string, any>): Promise<void> {
  const viewName = filePath.split('/').pop()?.split('.')[0] || ''

  // Run exact match composers
  if (composers.exact[filePath]) {
    for (const callback of composers.exact[filePath]) {
      await Promise.resolve(callback(context, filePath))
    }
  }

  if (composers.exact[viewName]) {
    for (const callback of composers.exact[viewName]) {
      await Promise.resolve(callback(context, filePath))
    }
  }

  // Run pattern match composers
  for (const { pattern, callback } of composers.patterns) {
    if (pattern.test(filePath) || pattern.test(viewName)) {
      await Promise.resolve(callback(context, filePath))
    }
  }
}

/**
 * Clear all registered composers
 * (Mainly for testing purposes)
 */
export function clearComposers(): void {
  composers.patterns = []
  composers.exact = {}
}
