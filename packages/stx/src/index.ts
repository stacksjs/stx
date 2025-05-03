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

// Export types for users
export type { ComponentDoc, ComponentPropDoc, CustomDirective, DirectiveDoc, DocFormat, DocGeneratorConfig, HydrationConfig, I18nConfig, Island, Middleware, StreamingConfig, StreamRenderer, StxConfig, StxOptions, TemplateDoc, WebComponent, WebComponentConfig } from './types'

export * from './types'
export * from './utils'

export { buildWebComponents, webComponentDirectiveHandler } from './web-components'

export default plugin
