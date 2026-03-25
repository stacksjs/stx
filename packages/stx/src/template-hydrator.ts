/**
 * Template Hydrator
 *
 * Resolves placeholder tokens in pre-compiled templates at serve time.
 * Only executes the dynamic parts — server scripts, expression evaluation,
 * and view composers — skipping all the deterministic work done at build time.
 *
 * @module template-hydrator
 */

import type { CompiledTemplate } from './template-compiler'
import { extractVariables } from './variable-extractor'
import { evaluateExpression, escapeHtml } from './expressions'
import { replacePlaceholders, hasPlaceholders } from './placeholder'

/**
 * Hydrate a pre-compiled template with request-time data.
 *
 * This is the serve-time counterpart to compileTemplate(). It takes a
 * compiled template (with placeholder tokens) and a request context,
 * executes server scripts, evaluates expressions, and returns final HTML.
 *
 * @param compiled - The pre-compiled template from build time
 * @param requestContext - Request-time context (route params, session, etc.)
 * @returns Final HTML ready to send to the browser
 */
export async function hydrateTemplate(
  compiled: CompiledTemplate,
  requestContext: Record<string, any> = {},
): Promise<string> {
  // If the page has no dynamic content, return pre-rendered HTML as-is
  if (!compiled.hasServerScripts && !hasPlaceholders(compiled.html)) {
    return compiled.html
  }

  // Build the hydration context from request data
  const context: Record<string, any> = {
    __filename: compiled.sourceFile,
    __dirname: compiled.sourceFile.replace(/[/\\][^/\\]+$/, ''),
    ...requestContext,
  }

  // Execute server scripts to populate context with dynamic data
  for (const scriptContent of compiled.serverScriptContent) {
    try {
      await extractVariables(scriptContent, context, compiled.sourceFile)
    }
    catch (error) {
      console.warn(`[stx] Server script error in ${compiled.sourceFile}:`, error)
    }
  }

  // If no placeholders, server scripts only needed to populate context
  // for side effects (e.g., setting headers). Return HTML as-is.
  if (!hasPlaceholders(compiled.html)) {
    return compiled.html
  }

  // Resolve expression placeholders
  const values = new Map<string, string>()

  for (const [token, info] of Object.entries(compiled.placeholders)) {
    if (info.expression) {
      try {
        const value = evaluateExpression(info.expression, context)
        if (info.type === 'raw') {
          values.set(token, value !== undefined && value !== null ? String(value) : '')
        }
        else {
          values.set(token, value !== undefined && value !== null ? escapeHtml(String(value)) : '')
        }
      }
      catch {
        values.set(token, '')
      }
    }
  }

  return replacePlaceholders(compiled.html, values)
}

/**
 * Hydrate a fragment (for SPA navigation).
 * Same as hydrateTemplate but returns the fragment portion.
 */
export async function hydrateFragment(
  compiled: CompiledTemplate,
  requestContext: Record<string, any> = {},
): Promise<string> {
  if (!compiled.hasServerScripts && !hasPlaceholders(compiled.fragment)) {
    return compiled.fragment
  }

  // Hydrate the full HTML first (to get context from server scripts)
  const context: Record<string, any> = {
    __filename: compiled.sourceFile,
    __dirname: compiled.sourceFile.replace(/[/\\][^/\\]+$/, ''),
    ...requestContext,
  }

  for (const scriptContent of compiled.serverScriptContent) {
    try {
      await extractVariables(scriptContent, context, compiled.sourceFile)
    }
    catch (error) {
      console.warn(`[stx] Server script error in ${compiled.sourceFile}:`, error)
    }
  }

  if (!hasPlaceholders(compiled.fragment)) {
    return compiled.fragment
  }

  const values = new Map<string, string>()
  for (const [token, info] of Object.entries(compiled.placeholders)) {
    if (info.expression) {
      try {
        const value = evaluateExpression(info.expression, context)
        if (info.type === 'raw') {
          values.set(token, value !== undefined && value !== null ? String(value) : '')
        }
        else {
          values.set(token, value !== undefined && value !== null ? escapeHtml(String(value)) : '')
        }
      }
      catch {
        values.set(token, '')
      }
    }
  }

  return replacePlaceholders(compiled.fragment, values)
}
