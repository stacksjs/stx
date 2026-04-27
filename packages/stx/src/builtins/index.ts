/**
 * Builtin Components Barrel
 *
 * Re-exports all builtin component definitions and provides a
 * convenience function to register them with the component registry.
 *
 * @module builtins
 */

// ── Core ──
export { StxLinkBuiltin } from './stx-link'
export { StxImageBuiltin } from './stx-image'
export { StxLoadingIndicatorBuiltin } from './stx-loading-indicator'
export { IconBuiltin, preloadIconCollection } from './icon'

// ── Feedback ──
export { StxToastBuiltin } from './toast'
export { StxModalBuiltin } from './modal'
export { StxDrawerBuiltin } from './drawer'
export { StxAlertBannerBuiltin } from './alert-banner'
export { StxSkeletonBuiltin } from './skeleton'
export { StxProgressBuiltin } from './progress'
export { StxMeterBuiltin } from './meter'

// ── Display ──
export { StxBadgeBuiltin } from './badge'
export { StxAvatarBuiltin } from './avatar'
export { StxChipBuiltin } from './chip'
export { StxCardBuiltin } from './card'

// ── Layout ──
export { StxTabsBuiltin } from './tabs'
export { StxAccordionBuiltin } from './accordion'
export { StxBreadcrumbBuiltin } from './breadcrumb'
export { StxPaginationBuiltin } from './pagination'

// ── Form ──
export { StxSwitchBuiltin } from './switch'
export { StxInputBuiltin } from './input'
export { StxTextareaBuiltin } from './textarea'
export { StxSelectBuiltin } from './select'
export { StxCheckboxBuiltin } from './checkbox'
export { StxRadioGroupBuiltin } from './radio'

// ── Tooltip runtime (injected into signals.ts) ──
export { getTooltipRuntime } from './tooltip'

import { registry } from '../component-registry'
import { StxLinkBuiltin } from './stx-link'
import { StxImageBuiltin } from './stx-image'
import { StxLoadingIndicatorBuiltin } from './stx-loading-indicator'
import { IconBuiltin } from './icon'
import { StxToastBuiltin } from './toast'
import { StxModalBuiltin } from './modal'
import { StxDrawerBuiltin } from './drawer'
import { StxAlertBannerBuiltin } from './alert-banner'
import { StxSkeletonBuiltin } from './skeleton'
import { StxProgressBuiltin } from './progress'
import { StxMeterBuiltin } from './meter'
import { StxBadgeBuiltin } from './badge'
import { StxAvatarBuiltin } from './avatar'
import { StxChipBuiltin } from './chip'
import { StxCardBuiltin } from './card'
import { StxTabsBuiltin } from './tabs'
import { StxAccordionBuiltin } from './accordion'
import { StxBreadcrumbBuiltin } from './breadcrumb'
import { StxPaginationBuiltin } from './pagination'
import { StxSwitchBuiltin } from './switch'
import { StxInputBuiltin } from './input'
import { StxTextareaBuiltin } from './textarea'
import { StxSelectBuiltin } from './select'
import { StxCheckboxBuiltin } from './checkbox'
import { StxRadioGroupBuiltin } from './radio'

/**
 * Register all builtin components with the singleton registry.
 * Call this once during framework initialization.
 */
export function registerBuiltins(): void {
  // Core
  registry.registerBuiltin(StxLinkBuiltin)
  registry.registerBuiltin(StxImageBuiltin)
  registry.registerBuiltin(StxLoadingIndicatorBuiltin)
  registry.registerBuiltin(IconBuiltin)
  // Feedback
  registry.registerBuiltin(StxToastBuiltin)
  registry.registerBuiltin(StxModalBuiltin)
  registry.registerBuiltin(StxDrawerBuiltin)
  registry.registerBuiltin(StxAlertBannerBuiltin)
  registry.registerBuiltin(StxSkeletonBuiltin)
  registry.registerBuiltin(StxProgressBuiltin)
  registry.registerBuiltin(StxMeterBuiltin)
  // Display
  registry.registerBuiltin(StxBadgeBuiltin)
  registry.registerBuiltin(StxAvatarBuiltin)
  registry.registerBuiltin(StxChipBuiltin)
  registry.registerBuiltin(StxCardBuiltin)
  // Layout
  registry.registerBuiltin(StxTabsBuiltin)
  registry.registerBuiltin(StxAccordionBuiltin)
  registry.registerBuiltin(StxBreadcrumbBuiltin)
  registry.registerBuiltin(StxPaginationBuiltin)
  // Form
  registry.registerBuiltin(StxSwitchBuiltin)
  registry.registerBuiltin(StxInputBuiltin)
  registry.registerBuiltin(StxTextareaBuiltin)
  registry.registerBuiltin(StxSelectBuiltin)
  registry.registerBuiltin(StxCheckboxBuiltin)
  registry.registerBuiltin(StxRadioGroupBuiltin)
}
