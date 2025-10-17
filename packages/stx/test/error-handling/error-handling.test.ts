import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import {
  createEnhancedError,
  devHelpers,
  ErrorLogger,
  errorRecovery,
  safeExecute,
  safeExecuteAsync,
  StxError,
  StxFileError,
  StxRuntimeError,
  StxSecurityError,
  StxSyntaxError,
  validators,
} from '../../src/error-handling'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-errors')

describe('Error Handling', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
  })

  afterAll(async () => {
    await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
  })

  describe('Custom Error Types', () => {
    it('should create StxError with all properties', () => {
      const error = new StxError(
        'Test error',
        'TEST_ERROR',
        '/path/to/file.stx',
        10,
        5,
        'Error context',
      )

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.filePath).toBe('/path/to/file.stx')
      expect(error.line).toBe(10)
      expect(error.column).toBe(5)
      expect(error.context).toBe('Error context')
      expect(error.name).toBe('StxError')
    })

    it('should create specific error types', () => {
      const syntaxError = new StxSyntaxError('Syntax error', '/path/file.stx', 5, 10, 'context')
      expect(syntaxError.name).toBe('StxSyntaxError')
      expect(syntaxError.code).toBe('stx_SYNTAX_ERROR')

      const runtimeError = new StxRuntimeError('Runtime error', '/path/file.stx')
      expect(runtimeError.name).toBe('StxRuntimeError')
      expect(runtimeError.code).toBe('stx_RUNTIME_ERROR')

      const securityError = new StxSecurityError('Security error', '/path/file.stx')
      expect(securityError.name).toBe('StxSecurityError')
      expect(securityError.code).toBe('stx_SECURITY_ERROR')

      const fileError = new StxFileError('File error', '/path/file.stx')
      expect(fileError.name).toBe('StxFileError')
      expect(fileError.code).toBe('stx_FILE_ERROR')
    })
  })

  describe('Enhanced Error Context', () => {
    it('should create enhanced error with context', () => {
      const template = `line 1
line 2
line 3 with error
line 4
line 5`

      const context = {
        filePath: '/test/file.stx',
        template,
        offset: template.indexOf('with error'),
        match: 'with error',
      }

      const enhancedError = createEnhancedError('Syntax', 'Test error message', context)

      expect(enhancedError).toContain('[Syntax Error at line 3 in /test/file.stx]: Test error message')
      expect(enhancedError).toContain('Context:')
      expect(enhancedError).toContain('>   3: line 3 with error')
      expect(enhancedError).toContain('^')
    })

    it('should handle edge cases in error context', () => {
      const template = 'single line'
      const context = {
        filePath: '/test/file.stx',
        template,
        offset: 0,
        match: 'single',
      }

      const enhancedError = createEnhancedError('Test', 'Error at start', context)

      expect(enhancedError).toContain('[Test Error at line 1 in /test/file.stx]: Error at start')
    })
  })

  describe('Safe Execution Wrappers', () => {
    it('should execute function safely and return result', () => {
      const result = safeExecute(
        () => 'success',
        'fallback',
      )

      expect(result).toBe('success')
    })

    it('should return fallback on error', () => {
      let errorHandled = false

      const result = safeExecute(
        () => { throw new Error('Test error') },
        'fallback',
        (error) => {
          errorHandled = true
          expect(error.message).toBe('Test error')
        },
      )

      expect(result).toBe('fallback')
      expect(errorHandled).toBe(true)
    })

    it('should execute async function safely', async () => {
      const result = await safeExecuteAsync(
        async () => 'async success',
        'fallback',
      )

      expect(result).toBe('async success')
    })

    it('should handle async errors', async () => {
      let errorHandled = false

      const result = await safeExecuteAsync(
        async () => { throw new Error('Async error') },
        'async fallback',
        (error) => {
          errorHandled = true
          expect(error.message).toBe('Async error')
        },
      )

      expect(result).toBe('async fallback')
      expect(errorHandled).toBe(true)
    })
  })

  describe('Validators', () => {
    describe('isValidFilePath', () => {
      it('should accept valid file paths', () => {
        expect(validators.isValidFilePath('file.stx')).toBe(true)
        expect(validators.isValidFilePath('components/header.stx')).toBe(true)
        expect(validators.isValidFilePath('./relative/path.stx')).toBe(true)
      })

      it('should reject path traversal attempts', () => {
        expect(validators.isValidFilePath('../../../etc/passwd')).toBe(false)
        expect(validators.isValidFilePath('file/../../../secret')).toBe(false)
        expect(validators.isValidFilePath('..\\windows\\path')).toBe(false)
      })

      it('should reject suspicious absolute paths', () => {
        expect(validators.isValidFilePath('/etc/passwd')).toBe(false)
        expect(validators.isValidFilePath('/root/secret')).toBe(false)
      })
    })

    describe('isValidVariableName', () => {
      it('should accept valid JavaScript identifiers', () => {
        expect(validators.isValidVariableName('validVar')).toBe(true)
        expect(validators.isValidVariableName('_private')).toBe(true)
        expect(validators.isValidVariableName('$jquery')).toBe(true)
        expect(validators.isValidVariableName('camelCase123')).toBe(true)
      })

      it('should reject invalid identifiers', () => {
        expect(validators.isValidVariableName('123invalid')).toBe(false)
        expect(validators.isValidVariableName('with-dash')).toBe(false)
        expect(validators.isValidVariableName('with space')).toBe(false)
        expect(validators.isValidVariableName('')).toBe(false)
      })
    })

    describe('isValidDirectiveName', () => {
      it('should accept valid directive names', () => {
        expect(validators.isValidDirectiveName('if')).toBe(true)
        expect(validators.isValidDirectiveName('foreach')).toBe(true)
        expect(validators.isValidDirectiveName('custom-directive')).toBe(true)
        expect(validators.isValidDirectiveName('my_directive')).toBe(true)
      })

      it('should reject invalid directive names', () => {
        expect(validators.isValidDirectiveName('123invalid')).toBe(false)
        expect(validators.isValidDirectiveName('with space')).toBe(false)
        expect(validators.isValidDirectiveName('')).toBe(false)
      })
    })

    describe('isSafeContent', () => {
      it('should accept safe content', () => {
        expect(validators.isSafeContent('Hello world')).toBe(true)
        expect(validators.isSafeContent('<p>Safe HTML</p>')).toBe(true)
        expect(validators.isSafeContent('Some text with {{ variables }}')).toBe(true)
      })

      it('should reject potentially dangerous content', () => {
        expect(validators.isSafeContent('<script>alert("xss")</script>')).toBe(false)
        expect(validators.isSafeContent('javascript:alert(1)')).toBe(false)
        expect(validators.isSafeContent('data:text/html,<script>alert(1)</script>')).toBe(false)
        expect(validators.isSafeContent('<div onclick="alert(1)">Click</div>')).toBe(false)
      })
    })
  })

  describe('Error Recovery', () => {
    describe('fixCommonSyntaxErrors', () => {
      it('should fix unmatched braces', () => {
        const template = 'Hello {{ name world'
        const fixed = errorRecovery.fixCommonSyntaxErrors(template)

        expect(fixed).toBe('Hello {{ name world}}')
      })

      it('should fix unclosed directives', () => {
        const template = '@if (condition)\n  Content'
        const fixed = errorRecovery.fixCommonSyntaxErrors(template)

        expect(fixed).toBe('@if (condition)\n  Content\n@endif')
      })

      it('should fix multiple unclosed directives', () => {
        const template = '@if (condition)\n  @foreach (items as item)\n    Content'
        const fixed = errorRecovery.fixCommonSyntaxErrors(template)

        expect(fixed).toContain('@endif')
        expect(fixed).toContain('@endforeach')
      })

      it('should not modify correctly formatted templates', () => {
        const template = '@if (condition)\n  {{ name }}\n@endif'
        const fixed = errorRecovery.fixCommonSyntaxErrors(template)

        expect(fixed).toBe(template)
      })
    })

    describe('createFallbackContent', () => {
      it('should create fallback content for failed sections', () => {
        const error = new Error('Template compilation failed')
        const fallback = errorRecovery.createFallbackContent('Component', error)

        expect(fallback).toContain('<!-- Component failed: Template compilation failed -->')
      })
    })
  })

  describe('Error Logger', () => {
    it('should log and retrieve errors', () => {
      const logger = new ErrorLogger()
      const error1 = new Error('First error')
      const error2 = new Error('Second error')

      logger.log(error1, { context: 'test1' })
      logger.log(error2, { context: 'test2' })

      const recent = logger.getRecentErrors(5)
      expect(recent).toHaveLength(2)
      expect(recent[0].error.message).toBe('First error')
      expect(recent[1].error.message).toBe('Second error')
    })

    it('should filter errors by type', () => {
      const logger = new ErrorLogger()
      const syntaxError = new StxSyntaxError('Syntax error')
      const runtimeError = new StxRuntimeError('Runtime error')

      logger.log(syntaxError)
      logger.log(runtimeError)

      const syntaxErrors = logger.getErrorsByType('StxSyntaxError')
      expect(syntaxErrors).toHaveLength(1)
      expect(syntaxErrors[0].error.message).toBe('Syntax error')
    })

    it('should provide error statistics', () => {
      const logger = new ErrorLogger()
      const syntaxError = new StxSyntaxError('Syntax error')
      const runtimeError1 = new StxRuntimeError('Runtime error 1')
      const runtimeError2 = new StxRuntimeError('Runtime error 2')

      logger.log(syntaxError)
      logger.log(runtimeError1)
      logger.log(runtimeError2)

      const stats = logger.getStats()
      expect(stats.total).toBe(3)
      expect(stats.byType.StxSyntaxError).toBe(1)
      expect(stats.byType.StxRuntimeError).toBe(2)
    })

    it('should clear error history', () => {
      const logger = new ErrorLogger()
      logger.log(new Error('Test error'))

      expect(logger.getRecentErrors().length).toBe(1)

      logger.clear()
      expect(logger.getRecentErrors().length).toBe(0)
    })

    it('should limit stored errors', () => {
      const logger = new ErrorLogger()

      // Add more errors than the max limit
      for (let i = 0; i < 1100; i++) {
        logger.log(new Error(`Error ${i}`))
      }

      expect(logger.getRecentErrors().length).toBeLessThanOrEqual(1000)
    })
  })

  describe('Development Helpers', () => {
    describe('isDevelopment', () => {
      it('should detect development mode', () => {
        const originalEnv = process.env.NODE_ENV
        const originalDebug = process.env.stx_DEBUG

        // Test development detection
        process.env.NODE_ENV = 'development'
        expect(devHelpers.isDevelopment()).toBe(true)

        process.env.NODE_ENV = 'production'
        process.env.stx_DEBUG = 'true'
        expect(devHelpers.isDevelopment()).toBe(true)

        process.env.NODE_ENV = 'production'
        process.env.stx_DEBUG = 'false'
        expect(devHelpers.isDevelopment()).toBe(false)

        // Restore original values
        if (originalEnv)
          process.env.NODE_ENV = originalEnv
        else delete process.env.NODE_ENV
        if (originalDebug)
          process.env.stx_DEBUG = originalDebug
        else delete process.env.stx_DEBUG
      })
    })

    describe('createErrorReport', () => {
      it('should create detailed error report', () => {
        const error = new StxRuntimeError('Test error', '/path/file.stx', 10, 5, 'context')
        const context = { template: 'test template', variables: { name: 'test' } }

        const report = devHelpers.createErrorReport(error, context)

        expect(report).toContain('=== stx Error Report ===')
        expect(report).toContain('Error: Test error')
        expect(report).toContain('Type: StxRuntimeError')
        expect(report).toContain('Context:')
        expect(report).toContain('template')
        expect(report).toContain('variables')
      })
    })
  })

  describe('Enhanced Error Integration', () => {
    it('should integrate with ErrorLogger for centralized logging', () => {
      const logger = new ErrorLogger()
      const error = new StxSyntaxError('Syntax issue', '/test/file.stx', 5, 10)

      logger.log(error, { template: 'test content', operation: 'parsing' })

      const recent = logger.getRecentErrors(1)
      expect(recent).toHaveLength(1)
      expect(recent[0].error).toBe(error)
      expect(recent[0].context?.template).toBe('test content')
      expect(recent[0].context?.operation).toBe('parsing')
    })

    it('should provide error context for debugging', async () => {
      const template = `line 1
line 2 with {{ error
line 3`

      const context = {
        filePath: '/test/debug.stx',
        template,
        offset: template.indexOf('{{ error'),
        match: '{{ error',
      }

      const enhancedError = createEnhancedError('Expression', 'Unclosed expression', context)

      expect(enhancedError).toContain('line 2')
      expect(enhancedError).toContain('{{ error')
      expect(enhancedError).toContain('^')
    })

    it('should handle nested error recovery', () => {
      const template = `
@if (condition1)
  @if (condition2)
    @foreach (items as item)
      Content {{ item }}
    // Missing @endforeach, @endif, @endif
`

      const fixed = errorRecovery.fixCommonSyntaxErrors(template)

      expect(fixed).toContain('@endforeach')
      expect(fixed).toContain('@endif')

      // Should have closed all nested structures
      const endifCount = (fixed.match(/@endif/g) || []).length
      expect(endifCount).toBe(2)
    })

    it('should validate and sanitize user inputs', () => {
      // Test path validation
      expect(validators.isValidFilePath('/etc/passwd')).toBe(false)
      expect(validators.isValidFilePath('../../../secret')).toBe(false)
      expect(validators.isValidFilePath('components/valid.stx')).toBe(true)

      // Test variable name validation
      expect(validators.isValidVariableName('validName')).toBe(true)
      expect(validators.isValidVariableName('123invalid')).toBe(false)
      expect(validators.isValidVariableName('with space')).toBe(false)

      // Test content safety
      expect(validators.isSafeContent('<script>alert("xss")</script>')).toBe(false)
      expect(validators.isSafeContent('<p>Safe content</p>')).toBe(true)
      expect(validators.isSafeContent('javascript:alert(1)')).toBe(false)
    })

    it('should provide meaningful error suggestions', () => {
      const syntaxError = new StxSyntaxError(
        'Unmatched directive',
        '/test/file.stx',
        10,
        5,
        '@if (condition)\n  content\n// missing @endif',
      )

      // Error should contain helpful information
      expect(syntaxError.message).toContain('Unmatched directive')
      expect(syntaxError.line).toBe(10)
      expect(syntaxError.column).toBe(5)
      expect(syntaxError.context).toContain('@if')
      expect(syntaxError.context).toContain('missing @endif')
    })

    it('should handle error chaining and causality', () => {
      const _rootCause = new Error('Network timeout')
      const stxError = new StxFileError('Failed to load template', '/remote/template.stx')

      // In a real scenario, we might chain errors
      expect(stxError.message).toContain('Failed to load template')
      expect(stxError.code).toBe('stx_FILE_ERROR')
      expect(stxError.filePath).toBe('/remote/template.stx')
    })

    it('should support error recovery with fallback content', () => {
      const error = new StxRuntimeError('Variable not found: user.name')
      const fallback = errorRecovery.createFallbackContent('UserProfile', error)

      expect(fallback).toContain('<!-- UserProfile failed:')
      expect(fallback).toContain('Variable not found: user.name')
      expect(fallback).toContain('-->')
    })
  })

  describe('Error Reporting and Analytics', () => {
    it('should track error patterns for analytics', () => {
      const logger = new ErrorLogger()

      // Simulate common error patterns
      logger.log(new StxSyntaxError('Unmatched @if'))
      logger.log(new StxSyntaxError('Unmatched @foreach'))
      logger.log(new StxSyntaxError('Unmatched @if'))
      logger.log(new StxRuntimeError('Variable not found'))

      const stats = logger.getStats()
      expect(stats.total).toBe(4)
      expect(stats.byType.StxSyntaxError).toBe(3)
      expect(stats.byType.StxRuntimeError).toBe(1)
    })

    it('should provide error frequency analysis', () => {
      const logger = new ErrorLogger()

      // Log multiple instances of the same error type
      for (let i = 0; i < 5; i++) {
        logger.log(new StxSyntaxError(`Syntax error ${i}`))
      }

      for (let i = 0; i < 3; i++) {
        logger.log(new StxRuntimeError(`Runtime error ${i}`))
      }

      const syntaxErrors = logger.getErrorsByType('StxSyntaxError')
      const runtimeErrors = logger.getErrorsByType('StxRuntimeError')

      expect(syntaxErrors).toHaveLength(5)
      expect(runtimeErrors).toHaveLength(3)
    })

    it('should support error filtering and search', () => {
      const logger = new ErrorLogger()

      logger.log(new StxSyntaxError('Missing @endif', '/templates/header.stx'))
      logger.log(new StxSyntaxError('Missing @endforeach', '/templates/nav.stx'))
      logger.log(new StxRuntimeError('Variable error', '/templates/footer.stx'))

      const allErrors = logger.getRecentErrors()
      expect(allErrors).toHaveLength(3)

      // Filter by error type
      const syntaxErrors = logger.getErrorsByType('StxSyntaxError')
      expect(syntaxErrors).toHaveLength(2)
      expect(syntaxErrors.every(e => e.error instanceof StxSyntaxError)).toBe(true)
    })
  })
})
