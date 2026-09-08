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
// Css (utility-first CSS) — Hover, completion, sorting, color previews
// =============================================================================

export {
  activateCss,
  deactivateCss,
  CssContext,
} from './ts-css/index'
export {
  loadCssEngineConfig,
  getDefaultConfig as getCssDefaultConfig,
} from './ts-css/context'
export { createCssHoverProvider } from './css/hover-provider'
export { createCssCompletionProvider } from './css/completion-provider'
export { createSortClassesCommand, sortClasses } from './css/sort-provider'
export { registerColorDecorations } from './css/color-provider'

// Css utilities
export {
  extractClassesFromDocument,
  getClassAtPosition,
  extractClassesFromLine,
} from './css/utils/class-matcher'
export type { ClassMatch } from './css/utils/class-matcher'
export {
  extractColorFromCSS,
  isColorClass,
  extractAllColors,
} from './css/utils/color-extractor'
export type { ColorInfo } from './css/utils/color-extractor'
export {
  prettifyCSS,
  extractRuleForClass,
  formatCSSDeclarations,
  addRemToPxComment,
} from './css/utils/css-parser'

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
