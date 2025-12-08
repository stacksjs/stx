/**
 * STX Story - Props Validation
 * Runtime prop validation based on extracted types
 */

import type { StoryAnalyzedProp } from './types'

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean
  /** Validation errors */
  errors: ValidationError[]
  /** Validation warnings */
  warnings: ValidationWarning[]
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Prop name */
  prop: string
  /** Error message */
  message: string
  /** Expected type */
  expected?: string
  /** Actual type */
  actual?: string
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Prop name */
  prop: string
  /** Warning message */
  message: string
}

/**
 * Validate props against their definitions
 */
export function validateProps(
  props: Record<string, any>,
  definitions: StoryAnalyzedProp[],
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []

  // Check required props
  for (const def of definitions) {
    if (def.required && !(def.name in props)) {
      errors.push({
        prop: def.name,
        message: `Required prop "${def.name}" is missing`,
        expected: def.type,
      })
    }
  }

  // Validate provided props
  for (const [name, value] of Object.entries(props)) {
    const def = definitions.find(d => d.name === name)

    if (!def) {
      warnings.push({
        prop: name,
        message: `Unknown prop "${name}" - not defined in component`,
      })
      continue
    }

    // Type validation
    const typeError = validateType(value, def.type, def.options)
    if (typeError) {
      errors.push({
        prop: name,
        message: typeError,
        expected: def.type,
        actual: typeof value,
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate a value against a type
 */
function validateType(
  value: any,
  type: string,
  options?: string[],
): string | null {
  // Handle null/undefined
  if (value === null || value === undefined) {
    if (type.includes('null') || type.includes('undefined') || type.includes('?')) {
      return null
    }
    return `Expected ${type}, got ${value === null ? 'null' : 'undefined'}`
  }

  const actualType = typeof value

  // Normalize type string
  const normalizedType = type.toLowerCase().trim()

  // Check for union types
  if (normalizedType.includes('|')) {
    const types = normalizedType.split('|').map(t => t.trim())
    for (const t of types) {
      if (validateType(value, t, options) === null) {
        return null // One type matched
      }
    }
    return `Expected one of ${types.join(' | ')}, got ${actualType}`
  }

  // Check for literal types (string literals)
  if (options && options.length > 0) {
    if (!options.includes(String(value))) {
      return `Expected one of [${options.join(', ')}], got "${value}"`
    }
    return null
  }

  // Basic type checks
  switch (normalizedType) {
    case 'string':
      if (actualType !== 'string') {
        return `Expected string, got ${actualType}`
      }
      break

    case 'number':
      if (actualType !== 'number' || Number.isNaN(value)) {
        return `Expected number, got ${actualType}`
      }
      break

    case 'boolean':
      if (actualType !== 'boolean') {
        return `Expected boolean, got ${actualType}`
      }
      break

    case 'array':
    case 'any[]':
    case 'array<any>':
      if (!Array.isArray(value)) {
        return `Expected array, got ${actualType}`
      }
      break

    case 'object':
    case 'record<string, any>':
      if (actualType !== 'object' || Array.isArray(value)) {
        return `Expected object, got ${actualType}`
      }
      break

    case 'function':
      if (actualType !== 'function') {
        return `Expected function, got ${actualType}`
      }
      break

    case 'any':
      // Any type accepts anything
      break

    default:
      // For complex types, just check if it's truthy or matches basic type
      if (normalizedType.startsWith('array<') || normalizedType.endsWith('[]')) {
        if (!Array.isArray(value)) {
          return `Expected array, got ${actualType}`
        }
      }
  }

  return null
}

/**
 * Generate validation script for client-side
 */
export function getValidationScript(definitions: StoryAnalyzedProp[]): string {
  const defsJson = JSON.stringify(definitions)

  return `
    window.__stxValidateProps = function(props) {
      const definitions = ${defsJson};
      const errors = [];
      const warnings = [];

      // Check required props
      for (const def of definitions) {
        if (def.required && !(def.name in props)) {
          errors.push({
            prop: def.name,
            message: 'Required prop "' + def.name + '" is missing',
            expected: def.type
          });
        }
      }

      // Validate provided props
      for (const [name, value] of Object.entries(props)) {
        const def = definitions.find(d => d.name === name);

        if (!def) {
          warnings.push({
            prop: name,
            message: 'Unknown prop "' + name + '"'
          });
          continue;
        }

        // Basic type validation
        const actualType = typeof value;
        const expectedType = def.type.toLowerCase();

        if (expectedType === 'string' && actualType !== 'string') {
          errors.push({ prop: name, message: 'Expected string, got ' + actualType });
        } else if (expectedType === 'number' && actualType !== 'number') {
          errors.push({ prop: name, message: 'Expected number, got ' + actualType });
        } else if (expectedType === 'boolean' && actualType !== 'boolean') {
          errors.push({ prop: name, message: 'Expected boolean, got ' + actualType });
        } else if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push({ prop: name, message: 'Expected array, got ' + actualType });
        }

        // Check options
        if (def.options && def.options.length > 0) {
          if (!def.options.includes(String(value))) {
            errors.push({
              prop: name,
              message: 'Expected one of [' + def.options.join(', ') + '], got "' + value + '"'
            });
          }
        }
      }

      return { valid: errors.length === 0, errors, warnings };
    };
  `
}

/**
 * Format validation result for display
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = []

  if (result.valid) {
    lines.push('✓ All props are valid')
  }
  else {
    lines.push('✗ Validation failed:')
    for (const error of result.errors) {
      lines.push(`  • ${error.prop}: ${error.message}`)
    }
  }

  if (result.warnings.length > 0) {
    lines.push('')
    lines.push('Warnings:')
    for (const warning of result.warnings) {
      lines.push(`  ⚠ ${warning.prop}: ${warning.message}`)
    }
  }

  return lines.join('\n')
}

/**
 * Generate HTML for validation errors display
 */
export function generateValidationErrorsHTML(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return ''
  }

  const errorItems = result.errors.map(e => `
    <div class="validation-error">
      <strong>${e.prop}:</strong> ${e.message}
    </div>
  `).join('')

  const warningItems = result.warnings.map(w => `
    <div class="validation-warning">
      <strong>${w.prop}:</strong> ${w.message}
    </div>
  `).join('')

  return `
    <div class="stx-validation-panel ${result.valid ? 'warnings-only' : 'has-errors'}">
      ${errorItems}
      ${warningItems}
    </div>
  `
}

/**
 * Get validation panel styles
 */
export function getValidationStyles(): string {
  return `
    .stx-validation-panel {
      padding: 12px;
      margin: 8px 0;
      border-radius: 4px;
      font-size: 13px;
    }
    .stx-validation-panel.has-errors {
      background: #fee2e2;
      border: 1px solid #ef4444;
    }
    .stx-validation-panel.warnings-only {
      background: #fef3c7;
      border: 1px solid #f59e0b;
    }
    .validation-error {
      color: #dc2626;
      margin-bottom: 4px;
    }
    .validation-warning {
      color: #d97706;
      margin-bottom: 4px;
    }
  `
}
