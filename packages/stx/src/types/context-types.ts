/**
 * Context Types - Typed interfaces for template context objects
 */

import type { StxOptions } from './config-types'

/**
 * Loop context object available within @foreach loops
 * Provides iteration metadata for template logic
 */
export interface LoopContext {
  /** Current zero-based index */
  index: number
  /** Current one-based iteration count */
  iteration: number
  /** Whether this is the first iteration */
  first: boolean
  /** Whether this is the last iteration */
  last: boolean
  /** Total number of items in the array */
  count: number
}

/**
 * Authentication context for @auth, @guest, @can directives
 * Required shape for auth-related template directives
 *
 * @example
 * ```typescript
 * const authContext: AuthContext = {
 *   check: true,
 *   user: { id: 1, name: 'John', role: 'admin' }
 * }
 * ```
 */
export interface AuthContext {
  /** Whether the user is authenticated */
  check: boolean
  /** User object (null if not authenticated) */
  user: Record<string, unknown> | null
}

/**
 * Permissions context for @can, @cannot directives
 *
 * @example
 * ```typescript
 * const permissions: PermissionsContext = {
 *   check: (ability, type?, id?) => {
 *     // Check if user has the ability
 *     return user.abilities.includes(ability)
 *   }
 * }
 * ```
 */
export interface PermissionsContext {
  /** Function to check if user has a specific permission */
  check: (ability: string, type?: string, id?: unknown) => boolean
}

/**
 * Translation context for @translate, @t directives
 */
export interface TranslationContext {
  /** Translation lookup object keyed by locale */
  [locale: string]: Record<string, string>
}

/**
 * Base template context with common properties
 * Extend this interface for specific template contexts
 */
export interface BaseTemplateContext {
  /** Authentication context (optional) */
  auth?: AuthContext
  /** Permissions context (optional) */
  permissions?: PermissionsContext
  /** User permissions map for simple boolean checks */
  userCan?: Record<string, boolean>
  /** Translations for i18n */
  __translations?: TranslationContext
  /** Internal sections storage (set by layout processing) */
  __sections?: Record<string, string>
  /** Internal stx options reference */
  __stx_options?: StxOptions
  /** Loop context (available within @foreach) */
  loop?: LoopContext
  /** Alias for loop context to avoid conflicts with user variables */
  $loop?: LoopContext
  /** Slot content for components */
  slot?: string
  /** Allow additional properties */
  [key: string]: unknown
}

/**
 * Template context type alias for backward compatibility
 * Use BaseTemplateContext for new code
 */
export type TemplateContext = BaseTemplateContext

/**
 * Generic template context that allows specifying custom typed properties
 *
 * @example
 * ```typescript
 * // Define your typed context
 * interface MyContext extends TypedContext<{
 *   user: { name: string; email: string }
 *   items: string[]
 *   count: number
 * }> {}
 *
 * // Use in template processing
 * const ctx: MyContext = {
 *   user: { name: 'John', email: 'john@example.com' },
 *   items: ['a', 'b'],
 *   count: 42
 * }
 * ```
 */
export type TypedContext<T extends Record<string, unknown>> = BaseTemplateContext & T

/**
 * Utility type to extract the value type from a context key
 */
export type ContextValue<C extends BaseTemplateContext, K extends keyof C> = C[K]

/**
 * Utility type to make certain context properties required
 */
export type RequireContextKeys<C extends BaseTemplateContext, K extends keyof C> =
  Required<Pick<C, K>> & Omit<C, K>
