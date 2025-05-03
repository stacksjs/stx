/**
 * Form Method Spoofing for STX templates
 *
 * Similar to Laravel's @method directive, this allows specifying
 * HTTP methods like PUT, PATCH, DELETE in HTML forms which only
 * support GET and POST.
 */

// Default name of the method field
const METHOD_FIELD_NAME = '_method'

/**
 * Generate a method spoofing input field
 */
export function methodField(method: string, fieldName: string = METHOD_FIELD_NAME): string {
  // Only generate for non-standard HTTP methods that need spoofing
  const upperMethod = method.toUpperCase()

  if (upperMethod === 'GET' || upperMethod === 'POST') {
    return '' // No spoofing needed for GET or POST
  }

  return `<input type="hidden" name="${fieldName}" value="${upperMethod}">`
}

/**
 * Process @method directives in templates
 */
export function processMethodDirectives(template: string): string {
  // Replace @method directives with hidden input fields
  return template.replace(/@method\(\s*(['"])([^'"]+)\1\s*(?:,\s*(['"])([^'"]+)\3)?\s*\)/g,
    (_, outerQuote, method, innerQuote, fieldName) => {
      return methodField(method, fieldName || METHOD_FIELD_NAME)
    })
}

/**
 * Helper to get the original method from a request
 * For middleware implementations
 */
export function getOriginalMethod(body: Record<string, any>, methodField: string = METHOD_FIELD_NAME): string | null {
  if (body && typeof body[methodField] === 'string') {
    const method = body[methodField].toUpperCase()
    return method
  }

  return null
}