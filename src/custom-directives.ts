import type { CustomDirective, StxOptions } from './types'

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
  const pattern = new RegExp(`${startTag}(?:\\s*\\(([^)]+)\\))?([\\s\\S]*?)${endTag}`, 'g')

  // Keep track of replacements to handle nested directives properly
  const replacements: Array<{ original: string, processed: string }> = []

  // Find all directive patterns
  let match = pattern.exec(output)
  while (match !== null) {
    const [fullMatch, paramString = '', content = ''] = match

    try {
      // Parse parameters
      const params = paramString ? paramString.split(',').map(p => p.trim()) : []

      // Trim the content to remove extra whitespace
      const trimmedContent = content.trim()

      // Apply the directive handler
      const processed = await handler(trimmedContent, params, context, filePath)

      // Store for later replacement (to avoid regex index issues)
      replacements.push({
        original: fullMatch,
        processed,
      })
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (options.debug) {
        console.error(`Error processing custom directive @${name}:`, error)
      }

      // Replace with error message if processing fails
      replacements.push({
        original: fullMatch,
        processed: `[Error in @${name}: ${errorMessage}]`,
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

  // Create a pattern that matches directives with parameters
  // e.g., @uppercase(text) or @uppercase('text')
  const pattern = new RegExp(`@${name}\\s*\\(([^)]+)\\)`, 'g')

  // Keep track of replacements
  const replacements: Array<{ original: string, processed: string }> = []

  // Find all directive patterns
  let match = pattern.exec(output)
  while (match !== null) {
    const [fullMatch, paramString = ''] = match

    try {
      // Parse parameters
      const params = parseDirectiveParams(paramString)

      // Apply the directive handler with empty content (since this directive type
      // doesn't have content between start and end tags)
      const processed = await handler('', params, context, filePath)

      // Store for later replacement
      replacements.push({
        original: fullMatch,
        processed,
      })
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (options.debug) {
        console.error(`Error processing custom directive @${name}:`, error)
      }

      // Replace with error message if processing fails
      replacements.push({
        original: fullMatch,
        processed: `[Error in @${name}: ${errorMessage}]`,
      })
    }

    // Get the next match
    match = pattern.exec(output)
  }

  // Apply all replacements in reverse order
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { original, processed } = replacements[i]
    output = output.replace(original, processed)
  }

  return output
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
