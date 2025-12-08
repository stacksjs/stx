/**
 * Internationalization (i18n) system for @stacksjs/components
 *
 * Provides translation, locale management, pluralization, and date/number formatting
 *
 * @example
 * ```ts
 * import { createI18n, t } from '@stacksjs/components'
 *
 * // Create i18n instance
 * const i18n = createI18n({
 *   locale: 'en',
 *   fallbackLocale: 'en',
 *   messages: {
 *     en: { welcome: 'Welcome' },
 *     es: { welcome: 'Bienvenido' }
 *   }
 * })
 *
 * // Use translations
 * t('welcome') // 'Welcome' or 'Bienvenido' based on locale
 * ```
 */

/**
 * Translation messages structure
 */
export type MessageValue = string | { [key: string]: MessageValue }
export type Messages = Record<string, MessageValue>

/**
 * Locale messages
 */
export type LocaleMessages = Record<string, Messages>

/**
 * Pluralization rules
 */
export type PluralRule = (count: number, locale: string) => number

/**
 * I18n configuration
 */
export interface I18nConfig {
  /** Current locale */
  locale: string
  /** Fallback locale when translation is missing */
  fallbackLocale?: string
  /** Translation messages for all locales */
  messages: LocaleMessages
  /** Custom pluralization rules */
  pluralRules?: Record<string, PluralRule>
  /** Date formatting options */
  dateTimeFormats?: Record<string, Intl.DateTimeFormatOptions>
  /** Number formatting options */
  numberFormats?: Record<string, Intl.NumberFormatOptions>
  /** Missing translation handler */
  missing?: (locale: string, key: string) => string | void
  /** Whether to warn about missing translations */
  warnMissing?: boolean
}

/**
 * I18n instance
 */
export interface I18n {
  /** Current locale */
  locale: string
  /** Available locales */
  availableLocales: string[]
  /** Set current locale */
  setLocale: (locale: string) => void
  /** Get translation */
  t: (key: string, params?: Record<string, any>) => string
  /** Get pluralized translation */
  tc: (key: string, count: number, params?: Record<string, any>) => string
  /** Format date */
  d: (date: Date | number, format?: string) => string
  /** Format number */
  n: (value: number, format?: string) => string
  /** Check if translation exists */
  te: (key: string) => boolean
  /** Add locale messages */
  addMessages: (locale: string, messages: Messages) => void
  /** Remove locale */
  removeLocale: (locale: string) => void
}

/**
 * Global i18n instance
 */
let globalI18n: I18n | null = null

/**
 * Default pluralization rule (English-like)
 */
const defaultPluralRule: PluralRule = (count: number) => {
  return count === 1 ? 0 : 1
}

/**
 * Get nested property from object by path
 */
function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * Interpolate parameters in translation string
 */
function interpolate(template: string, params: Record<string, any> = {}): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key] !== undefined ? String(params[key]) : match
  })
}

/**
 * Create an i18n instance
 *
 * @param config - I18n configuration
 * @returns I18n instance
 *
 * @example
 * ```ts
 * const i18n = createI18n({
 *   locale: 'en',
 *   fallbackLocale: 'en',
 *   messages: {
 *     en: {
 *       welcome: 'Welcome, {name}!',
 *       items: 'No items | One item | {count} items'
 *     },
 *     es: {
 *       welcome: 'Bienvenido, {name}!',
 *       items: 'Sin elementos | Un elemento | {count} elementos'
 *     }
 *   }
 * })
 * ```
 */
export function createI18n(config: I18nConfig): I18n {
  let {
    locale,
    fallbackLocale = 'en',
    messages,
    pluralRules = {},
    dateTimeFormats = {},
    numberFormats = {},
    missing,
    warnMissing = true,
  } = config

  /**
   * Get translation for key
   */
  function t(key: string, params: Record<string, any> = {}): string {
    // Try current locale
    let translation = getNestedProperty(messages[locale], key)

    // Try fallback locale
    if (translation === undefined && fallbackLocale) {
      translation = getNestedProperty(messages[fallbackLocale], key)
    }

    // Handle missing translation
    if (translation === undefined) {
      if (missing) {
        const result = missing(locale, key)
        if (result) {
          return interpolate(result, params)
        }
      }

      if (warnMissing && typeof console !== 'undefined') {
        console.warn(`[i18n] Missing translation for key "${key}" in locale "${locale}"`)
      }

      return key
    }

    // Interpolate parameters
    if (typeof translation === 'string') {
      return interpolate(translation, params)
    }

    return String(translation)
  }

  /**
   * Get pluralized translation
   */
  function tc(key: string, count: number, params: Record<string, any> = {}): string {
    const translation = t(key, { ...params, count })

    // If translation contains plural forms separated by |
    if (translation.includes('|')) {
      const forms = translation.split('|').map(s => s.trim())
      const pluralRule = pluralRules[locale] || defaultPluralRule
      const index = pluralRule(count, locale)

      const form = forms[index] || forms[forms.length - 1]
      return interpolate(form, { ...params, count })
    }

    return translation
  }

  /**
   * Format date
   */
  function d(date: Date | number, format = 'default'): string {
    const dateObj = typeof date === 'number' ? new Date(date) : date
    const formatOptions = dateTimeFormats[format] || dateTimeFormats.default || {}

    return new Intl.DateTimeFormat(locale, formatOptions).format(dateObj)
  }

  /**
   * Format number
   */
  function n(value: number, format = 'default'): string {
    const formatOptions = numberFormats[format] || numberFormats.default || {}

    return new Intl.NumberFormat(locale, formatOptions).format(value)
  }

  /**
   * Check if translation exists
   */
  function te(key: string): boolean {
    const translation = getNestedProperty(messages[locale], key)
    if (translation !== undefined) {
      return true
    }

    if (fallbackLocale) {
      const fallbackTranslation = getNestedProperty(messages[fallbackLocale], key)
      return fallbackTranslation !== undefined
    }

    return false
  }

  /**
   * Set locale
   */
  function setLocale(newLocale: string): void {
    if (!messages[newLocale]) {
      console.warn(`[i18n] Locale "${newLocale}" not found. Available locales: ${Object.keys(messages).join(', ')}`)
      return
    }
    locale = newLocale
  }

  /**
   * Add messages for a locale
   */
  function addMessages(addLocale: string, newMessages: Messages): void {
    if (!messages[addLocale]) {
      messages[addLocale] = {}
    }

    // Deep merge messages
    messages[addLocale] = {
      ...messages[addLocale],
      ...newMessages,
    }
  }

  /**
   * Remove a locale
   */
  function removeLocale(removeLocale: string): void {
    delete messages[removeLocale]
  }

  return {
    get locale() {
      return locale
    },
    get availableLocales() {
      return Object.keys(messages)
    },
    setLocale,
    t,
    tc,
    d,
    n,
    te,
    addMessages,
    removeLocale,
  }
}

/**
 * Set global i18n instance
 *
 * @param i18n - I18n instance
 */
export function setI18n(i18n: I18n): void {
  globalI18n = i18n
}

/**
 * Get global i18n instance
 *
 * @returns Global i18n instance or null
 */
export function getI18n(): I18n | null {
  return globalI18n
}

/**
 * Global translation function
 * Uses global i18n instance
 *
 * @param key - Translation key
 * @param params - Interpolation parameters
 * @returns Translated string
 */
export function t(key: string, params?: Record<string, any>): string {
  if (!globalI18n) {
    console.warn('[i18n] No global i18n instance set. Call setI18n() first.')
    return key
  }
  return globalI18n.t(key, params)
}

/**
 * Global pluralization function
 *
 * @param key - Translation key
 * @param count - Count for pluralization
 * @param params - Interpolation parameters
 * @returns Pluralized translated string
 */
export function tc(key: string, count: number, params?: Record<string, any>): string {
  if (!globalI18n) {
    console.warn('[i18n] No global i18n instance set. Call setI18n() first.')
    return key
  }
  return globalI18n.tc(key, count, params)
}

/**
 * Global date formatting function
 *
 * @param date - Date to format
 * @param format - Format name
 * @returns Formatted date string
 */
export function d(date: Date | number, format?: string): string {
  if (!globalI18n) {
    console.warn('[i18n] No global i18n instance set. Call setI18n() first.')
    return String(date)
  }
  return globalI18n.d(date, format)
}

/**
 * Global number formatting function
 *
 * @param value - Number to format
 * @param format - Format name
 * @returns Formatted number string
 */
export function n(value: number, format?: string): string {
  if (!globalI18n) {
    console.warn('[i18n] No global i18n instance set. Call setI18n() first.')
    return String(value)
  }
  return globalI18n.n(value, format)
}

/**
 * Predefined pluralization rules for common languages
 */
export const pluralRules: Record<string, PluralRule> = {
  // English, German, Dutch, Swedish, Danish, Norwegian, Finnish
  en: count => count === 1 ? 0 : 1,
  de: count => count === 1 ? 0 : 1,
  nl: count => count === 1 ? 0 : 1,
  sv: count => count === 1 ? 0 : 1,

  // French, Brazilian Portuguese
  fr: count => count === 0 || count === 1 ? 0 : 1,
  pt_BR: count => count === 0 || count === 1 ? 0 : 1,

  // Russian, Ukrainian, Serbian, Croatian
  ru: (count) => {
    if (count % 10 === 1 && count % 100 !== 11)
      return 0
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20))
      return 1
    return 2
  },

  // Polish
  pl: (count) => {
    if (count === 1)
      return 0
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20))
      return 1
    return 2
  },

  // Czech, Slovak
  cs: (count) => {
    if (count === 1)
      return 0
    if (count >= 2 && count <= 4)
      return 1
    return 2
  },

  // Arabic
  ar: (count) => {
    if (count === 0)
      return 0
    if (count === 1)
      return 1
    if (count === 2)
      return 2
    if (count % 100 >= 3 && count % 100 <= 10)
      return 3
    if (count % 100 >= 11)
      return 4
    return 5
  },

  // Japanese, Korean, Chinese, Thai, Vietnamese
  ja: () => 0,
  ko: () => 0,
  zh: () => 0,
  th: () => 0,
  vi: () => 0,
}

/**
 * Common date/time format presets
 */
export const dateTimeFormats: Record<string, Intl.DateTimeFormatOptions> = {
  short: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  },
  long: {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  full: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  time: {
    hour: 'numeric',
    minute: 'numeric',
  },
  datetime: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  },
}

/**
 * Common number format presets
 */
export const numberFormats: Record<string, Intl.NumberFormatOptions> = {
  decimal: {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  },
  currency: {
    style: 'currency',
    currency: 'USD',
  },
  percent: {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  },
  compact: {
    notation: 'compact',
  },
}

/**
 * RTL (Right-to-Left) language detection
 *
 * @param locale - Locale code
 * @returns Whether locale is RTL
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur', 'yi']
  const lang = locale.split('-')[0].toLowerCase()
  return rtlLocales.includes(lang)
}

/**
 * Load locale messages dynamically
 *
 * @param locale - Locale code
 * @param loadFn - Function to load messages
 * @returns Promise of messages
 *
 * @example
 * ```ts
 * const messages = await loadLocaleMessages('es', async () => {
 *   const module = await import('./locales/es.json')
 *   return module.default
 * })
 * ```
 */
export async function loadLocaleMessages(
  locale: string,
  loadFn: () => Promise<Messages>,
): Promise<Messages> {
  try {
    return await loadFn()
  }
  catch (error) {
    console.error(`[i18n] Failed to load messages for locale "${locale}":`, error)
    return {}
  }
}

/**
 * Component-specific i18n messages
 *
 * Provides default translations for component library
 */
export const componentMessages: LocaleMessages = {
  en: {
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      search: 'Search',
      clear: 'Clear',
      submit: 'Submit',
      reset: 'Reset',
    },
    form: {
      required: 'This field is required',
      invalid: 'Invalid value',
      tooShort: 'Value is too short (minimum {min} characters)',
      tooLong: 'Value is too long (maximum {max} characters)',
      invalidEmail: 'Invalid email address',
      invalidUrl: 'Invalid URL',
    },
    pagination: {
      previous: 'Previous',
      next: 'Next',
      page: 'Page {page}',
      of: 'of {total}',
    },
  },
  es: {
    common: {
      loading: 'Cargando...',
      error: 'Error',
      retry: 'Reintentar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      save: 'Guardar',
      delete: 'Eliminar',
      edit: 'Editar',
      search: 'Buscar',
      clear: 'Limpiar',
      submit: 'Enviar',
      reset: 'Restablecer',
    },
    form: {
      required: 'Este campo es obligatorio',
      invalid: 'Valor inválido',
      tooShort: 'El valor es demasiado corto (mínimo {min} caracteres)',
      tooLong: 'El valor es demasiado largo (máximo {max} caracteres)',
      invalidEmail: 'Dirección de correo electrónico inválida',
      invalidUrl: 'URL inválida',
    },
    pagination: {
      previous: 'Anterior',
      next: 'Siguiente',
      page: 'Página {page}',
      of: 'de {total}',
    },
  },
  fr: {
    common: {
      loading: 'Chargement...',
      error: 'Erreur',
      retry: 'Réessayer',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      close: 'Fermer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      edit: 'Modifier',
      search: 'Rechercher',
      clear: 'Effacer',
      submit: 'Soumettre',
      reset: 'Réinitialiser',
    },
    form: {
      required: 'Ce champ est obligatoire',
      invalid: 'Valeur invalide',
      tooShort: 'La valeur est trop courte (minimum {min} caractères)',
      tooLong: 'La valeur est trop longue (maximum {max} caractères)',
      invalidEmail: 'Adresse e-mail invalide',
      invalidUrl: 'URL invalide',
    },
    pagination: {
      previous: 'Précédent',
      next: 'Suivant',
      page: 'Page {page}',
      of: 'sur {total}',
    },
  },
}
