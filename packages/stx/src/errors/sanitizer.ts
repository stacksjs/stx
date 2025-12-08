/**
 * Parameter and Content Sanitization
 *
 * Provides sanitization utilities for directive parameters, file paths,
 * expressions, and component props.
 *
 * @module errors/sanitizer
 */

import path from 'node:path'

// =============================================================================
// Types
// =============================================================================

/**
 * Options for parameter sanitization
 */
export interface SanitizeOptions {
  /** Allow HTML in parameter values (default: false) */
  allowHtml?: boolean
  /** Maximum length for string parameters (default: 10000) */
  maxLength?: number
  /** Allow special characters (default: true for most, false for paths) */
  allowSpecialChars?: boolean
  /** Custom sanitization function */
  customSanitizer?: (value: string) => string
}

/**
 * Result of parameter sanitization
 */
export interface SanitizedParam {
  /** Sanitized value */
  value: string
  /** Whether the value was modified */
  modified: boolean
  /** Warnings generated during sanitization */
  warnings: string[]
}

// =============================================================================
// Validators
// =============================================================================

/**
 * Validation utilities
 */
export const validators = {
  /**
   * Validate file path is safe and doesn't escape the allowed directory
   */
  isValidFilePath(filePath: string, allowedDir?: string): boolean {
    // Normalize the path to handle different separators
    const normalizedPath = filePath.replace(/\\/g, '/')

    // Check for null bytes (can bypass security checks)
    if (normalizedPath.includes('\0')) {
      return false
    }

    // Check for path traversal attempts in various forms
    if (normalizedPath.includes('../')
      || normalizedPath.includes('..\\')
      || normalizedPath === '..'
      || normalizedPath.startsWith('../')
      || normalizedPath.endsWith('/..')
      || normalizedPath.includes('/..\\')
      || normalizedPath.includes('\\../')
    ) {
      return false
    }

    // Check for protocol handlers that could be exploited
    const protocolPattern = /^[a-z][a-z0-9+.-]*:/i
    if (protocolPattern.test(normalizedPath)) {
      return false
    }

    // If allowedDir is provided, validate the resolved path is within it
    if (allowedDir) {
      const resolvedPath = path.resolve(allowedDir, filePath)
      const normalizedAllowedDir = path.resolve(allowedDir)

      // Ensure the resolved path starts with the allowed directory
      if (!resolvedPath.startsWith(normalizedAllowedDir + path.sep)
        && resolvedPath !== normalizedAllowedDir) {
        return false
      }
    }

    return true
  },

  /**
   * Validate template variable name
   */
  isValidVariableName(name: string): boolean {
    // Must be valid JavaScript identifier
    return /^[a-z_$]\w*$/i.test(name)
  },

  /**
   * Validate directive name
   */
  isValidDirectiveName(name: string): boolean {
    // Must be alphanumeric with optional hyphens/underscores
    return /^[a-z][\w-]*$/i.test(name)
  },

  /**
   * Check if string contains potentially malicious content
   */
  isSafeContent(content: string): boolean {
    const dangerousPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi, // Event handlers
    ]

    return !dangerousPatterns.some(pattern => pattern.test(content))
  },
}

// =============================================================================
// Sanitization Functions
// =============================================================================

/**
 * Escape HTML special characters
 */
function escapeHtml(str: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\'': '&#39;',
  }
  return str.replace(/[&<>"']/g, char => htmlEntities[char] || char)
}

/**
 * Sanitize a directive parameter value
 */
export function sanitizeDirectiveParam(param: string, options: SanitizeOptions = {}): SanitizedParam {
  const {
    allowHtml = false,
    maxLength = 10000,
    allowSpecialChars = true,
    customSanitizer,
  } = options

  const warnings: string[] = []
  let value = param
  let modified = false

  // Apply custom sanitizer first if provided
  if (customSanitizer) {
    const customResult = customSanitizer(value)
    if (customResult !== value) {
      value = customResult
      modified = true
    }
  }

  // Check for null bytes
  if (value.includes('\0')) {
    value = value.replace(/\0/g, '')
    modified = true
    warnings.push('Null bytes removed from parameter')
  }

  // Truncate if too long
  if (value.length > maxLength) {
    value = value.substring(0, maxLength)
    modified = true
    warnings.push(`Parameter truncated to ${maxLength} characters`)
  }

  // Escape HTML if not allowed
  if (!allowHtml && /<[^>]+>/.test(value)) {
    value = escapeHtml(value)
    modified = true
    warnings.push('HTML content was escaped')
  }

  // Remove dangerous patterns
  const dangerousPatterns = [
    { pattern: /javascript:/gi, replacement: '', name: 'javascript: URI' },
    { pattern: /vbscript:/gi, replacement: '', name: 'vbscript: URI' },
    { pattern: /data:text\/html/gi, replacement: '', name: 'data:text/html URI' },
  ]

  for (const { pattern, replacement, name } of dangerousPatterns) {
    if (pattern.test(value)) {
      value = value.replace(pattern, replacement)
      modified = true
      warnings.push(`Removed ${name} from parameter`)
    }
  }

  // Remove special characters if not allowed
  if (!allowSpecialChars) {
    const originalValue = value
    // Remove ASCII control characters (0x00-0x1F and 0x7F)
    value = value.split('').filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 0x20 && code !== 0x7F
    }).join('')
    if (value !== originalValue) {
      modified = true
      warnings.push('Control characters removed')
    }
  }

  return { value, modified, warnings }
}

/**
 * Sanitize a file path parameter
 */
export function sanitizeFilePath(filePath: string, baseDir?: string): string | null {
  // Remove null bytes
  let sanitized = filePath.replace(/\0/g, '')

  // Normalize path separators
  sanitized = sanitized.replace(/\\/g, '/')

  // Remove protocol handlers
  sanitized = sanitized.replace(/^[a-z][a-z0-9+.-]*:/i, '')

  // Remove path traversal attempts
  while (sanitized.includes('../') || sanitized.includes('./')) {
    sanitized = sanitized.replace(/\.\.\//g, '').replace(/\.\//g, '')
  }

  // Validate the path is safe
  if (!validators.isValidFilePath(sanitized, baseDir)) {
    return null
  }

  return sanitized
}

/**
 * Sanitize an expression parameter (used in @if, @foreach, etc.)
 */
export function sanitizeExpression(expr: string): SanitizedParam {
  const warnings: string[] = []
  let value = expr.trim()
  let modified = value !== expr

  // Remove potentially dangerous patterns in expressions
  const dangerousExprPatterns = [
    { pattern: /\beval\s*\(/gi, name: 'eval()' },
    { pattern: /\bFunction\s*\(/gi, name: 'Function()' },
    { pattern: /\bsetTimeout\s*\(/gi, name: 'setTimeout()' },
    { pattern: /\bsetInterval\s*\(/gi, name: 'setInterval()' },
    { pattern: /\bimport\s*\(/gi, name: 'dynamic import()' },
    { pattern: /\brequire\s*\(/gi, name: 'require()' },
    { pattern: /\b__proto__\b/gi, name: '__proto__' },
    { pattern: /\bconstructor\b/gi, name: 'constructor' },
    { pattern: /\bprototype\b/gi, name: 'prototype' },
  ]

  for (const { pattern, name } of dangerousExprPatterns) {
    if (pattern.test(value)) {
      warnings.push(`Potentially dangerous pattern detected: ${name}`)
      // Don't remove, just warn - these might be legitimate in some contexts
    }
  }

  // Remove null bytes
  if (value.includes('\0')) {
    value = value.replace(/\0/g, '')
    modified = true
    warnings.push('Null bytes removed from expression')
  }

  return { value, modified, warnings }
}

/**
 * Sanitize multiple directive parameters at once
 */
export function sanitizeDirectiveParams(params: string[], options: SanitizeOptions = {}): SanitizedParam[] {
  return params.map(param => sanitizeDirectiveParam(param, options))
}

/**
 * Validate and sanitize component props
 */
export function sanitizeComponentProps(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(props)) {
    // Validate key is a valid identifier
    if (!validators.isValidVariableName(key)) {
      continue // Skip invalid keys
    }

    // Sanitize based on value type
    if (typeof value === 'string') {
      const result = sanitizeDirectiveParam(value)
      sanitized[key] = result.value
    }
    else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeDirectiveParam(item).value : item,
      )
    }
    else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeComponentProps(value as Record<string, unknown>)
    }
    else {
      sanitized[key] = value
    }
  }

  return sanitized
}
