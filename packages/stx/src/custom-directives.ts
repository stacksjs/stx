import type { CustomDirective, StxOptions } from './types'
import { findDirectiveCalls, splitTopLevelArgs } from './directive-arguments'
import { ErrorCodes, inlineError } from './error-handling'
import { getCachedRegex } from './performance-utils'

/**
 * Process all custom directives registered in the app
 */
export async function processCustomDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  if (!options.customDirectives || options.customDirectives.length === 0) {
    return template // No custom directives to process
  }

  let output = template

  // Process custom directives
  for (const directive of options.customDirectives) {
    // Skip invalid directives
    if (!directive.name || typeof directive.handler !== 'function') {
      if (options.debug) {
        console.warn('Invalid custom directive:', directive)
      }
      continue
    }

    if (directive.hasEndTag) {
      // Process directives with end tags
      output = await processDirectiveWithEndTag(
        output,
        directive,
        context,
        filePath,
        options,
      )
    }
    else {
      // Process directive without end tags
      output = await processDirectiveWithoutEndTag(
        output,
        directive,
        context,
        filePath,
        options,
      )
    }
  }

  return output
}

/**
 * Process directives that have a closing tag (e.g., @uppercase...@enduppercase)
 */
async function processDirectiveWithEndTag(
  template: string,
  directive: CustomDirective,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  const { name, handler } = directive
  const startTag = `@${name}`
  const endTag = `@end${name}`
  let output = template

  // Create a regex pattern that handles optional parameters
  // Matches patterns like @uppercase, @uppercase(param1), @uppercase(param1, param2), etc.
  // Ensure we capture all content between the start and end tags
  // Use balanced parenthesis matching to handle nested parens in params
  // [^()]* matches non-paren chars, (?:\([^)]*\)[^()]*)* handles one level of nesting
  const pattern = getCachedRegex(`${startTag}(?:\\s*\\(([^()]*(?:\\([^)]*\\)[^()]*)*)\\))?([\\s\\S]*?)${endTag}`, 'g')

  // Keep track of replacements to handle nested directives properly
  const replacements: Array<{ original: string, processed: string, startIndex: number }> = []

  // Find all directive patterns
  let match = pattern.exec(output)
  while (match !== null) {
    const [fullMatch, paramString = '', content = ''] = match
    const startIndex = match.index || 0

    try {
      // Parse parameters (strip quotes from values, unless the directive
      // evaluates them and needs them as written)
      const params = paramString ? parseParams(directive, paramString) : []

      // Trim the content to remove extra whitespace
      const trimmedContent = content.trim()

      // Apply the directive handler
      const processed = await handler(trimmedContent, params, context, filePath)

      // Store for later replacement (to avoid regex index issues)
      replacements.push({
        original: fullMatch,
        processed,
        startIndex,
      })
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (options.debug) {
        console.error(`Error processing custom directive @${name}:`, error)
      }

      // Replace with detailed error message if processing fails
      replacements.push({
        original: fullMatch,
        processed: inlineError('CustomDirective', `Error in @${name}${paramString ? `(${paramString})` : ''}: ${errorMessage}`, ErrorCodes.EVALUATION_ERROR),
        startIndex,
      })
    }

    // Get the next match
    match = pattern.exec(output)
  }

  // Apply all replacements in reverse order to avoid position issues
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { original, processed } = replacements[i]
    output = output.replace(original, processed)
  }

  return output
}

/**
 * Process directives without a closing tag (e.g., @uppercase(text))
 */
async function processDirectiveWithoutEndTag(
  template: string,
  directive: CustomDirective,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  const { name, handler } = directive
  let output = template

  // Keep track of replacements
  const replacements: Array<{ original: string, processed: string, startIndex: number }> = []

  // Find all directive calls with parameters, e.g. @uppercase(text) or
  // @uppercase('text'). A directive that evaluates its arguments is matched by
  // balance, so parens inside a string or a nested call stay in the call; the
  // pattern below allows one level of nesting and does not know about quotes.
  const calls: Array<{ fullMatch: string, paramString: string, startIndex: number }> = []
  if (directive.rawParams) {
    for (const call of findDirectiveCalls(output, getCachedRegex(`(?<![\\w$@])@${name}\\s*\\(`, 'g'))) {
      // An unclosed call is left for whoever owns the directive to report.
      if (call.end !== -1)
        calls.push({ fullMatch: call.call, paramString: call.args, startIndex: call.start })
    }
  }
  else {
    // Use balanced parenthesis matching for nested parens in params
    const pattern = getCachedRegex(`@${name}\\s*\\(([^()]*(?:\\([^)]*\\)[^()]*)*)\\)`, 'g')
    pattern.lastIndex = 0
    let match = pattern.exec(output)
    while (match !== null) {
      calls.push({ fullMatch: match[0], paramString: match[1] ?? '', startIndex: match.index || 0 })
      match = pattern.exec(output)
    }
  }

  for (const { fullMatch, paramString, startIndex } of calls) {
    try {
      // Parse parameters
      const params = parseParams(directive, paramString)

      // Apply the directive handler with empty content (since this directive type
      // doesn't have content between start and end tags)
      const processed = await handler('', params, context, filePath)

      // Store for later replacement
      replacements.push({
        original: fullMatch,
        processed,
        startIndex,
      })
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (options.debug) {
        console.error(`Error processing custom directive @${name}:`, error)
      }

      // Replace with detailed error message if processing fails
      replacements.push({
        original: fullMatch,
        processed: inlineError('CustomDirective', `Error in @${name}(${paramString}): ${errorMessage}`, ErrorCodes.EVALUATION_ERROR),
        startIndex,
      })
    }
  }

  // Also handle bare directives without parameters (e.g., @stxRouter)
  // Use negative lookahead to avoid matching directives already handled above or longer names
  const barePattern = getCachedRegex(`@${name}(?!\\w)(?!\\s*\\()`, 'g')
  let bareMatch = barePattern.exec(output)
  while (bareMatch !== null) {
    const [fullMatch] = bareMatch
    const startIndex = bareMatch.index || 0

    try {
      const processed = await handler('', [], context, filePath)
      replacements.push({
        original: fullMatch,
        processed,
        startIndex,
      })
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (options.debug) {
        console.error(`Error processing custom directive @${name}:`, error)
      }
      replacements.push({
        original: fullMatch,
        processed: inlineError('CustomDirective', `Error in @${name}: ${errorMessage}`, ErrorCodes.EVALUATION_ERROR),
        startIndex,
      })
    }

    bareMatch = barePattern.exec(output)
  }

  // Apply all replacements in reverse order
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { original, processed } = replacements[i]
    output = output.replace(original, processed)
  }

  return output
}

/**
 * A directive's parameters: as written for a `rawParams` directive, otherwise
 * with their quotes stripped.
 */
function parseParams(directive: CustomDirective, paramString: string): string[] {
  return directive.rawParams ? splitTopLevelArgs(paramString) : parseDirectiveParams(paramString)
}

/**
 * Parse parameters from directive parameter string
 * Handles cases like: 'param1, param2, "param with spaces", true, 123'
 */
function parseDirectiveParams(paramString: string): string[] {
  // Handle empty parameters
  if (!paramString.trim()) {
    return []
  }

  const params: string[] = []
  let currentParam = ''
  let inQuotes = false
  let quoteChar = ''

  for (let i = 0; i < paramString.length; i++) {
    const char = paramString[i]

    // Handle quotes (both single and double)
    if ((char === '"' || char === '\'') && (i === 0 || paramString[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true
        quoteChar = char
      }
      else if (char === quoteChar) {
        inQuotes = false
      }
      else {
        // This is a quote character inside a string quoted with a different quote character
        currentParam += char
      }
    }
    // Handle parameter separators (commas) - only if not in quotes
    else if (char === ',' && !inQuotes) {
      params.push(currentParam.trim())
      currentParam = ''
    }
    else {
      currentParam += char
    }
  }

  // Add the last parameter
  if (currentParam.trim()) {
    params.push(currentParam.trim())
  }

  // Cleanup parameters - remove wrapping quotes if present
  return params.map((param) => {
    const trimmed = param.trim()
    // Remove wrapping quotes
    if ((trimmed.startsWith('"') && trimmed.endsWith('"'))
      || (trimmed.startsWith('\'') && trimmed.endsWith('\''))) {
      return trimmed.substring(1, trimmed.length - 1)
    }
    return trimmed
  })
}
