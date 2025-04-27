import { plugin } from './plugin'

/**
 * STX Plugin for Bun
 * Enables Laravel Blade-like syntax in .stx files
 */
export default plugin

// Export i18n functions for advanced usage
export { createTranslateFilter, getTranslation, loadTranslation, processTranslateDirective } from './i18n'

// Export types for users
export type { CustomDirective, I18nConfig, Middleware, StxConfig, StxOptions } from './types'
