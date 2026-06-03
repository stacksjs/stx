/**
 * Builtin Components Barrel
 *
 * These are engine-level builtins that need deep template processing
 * integration or inject runtime globals. Presentational UI components
 * live in packages/components instead.
 *
 * @module builtins
 */

export { StxLinkBuiltin } from './stx-link'
export { StxImageBuiltin } from './stx-image'
export { SafeImageBuiltin } from './safe-image'
export { StxLoadingIndicatorBuiltin } from './stx-loading-indicator'
export { StxToastBuiltin } from './toast'
export { StxModalBuiltin } from './modal'
export { StxDrawerBuiltin } from './drawer'
export { IconBuiltin, preloadIconCollection } from './icon'
export { getTooltipRuntime } from './tooltip'
export { SuspenseBuiltin } from './suspense'
export { TransitionGroupBuiltin } from './transition-group'

import { registry } from '../component-registry'
import { StxLinkBuiltin } from './stx-link'
import { StxImageBuiltin } from './stx-image'
import { SafeImageBuiltin } from './safe-image'
import { StxLoadingIndicatorBuiltin } from './stx-loading-indicator'
import { StxToastBuiltin } from './toast'
import { StxModalBuiltin } from './modal'
import { StxDrawerBuiltin } from './drawer'
import { IconBuiltin } from './icon'
import { SuspenseBuiltin } from './suspense'
import { TransitionGroupBuiltin } from './transition-group'

/**
 * Register all builtin components with the singleton registry.
 * Call this once during framework initialization.
 */
export function registerBuiltins(): void {
  registry.registerBuiltin(StxLinkBuiltin)
  registry.registerBuiltin(StxImageBuiltin)
  registry.registerBuiltin(SafeImageBuiltin)
  registry.registerBuiltin(StxLoadingIndicatorBuiltin)
  registry.registerBuiltin(StxToastBuiltin)
  registry.registerBuiltin(StxModalBuiltin)
  registry.registerBuiltin(StxDrawerBuiltin)
  registry.registerBuiltin(IconBuiltin)
  registry.registerBuiltin(SuspenseBuiltin)
  registry.registerBuiltin(TransitionGroupBuiltin)
}
