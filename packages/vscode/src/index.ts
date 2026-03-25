/**
 * stx VSCode Extension - Library Exports
 *
 * Import these to build your own VSCode extension using stx's language features as a base.
 *
 * @example
 * ```ts
 * import {
 *   VirtualTsDocumentProvider,
 *   createHoverProvider,
 *   createCompletionProvider,
 *   createDefinitionProvider,
 *   createDiagnosticsProvider,
 *   ComponentRegistry,
 *   PropsTypeExtractor,
 * } from 'vscode-stacks'
 * ```
 */

// =============================================================================
// Providers — Create language feature providers for the editor
// =============================================================================

export { createHoverProvider } from './providers/hoverProvider'
export { createCompletionProvider } from './providers/completionProvider'
export { createDefinitionProvider } from './providers/definitionProvider'
export { createDiagnosticsProvider } from './providers/diagnosticsProvider'
export { createDocumentLinkProvider } from './providers/documentLinkProvider'
export { createPathCompletionProvider } from './providers/pathCompletionProvider'
export { createCodeActionsProvider } from './providers/codeActionsProvider'
export { createFoldingRangeProvider } from './providers/foldingProvider'
export {
  createSemanticTokensProvider,
  tokenTypes,
  tokenModifiers,
  legend,
} from './providers/semanticTokensProvider'
export { VirtualTsDocumentProvider } from './providers/virtualTsDocumentProvider'

// =============================================================================
// Services — Component discovery, prop extraction, etc.
// =============================================================================

export { ComponentRegistry } from './services/ComponentRegistry'
export type { ComponentInfo } from './services/ComponentRegistry'
export { PropsTypeExtractor } from './services/PropsTypeExtractor'
export type { PropDetail, ExtractedProps } from './services/PropsTypeExtractor'

// =============================================================================
// Crosswind (utility-first CSS) — Hover, completion, sorting, color previews
// =============================================================================

export {
  activateCrosswind,
  deactivateCrosswind,
  CrosswindContext,
} from './crosswind/index'
export {
  loadCrosswindConfig,
  getDefaultConfig as getCrosswindDefaultConfig,
} from './crosswind/context'
export { createCrosswindHoverProvider } from './crosswind/hover-provider'
export { createCrosswindCompletionProvider } from './crosswind/completion-provider'
export { createSortClassesCommand, sortClasses } from './crosswind/sort-provider'
export { registerColorDecorations } from './crosswind/color-provider'

// Crosswind utilities
export {
  extractClassesFromDocument,
  getClassAtPosition,
  extractClassesFromLine,
} from './crosswind/utils/class-matcher'
export type { ClassMatch } from './crosswind/utils/class-matcher'
export {
  extractColorFromCSS,
  isColorClass,
  extractAllColors,
} from './crosswind/utils/color-extractor'
export type { ColorInfo } from './crosswind/utils/color-extractor'
export {
  prettifyCSS,
  extractRuleForClass,
  formatCSSDeclarations,
  addRemToPxComment,
} from './crosswind/utils/css-parser'

// =============================================================================
// Utilities — Template path resolution, CSS analysis, JSDoc formatting
// =============================================================================

export {
  extractTemplatePath,
  normalizeTemplatePath,
  resolveTemplatePath,
  getTemplatePathRange,
} from './utils/templateUtils'
export {
  findCssStylesForClass,
  isInStyleTag,
  isInScriptTag,
  findCssDefinitionForClass,
  isCssClassName,
} from './utils/cssUtils'
export type { CssDefinitionPosition } from './utils/cssUtils'
export { formatJSDoc } from './utils/jsdocUtils'
export { findForeachDeclarationForVariable } from './utils/stxUtils'

// =============================================================================
// Interfaces & Types — All type definitions for the extension
// =============================================================================

export type {
  PositionMapping,
  JSDocInfo,
  stxComponent,
  stxDirective,
  stxTemplate,
  stxLanguageConfig,
  stxSnippet,
  stxExtensionConfig,
} from './interfaces'
export {
  TransitionType,
  TransitionDirection,
  TransitionEase,
  DEFAULT_TRANSITION_OPTIONS,
} from './interfaces/animation-types'
export type {
  AnimationType,
  AnimationTiming,
  AnimationDirection,
  AnimationConfig,
  TransitionCallbacks,
  MotionConfig,
  AnimationGroupConfig,
  TransitionOptions,
} from './interfaces/animation-types'

// =============================================================================
// Extension lifecycle — activate/deactivate for direct use
// =============================================================================

export { activate, deactivate } from './extension'
