/**
 * stx Types
 *
 * This file re-exports all types from the modular types directory.
 * The types have been split into domain-specific files for better organization:
 *
 * - types/context-types.ts - Template context and authentication types
 * - types/directive-types.ts - All directive types (discriminated unions)
 * - types/component-types.ts - Component system and documentation types
 * - types/config-types.ts - Configuration types for stx options
 * - types/pwa-types.ts - Progressive Web App configuration types
 * - types/csp-types.ts - Content Security Policy types
 *
 * For new code, prefer importing from specific type files:
 * @example
 * ```typescript
 * import type { StxConfig } from './types/config-types'
 * import type { ConditionalDirective } from './types/directive-types'
 * ```
 *
 * For backward compatibility, you can still import from this file:
 * @example
 * ```typescript
 * import type { StxConfig, ConditionalDirective } from './types'
 * ```
 */

// Re-export everything from the modular types
export * from './types/index'
