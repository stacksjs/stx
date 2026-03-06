import { describe, expect, test } from 'bun:test'
import { StxError } from '../src/error-types'
import {
  AuthenticationError,
  AuthorizationError,
  ConfigError,
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../src/error-types'
import { extractSourceContext, formatError, formatErrorDetailed, getErrorHint } from '../src/formatter'

describe('formatError', () => {
  test('formats basic error', () => {
    const error = new Error('something went wrong')
    const result = formatError(error)

    expect(result).toContain('Error')
    expect(result).toContain('something went wrong')
  })

  test('formats StxError with code', () => {
    const error = new StxError('bad config', { code: 'CONFIG_ERROR' })
    const result = formatError(error)

    expect(result).toContain('StxError')
    expect(result).toContain('[CONFIG_ERROR]')
    expect(result).toContain('bad config')
  })

  test('formats StxError with file path', () => {
    const error = new StxError('parse error', {
      filePath: '/app/test.stx',
      line: 10,
      column: 5,
    })
    const result = formatError(error)

    expect(result).toContain('at /app/test.stx:10:5')
  })

  test('formats StxError with file path and line only', () => {
    const error = new StxError('error', { filePath: '/app/test.stx', line: 10 })
    const result = formatError(error)

    expect(result).toContain('at /app/test.stx:10')
    expect(result).not.toContain(':10:')
  })
})

describe('formatErrorDetailed', () => {
  test('includes error name and message', () => {
    const error = new Error('test error')
    const result = formatErrorDetailed(error)

    expect(result).toContain('Error: test error')
  })

  test('includes code for StxError', () => {
    const error = new StxError('test', { code: 'MY_CODE' })
    const result = formatErrorDetailed(error)

    expect(result).toContain('Code: MY_CODE')
  })

  test('includes file path and line info', () => {
    const error = new StxError('test', {
      filePath: '/app/file.stx',
      line: 42,
      column: 8,
    })
    const result = formatErrorDetailed(error)

    expect(result).toContain('File: /app/file.stx')
    expect(result).toContain('Line: 42, Column: 8')
  })

  test('includes hint for StxError', () => {
    const error = new StxError('test', { hint: 'Try this instead' })
    const result = formatErrorDetailed(error)

    expect(result).toContain('Hint: Try this instead')
  })

  test('includes stack trace', () => {
    const error = new Error('test')
    const result = formatErrorDetailed(error)

    expect(result).toContain('Stack trace:')
  })
})

describe('extractSourceContext', () => {
  test('returns empty array for non-existent file', () => {
    const result = extractSourceContext('/nonexistent/file.ts', 1)
    expect(result).toEqual([])
  })
})

describe('getErrorHint', () => {
  test('returns hint for module not found', () => {
    const error = new Error('Cannot find module "foo"')
    const hint = getErrorHint(error)

    expect(hint).toContain('bun install')
  })

  test('returns hint for not defined', () => {
    const error = new Error('myVar is not defined')
    const hint = getErrorHint(error)

    expect(hint).toContain('imported or declared')
  })

  test('returns hint for ENOENT', () => {
    const error = new Error('ENOENT: no such file')
    const hint = getErrorHint(error)

    expect(hint).toContain('does not exist')
  })

  test('returns hint for permission denied', () => {
    const error = new Error('EACCES: permission denied')
    const hint = getErrorHint(error)

    expect(hint).toContain('Permission denied')
  })

  test('returns hint for syntax error', () => {
    const error = new Error('Unexpected token syntax error')
    const hint = getErrorHint(error)

    expect(hint).toContain('syntax error')
  })

  test('returns hint for connection refused', () => {
    const error = new Error('ECONNREFUSED: connection refused')
    const hint = getErrorHint(error)

    expect(hint).toContain('server running')
  })

  test('returns hint for timeout', () => {
    const error = new Error('Operation timed out')
    const hint = getErrorHint(error)

    expect(hint).toContain('timed out')
  })

  test('returns hint for port in use', () => {
    const error = new Error('Port 3000 is already in use')
    const hint = getErrorHint(error)

    expect(hint).toContain('port')
  })

  test('returns null for unknown errors', () => {
    const error = new Error('Some random error 12345')
    const hint = getErrorHint(error)

    expect(hint).toBeNull()
  })
})

describe('custom error classes', () => {
  test('StxError sets all properties', () => {
    const error = new StxError('test', {
      code: 'MY_CODE',
      filePath: '/file.stx',
      line: 10,
      column: 5,
      hint: 'Try this',
    })

    expect(error.message).toBe('test')
    expect(error.name).toBe('StxError')
    expect(error.code).toBe('MY_CODE')
    expect(error.filePath).toBe('/file.stx')
    expect(error.line).toBe(10)
    expect(error.column).toBe(5)
    expect(error.hint).toBe('Try this')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(StxError)
  })

  test('StxError has default code', () => {
    const error = new StxError('test')
    expect(error.code).toBe('STX_ERROR')
  })

  test('NotFoundError', () => {
    const error = new NotFoundError('/users/1')

    expect(error.message).toBe('Not found: /users/1')
    expect(error.name).toBe('NotFoundError')
    expect(error.code).toBe('NOT_FOUND')
    expect(error).toBeInstanceOf(StxError)
    expect(error).toBeInstanceOf(Error)
  })

  test('NotFoundError without resource', () => {
    const error = new NotFoundError()
    expect(error.message).toBe('Not found')
  })

  test('ValidationError', () => {
    const errors = { email: ['required', 'invalid'], name: ['too short'] }
    const error = new ValidationError(errors)

    expect(error.message).toContain('2 errors')
    expect(error.name).toBe('ValidationError')
    expect(error.code).toBe('VALIDATION_ERROR')
    expect(error.errors).toEqual(errors)
    expect(error).toBeInstanceOf(StxError)
  })

  test('ValidationError with single field', () => {
    const error = new ValidationError({ email: ['required'] })
    expect(error.message).toContain('1 error')
    expect(error.message).not.toContain('1 errors')
  })

  test('AuthenticationError', () => {
    const error = new AuthenticationError()

    expect(error.message).toBe('Authentication required')
    expect(error.name).toBe('AuthenticationError')
    expect(error.code).toBe('AUTHENTICATION_ERROR')
    expect(error).toBeInstanceOf(StxError)
  })

  test('AuthenticationError with custom message', () => {
    const error = new AuthenticationError('Token expired')
    expect(error.message).toBe('Token expired')
  })

  test('AuthorizationError', () => {
    const error = new AuthorizationError()

    expect(error.message).toBe('Access denied')
    expect(error.name).toBe('AuthorizationError')
    expect(error.code).toBe('AUTHORIZATION_ERROR')
  })

  test('DatabaseError', () => {
    const error = new DatabaseError('Connection failed', 'SELECT * FROM users')

    expect(error.message).toBe('Connection failed')
    expect(error.name).toBe('DatabaseError')
    expect(error.code).toBe('DATABASE_ERROR')
    expect(error.query).toBe('SELECT * FROM users')
    expect(error).toBeInstanceOf(StxError)
  })

  test('DatabaseError without query', () => {
    const error = new DatabaseError('Connection failed')
    expect(error.query).toBeUndefined()
  })

  test('ConfigError', () => {
    const error = new ConfigError('Missing key', 'database.host')

    expect(error.message).toBe('Missing key')
    expect(error.name).toBe('ConfigError')
    expect(error.code).toBe('CONFIG_ERROR')
    expect(error.key).toBe('database.host')
    expect(error).toBeInstanceOf(StxError)
  })

  test('ConfigError without key', () => {
    const error = new ConfigError('Invalid config')
    expect(error.key).toBeUndefined()
  })
})
