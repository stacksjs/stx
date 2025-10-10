/**
 * Module for internationalization (i18n) support
 */

import type { I18nConfig, StxOptions } from './types'
import path from 'node:path'
import { createDetailedErrorMessage } from './utils'

// Default i18n configuration
export const defaultI18nConfig: I18nConfig = {
  defaultLocale: 'en',
  locale: 'en',
  translationsDir: 'translations',
  format: 'yaml',
  fallbackToKey: true,
  cache: true,
}

// Cache for translation files
const translationsCache: Record<string, Record<string, any>> = {}

/**
 * Load a translation file
 */
export async function loadTranslation(
  locale: string,
  options: StxOptions,
): Promise<Record<string, any>> {
  const i18nConfig = {
    ...defaultI18nConfig,
    ...options.i18n,
  }

  // Check cache first if enabled
  if (i18nConfig.cache && translationsCache[locale]) {
    return translationsCache[locale]
  }

  // Determine the path to the translation file
  const translationsDir = path.resolve(import.meta.dir, '..', i18nConfig.translationsDir)
  const fileExtension = getFileExtension(i18nConfig.format)
  const translationFile = path.join(translationsDir, `${locale}${fileExtension}`)

  try {
    let translations: Record<string, any> = {}

    // Use dynamic imports for all formats - Bun supports JS, JSON, and YAML
    const imported = await import(translationFile)
    translations = imported.default || imported

    // Cache the translations if caching is enabled
    if (i18nConfig.cache) {
      translationsCache[locale] = translations
    }

    return translations
  }
  catch (error) {
    if (options.debug) {
      console.error(`Error loading translation file for locale "${locale}":`, error)
    }

    // If file not found and locale is not the default, try to load the default locale
    if (locale !== i18nConfig.defaultLocale) {
      return loadTranslation(i18nConfig.defaultLocale, options)
    }

    // Return empty object if default locale file is also not found
    return {}
  }
}

/**
 * Get file extension based on format
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'yaml':
      return '.yaml'
    case 'yml':
      return '.yml'
    case 'js':
      return '.js'
    case 'json':
    default:
      return '.json'
  }
}

/**
 * Get a translation by key
 */
export function getTranslation(
  key: string,
  translations: Record<string, any>,
  fallbackToKey: boolean = true,
  params: Record<string, any> = {},
): string {
  // Split the key by dots to access nested properties
  const parts = key.split('.')
  let value = translations

  // Traverse through the translations object
  for (const part of parts) {
    if (value === undefined || value === null) {
      break
    }
    value = value[part]
  }

  // If translation not found, fallback to key if enabled
  if (value === undefined || value === null) {
    return fallbackToKey ? key : ''
  }

  // Replace parameters in the translation string
  let result = String(value)

  // Replace :parameter style placeholders
  Object.entries(params).forEach(([paramKey, paramValue]) => {
    result = result.replace(
      new RegExp(`:${paramKey}`, 'g'),
      String(paramValue),
    )
  })

  return result
}

/**
 * Process @translate directive
 */
export async function processTranslateDirective(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  let output = template

  // More specific, less greedy regex for the translate directive with content blocks
  const fixedTranslateRegex = /@translate\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[^}]*\})\s*)?\)([\s\S]*?)@endtranslate/g

  // Get the i18n configuration
  const i18nConfig = {
    ...defaultI18nConfig,
    ...options.i18n,
  }

  // Load translations for the current locale
  const translations = await loadTranslation(i18nConfig.locale, options)

  // Add translations to context for use in expressions
  context.__translations = translations
  context.__locale = i18nConfig.locale
  context.__i18nConfig = i18nConfig

  // Process @translate with content blocks first
  output = await replaceAsync(output, fixedTranslateRegex, async (match, key, paramsStr, content, offset) => {
    try {
      // Parse parameters if provided
      let params: Record<string, any> = {}
      if (paramsStr) {
        try {
          // Try multiple approaches to parse the object
          const approaches = [
            // Direct JSON parsing
            () => JSON.parse(paramsStr),
            // Parse with wrapper
            () => {
              const jsonStr = `{"data":${paramsStr}}`
              const parsed = JSON.parse(jsonStr)
              return typeof parsed.data === 'object' ? parsed.data : {}
            },
            // JavaScript eval approach
            () => {
              // eslint-disable-next-line no-new-func
              const evalFn = new Function(`return ${paramsStr}`)
              const result = evalFn()
              return typeof result === 'object' ? result : {}
            },
          ]

          // Try each approach until one works
          for (const approach of approaches) {
            try {
              params = approach()
              if (Object.keys(params).length > 0) {
                break
              }
            }
            catch {
              // Continue to next approach
            }
          }
        }
        catch (error) {
          if (options.debug) {
            console.error(`Error parsing parameters for @translate directive:`, error)
          }
        }
      }

      // Get the translation
      const translation = getTranslation(key, translations, i18nConfig.fallbackToKey, params)

      // Return the translation or fallback to the content if no translation found
      return translation || content.trim()
    }
    catch (error) {
      if (options.debug) {
        console.error(`Error processing @translate directive:`, error)
      }

      return createDetailedErrorMessage(
        'Translate',
        `Error in @translate('${key}'): ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Process inline @translate directive
  const inlineTranslateRegex = /@translate\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[^}]+\})\s*)?\)/g

  // Fix for potential template transformation issues
  if (options.debug) {
    console.warn(`Processing translations in template. Sections: ${output.includes('<h2>Translation with Parameters</h2>') ? 'Parameters section found' : 'Parameters section missing'}`)

    // Check which matching expressions are found
    const matches = [...output.matchAll(inlineTranslateRegex)]
    console.warn(`Found ${matches.length} @translate matches`)
    matches.forEach((m, i) => console.warn(`Match ${i}: ${m[0]}, Key: ${m[1]}, Params: ${m[2] || 'none'}`))
  }

  // Create a safer regex that doesn't consume too much content
  // The original regex /@translate\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[^}]+\})\s*)?\)/g could be too greedy
  const fixedInlineTranslateRegex = /@translate\(\s*['"]([^'"]+)['"]\s*(?:,\s*(\{[^}]*\})\s*)?\)/g

  output = await replaceAsync(output, fixedInlineTranslateRegex, async (match, key, paramsStr, offset) => {
    try {
      // Parse parameters if provided
      let params: Record<string, any> = {}
      if (paramsStr) {
        try {
          // Try multiple approaches to parse the object
          const approaches = [
            // Direct JSON parsing
            () => JSON.parse(paramsStr),
            // Parse with wrapper
            () => {
              const jsonStr = `{"data":${paramsStr}}`
              const parsed = JSON.parse(jsonStr)
              return typeof parsed.data === 'object' ? parsed.data : {}
            },
            // JavaScript eval approach
            () => {
              // eslint-disable-next-line no-new-func
              const evalFn = new Function(`return ${paramsStr}`)
              const result = evalFn()
              return typeof result === 'object' ? result : {}
            },
          ]

          // Try each approach until one works
          for (const approach of approaches) {
            try {
              params = approach()
              if (Object.keys(params).length > 0) {
                break
              }
            }
            catch {
              // Continue to next approach
            }
          }
        }
        catch (error) {
          if (options.debug) {
            console.error(`Error parsing parameters for @translate directive:`, error)
          }
        }
      }

      // Get the translation
      return getTranslation(key, translations, i18nConfig.fallbackToKey, params)
    }
    catch (error) {
      if (options.debug) {
        console.error(`Error processing @translate directive:`, error)
      }

      return createDetailedErrorMessage(
        'Translate',
        `Error in @translate('${key}'): ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  return output
}

// Helper for async replacements in regex
async function replaceAsync(
  str: string,
  regex: RegExp,
  asyncFn: (
    match: string,
    ...groups: any[]
  ) => Promise<string>,
): Promise<string> {
  const promises: Promise<{ match: string, replacement: string }>[] = []
  str.replace(regex, (match, ...args) => {
    const promise = asyncFn(match, ...args).then(replacement => ({
      match,
      replacement,
    }))
    promises.push(promise)
    return match
  })

  const results = await Promise.all(promises)
  return results.reduce(
    (str, { match, replacement }) => str.replace(match, replacement),
    str,
  )
}

/**
 * Create a translation filter for expressions
 */
export function createTranslateFilter(
  translations: Record<string, any>,
  fallbackToKey: boolean = true,
): (value: string, params?: Record<string, any>) => string {
  return (value: string, params: Record<string, any> = {}) => {
    return getTranslation(value, translations, fallbackToKey, params)
  }
}
