import { readFile } from 'node:fs/promises'

/**
 * Render a .stx template file for email by performing variable interpolation.
 * Replaces {{ variable }} expressions with values from the data object.
 */
export async function renderEmailTemplate(
  templatePath: string,
  data: Record<string, unknown>,
): Promise<string> {
  const templateContent = await readFile(templatePath, 'utf-8')
  return interpolate(templateContent, data)
}

/**
 * Interpolate {{ variable }} expressions in a template string.
 */
function interpolate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, key: string) => {
    const trimmed = key.trim()
    const value = resolveValue(trimmed, data)
    if (value === undefined) {
      return ''
    }
    return escapeHtml(String(value))
  })
}

/**
 * Resolve a dotted key path against a data object.
 * Supports simple keys like "name" and nested keys like "user.name".
 */
function resolveValue(key: string, data: Record<string, unknown>): unknown {
  const parts = key.split('.')
  let current: unknown = data

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Escape HTML special characters to prevent XSS in email templates.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}
