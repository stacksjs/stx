import { plugin } from 'bun-plugin-stx'

export * from './auth'
export * from './caching'
export * from './config'
export * from './custom-directives'
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

// Export types for users
export type { ComponentDoc, ComponentPropDoc, CustomDirective, DirectiveDoc, DocFormat, DocGeneratorConfig, HydrationConfig, I18nConfig, Island, Middleware, StreamingConfig, StreamRenderer, StxConfig, StxOptions, TemplateDoc, WebComponent, WebComponentConfig, A11yViolation } from './types'

export * from './types'
export * from './utils'

export { buildWebComponents, webComponentDirectiveHandler } from './web-components'

export default plugin
