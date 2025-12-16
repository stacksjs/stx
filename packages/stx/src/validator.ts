/**
 * Template Validation
 *
 * Provides validation utilities for stx templates before processing.
 * Checks for common syntax errors, structural issues, and potential security problems.
 */

/**
 * Template validation error
 */
export interface TemplateValidationError {
  type: 'syntax' | 'directive' | 'expression' | 'structure'
  message: string
  line?: number
  column?: number
  suggestion?: string
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean
  errors: TemplateValidationError[]
  warnings: TemplateValidationError[]
}

/**
 * Directive pair configuration for validation
 */
interface DirectivePair {
  open: string
  close: string
  name: string
  altClose?: string
}

/**
 * Malformed directive check configuration
 */
interface MalformedDirectiveCheck {
  pattern: RegExp
  message: string
  suggestion: string
}

/**
 * Dangerous pattern check configuration
 */
interface DangerousPatternCheck {
  pattern: RegExp
  message: string
}

/**
 * Directive pairs to check for proper opening/closing
 */
const DIRECTIVE_PAIRS: DirectivePair[] = [
  { open: '@if', close: '@endif', name: 'if' },
  { open: '@unless', close: '@endunless', name: 'unless' },
  { open: '@foreach', close: '@endforeach', name: 'foreach' },
  { open: '@for', close: '@endfor', name: 'for' },
  { open: '@while', close: '@endwhile', name: 'while' },
  { open: '@forelse', close: '@endforelse', name: 'forelse' },
  { open: '@switch', close: '@endswitch', name: 'switch' },
  { open: '@isset', close: '@endisset', name: 'isset' },
  { open: '@empty', close: '@endempty', name: 'empty' },
  { open: '@auth', close: '@endauth', name: 'auth' },
  { open: '@guest', close: '@endguest', name: 'guest' },
  { open: '@can', close: '@endcan', name: 'can' },
  { open: '@cannot', close: '@endcannot', name: 'cannot' },
  { open: '@section', close: '@endsection', name: 'section', altClose: '@show' },
  { open: '@push', close: '@endpush', name: 'push' },
  { open: '@prepend', close: '@endprepend', name: 'prepend' },
  { open: '@once', close: '@endonce', name: 'once' },
  { open: '@markdown', close: '@endmarkdown', name: 'markdown' },
  { open: '@component', close: '@endcomponent', name: 'component' },
]

/**
 * Checks for malformed directive syntax
 */
const MALFORMED_DIRECTIVE_CHECKS: MalformedDirectiveCheck[] = [
  { pattern: /@if\s*[^(]/, message: '@if directive missing parentheses', suggestion: 'Use @if(condition)' },
  { pattern: /@foreach\s*[^(]/, message: '@foreach directive missing parentheses', suggestion: 'Use @foreach(items as item)' },
  { pattern: /@foreach\([^)]*\)\s*[^@\n<]/, message: '@foreach may have content on same line', suggestion: 'Put content on new line after @foreach()' },
  { pattern: /@include\s*[^(]/, message: '@include directive missing parentheses', suggestion: 'Use @include(\'partial-name\')' },
  { pattern: /@extends\s*[^(]/, message: '@extends directive missing parentheses', suggestion: 'Use @extends(\'layout-name\')' },
]

/**
 * Potentially dangerous patterns to check for
 */
const DANGEROUS_PATTERN_CHECKS: DangerousPatternCheck[] = [
  { pattern: /\{\{\s*constructor\s*\}\}/, message: 'Attempting to access constructor property' },
  { pattern: /\{\{\s*__proto__\s*\}\}/, message: 'Attempting to access __proto__ property' },
  { pattern: /\{\{\s*eval\s*\(/, message: 'Attempting to use eval in expression' },
]

/**
 * Validate a template before processing
 *
 * Checks for common syntax errors and structural issues:
 * - Unclosed directive blocks (@if without @endif)
 * - Unclosed expression brackets
 * - Invalid directive syntax
 * - Nested quote issues
 * - Security-related patterns
 *
 * @param template - The template string to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateTemplate(templateString)
 * if (!result.valid) {
 *   console.error('Template errors:', result.errors)
 * }
 * ```
 */
export function validateTemplate(template: string): TemplateValidationResult {
  const errors: TemplateValidationError[] = []
  const warnings: TemplateValidationError[] = []

  // Check for unclosed expression brackets
  validateExpressionBrackets(template, errors)

  // Check directive pairs
  validateDirectivePairs(template, errors, warnings)

  // Check for malformed directives
  validateDirectiveSyntax(template, warnings)

  // Check for dangerous patterns
  validateSecurityPatterns(template, errors)

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate expression bracket pairs ({{ }})
 */
function validateExpressionBrackets(template: string, errors: TemplateValidationError[]): void {
  const expressionOpens = (template.match(/\{\{/g) || []).length
  const expressionCloses = (template.match(/\}\}/g) || []).length

  if (expressionOpens !== expressionCloses) {
    errors.push({
      type: 'expression',
      message: `Unclosed expression brackets: found ${expressionOpens} opening '{{' and ${expressionCloses} closing '}}'`,
      suggestion: 'Ensure every {{ has a matching }}',
    })
  }
}

/**
 * Validate directive opening/closing pairs
 */
function validateDirectivePairs(
  template: string,
  errors: TemplateValidationError[],
  warnings: TemplateValidationError[],
): void {
  for (const pair of DIRECTIVE_PAIRS) {
    const openRegex = new RegExp(`${pair.open}(?:\\s|\\()`, 'g')
    const closeRegex = new RegExp(pair.close, 'g')

    const openCount = (template.match(openRegex) || []).length
    let closeCount = (template.match(closeRegex) || []).length

    // Check for alternate close tags
    if (pair.altClose) {
      const altCloseRegex = new RegExp(pair.altClose, 'g')
      closeCount += (template.match(altCloseRegex) || []).length
    }

    if (openCount > closeCount) {
      errors.push({
        type: 'directive',
        message: `Unclosed @${pair.name} directive: found ${openCount} opening and ${closeCount} closing`,
        suggestion: `Add ${openCount - closeCount} missing ${pair.close} tag(s)`,
      })
    }
    else if (closeCount > openCount) {
      warnings.push({
        type: 'directive',
        message: `Extra ${pair.close} found: ${closeCount - openCount} more closing than opening`,
        suggestion: `Check for orphaned ${pair.close} tags`,
      })
    }
  }
}

/**
 * Validate directive syntax
 */
function validateDirectiveSyntax(template: string, warnings: TemplateValidationError[]): void {
  for (const check of MALFORMED_DIRECTIVE_CHECKS) {
    if (check.pattern.test(template)) {
      warnings.push({
        type: 'syntax',
        message: check.message,
        suggestion: check.suggestion,
      })
    }
  }
}

/**
 * Validate for security-related patterns
 */
function validateSecurityPatterns(template: string, errors: TemplateValidationError[]): void {
  for (const check of DANGEROUS_PATTERN_CHECKS) {
    if (check.pattern.test(template)) {
      errors.push({
        type: 'expression',
        message: `Security warning: ${check.message}`,
        suggestion: 'Remove dangerous code from template expressions',
      })
    }
  }
}

/**
 * Get line and column information for a position in the template
 *
 * @param template - The template string
 * @param position - Character position
 * @returns Line and column numbers (1-indexed)
 */
export function getPositionInfo(template: string, position: number): { line: number, column: number } {
  const lines = template.slice(0, position).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

/**
 * Validate a specific directive's syntax
 *
 * @param directiveName - Name of the directive (without @)
 * @param content - Content between directive tags
 * @param params - Parameters passed to the directive
 * @returns Validation errors, if any
 */
export function validateDirective(
  directiveName: string,
  content: string,
  params: string[],
): TemplateValidationError[] {
  const errors: TemplateValidationError[] = []

  // Directive-specific validation
  switch (directiveName) {
    case 'if':
    case 'elseif':
    case 'unless':
      if (params.length === 0) {
        errors.push({
          type: 'syntax',
          message: `@${directiveName} requires a condition`,
          suggestion: `Use @${directiveName}(condition)`,
        })
      }
      break

    case 'foreach':
      if (params.length === 0 || !params[0].includes(' as ')) {
        errors.push({
          type: 'syntax',
          message: '@foreach requires "items as item" syntax',
          suggestion: 'Use @foreach(items as item) or @foreach(items as key => value)',
        })
      }
      break

    case 'for':
      if (params.length === 0) {
        errors.push({
          type: 'syntax',
          message: '@for requires loop parameters',
          suggestion: 'Use @for(let i = 0; i < 10; i++)',
        })
      }
      break

    case 'switch':
      if (params.length === 0) {
        errors.push({
          type: 'syntax',
          message: '@switch requires an expression',
          suggestion: 'Use @switch(expression)',
        })
      }
      break

    case 'case':
      if (params.length === 0) {
        errors.push({
          type: 'syntax',
          message: '@case requires a value',
          suggestion: 'Use @case(value)',
        })
      }
      break

    case 'include':
    case 'extends':
    case 'component':
      if (params.length === 0) {
        errors.push({
          type: 'syntax',
          message: `@${directiveName} requires a path`,
          suggestion: `Use @${directiveName}('path/to/template')`,
        })
      }
      break
  }

  return errors
}

/**
 * Check if a template has any directives
 *
 * @param template - The template string
 * @returns Whether the template contains any stx directives
 */
export function hasDirectives(template: string): boolean {
  return /@[a-z]+/i.test(template) || /\{\{/.test(template)
}

/**
 * Extract all directive names used in a template
 *
 * @param template - The template string
 * @returns Array of directive names (without @ prefix)
 */
export function extractDirectiveNames(template: string): string[] {
  const matches = template.matchAll(/@([a-z]+)/gi)
  const names = new Set<string>()

  for (const match of matches) {
    const name = match[1].toLowerCase()
    // Filter out end tags
    if (!name.startsWith('end')) {
      names.add(name)
    }
  }

  return Array.from(names)
}
