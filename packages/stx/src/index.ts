import { plugin } from './plugin'

/**
 * STX Plugin for Bun
 * Enables Laravel Blade-like syntax in .stx files
 */
export default plugin

// Export i18n functions for advanced usage
export { createTranslateFilter, getTranslation, loadTranslation, processTranslateDirective } from './i18n'

// Export markdown functions for advanced usage
export { markdownDirectiveHandler, processMarkdownDirectives } from './markdown'

// Export types for users
export type { CustomDirective, I18nConfig, Middleware, StxConfig, StxOptions, WebComponent, WebComponentConfig } from './types'

// Export web component functions for advanced usage
export { buildWebComponents, webComponentDirectiveHandler } from './web-components'
