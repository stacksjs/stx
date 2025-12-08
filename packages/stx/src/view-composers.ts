/**
 * View Composers Module
 *
 * Similar to Laravel's View Composers, this module allows registering callbacks
 * that automatically run whenever a specific view (or views matching a pattern)
 * is rendered. Use this to inject data into templates without manually passing
 * it every time.
 *
 * ## Use Cases
 *
 * - Inject user data into all views
 * - Add navigation data to layout templates
 * - Load settings for specific page types
 * - Populate dropdown options across forms
 *
 * ## Registration Methods
 *
 * ### Exact Match
 * ```typescript
 * import { composer } from 'stx'
 *
 * // Match by exact view name
 * composer('dashboard', async (context) => {
 *   context.stats = await fetchDashboardStats()
 * })
 *
 * // Match by full file path
 * composer('/views/admin/users.stx', (context) => {
 *   context.roles = ['admin', 'editor', 'viewer']
 * })
 * ```
 *
 * ### Pattern Match
 * ```typescript
 * import { composerPattern } from 'stx'
 *
 * // Match all admin views
 * composerPattern(/^admin/, (context) => {
 *   context.isAdmin = true
 * })
 *
 * // Match with string pattern (converted to RegExp)
 * composerPattern('.*\\.settings\\.', (context) => {
 *   context.settingsMenu = loadSettingsMenu()
 * })
 * ```
 *
 * ## Execution Order
 *
 * 1. Exact match composers (by full file path)
 * 2. Exact match composers (by view name only)
 * 3. Pattern match composers (in registration order)
 *
 * All composers for a matching view run in sequence.
 * Async composers are awaited before the next runs.
 *
 * ## Important Notes
 *
 * - Composers modify the context object directly (no return value needed)
 * - Composers are global and persist for the application lifetime
 * - Use `clearComposers()` to reset in tests
 *
 * @module view-composers
 */

/**
 * Callback function type for view composers.
 *
 * @param context - The template context object (modify this directly)
 * @param filePath - Full path to the template file being rendered
 * @returns void or a Promise that resolves to void
 *
 * @example
 * ```typescript
 * const myComposer: ViewComposerCallback = async (context, filePath) => {
 *   context.user = await getCurrentUser()
 *   context.viewPath = filePath
 * }
 * ```
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
 * Register a composer for a specific view.
 *
 * The view can be either the full file path or just the view name (filename without extension).
 * Both will be checked when determining which composers to run.
 *
 * @param view - The view name or full file path to match
 * @param callback - Function to execute when the view is rendered
 *
 * @example
 * ```typescript
 * // Match by view name
 * composer('profile', (context) => {
 *   context.tabs = ['overview', 'settings', 'security']
 * })
 *
 * // Match by full path
 * composer('/app/views/users/edit.stx', async (context) => {
 *   context.timezones = await loadTimezones()
 * })
 * ```
 */
export function composer(view: string, callback: ViewComposerCallback): void {
  if (!composers.exact[view]) {
    composers.exact[view] = []
  }
  composers.exact[view].push(callback)
}

/**
 * Register a composer for all views matching a pattern.
 *
 * The pattern is tested against both the full file path and the view name.
 * If either matches, the composer will run.
 *
 * @param pattern - A RegExp or string pattern (strings are converted to RegExp)
 * @param callback - Function to execute when a matching view is rendered
 *
 * @example
 * ```typescript
 * // Match all admin views using RegExp
 * composerPattern(/^admin/, (context) => {
 *   context.adminNav = loadAdminNavigation()
 * })
 *
 * // Match views containing 'settings' using string pattern
 * composerPattern('settings', (context) => {
 *   context.settingsVersion = '2.0'
 * })
 *
 * // Match views ending with '-form'
 * composerPattern(/-form$/, (context) => {
 *   context.csrfToken = generateCsrfToken()
 * })
 * ```
 */
export function composerPattern(pattern: string | RegExp, callback: ViewComposerCallback): void {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  composers.patterns.push({ pattern: regex, callback })
}

/**
 * Execute all composers for a given view.
 *
 * This function is called automatically during template processing.
 * You typically don't need to call this directly.
 *
 * Execution order:
 * 1. Exact match by full file path
 * 2. Exact match by view name (filename without extension)
 * 3. Pattern matches (in registration order)
 *
 * @param filePath - Full path to the template file being rendered
 * @param context - The template context object to be modified by composers
 *
 * @internal
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
 * Clear all registered composers.
 *
 * Removes all exact match and pattern match composers.
 * Primarily used for testing to reset state between tests.
 *
 * @example
 * ```typescript
 * import { clearComposers, composer } from 'stx'
 *
 * describe('MyComponent', () => {
 *   beforeEach(() => {
 *     clearComposers() // Reset before each test
 *   })
 *
 *   it('should inject user data', () => {
 *     composer('profile', (ctx) => { ctx.user = mockUser })
 *     // ... test
 *   })
 * })
 * ```
 */
export function clearComposers(): void {
  composers.patterns = []
  composers.exact = {}
}
