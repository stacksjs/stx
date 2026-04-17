/**
 * Builtin Components Barrel
 *
 * Re-exports all builtin component definitions and provides a
 * convenience function to register them with the component registry.
 *
 * @module builtins
 */

export { StxLinkBuiltin } from './stx-link'
export { StxImageBuiltin } from './stx-image'
export { StxLoadingIndicatorBuiltin } from './stx-loading-indicator'
export { IconBuiltin, preloadIconCollection } from './icon'

import { registry } from '../component-registry'
import { StxLinkBuiltin } from './stx-link'
import { StxImageBuiltin } from './stx-image'
import { StxLoadingIndicatorBuiltin } from './stx-loading-indicator'
import { IconBuiltin } from './icon'

/**
 * Register all builtin components with the singleton registry.
 * Call this once during framework initialization.
 */
export function registerBuiltins(): void {
  registry.registerBuiltin(StxLinkBuiltin)
  registry.registerBuiltin(StxImageBuiltin)
  registry.registerBuiltin(StxLoadingIndicatorBuiltin)
  registry.registerBuiltin(IconBuiltin)
}
