import { plugin as stxPlugin } from 'bun-plugin-stx'

export * from './auth'
export * from './animation'
export * from './caching'
export * from './config'
export * from './custom-directives'
export * from './dev-server'
export * from './docs'
export * from './expressions'
export * from './forms'

export { createTranslateFilter, getTranslation, loadTranslation, processTranslateDirective } from './i18n'

export * from './includes'
export * from './loops'

export { markdownDirectiveHandler, processMarkdownDirectives } from './markdown'

export * from './middleware'
export * from './process'

// Export streaming functions and directives
export { createStreamRenderer, islandDirective, processSectionDirectives, registerStreamingDirectives, streamTemplate } from './streaming'

// Export accessibility functions and directives
export { a11yDirective, checkA11y, getScreenReaderOnlyStyle, processA11yDirectives, registerA11yDirectives, scanA11yIssues, screenReaderDirective } from './a11y'

// Export component directives
export { componentDirective, registerComponentDirectives } from './components'

// Export animation directives
export {
  transitionDirective,
  animationGroupDirective,
  motionDirective,
  processAnimationDirectives,
  registerAnimationDirectives,
  TransitionType,
  TransitionDirection,
  TransitionEase
} from './animation'

// Export SEO functions and directives
export {
  metaDirective,
  structuredDataDirective,
  registerSeoDirectives,
  processMetaDirectives,
  processSeoDirective,
  processStructuredData,
  injectSeoTags
} from './seo'

// Export types for users
export type {
  ComponentDoc,
  ComponentPropDoc,
  CustomDirective,
  DirectiveDoc,
  DocFormat,
  DocGeneratorConfig,
  HydrationConfig,
  I18nConfig,
  Island,
  Middleware,
  StreamingConfig,
  StreamRenderer,
  StxConfig,
  StxOptions,
  TemplateDoc,
  WebComponent,
  WebComponentConfig,
  A11yViolation,
  SeoConfig,
  SeoFeatureConfig,
  OpenGraphConfig,
  TwitterConfig
} from './types'

export * from './types'
export * from './utils'

export { buildWebComponents, webComponentDirectiveHandler } from './web-components'

// Export the plugin as a named export
export { stxPlugin }

// Also export as default for backward compatibility
export default stxPlugin
