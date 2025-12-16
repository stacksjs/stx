/**
 * stx Types
 *
 * This file re-exports all types from domain-specific type files.
 * For new code, prefer importing from specific type files for better code organization.
 *
 * @example
 * // Import from specific file (preferred)
 * import type { StxConfig } from './types/config-types'
 *
 * // Or import from index (backward compatible)
 * import type { StxConfig } from './types'
 */

// Context types
export type {
  AuthContext,
  BaseTemplateContext,
  ContextValue,
  LoopContext,
  PermissionsContext,
  RequireContextKeys,
  TemplateContext,
  TranslationContext,
  TypedContext,
} from './context-types'

// Directive types
export type {
  A11yDirective,
  AuthDirective,
  ComponentDirective,
  ConditionalDirective,
  CustomDirective,
  CustomDirectiveHandler,
  Directive,
  DirectiveOfKind,
  EnvDirective,
  ExpressionDirective,
  FormDirective,
  I18nDirective,
  IncludeDirective,
  LayoutDirective,
  LoopDirective,
  Middleware,
  MiddlewareHandler,
  ScriptDirective,
  SeoDirective,
  StackDirective,
  SwitchDirective,
  UserCustomDirective,
} from './directive-types'

export { isDirectiveKind } from './directive-types'

// Component types
export type {
  ComponentConfig,
  ComponentDefinition,
  ComponentDoc,
  ComponentPropDoc,
  ComponentPropsSchema,
  DirectiveDoc,
  DocFormat,
  DocGeneratorConfig,
  PropDefinition,
  PropType,
  TemplateDoc,
  WebComponent,
  WebComponentConfig,
} from './component-types'

// Config types
export type {
  A11yConfig,
  AnalyticsConfig,
  AnalyticsDriver,
  AnimationConfig,
  FormConfig,
  HydrationConfig,
  I18nConfig,
  Island,
  LoopConfig,
  MarkdownConfig,
  OpenGraphConfig,
  SeoConfig,
  SeoFeatureConfig,
  StreamingConfig,
  StreamRenderer,
  StxConfig,
  StxOptions,
  SyntaxHighlightingConfig,
  SyntaxHighlightTheme,
  TwitterConfig,
} from './config-types'

// PWA types
export type {
  PwaBackgroundSyncConfig,
  PwaCacheStorageConfig,
  PwaCacheStrategy,
  PwaConfig,
  PwaFileHandlerConfig,
  PwaIconConfig,
  PwaManifestConfig,
  PwaOfflineConfig,
  PwaPrecacheConfig,
  PwaProtocolHandlerConfig,
  PwaPushConfig,
  PwaRouteCache,
  PwaScreenshot,
  PwaServiceWorkerConfig,
  PwaShareTargetConfig,
  PwaShortcut,
  PwaUpdateConfig,
} from './pwa-types'

// CSP types
export type {
  CspConfig,
  CspDirectives,
  CspPreset,
  CspSourceValue,
} from './csp-types'
