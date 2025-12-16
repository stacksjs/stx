/**
 * Middleware Module
 *
 * Provides a middleware system for pre/post-processing templates.
 * Middleware can transform template content before or after directive processing.
 *
 * ## Middleware Lifecycle
 *
 * 1. **Before (pre-processing)**: Runs before any directives are processed.
 *    Use for raw template transformation, content injection, or validation.
 *
 * 2. **After (post-processing)**: Runs after all directives are processed.
 *    Use for output transformation, minification, or final validation.
 *
 * ## Middleware Definition
 *
 * ```typescript
 * interface Middleware {
 *   name: string                              // Unique identifier
 *   timing: 'before' | 'after'                // When to run
 *   handler: (
 *     template: string,                       // Current template content
 *     context: Record<string, any>,           // Template context
 *     filePath: string,                       // Path to template file
 *     options: StxOptions                     // Processing options
 *   ) => string | Promise<string>             // Modified template
 * }
 * ```
 *
 * ## Configuration Example
 *
 * ```typescript
 * // stx.config.ts
 * export default {
 *   middleware: [
 *     {
 *       name: 'minify-html',
 *       timing: 'after',
 *       handler: (template) => template.replace(/\\s+/g, ' ')
 *     },
 *     {
 *       name: 'inject-timestamp',
 *       timing: 'before',
 *       handler: (template, ctx) => {
 *         ctx.buildTime = new Date().toISOString()
 *         return template
 *       }
 *     }
 *   ]
 * }
 * ```
 *
 * ## Error Handling
 *
 * - Middleware errors are caught and logged (in debug mode)
 * - A visual error message is injected into the output when debug is enabled
 * - Processing continues with remaining middleware even if one fails
 *
 * @module middleware
 */

import type { StxOptions } from './types'
import { escapeHtml } from './expressions'
import { createDetailedErrorMessage } from './utils'

/**
 * Process middleware registered in the application.
 *
 * Executes all middleware handlers that match the specified timing in sequence.
 * Each middleware receives the current template and can modify it.
 *
 * @param template - The template string to process
 * @param context - Template context with variables (can be modified by middleware)
 * @param filePath - Path to the template file (for error messages)
 * @param options - STX processing options containing middleware configuration
 * @param timing - When to run: 'before' or 'after' directive processing
 * @returns The processed template string
 *
 * @example
 * ```typescript
 * const processed = await processMiddleware(
 *   '<div>{{ content }}</div>',
 *   { content: 'Hello' },
 *   '/path/to/template.stx',
 *   { middleware: myMiddleware },
 *   'before'
 * )
 * ```
 */
export async function processMiddleware(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  timing: 'before' | 'after',
): Promise<string> {
  if (!options.middleware || options.middleware.length === 0) {
    return template // No middleware to process
  }

  let output = template
  const middlewareToRun = options.middleware.filter(m => m.timing === timing)

  if (middlewareToRun.length === 0) {
    return output // No middleware for this timing
  }

  // Process each middleware in sequence
  for (const middleware of middlewareToRun) {
    // Skip invalid middleware
    if (!middleware.name || typeof middleware.handler !== 'function') {
      if (options.debug) {
        console.warn('Invalid middleware:', middleware)
      }
      continue
    }

    try {
      // Run the middleware handler
      const result = await middleware.handler(output, context, filePath, options)

      // Update the output with the processed result
      if (typeof result === 'string') {
        output = result
      }
      else if (options.debug) {
        console.warn(`Middleware ${middleware.name} did not return a string`)
      }
    }
    catch (error: unknown) {
      if (options.debug) {
        console.error(`Error in middleware ${middleware.name}:`, error)
      }

      // Provide more detailed error information for debugging
      if (options.debug) {
        // Insert a helpful error message in the output
        const errorMessage = createDetailedErrorMessage(
          'Middleware',
          `Error in middleware '${middleware.name}': ${error instanceof Error ? error.message : String(error)}`,
          filePath,
          template,
        )

        // Add a visible error message to the template (escape HTML to prevent XSS)
        output = output.replace(/<body[^>]*>/, `$&\n<div style="color:red;background:#ffeeee;padding:10px;border:1px solid #ff0000;margin:10px 0;font-family:monospace;white-space:pre-wrap;">${escapeHtml(errorMessage)}</div>\n`)
      }

      // Continue with other middleware even if one fails
    }
  }

  return output
}

/**
 * Run pre-processing middleware (timing: 'before').
 *
 * This is a convenience wrapper for `processMiddleware` with timing='before'.
 * Pre-processing middleware runs before any directives are processed.
 *
 * @param template - The raw template string
 * @param context - Template context with variables
 * @param filePath - Path to the template file
 * @param options - STX processing options
 * @returns The pre-processed template string
 */
export async function runPreProcessingMiddleware(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  return processMiddleware(template, context, filePath, options, 'before')
}

/**
 * Run post-processing middleware (timing: 'after').
 *
 * This is a convenience wrapper for `processMiddleware` with timing='after'.
 * Post-processing middleware runs after all directives have been processed.
 *
 * @param template - The processed template string
 * @param context - Template context with variables
 * @param filePath - Path to the template file
 * @param options - STX processing options
 * @returns The post-processed template string
 */
export async function runPostProcessingMiddleware(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  return processMiddleware(template, context, filePath, options, 'after')
}
