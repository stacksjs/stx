/**
 * Module for internationalization (i18n) support
 *
 * Features:
 * - Translation file loading (JSON, YAML, JS)
 * - Nested key access (e.g., 'messages.welcome')
 * - Parameter replacement (e.g., ':name' → 'John')
 * - Basic pluralization support
 * - Translation caching with invalidation
 *
 * ## Pluralization
 *
 * Use the `|` separator to define plural forms:
 * ```yaml
 * items: "One item|:count items"
 * ```
 *
 * Or for more complex pluralization:
 * ```yaml
 * apples: "{0} No apples|{1} One apple|[2,*] :count apples"
 * ```
 *
 * ## Cache Management
 *
 * The translation cache can be managed via:
 * - `clearTranslationCache()` - Clear all cached translations
 * - `clearTranslationCache('en')` - Clear specific locale
 * - `getTranslationCacheStats()` - Get cache statistics
 */

import type { I18nConfig, StxOptions } from './types'
import path from 'node:path'
import { ErrorCodes, inlineError } from './error-handling'
import { safeEvaluateObject } from './safe-evaluator'

// =============================================================================
// Configuration
// =============================================================================

// Default i18n configuration
export const defaultI18nConfig: I18nConfig = {
  defaultLocale: 'en',
  locale: 'en',
  translationsDir: 'translations',
  format: 'yaml',
  fallbackToKey: true,
  cache: true,
}

// =============================================================================
// Cache Management
// =============================================================================

/**
 * Cache entry with metadata
 */
interface TranslationCacheEntry {
  translations: Record<string, any>
  loadedAt: number
  locale: string
}

/**
 * Cache for translation files with metadata
 */
const translationsCache: Record<string, TranslationCacheEntry> = {}

/**
 * Clear the translation cache
 * @param locale - Optional locale to clear. If not provided, clears all.
 */
export function clearTranslationCache(locale?: string): void {
  if (locale) {
    delete translationsCache[locale]
  }
  else {
    // Clear all entries
    for (const key of Object.keys(translationsCache)) {
      delete translationsCache[key]
    }
  }
}

/**
 * Get translation cache statistics
 */
export function getTranslationCacheStats(): {
  size: number
  locales: string[]
  entries: Array<{ locale: string, loadedAt: Date, keyCount: number }>
} {
  const entries = Object.entries(translationsCache).map(([locale, entry]) => ({
    locale,
    loadedAt: new Date(entry.loadedAt),
    keyCount: countKeys(entry.translations),
  }))

  return {
    size: Object.keys(translationsCache).length,
    locales: Object.keys(translationsCache),
    entries,
  }
}

/**
 * Count total keys in a nested object
 */
function countKeys(obj: Record<string, any>, count = 0): number {
  for (const value of Object.values(obj)) {
    count++
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      count = countKeys(value, count)
    }
  }
  return count
}

/**
 * Check if a cache entry is stale (older than maxAge milliseconds)
 */
function isCacheStale(entry: TranslationCacheEntry, maxAge: number = 0): boolean {
  if (maxAge <= 0)
    return false // No max age, never stale
  return Date.now() - entry.loadedAt > maxAge
}

// =============================================================================
// Translation Loading
// =============================================================================

/**
 * Load a translation file
 *
 * @param locale - Locale code (e.g., 'en', 'fr', 'de')
 * @param options - stx options with i18n configuration
 * @returns Translation dictionary
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
    const entry = translationsCache[locale]
    // Check if cache is stale (if maxAge is configured)
    const maxAge = (options.i18n as any)?.cacheMaxAge ?? 0
    if (!isCacheStale(entry, maxAge)) {
      return entry.translations
    }
    // Cache is stale, will reload below
  }

  // Determine the path to the translation file
  const translationsDir = path.resolve(import.meta.dir, '..', i18nConfig.translationsDir)
  const fileExtension = getFileExtension(i18nConfig.format)
  const translationFile = path.join(translationsDir, `${locale}${fileExtension}`)

  try {
    let translations: Record<string, any> = {}

    // Use dynamic imports for all formats - Bun supports JS, JSON, and YAML
    try {
      const imported = await import(translationFile)
      translations = imported.default || imported
    }
    catch (importError) {
      // Fallback: Try reading and parsing the file manually
      const fileContent = await Bun.file(translationFile).text()

      if (i18nConfig.format === 'yaml' || i18nConfig.format === 'yml') {
        // Use simple YAML parser fallback
        translations = parseSimpleYaml(fileContent)
      }
      else if (i18nConfig.format === 'json') {
        translations = JSON.parse(fileContent)
      }
      else {
        // For JS files, re-throw the import error
        throw importError
      }
    }

    // Cache the translations if caching is enabled
    if (i18nConfig.cache) {
      translationsCache[locale] = {
        translations,
        loadedAt: Date.now(),
        locale,
      }
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
 * Simple YAML parser fallback for basic key-value pairs
 * Supports:
 * - Simple key: value pairs
 * - Nested objects via indentation
 * - String values (quoted or unquoted)
 * - Comments (#)
 *
 * Does NOT support:
 * - Arrays
 * - Multi-line strings
 * - Anchors and aliases
 * - Complex YAML features
 */
function parseSimpleYaml(content: string): Record<string, any> {
  const result: Record<string, any> = {}
  const lines = content.split('\n')
  const stack: Array<{ obj: Record<string, any>, indent: number }> = [{ obj: result, indent: -1 }]

  for (const rawLine of lines) {
    // Skip empty lines and comments
    const line = rawLine.replace(/#.*$/, '').trimEnd()
    if (!line.trim())
      continue

    // Calculate indentation
    const indent = line.search(/\S/)
    if (indent === -1)
      continue

    // Pop stack to find the correct parent
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const currentObj = stack[stack.length - 1].obj

    // Parse key: value
    const match = line.match(/^(\s*)(\S[^:]*):\s*(.*)$/)
    if (match) {
      const [, , key, rawValue] = match
      const trimmedKey = key.trim()
      const trimmedValue = rawValue.trim()

      if (trimmedValue === '') {
        // This is a nested object
        currentObj[trimmedKey] = {}
        stack.push({ obj: currentObj[trimmedKey], indent })
      }
      else {
        // This is a simple value
        currentObj[trimmedKey] = parseYamlValue(trimmedValue)
      }
    }
  }

  return result
}

/**
 * Parse a YAML value (handles strings, numbers, booleans)
 */
function parseYamlValue(value: string): string | number | boolean | null {
  // Remove quotes
  if ((value.startsWith('\'') && value.endsWith('\'')) || (value.startsWith('"') && value.endsWith('"'))) {
    return value.slice(1, -1)
  }

  // Check for boolean
  const lowerValue = value.toLowerCase()
  if (lowerValue === 'true' || lowerValue === 'yes')
    return true
  if (lowerValue === 'false' || lowerValue === 'no')
    return false
  if (lowerValue === 'null' || lowerValue === '~')
    return null

  // Check for number
  const num = Number(value)
  if (!Number.isNaN(num))
    return num

  // Return as string
  return value
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
 * Select the appropriate plural form based on count.
 *
 * Supports two formats:
 * 1. Simple: "One item|:count items" (index 0 for count=1, index 1 otherwise)
 * 2. Complex: "{0} No apples|{1} One apple|[2,*] :count apples"
 *    - {n} matches exact count
 *    - [min,max] matches range (use * for infinity)
 *
 * @param forms - Array of plural form strings
 * @param count - The count to use for selection
 * @returns The selected plural form
 */
function selectPluralForm(forms: string[], count: number): string {
  // Check for complex format with explicit ranges/exact matches
  for (const form of forms) {
    const trimmed = form.trim()

    // Check for exact match: {n}
    const exactMatch = trimmed.match(/^\{(\d+)\}\s*(.*)$/)
    if (exactMatch) {
      const exactCount = Number.parseInt(exactMatch[1], 10)
      if (count === exactCount) {
        return exactMatch[2]
      }
      continue
    }

    // Check for range match: [min,max] or [min,*]
    const rangeMatch = trimmed.match(/^\[(\d+),(\d+|\*)\]\s*(.*)$/)
    if (rangeMatch) {
      const min = Number.parseInt(rangeMatch[1], 10)
      const max = rangeMatch[2] === '*' ? Number.POSITIVE_INFINITY : Number.parseInt(rangeMatch[2], 10)
      if (count >= min && count <= max) {
        return rangeMatch[3]
      }
      continue
    }
  }

  // Simple format: first form for count=1, second form otherwise
  if (forms.length === 2) {
    return count === 1 ? forms[0].trim() : forms[1].trim()
  }

  // For more than 2 forms without explicit ranges, use index-based selection
  // Index 0 = 0, Index 1 = 1, Index 2 = 2+
  if (count < forms.length) {
    return forms[count].trim()
  }

  return forms[forms.length - 1].trim()
}

// =============================================================================
// ICU MessageFormat Support
// =============================================================================

/**
 * ICU MessageFormat parser and formatter
 *
 * Supports:
 * - Simple replacement: {name}
 * - Plural: {count, plural, =0{none} one{# item} other{# items}}
 * - Select: {gender, select, male{He} female{She} other{They}}
 * - SelectOrdinal: {pos, selectordinal, one{#st} two{#nd} few{#rd} other{#th}}
 * - Number formatting: {amount, number}
 * - Date formatting: {date, date, short|medium|long|full}
 *
 * @example
 * formatICU('{count, plural, =0{No items} one{# item} other{# items}}', { count: 5 })
 * // => '5 items'
 *
 * @example
 * formatICU('{gender, select, male{He} female{She} other{They}} liked this', { gender: 'female' })
 * // => 'She liked this'
 */
export function formatICU(message: string, params: Record<string, unknown> = {}): string {
  return parseICUMessage(message, params)
}

/**
 * Parse and format an ICU message
 */
function parseICUMessage(message: string, params: Record<string, unknown>): string {
  let result = ''
  let i = 0

  while (i < message.length) {
    if (message[i] === '{') {
      // Find the matching closing brace
      const endIndex = findMatchingBrace(message, i)
      if (endIndex === -1) {
        result += message[i]
        i++
        continue
      }

      const placeholder = message.slice(i + 1, endIndex)
      result += formatICUPlaceholder(placeholder, params)
      i = endIndex + 1
    }
    else if (message[i] === '\'' && i + 1 < message.length) {
      // Handle escaped characters in ICU format
      if (message[i + 1] === '\'') {
        result += '\''
        i += 2
      }
      else if (message[i + 1] === '{' || message[i + 1] === '}') {
        // Escaped brace
        result += message[i + 1]
        i += 2
      }
      else {
        result += message[i]
        i++
      }
    }
    else {
      result += message[i]
      i++
    }
  }

  return result
}

/**
 * Find matching closing brace, accounting for nested braces
 */
function findMatchingBrace(message: string, start: number): number {
  let depth = 0
  for (let i = start; i < message.length; i++) {
    if (message[i] === '{') {
      depth++
    }
    else if (message[i] === '}') {
      depth--
      if (depth === 0) {
        return i
      }
    }
  }
  return -1
}

/**
 * Format a single ICU placeholder
 */
function formatICUPlaceholder(placeholder: string, params: Record<string, unknown>): string {
  const parts = splitICUParts(placeholder)

  if (parts.length === 0) {
    return `{${placeholder}}`
  }

  const varName = parts[0].trim()
  const value = params[varName]

  // Simple replacement: {name}
  if (parts.length === 1) {
    return value !== undefined ? String(value) : `{${varName}}`
  }

  const formatType = parts[1].trim().toLowerCase()

  switch (formatType) {
    case 'plural':
      return formatICUPlural(value, parts.slice(2).join(','), params)
    case 'select':
      return formatICUSelect(value, parts.slice(2).join(','))
    case 'selectordinal':
      return formatICUSelectOrdinal(value, parts.slice(2).join(','))
    case 'number':
      return formatICUNumber(value, parts[2]?.trim())
    case 'date':
      return formatICUDate(value, parts[2]?.trim())
    case 'time':
      return formatICUTime(value, parts[2]?.trim())
    default:
      return value !== undefined ? String(value) : `{${placeholder}}`
  }
}

/**
 * Split ICU placeholder into parts, respecting nested braces
 */
function splitICUParts(placeholder: string): string[] {
  const parts: string[] = []
  let current = ''
  let depth = 0

  for (let i = 0; i < placeholder.length; i++) {
    const char = placeholder[i]
    if (char === '{') {
      depth++
      current += char
    }
    else if (char === '}') {
      depth--
      current += char
    }
    else if (char === ',' && depth === 0) {
      parts.push(current)
      current = ''
    }
    else {
      current += char
    }
  }

  if (current) {
    parts.push(current)
  }

  return parts
}

/**
 * Format ICU plural
 */
function formatICUPlural(value: unknown, options: string, params: Record<string, unknown>): string {
  const count = Number(value) || 0
  const parsedOptions = parseICUOptions(options)

  // Check for exact match first (=0, =1, =2, etc.)
  const exactKey = `=${count}`
  if (parsedOptions[exactKey]) {
    return formatICUPluralContent(parsedOptions[exactKey], count, params)
  }

  // Get plural category
  const category = getPluralCategory(count)
  if (parsedOptions[category]) {
    return formatICUPluralContent(parsedOptions[category], count, params)
  }

  // Fallback to 'other'
  if (parsedOptions.other) {
    return formatICUPluralContent(parsedOptions.other, count, params)
  }

  return String(count)
}

/**
 * Format plural content, replacing # with the count
 */
function formatICUPluralContent(content: string, count: number, params: Record<string, unknown>): string {
  const replaced = content.replace(/#/g, String(count))
  return parseICUMessage(replaced, params)
}

/**
 * Get CLDR plural category for a number (simplified English rules)
 */
function getPluralCategory(n: number): string {
  const absN = Math.abs(n)
  const i = Math.floor(absN)
  const v = String(n).includes('.') ? String(n).split('.')[1].length : 0

  // English plural rules (simplified)
  if (i === 1 && v === 0) {
    return 'one'
  }
  return 'other'
}

/**
 * Format ICU select
 */
function formatICUSelect(value: unknown, options: string): string {
  const key = String(value || '')
  const parsedOptions = parseICUOptions(options)

  if (parsedOptions[key]) {
    return parsedOptions[key]
  }

  // Fallback to 'other'
  return parsedOptions.other || String(value)
}

/**
 * Format ICU selectordinal
 */
function formatICUSelectOrdinal(value: unknown, options: string): string {
  const count = Number(value) || 0
  const parsedOptions = parseICUOptions(options)

  // Get ordinal category
  const category = getOrdinalCategory(count)
  if (parsedOptions[category]) {
    return parsedOptions[category].replace(/#/g, String(count))
  }

  // Fallback to 'other'
  if (parsedOptions.other) {
    return parsedOptions.other.replace(/#/g, String(count))
  }

  return String(count)
}

/**
 * Get CLDR ordinal category (simplified English rules)
 */
function getOrdinalCategory(n: number): string {
  const absN = Math.abs(n)
  const mod10 = absN % 10
  const mod100 = absN % 100

  if (mod10 === 1 && mod100 !== 11) {
    return 'one' // 1st, 21st, 31st...
  }
  if (mod10 === 2 && mod100 !== 12) {
    return 'two' // 2nd, 22nd, 32nd...
  }
  if (mod10 === 3 && mod100 !== 13) {
    return 'few' // 3rd, 23rd, 33rd...
  }
  return 'other' // 4th, 5th, 11th, 12th, 13th...
}

/**
 * Parse ICU options string like "one{# item} other{# items}"
 */
function parseICUOptions(options: string): Record<string, string> {
  const result: Record<string, string> = {}
  const regex = /(\w+|=\d+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g

  let match = regex.exec(options)
  while (match !== null) {
    result[match[1]] = match[2]
    match = regex.exec(options)
  }

  return result
}

/**
 * Format ICU number
 */
function formatICUNumber(value: unknown, style?: string): string {
  const num = Number(value)
  if (Number.isNaN(num)) {
    return String(value)
  }

  switch (style) {
    case 'integer':
      return Math.floor(num).toLocaleString()
    case 'percent':
      return `${(num * 100).toFixed(0)}%`
    case 'currency':
      return num.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
    default:
      return num.toLocaleString()
  }
}

/**
 * Format ICU date
 */
function formatICUDate(value: unknown, style?: string): string {
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const options: Intl.DateTimeFormatOptions = {}
  switch (style) {
    case 'short':
      options.dateStyle = 'short'
      break
    case 'medium':
      options.dateStyle = 'medium'
      break
    case 'long':
      options.dateStyle = 'long'
      break
    case 'full':
      options.dateStyle = 'full'
      break
    default:
      options.dateStyle = 'medium'
  }

  return date.toLocaleDateString(undefined, options)
}

/**
 * Format ICU time
 */
function formatICUTime(value: unknown, style?: string): string {
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const options: Intl.DateTimeFormatOptions = {}
  switch (style) {
    case 'short':
      options.timeStyle = 'short'
      break
    case 'medium':
      options.timeStyle = 'medium'
      break
    case 'long':
      options.timeStyle = 'long'
      break
    case 'full':
      options.timeStyle = 'full'
      break
    default:
      options.timeStyle = 'short'
  }

  return date.toLocaleTimeString(undefined, options)
}

/**
 * Check if a message uses ICU format
 */
export function isICUFormat(message: string): boolean {
  // ICU format typically has {var, type, ...} patterns
  return /\{[^}]+,\s*(?:plural|select|selectordinal|number|date|time)\s*,/.test(message)
}

// =============================================================================
// Translation Functions
// =============================================================================

/**
 * Get a translation by key with parameter replacement and pluralization.
 *
 * Supports both Laravel-style (:param, |plural) and ICU MessageFormat.
 *
 * @param key - Dot-notation key (e.g., 'messages.welcome')
 * @param translations - Translation dictionary
 * @param fallbackToKey - Return key if translation not found
 * @param params - Parameters for replacement (use 'count' for pluralization)
 * @returns The translated string
 *
 * @example
 * // Simple parameter replacement
 * getTranslation('greeting', { greeting: 'Hello :name' }, true, { name: 'John' })
 * // => 'Hello John'
 *
 * @example
 * // Pluralization (Laravel-style)
 * getTranslation('items', { items: 'One item|:count items' }, true, { count: 5 })
 * // => '5 items'
 *
 * @example
 * // ICU MessageFormat
 * getTranslation('items', { items: '{count, plural, one{# item} other{# items}}' }, true, { count: 5 })
 * // => '5 items'
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

  let result = String(value)

  // Check if message uses ICU MessageFormat
  if (isICUFormat(result)) {
    return formatICU(result, params)
  }

  // Handle Laravel-style pluralization if value contains | separator and count is provided
  if (result.includes('|') && 'count' in params) {
    const count = Number(params.count)
    const forms = result.split('|')
    result = selectPluralForm(forms, count)
  }

  // Replace :parameter style placeholders (Laravel-style)
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(
      new RegExp(`:${paramKey}`, 'g'),
      String(paramValue),
    )
  }

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
  output = await replaceAsync(output, fixedTranslateRegex, async (_match, key, paramsStr, content, _offset) => {
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
            // Safe evaluation approach
            () => {
              return safeEvaluateObject(paramsStr, context)
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

      return inlineError('Translate', `Error in @translate('${key}'): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
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

  output = await replaceAsync(output, fixedInlineTranslateRegex, async (_match, key, paramsStr, _offset) => {
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
            // Safe evaluation approach
            () => {
              return safeEvaluateObject(paramsStr, context)
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

      return inlineError('Translate', `Error in @translate('${key}'): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
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
