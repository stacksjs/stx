import type { Middleware, StxOptions } from './types'

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
    catch (error) {
      if (options.debug) {
        console.error(`Error in middleware ${middleware.name}:`, error)
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
