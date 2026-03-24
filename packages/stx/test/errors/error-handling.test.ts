/**
 * Comprehensive tests for error logger and input sanitizer
 *
 * Tests cover:
 * - ErrorLogger class (creation, logging, filtering, stats, clear, flush)
 * - validators.isValidFilePath
 * - validators.isValidVariableName
 * - validators.isValidDirectiveName
 * - validators.isSafeContent
 * - sanitizeDirectiveParam
 * - sanitizeFilePath
 * - sanitizeExpression
 * - sanitizeComponentProps
 * - errorRecovery
 * - devHelpers
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { ErrorLogger, errorRecovery, devHelpers } from '../../src/errors/logger'
import {
  validators,
  sanitizeDirectiveParam,
  sanitizeFilePath,
  sanitizeExpression,
  sanitizeDirectiveParams,
  sanitizeComponentProps,
} from '../../src/errors/sanitizer'

// =============================================================================
// validators.isValidFilePath
// =============================================================================

describe('validators.isValidFilePath', () => {
  describe('valid paths', () => {
    it('should accept a simple relative path', () => {
      expect(validators.isValidFilePath('components/header.stx')).toBe(true)
    })

    it('should accept a dot-relative path', () => {
      expect(validators.isValidFilePath('./relative/path.stx')).toBe(true)
    })

    it('should accept a filename only', () => {
      expect(validators.isValidFilePath('file.stx')).toBe(true)
    })

    it('should accept a deeply nested path', () => {
      expect(validators.isValidFilePath('a/b/c/d/e/f/g/h.stx')).toBe(true)
    })

    it('should accept paths with hyphens and underscores', () => {
      expect(validators.isValidFilePath('my-component_v2/main.stx')).toBe(true)
    })

    it('should accept paths with dots in directory names', () => {
      expect(validators.isValidFilePath('src/.config/stx.config.ts')).toBe(true)
    })

    it('should accept paths with numbers', () => {
      expect(validators.isValidFilePath('v2/components/123.stx')).toBe(true)
    })
  })

  describe('invalid paths - path traversal', () => {
    it('should reject paths with ../', () => {
      expect(validators.isValidFilePath('../secret/file.stx')).toBe(false)
    })

    it('should reject paths with embedded ../', () => {
      expect(validators.isValidFilePath('components/../../../etc/passwd')).toBe(false)
    })

    it('should reject bare ..', () => {
      expect(validators.isValidFilePath('..')).toBe(false)
    })

    it('should reject paths ending with /..', () => {
      expect(validators.isValidFilePath('components/..')).toBe(false)
    })
  })

  describe('invalid paths - null bytes', () => {
    it('should reject paths with null bytes', () => {
      expect(validators.isValidFilePath('file\0.stx')).toBe(false)
    })

    it('should reject paths with null bytes in directory', () => {
      expect(validators.isValidFilePath('dir\0name/file.stx')).toBe(false)
    })
  })

  describe('invalid paths - protocol handlers', () => {
    it('should reject file:// protocol', () => {
      expect(validators.isValidFilePath('file:///etc/passwd')).toBe(false)
    })

    it('should reject http:// protocol', () => {
      expect(validators.isValidFilePath('http://evil.com/script.js')).toBe(false)
    })

    it('should reject https:// protocol', () => {
      expect(validators.isValidFilePath('https://evil.com/script.js')).toBe(false)
    })

    it('should reject javascript: protocol', () => {
      expect(validators.isValidFilePath('javascript:alert(1)')).toBe(false)
    })

    it('should reject data: protocol', () => {
      expect(validators.isValidFilePath('data:text/html,<h1>hi</h1>')).toBe(false)
    })

    it('should reject ftp: protocol', () => {
      expect(validators.isValidFilePath('ftp://server/file')).toBe(false)
    })
  })

  describe('invalid paths - suspicious system directories', () => {
    it('should reject /etc/ paths', () => {
      expect(validators.isValidFilePath('/etc/passwd')).toBe(false)
    })

    it('should reject /root/ paths', () => {
      expect(validators.isValidFilePath('/root/.ssh/id_rsa')).toBe(false)
    })

    it('should reject /proc/ paths', () => {
      expect(validators.isValidFilePath('/proc/self/environ')).toBe(false)
    })

    it('should reject /dev/ paths', () => {
      expect(validators.isValidFilePath('/dev/null')).toBe(false)
    })

    it('should reject /home/ paths', () => {
      expect(validators.isValidFilePath('/home/user/.bashrc')).toBe(false)
    })
  })

  describe('Windows paths', () => {
    it('should reject Windows system paths with System32', () => {
      expect(validators.isValidFilePath('C:/Windows/System32/config')).toBe(false)
    })

    it('should reject Windows paths with Program Files', () => {
      expect(validators.isValidFilePath('C:/Program Files/app.exe')).toBe(false)
    })
  })

  describe('allowedDir constraint', () => {
    it('should accept paths within allowed directory', () => {
      expect(validators.isValidFilePath('sub/file.stx', '/tmp/project')).toBe(true)
    })

    it('should reject paths escaping allowed directory', () => {
      // An absolute path outside the allowed dir
      expect(validators.isValidFilePath('/tmp/other/file.stx', '/tmp/project')).toBe(false)
    })
  })
})

// =============================================================================
// validators.isValidVariableName
// =============================================================================

describe('validators.isValidVariableName', () => {
  describe('valid variable names', () => {
    it('should accept simple lowercase name', () => {
      expect(validators.isValidVariableName('name')).toBe(true)
    })

    it('should accept underscore-prefixed name', () => {
      expect(validators.isValidVariableName('_private')).toBe(true)
    })

    it('should accept dollar-prefixed name', () => {
      expect(validators.isValidVariableName('$dollar')).toBe(true)
    })

    it('should accept camelCase name', () => {
      expect(validators.isValidVariableName('camelCase')).toBe(true)
    })

    it('should accept PascalCase name', () => {
      expect(validators.isValidVariableName('PascalCase')).toBe(true)
    })

    it('should accept single character name', () => {
      expect(validators.isValidVariableName('x')).toBe(true)
    })

    it('should accept name with numbers', () => {
      expect(validators.isValidVariableName('item1')).toBe(true)
    })

    it('should accept all underscores', () => {
      expect(validators.isValidVariableName('___')).toBe(true)
    })

    it('should accept name with mixed characters', () => {
      expect(validators.isValidVariableName('$_myVar99')).toBe(true)
    })
  })

  describe('invalid variable names', () => {
    it('should reject names starting with a number', () => {
      expect(validators.isValidVariableName('1abc')).toBe(false)
    })

    it('should reject names with spaces', () => {
      expect(validators.isValidVariableName('my var')).toBe(false)
    })

    it('should reject names with hyphens', () => {
      expect(validators.isValidVariableName('my-var')).toBe(false)
    })

    it('should reject names with special characters', () => {
      expect(validators.isValidVariableName('foo@bar')).toBe(false)
    })

    it('should reject empty string', () => {
      expect(validators.isValidVariableName('')).toBe(false)
    })

    it('should reject names with dots', () => {
      expect(validators.isValidVariableName('obj.prop')).toBe(false)
    })

    it('should reject names with brackets', () => {
      expect(validators.isValidVariableName('arr[0]')).toBe(false)
    })
  })
})

// =============================================================================
// validators.isValidDirectiveName
// =============================================================================

describe('validators.isValidDirectiveName', () => {
  describe('valid directive names', () => {
    it('should accept simple directive name', () => {
      expect(validators.isValidDirectiveName('if')).toBe(true)
    })

    it('should accept longer directive name', () => {
      expect(validators.isValidDirectiveName('foreach')).toBe(true)
    })

    it('should accept directive with hyphens', () => {
      expect(validators.isValidDirectiveName('custom-name')).toBe(true)
    })

    it('should accept directive with underscores', () => {
      expect(validators.isValidDirectiveName('custom_name')).toBe(true)
    })

    it('should accept directive with numbers', () => {
      expect(validators.isValidDirectiveName('v2directive')).toBe(true)
    })

    it('should accept single character directive', () => {
      expect(validators.isValidDirectiveName('x')).toBe(true)
    })
  })

  describe('invalid directive names', () => {
    it('should reject empty string', () => {
      expect(validators.isValidDirectiveName('')).toBe(false)
    })

    it('should reject name with spaces', () => {
      expect(validators.isValidDirectiveName('my directive')).toBe(false)
    })

    it('should reject name starting with number', () => {
      expect(validators.isValidDirectiveName('1directive')).toBe(false)
    })

    it('should reject name starting with hyphen', () => {
      expect(validators.isValidDirectiveName('-directive')).toBe(false)
    })

    it('should reject name with special characters', () => {
      expect(validators.isValidDirectiveName('dir@name')).toBe(false)
    })

    it('should reject name starting with underscore', () => {
      // The regex requires starting with [a-z], so _ at start is invalid
      expect(validators.isValidDirectiveName('_directive')).toBe(false)
    })
  })
})

// =============================================================================
// validators.isSafeContent
// =============================================================================

describe('validators.isSafeContent', () => {
  it('should accept plain text', () => {
    expect(validators.isSafeContent('Hello World')).toBe(true)
  })

  it('should accept safe HTML', () => {
    expect(validators.isSafeContent('<div class="container"><p>text</p></div>')).toBe(true)
  })

  it('should reject script tags', () => {
    expect(validators.isSafeContent('<script>alert(1)</script>')).toBe(false)
  })

  it('should reject javascript: URIs', () => {
    expect(validators.isSafeContent('javascript:alert(1)')).toBe(false)
  })

  it('should reject event handlers', () => {
    expect(validators.isSafeContent('<img onerror=alert(1)>')).toBe(false)
  })

  it('should reject data:text/html', () => {
    expect(validators.isSafeContent('data:text/html,<h1>hi</h1>')).toBe(false)
  })

  it('should reject vbscript', () => {
    expect(validators.isSafeContent('vbscript:msgbox')).toBe(false)
  })
})

// =============================================================================
// ErrorLogger
// =============================================================================

describe('ErrorLogger', () => {
  let logger: ErrorLogger

  beforeEach(() => {
    logger = new ErrorLogger({ maxErrors: 5 })
  })

  describe('constructor and configuration', () => {
    it('should create a logger with default options', () => {
      const defaultLogger = new ErrorLogger()
      expect(defaultLogger).toBeInstanceOf(ErrorLogger)
    })

    it('should create a logger with custom maxErrors', () => {
      const customLogger = new ErrorLogger({ maxErrors: 10 })
      expect(customLogger).toBeInstanceOf(ErrorLogger)
    })

    it('should configure logger options after creation', () => {
      logger.configure({ maxErrors: 20, logFormat: 'text' })
      // Verify by filling beyond old limit but within new
      for (let i = 0; i < 15; i++) {
        logger.log(new Error(`error ${i}`))
      }
      expect(logger.getRecentErrors(20).length).toBe(15)
    })
  })

  describe('log and getRecentErrors', () => {
    it('should log an error and retrieve it', () => {
      const err = new Error('test error')
      logger.log(err)
      const recent = logger.getRecentErrors()
      expect(recent.length).toBe(1)
      expect(recent[0].error.message).toBe('test error')
    })

    it('should log errors with different levels', () => {
      logger.log(new Error('err'), undefined, 'error')
      logger.log(new Error('warn'), undefined, 'warning')
      logger.log(new Error('info'), undefined, 'info')
      expect(logger.getRecentErrors(10).length).toBe(3)
    })

    it('should log errors with context', () => {
      logger.log(new Error('ctx err'), { file: 'test.stx', line: 42 })
      const recent = logger.getRecentErrors()
      expect(recent[0].context).toEqual({ file: 'test.stx', line: 42 })
    })

    it('should default level to error', () => {
      logger.log(new Error('default level'))
      const recent = logger.getRecentErrors()
      expect(recent[0].level).toBe('error')
    })

    it('should include timestamp on entries', () => {
      logger.log(new Error('time test'))
      const recent = logger.getRecentErrors()
      expect(recent[0].timestamp).toBeInstanceOf(Date)
    })

    it('should return only the requested limit', () => {
      for (let i = 0; i < 5; i++) {
        logger.log(new Error(`error ${i}`))
      }
      expect(logger.getRecentErrors(2).length).toBe(2)
    })

    it('should return most recent errors', () => {
      for (let i = 0; i < 5; i++) {
        logger.log(new Error(`error ${i}`))
      }
      const recent = logger.getRecentErrors(1)
      expect(recent[0].error.message).toBe('error 4')
    })
  })

  describe('memory buffer maxErrors', () => {
    it('should trim old errors when exceeding maxErrors', () => {
      for (let i = 0; i < 10; i++) {
        logger.log(new Error(`error ${i}`))
      }
      const all = logger.getRecentErrors(100)
      expect(all.length).toBe(5)
    })

    it('should keep the most recent entries after trimming', () => {
      for (let i = 0; i < 10; i++) {
        logger.log(new Error(`error ${i}`))
      }
      const all = logger.getRecentErrors(100)
      expect(all[0].error.message).toBe('error 5')
      expect(all[4].error.message).toBe('error 9')
    })
  })

  describe('getErrorsByType', () => {
    it('should filter errors by constructor name', () => {
      logger.log(new TypeError('type err'))
      logger.log(new RangeError('range err'))
      logger.log(new TypeError('type err 2'))
      const typeErrors = logger.getErrorsByType('TypeError')
      expect(typeErrors.length).toBe(2)
    })

    it('should return empty array when no match', () => {
      logger.log(new Error('generic'))
      const syntaxErrors = logger.getErrorsByType('SyntaxError')
      expect(syntaxErrors.length).toBe(0)
    })
  })

  describe('getErrorsByLevel', () => {
    it('should filter errors by level', () => {
      logger.log(new Error('e1'), undefined, 'error')
      logger.log(new Error('w1'), undefined, 'warning')
      logger.log(new Error('i1'), undefined, 'info')
      logger.log(new Error('w2'), undefined, 'warning')
      expect(logger.getErrorsByLevel('warning').length).toBe(2)
      expect(logger.getErrorsByLevel('error').length).toBe(1)
      expect(logger.getErrorsByLevel('info').length).toBe(1)
    })
  })

  describe('getStats', () => {
    it('should return correct totals', () => {
      logger.log(new Error('e1'), undefined, 'error')
      logger.log(new Error('w1'), undefined, 'warning')
      logger.log(new TypeError('t1'), undefined, 'error')
      const stats = logger.getStats()
      expect(stats.total).toBe(3)
    })

    it('should count by type', () => {
      logger.log(new Error('e1'))
      logger.log(new TypeError('t1'))
      logger.log(new TypeError('t2'))
      const stats = logger.getStats()
      expect(stats.byType.Error).toBe(1)
      expect(stats.byType.TypeError).toBe(2)
    })

    it('should count by level', () => {
      logger.log(new Error('e1'), undefined, 'error')
      logger.log(new Error('w1'), undefined, 'warning')
      logger.log(new Error('w2'), undefined, 'warning')
      logger.log(new Error('i1'), undefined, 'info')
      const stats = logger.getStats()
      expect(stats.byLevel.error).toBe(1)
      expect(stats.byLevel.warning).toBe(2)
      expect(stats.byLevel.info).toBe(1)
    })

    it('should return zero counts when empty', () => {
      const stats = logger.getStats()
      expect(stats.total).toBe(0)
      expect(stats.byLevel.error).toBe(0)
      expect(stats.byLevel.warning).toBe(0)
      expect(stats.byLevel.info).toBe(0)
    })
  })

  describe('clear', () => {
    it('should remove all errors from memory', () => {
      logger.log(new Error('e1'))
      logger.log(new Error('e2'))
      logger.clear()
      expect(logger.getRecentErrors(100).length).toBe(0)
    })

    it('should reset stats after clearing', () => {
      logger.log(new Error('e1'))
      logger.clear()
      expect(logger.getStats().total).toBe(0)
    })
  })

  describe('flush', () => {
    it('should resolve without error when no file logging', async () => {
      logger.log(new Error('test'))
      await expect(logger.flush()).resolves.toBeUndefined()
    })
  })
})

// =============================================================================
// sanitizeDirectiveParam
// =============================================================================

describe('sanitizeDirectiveParam', () => {
  it('should return unmodified value for clean input', () => {
    const result = sanitizeDirectiveParam('hello world')
    expect(result.value).toBe('hello world')
    expect(result.modified).toBe(false)
    expect(result.warnings.length).toBe(0)
  })

  it('should remove null bytes', () => {
    const result = sanitizeDirectiveParam('hello\0world')
    expect(result.value).toBe('helloworld')
    expect(result.modified).toBe(true)
    expect(result.warnings).toContain('Null bytes removed from parameter')
  })

  it('should truncate long input', () => {
    const longStr = 'x'.repeat(20000)
    const result = sanitizeDirectiveParam(longStr, { maxLength: 100 })
    expect(result.value.length).toBe(100)
    expect(result.modified).toBe(true)
  })

  it('should escape HTML when allowHtml is false', () => {
    const result = sanitizeDirectiveParam('<script>alert(1)</script>')
    expect(result.value).not.toContain('<script>')
    expect(result.modified).toBe(true)
    expect(result.warnings).toContain('HTML content was escaped')
  })

  it('should preserve HTML when allowHtml is true', () => {
    const result = sanitizeDirectiveParam('<b>bold</b>', { allowHtml: true })
    expect(result.value).toBe('<b>bold</b>')
  })

  it('should remove javascript: URIs', () => {
    const result = sanitizeDirectiveParam('javascript:alert(1)')
    expect(result.value).not.toContain('javascript:')
    expect(result.modified).toBe(true)
  })

  it('should remove vbscript: URIs', () => {
    const result = sanitizeDirectiveParam('vbscript:msgbox("hi")')
    expect(result.value).not.toContain('vbscript:')
    expect(result.modified).toBe(true)
  })

  it('should remove data:text/html URIs', () => {
    const result = sanitizeDirectiveParam('data:text/html,<h1>hi</h1>')
    expect(result.modified).toBe(true)
  })

  it('should apply custom sanitizer', () => {
    const result = sanitizeDirectiveParam('HELLO', {
      customSanitizer: (v: string) => v.toLowerCase(),
    })
    expect(result.value).toBe('hello')
    expect(result.modified).toBe(true)
  })

  it('should remove control characters when allowSpecialChars is false', () => {
    const result = sanitizeDirectiveParam('hello\x01world', { allowSpecialChars: false })
    expect(result.value).toBe('helloworld')
    expect(result.modified).toBe(true)
  })
})

// =============================================================================
// sanitizeDirectiveParams (batch)
// =============================================================================

describe('sanitizeDirectiveParams', () => {
  it('should sanitize multiple params', () => {
    const results = sanitizeDirectiveParams(['clean', 'hello\0world'])
    expect(results.length).toBe(2)
    expect(results[0].modified).toBe(false)
    expect(results[1].modified).toBe(true)
  })
})

// =============================================================================
// sanitizeFilePath
// =============================================================================

describe('sanitizeFilePath', () => {
  it('should return clean paths unchanged', () => {
    expect(sanitizeFilePath('components/header.stx')).toBe('components/header.stx')
  })

  it('should remove null bytes', () => {
    const result = sanitizeFilePath('file\0.stx')
    expect(result).not.toBeNull()
    expect(result!).not.toContain('\0')
  })

  it('should normalize backslashes to forward slashes', () => {
    const result = sanitizeFilePath('dir\\file.stx')
    expect(result).toBe('dir/file.stx')
  })

  it('should remove path traversal attempts', () => {
    const result = sanitizeFilePath('../../etc/passwd')
    // After removing ../, the path becomes etc/passwd
    expect(result).not.toBeNull()
    expect(result!).not.toContain('../')
  })

  it('should remove protocol handlers', () => {
    const result = sanitizeFilePath('file:///etc/passwd')
    expect(result).not.toBeNull()
    expect(result!).not.toContain('file://')
  })

  it('should return null for unsafe paths that cannot be sanitized', () => {
    // After sanitizing, /etc/passwd is still a suspicious system path
    const result = sanitizeFilePath('/etc/passwd')
    expect(result).toBeNull()
  })
})

// =============================================================================
// sanitizeExpression
// =============================================================================

describe('sanitizeExpression', () => {
  it('should trim whitespace', () => {
    const result = sanitizeExpression('  x + y  ')
    expect(result.value).toBe('x + y')
    expect(result.modified).toBe(true)
  })

  it('should warn about eval()', () => {
    const result = sanitizeExpression('eval("alert(1)")')
    expect(result.warnings.some(w => w.includes('eval()'))).toBe(true)
  })

  it('should warn about Function()', () => {
    const result = sanitizeExpression('new Function("return 1")')
    expect(result.warnings.some(w => w.includes('Function()'))).toBe(true)
  })

  it('should warn about __proto__', () => {
    const result = sanitizeExpression('obj.__proto__')
    expect(result.warnings.some(w => w.includes('__proto__'))).toBe(true)
  })

  it('should warn about constructor access', () => {
    const result = sanitizeExpression('obj.constructor')
    expect(result.warnings.some(w => w.includes('constructor'))).toBe(true)
  })

  it('should warn about prototype access', () => {
    const result = sanitizeExpression('obj.prototype')
    expect(result.warnings.some(w => w.includes('prototype'))).toBe(true)
  })

  it('should remove null bytes from expression', () => {
    const result = sanitizeExpression('x\0 + y')
    expect(result.value).not.toContain('\0')
    expect(result.modified).toBe(true)
  })

  it('should return clean expression without modification', () => {
    const result = sanitizeExpression('items.length > 0')
    expect(result.value).toBe('items.length > 0')
    expect(result.modified).toBe(false)
    expect(result.warnings.length).toBe(0)
  })

  it('should warn about dynamic import()', () => {
    const result = sanitizeExpression('import("malicious")')
    expect(result.warnings.some(w => w.includes('dynamic import()'))).toBe(true)
  })

  it('should warn about require()', () => {
    const result = sanitizeExpression('require("fs")')
    expect(result.warnings.some(w => w.includes('require()'))).toBe(true)
  })
})

// =============================================================================
// sanitizeComponentProps
// =============================================================================

describe('sanitizeComponentProps', () => {
  it('should pass through valid string props', () => {
    const result = sanitizeComponentProps({ title: 'Hello' })
    expect(result.title).toBe('Hello')
  })

  it('should pass through numeric props', () => {
    const result = sanitizeComponentProps({ count: 42 })
    expect(result.count).toBe(42)
  })

  it('should pass through boolean props', () => {
    const result = sanitizeComponentProps({ active: true })
    expect(result.active).toBe(true)
  })

  it('should skip props with invalid keys', () => {
    const result = sanitizeComponentProps({ 'invalid-key': 'value', validKey: 'value' })
    expect(result['invalid-key']).toBeUndefined()
    expect(result.validKey).toBe('value')
  })

  it('should sanitize string values in arrays', () => {
    const result = sanitizeComponentProps({ items: ['hello\0', 'world'] })
    const items = result.items as string[]
    expect(items[0]).toBe('hello')
    expect(items[1]).toBe('world')
  })

  it('should recursively sanitize nested objects', () => {
    const result = sanitizeComponentProps({
      nested: { innerProp: 'safe value' },
    })
    expect((result.nested as Record<string, unknown>).innerProp).toBe('safe value')
  })

  it('should preserve non-string array items', () => {
    const result = sanitizeComponentProps({ nums: [1, 2, 3] })
    expect(result.nums).toEqual([1, 2, 3])
  })
})

// =============================================================================
// errorRecovery
// =============================================================================

describe('errorRecovery', () => {
  it('should report whether recovery is enabled', () => {
    const enabled = errorRecovery.isEnabled()
    expect(typeof enabled).toBe('boolean')
  })

  it('should create fallback content for errors', () => {
    const fallback = errorRecovery.createFallbackContent('header', new Error('render failed'))
    expect(typeof fallback).toBe('string')
    expect(fallback).toContain('<!--')
    expect(fallback).toContain('-->')
  })

  it('should return template unchanged when recovery is disabled and no fixes needed', () => {
    // fixCommonSyntaxErrors returns unchanged if recovery is disabled
    const result = errorRecovery.fixCommonSyntaxErrors('<div>clean</div>')
    // Either fixes applied or not, the template should be returned
    expect(result.fixed).toContain('<div>clean</div>')
  })
})

// =============================================================================
// devHelpers
// =============================================================================

describe('devHelpers', () => {
  it('should report development mode', () => {
    expect(typeof devHelpers.isDevelopment()).toBe('boolean')
  })

  it('should create an error report string', () => {
    const report = devHelpers.createErrorReport(new Error('test error'), { key: 'value' })
    expect(report).toContain('test error')
    expect(report).toContain('Error Report')
    expect(report).toContain('key')
  })

  it('should include error type in report', () => {
    const report = devHelpers.createErrorReport(new TypeError('type err'))
    expect(report).toContain('TypeError')
  })

  it('should include timestamp in report', () => {
    const report = devHelpers.createErrorReport(new Error('ts'))
    expect(report).toContain('Time:')
  })

  it('should handle report without context', () => {
    const report = devHelpers.createErrorReport(new Error('no ctx'))
    expect(report).toContain('no ctx')
    expect(report).not.toContain('Context:')
  })
})
