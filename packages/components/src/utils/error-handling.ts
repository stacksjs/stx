/**
 * Error handling utilities for @stacksjs/components
 *
 * Provides clear, actionable error messages with links to documentation
 *
 * @example
 * ```ts
 * import { ComponentError, handleError } from '@stacksjs/components'
 *
 * throw new ComponentError('Button', 'Invalid variant provided', {
 *   received: 'invalid',
 *   expected: ['primary', 'secondary', 'outline']
 * })
 * ```
 */

/**
 * Base URL for documentation
 */
const DOCS_BASE_URL = 'https://stacks.js.org/components'

/**
 * Error context information
 */
export interface ErrorContext {
  /** The component name where the error occurred */
  component?: string
  /** The prop name that caused the error */
  prop?: string
  /** The value that was received */
  received?: any
  /** The expected value(s) */
  expected?: any
  /** Additional details about the error */
  details?: string
  /** Link to relevant documentation */
  docsUrl?: string
}

/**
 * Custom error class for component errors
 */
export class ComponentError extends Error {
  component: string
  context: ErrorContext

  constructor(component: string, message: string, context: ErrorContext = {}) {
    const fullMessage = ComponentError.formatMessage(component, message, context)
    super(fullMessage)

    this.name = 'ComponentError'
    this.component = component
    this.context = { component, ...context }

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ComponentError)
    }
  }

  /**
   * Format error message with context
   */
  static formatMessage(component: string, message: string, context: ErrorContext): string {
    let formatted = `[${component}] ${message}`

    if (context.prop) {
      formatted += `\n  Prop: "${context.prop}"`
    }

    if (context.received !== undefined) {
      formatted += `\n  Received: ${JSON.stringify(context.received)}`
    }

    if (context.expected !== undefined) {
      const expected = Array.isArray(context.expected)
        ? context.expected.map(v => JSON.stringify(v)).join(', ')
        : JSON.stringify(context.expected)
      formatted += `\n  Expected: ${expected}`
    }

    if (context.details) {
      formatted += `\n  Details: ${context.details}`
    }

    if (context.docsUrl) {
      formatted += `\n  Documentation: ${context.docsUrl}`
    }
    else if (component) {
      formatted += `\n  Documentation: ${DOCS_BASE_URL}/${component.toLowerCase()}`
    }

    return formatted
  }

  /**
   * Get error as plain object
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      component: this.component,
      context: this.context,
      stack: this.stack,
    }
  }
}

/**
 * Error types for common scenarios
 */
export const ErrorTypes = {
  /**
   * Invalid prop value error
   */
  invalidProp(component: string, prop: string, received: any, expected: any): ComponentError {
    return new ComponentError(
      component,
      `Invalid prop value for "${prop}"`,
      {
        prop,
        received,
        expected,
        details: Array.isArray(expected)
          ? `The "${prop}" prop must be one of the allowed values`
          : `The "${prop}" prop does not match the expected type`,
      },
    )
  },

  /**
   * Required prop missing error
   */
  requiredProp(component: string, prop: string): ComponentError {
    return new ComponentError(
      component,
      `Required prop "${prop}" is missing`,
      {
        prop,
        details: `The "${prop}" prop is required for ${component} to function correctly`,
      },
    )
  },

  /**
   * Invalid prop type error
   */
  invalidType(component: string, prop: string, received: any, expected: string): ComponentError {
    return new ComponentError(
      component,
      `Invalid type for prop "${prop}"`,
      {
        prop,
        received: typeof received,
        expected,
        details: `Expected "${prop}" to be of type ${expected}, but received ${typeof received}`,
      },
    )
  },

  /**
   * Component not found error
   */
  componentNotFound(componentName: string): ComponentError {
    return new ComponentError(
      'ComponentLoader',
      `Component "${componentName}" not found`,
      {
        component: componentName,
        details: 'Make sure the component is properly imported and registered',
      },
    )
  },

  /**
   * Invalid children error
   */
  invalidChildren(component: string, received: any, expected: string): ComponentError {
    return new ComponentError(
      component,
      'Invalid children',
      {
        received: typeof received,
        expected,
        details: `${component} expects ${expected} as children`,
      },
    )
  },

  /**
   * State update error
   */
  stateUpdate(component: string, stateName: string, error: Error): ComponentError {
    return new ComponentError(
      component,
      `Failed to update state "${stateName}"`,
      {
        details: error.message,
      },
    )
  },

  /**
   * Event handler error
   */
  eventHandler(component: string, eventName: string, error: Error): ComponentError {
    return new ComponentError(
      component,
      `Error in "${eventName}" event handler`,
      {
        details: error.message,
      },
    )
  },

  /**
   * Render error
   */
  render(component: string, error: Error): ComponentError {
    return new ComponentError(
      component,
      'Failed to render component',
      {
        details: error.message,
      },
    )
  },
}

/**
 * Global error handler
 */
let errorHandler: ((error: Error) => void) | null = null

/**
 * Set global error handler
 *
 * @param handler - Error handler function
 *
 * @example
 * ```ts
 * setErrorHandler((error) => {
 *   console.error('Component error:', error)
 *   // Send to error tracking service
 * })
 * ```
 */
export function setErrorHandler(handler: (error: Error) => void): void {
  errorHandler = handler
}

/**
 * Handle an error
 *
 * @param error - Error to handle
 * @param options - Handling options
 *
 * @example
 * ```ts
 * try {
 *   // Component code
 * } catch (error) {
 *   handleError(error, { throwError: false })
 * }
 * ```
 */
export function handleError(
  error: Error,
  options: {
    /** Whether to re-throw the error after handling */
    throwError?: boolean
    /** Whether to log the error to console */
    logError?: boolean
  } = {},
): void {
  const { throwError = true, logError = true } = options

  // Log to console in development
  if (logError && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.error('Component Error:', error)

    if (error instanceof ComponentError) {
      console.group('Error Details')
      console.log('Component:', error.component)
      console.log('Context:', error.context)
      console.groupEnd()
    }
  }

  // Call global error handler if set
  if (errorHandler) {
    try {
      errorHandler(error)
    }
    catch (handlerError) {
      console.error('Error in error handler:', handlerError)
    }
  }

  // Re-throw if requested
  if (throwError) {
    throw error
  }
}

/**
 * Create a wrapped function that catches and handles errors
 *
 * @param fn - Function to wrap
 * @param component - Component name for error context
 * @param eventName - Event name for error context
 * @returns Wrapped function
 *
 * @example
 * ```ts
 * const safeHandler = wrapErrorHandler(
 *   () => { /* ... * / },
 *   'Button',
 *   'onClick'
 * )
 * ```
 */
export function wrapErrorHandler<T extends (...args: any[]) => any>(
  fn: T,
  component: string,
  eventName: string,
): T {
  return ((...args: any[]) => {
    try {
      const result = fn(...args)

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          const wrappedError = ErrorTypes.eventHandler(component, eventName, error)
          handleError(wrappedError, { throwError: false })
          throw wrappedError
        })
      }

      return result
    }
    catch (error) {
      const wrappedError = ErrorTypes.eventHandler(component, eventName, error as Error)
      handleError(wrappedError, { throwError: false })
      throw wrappedError
    }
  }) as T
}

/**
 * Assert a condition with a custom error
 *
 * @param condition - Condition to check
 * @param error - Error to throw if condition is false
 *
 * @example
 * ```ts
 * assert(
 *   props.variant !== undefined,
 *   ErrorTypes.requiredProp('Button', 'variant')
 * )
 * ```
 */
export function assert(condition: any, error: Error): asserts condition {
  if (!condition) {
    throw error
  }
}

/**
 * Warning message handler
 */
export function warn(component: string, message: string, context: Partial<ErrorContext> = {}): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }

  const fullMessage = ComponentError.formatMessage(component, message, context as ErrorContext)

  console.warn(`⚠️  ${fullMessage}`)
}

/**
 * Development-only assertion
 */
export function devAssert(condition: any, error: Error): asserts condition {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    return
  }

  assert(condition, error)
}

/**
 * Create a debug logger for a component
 *
 * @param component - Component name
 * @returns Debug logger functions
 *
 * @example
 * ```ts
 * const debug = createDebugger('Button')
 * debug.log('Button rendered')
 * debug.error('Invalid prop')
 * ```
 */
export function createDebugger(component: string) {
  const isDebug = typeof process !== 'undefined' && process.env.DEBUG === 'true'

  return {
    log(...args: any[]) {
      if (isDebug) {
        console.log(`[${component}]`, ...args)
      }
    },
    warn(message: string, context?: Partial<ErrorContext>) {
      warn(component, message, context)
    },
    error(message: string, context?: ErrorContext) {
      const error = new ComponentError(component, message, context)
      handleError(error, { throwError: false })
    },
  }
}

/**
 * Error boundary helper for catching render errors
 *
 * @param component - Component name
 * @param renderFn - Render function
 * @param fallback - Fallback content on error
 * @returns Rendered content or fallback
 *
 * @example
 * ```ts
 * const content = errorBoundary(
 *   'MyComponent',
 *   () => renderComponent(),
 *   '<div>Error loading component</div>'
 * )
 * ```
 */
export function errorBoundary<T>(
  component: string,
  renderFn: () => T,
  fallback: T,
): T {
  try {
    return renderFn()
  }
  catch (error) {
    const wrappedError = ErrorTypes.render(component, error as Error)
    handleError(wrappedError, { throwError: false })
    return fallback
  }
}
