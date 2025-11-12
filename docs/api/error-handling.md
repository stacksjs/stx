# Error Handling API Reference

This document covers stx's comprehensive error handling system for robust template processing.

## Overview

stx provides a sophisticated error handling system that:
- Provides custom error types for different error categories
- Includes detailed error context with line numbers and code snippets
- Supports graceful error recovery in production
- Offers development-friendly error messages
- Enables error logging and monitoring integration

## Error Types

### StxError

Base error class for all stx errors.

```typescript
import { StxError } from '@stacksjs/stx/error-handling'

throw new StxError(
  'Error message',
  'ERROR_CODE',
  '/path/to/file.stx',
  42,        // line number
  15,        // column number
  'context'  // code snippet
)
```

**Properties:**
- `message` (string): Error message
- `code` (string): Error code
- `filePath` (string): File where error occurred
- `line` (number): Line number
- `column` (number): Column number
- `context` (string): Code context

### StxSyntaxError

Syntax errors in templates.

```typescript
import { StxSyntaxError } from '@stacksjs/stx/error-handling'

throw new StxSyntaxError(
  'Invalid directive syntax',
  'template.stx',
  10,
  5,
  '@if(invalid syntax'
)
```

**Common Syntax Errors:**
- Unclosed directives (`@if` without `@endif`)
- Invalid expressions
- Malformed component tags
- Missing quotes or brackets

**Example Output:**
```
[Syntax Error at line 10 in template.stx]: Invalid directive syntax

Context:
   7: <div>
   8:   <h1>Hello</h1>
   9:
>  10:   @if(invalid syntax
  11:     <p>Content</p>
  12:   @endif
  13: </div>
          ^
```

### StxRuntimeError

Runtime errors during template processing.

```typescript
import { StxRuntimeError } from '@stacksjs/stx/error-handling'

throw new StxRuntimeError(
  'Variable not defined',
  'template.stx',
  15,
  10,
  '{{ undefinedVar }}'
)
```

**Common Runtime Errors:**
- Undefined variables
- Failed component rendering
- Invalid function calls
- Type errors in expressions

### StxSecurityError

Security-related errors.

```typescript
import { StxSecurityError } from '@stacksjs/stx/error-handling'

throw new StxSecurityError(
  'Attempted to access restricted path',
  'template.stx',
  20,
  5,
  '@include(../../etc/passwd)'
)
```

**Security Protections:**
- Path traversal prevention
- XSS protection
- CSRF token validation
- Safe expression evaluation

### StxFileError

File system errors.

```typescript
import { StxFileError } from '@stacksjs/stx/error-handling'

throw new StxFileError(
  'Template not found',
  'missing.stx',
  undefined,
  undefined,
  '@include(missing.stx)'
)
```

**Common File Errors:**
- Template not found
- Permission denied
- Invalid file paths
- Circular dependencies

## Error Context

### ErrorContext Interface

```typescript
interface ErrorContext {
  filePath: string    // Template file path
  template: string    // Full template content
  offset: number      // Character offset in template
  match: string       // Matched directive/expression
}
```

### Creating Enhanced Errors

```typescript
import { createEnhancedError } from '@stacksjs/stx/error-handling'

const context: ErrorContext = {
  filePath: 'template.stx',
  template: templateContent,
  offset: 150,
  match: '@if(user.isAdmin'
}

const errorMessage = createEnhancedError(
  'Syntax',
  'Unclosed directive',
  context
)

console.error(errorMessage)
```

**Output:**
```
[Syntax Error at line 8 in template.stx]: Unclosed directive

Context:
   5: <body>
   6:   <header>
   7:     <h1>Dashboard</h1>
>  8:     @if(user.isAdmin
   9:       <admin-panel />
  10:     <!-- Missing @endif -->
  11:   </header>
          ^
```

## Error Recovery

### Safe Execution Wrapper

Safely execute code with automatic error handling:

```typescript
import { safeExecuteAsync } from '@stacksjs/stx/error-handling'

const result = await safeExecuteAsync(
  // Function to execute
  async () => {
    return await processTemplate(filePath)
  },
  // Fallback value on error
  '<div>Error occurred</div>',
  // Optional error handler
  (error) => {
    console.error('Template processing failed:', error)
  }
)
```

**Parameters:**
- `fn` (Function): Async function to execute
- `fallback` (any): Fallback value on error
- `errorHandler` (Function): Optional error handler

### Error Recovery Strategies

```typescript
import { errorRecovery } from '@stacksjs/stx/error-handling'

// Create fallback content
const fallback = errorRecovery.createFallbackContent(
  'Template Processing',
  new StxRuntimeError('Failed to load component')
)

console.log(fallback)
// Output: "[Error: Template Processing - Failed to load component]"
```

## Error Logging

### ErrorLogger

Built-in error logging system:

```typescript
import { errorLogger } from '@stacksjs/stx/error-handling'

// Log an error
errorLogger.log(
  new StxRuntimeError('Template error'),
  { filePath: 'template.stx', context: {} }
)

// Get error history
const errors = errorLogger.getErrors()

// Get errors for specific file
const fileErrors = errorLogger.getErrorsForFile('template.stx')

// Clear error log
errorLogger.clear()
```

**Error Log Entry:**
```typescript
{
  error: StxRuntimeError,
  timestamp: 1696789012345,
  metadata: {
    filePath: 'template.stx',
    context: {}
  }
}
```

## Development Helpers

### Detailed Error Logging

Enable detailed error messages in development:

```typescript
import { devHelpers } from '@stacksjs/stx/error-handling'

devHelpers.logDetailedError(
  new StxSyntaxError('Invalid syntax'),
  {
    filePath: 'template.stx',
    template: templateContent
  }
)
```

**Output:**
```
====================================
ERROR DETAILS
====================================

Type: StxSyntaxError
Message: Invalid syntax
File: template.stx

Template Preview:
------------------------------------
1: <!DOCTYPE html>
2: <html>
3: <body>
4:   @if(user.isAdmin
           ^
5:   </div>
------------------------------------

Stack Trace:
...
====================================
```

### Error Monitoring

Enable error monitoring in production:

```typescript
// stx.config.ts
export default {
  debug: false,
  errorHandling: {
    logErrors: true,
    throwOnError: false,
    fallbackContent: true
  }
}
```

## Configuration

### Error Handling Options

```typescript
// stx.config.ts
export default {
  // Enable debug mode for detailed errors
  debug: process.env.NODE_ENV !== 'production',

  // Error handling configuration
  errorHandling: {
    // Log errors to console
    logErrors: true,

    // Throw errors instead of recovering
    throwOnError: process.env.NODE_ENV !== 'production',

    // Use fallback content on errors
    fallbackContent: process.env.NODE_ENV === 'production',

    // Custom error handler
    onError: (error: StxError) => {
      // Send to error tracking service
      console.error('[stx Error]', error)
    }
  }
}
```

## Best Practices

### 1. Use Specific Error Types

```typescript
// Bad - Generic error
throw new Error('Template not found')

// Good - Specific error type
throw new StxFileError(
  'Template not found: user-profile.stx',
  'user-profile.stx'
)
```

### 2. Include Context

```typescript
// Bad - No context
throw new StxSyntaxError('Invalid directive')

// Good - With context
throw new StxSyntaxError(
  'Invalid @if directive: missing closing parenthesis',
  'template.stx',
  42,
  10,
  '@if(user.isAdmin'
)
```

### 3. Graceful Degradation

```typescript
// Production: Graceful fallback
if (process.env.NODE_ENV === 'production') {
  try {
    return await processTemplate(filePath)
  } catch (error) {
    errorLogger.log(error)
    return errorRecovery.createFallbackContent('Template', error)
  }
}

// Development: Fail fast
return await processTemplate(filePath)
```

### 4. Error Boundaries

```typescript
async function renderWithErrorBoundary(
  templatePath: string,
  context: any
) {
  try {
    return await processTemplate(templatePath, context)
  } catch (error) {
    if (error instanceof StxSyntaxError) {
      // Handle syntax errors
      return createSyntaxErrorPage(error)
    } else if (error instanceof StxFileError) {
      // Handle file errors
      return create404Page(error)
    } else {
      // Handle other errors
      return create500Page(error)
    }
  }
}
```

## Examples

### Custom Error Handler

```typescript
import { StxError } from '@stacksjs/stx/error-handling'

function handleTemplateError(error: unknown) {
  if (error instanceof StxError) {
    console.error(`[${error.name}] ${error.message}`)
    console.error(`  File: ${error.filePath}`)
    console.error(`  Line: ${error.line}:${error.column}`)
    console.error(`  Code: ${error.code}`)

    // Send to monitoring service
    sendToMonitoring({
      type: error.name,
      message: error.message,
      file: error.filePath,
      line: error.line
    })
  } else {
    console.error('Unknown error:', error)
  }
}
```

### Error Recovery with Retry

```typescript
async function renderWithRetry(
  templatePath: string,
  maxRetries: number = 3
): Promise<string> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await processTemplate(templatePath)
    } catch (error) {
      if (attempt === maxRetries) {
        errorLogger.log(error as StxError)
        return errorRecovery.createFallbackContent('Template', error)
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 100 * attempt))
    }
  }

  throw new StxRuntimeError('Max retries exceeded')
}
```

### Development Error Page

```typescript
function createDevelopmentErrorPage(error: StxError): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>stx Error</title>
      <style>
        body {
          font-family: monospace;
          padding: 2rem;
          background: #1e1e1e;
          color: #d4d4d4;
        }
        .error {
          background: #2d2d2d;
          padding: 2rem;
          border-left: 4px solid #f44336;
        }
        .error-type {
          color: #f44336;
          font-size: 1.2rem;
          font-weight: bold;
        }
        .error-message {
          margin: 1rem 0;
        }
        .error-location {
          color: #888;
        }
        pre {
          background: #1e1e1e;
          padding: 1rem;
          overflow-x: auto;
        }
      </style>
    </head>
    <body>
      <div class="error">
        <div class="error-type">${error.name}</div>
        <div class="error-message">${error.message}</div>
        <div class="error-location">
          ${error.filePath}:${error.line}:${error.column}
        </div>
        <pre>${error.context || ''}</pre>
      </div>
    </body>
    </html>
  `
}
```

## Integration with Monitoring

### Sentry Integration

```typescript
import * as Sentry from '@sentry/node'
import { StxError } from '@stacksjs/stx/error-handling'

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN
})

// Custom error handler
function reportError(error: StxError) {
  Sentry.captureException(error, {
    tags: {
      errorCode: error.code,
      filePath: error.filePath
    },
    contexts: {
      template: {
        line: error.line,
        column: error.column,
        context: error.context
      }
    }
  })
}
```

### Custom Logging Service

```typescript
async function logToService(error: StxError) {
  await fetch('https://api.logging.com/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: error.name,
      message: error.message,
      code: error.code,
      file: error.filePath,
      line: error.line,
      column: error.column,
      timestamp: Date.now()
    })
  })
}
```

## See Also

- [Configuration](/guide/config) - stx configuration options
- [Security](/features/security) - Security best practices
- [Testing](/guide/testing) - Testing error scenarios
- [Best Practices](/guide/best-practices) - Development best practices
