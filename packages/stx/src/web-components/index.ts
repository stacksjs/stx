/**
 * Web Components Module
 *
 * Provides utilities for building web components from stx templates.
 * This module has been split into focused sub-modules:
 *
 * - css-scoping.ts - CSS scoping and style isolation
 * - reactive-generator.ts - Reactive component code generation
 */

export {
  extractStyleFromTemplate,
  generateComponentId,
  generateShadowDomCss,
  injectScopedCss,
  scopeCss,
} from './css-scoping'
export type { CssScopingOptions } from './css-scoping'
export {
  generateReactiveComponentJS,
  generateReactiveComponentTS,
  generateReactiveMixin,
  generateReactiveRuntime,
} from './reactive-generator'
export type {
  ComputedProperty,
  ReactiveComponentOptions,
  ReactiveProperty,
  WatchDefinition,
} from './reactive-generator'
