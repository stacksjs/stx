import type { StxOptions } from './types'
import { escapeHtml } from './expressions'
import { createDetailedErrorMessage } from './utils'

/**
 * Process middleware registered in the application
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
    catch (error: any) {
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
 * Run pre-processing middleware
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
 * Run post-processing middleware
 */
export async function runPostProcessingMiddleware(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
): Promise<string> {
  return processMiddleware(template, context, filePath, options, 'after')
}
