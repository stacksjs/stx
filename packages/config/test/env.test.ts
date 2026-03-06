import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { defineEnv, isDevelopment, isProduction, isTest } from '../src/env'

describe('defineEnv', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    // Reset env
    for (const key of Object.keys(process.env)) {
      if (key.startsWith('TEST_')) delete process.env[key]
    }
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv.NODE_ENV
  })

  test('parses string env vars', () => {
    process.env.TEST_NAME = 'hello'
    const env = defineEnv({
      TEST_NAME: { type: 'string' },
    })
    expect(env.TEST_NAME).toBe('hello')
  })

  test('parses number env vars', () => {
    process.env.TEST_COUNT = '42'
    const env = defineEnv({
      TEST_COUNT: { type: 'number' },
    })
    expect(env.TEST_COUNT).toBe(42)
  })

  test('parses boolean env vars', () => {
    process.env.TEST_ENABLED = 'true'
    const env = defineEnv({
      TEST_ENABLED: { type: 'boolean' },
    })
    expect(env.TEST_ENABLED).toBe(true)
  })

  test('parses port env vars', () => {
    process.env.TEST_PORT = '3000'
    const env = defineEnv({
      TEST_PORT: { type: 'port' },
    })
    expect(env.TEST_PORT).toBe(3000)
  })

  test('applies defaults when env var is missing', () => {
    const env = defineEnv({
      TEST_MISSING: { type: 'string', default: 'fallback' },
    })
    expect(env.TEST_MISSING).toBe('fallback')
  })

  test('throws when required var is missing', () => {
    expect(() => {
      defineEnv({
        TEST_REQUIRED: { type: 'string', required: true },
      })
    }).toThrow('Environment validation failed')
  })

  test('does not throw when optional var is missing', () => {
    const env = defineEnv({
      TEST_OPTIONAL: { type: 'string', required: false },
    })
    expect(env.TEST_OPTIONAL).toBeUndefined()
  })

  test('validates url type', () => {
    process.env.TEST_URL = 'https://example.com'
    const env = defineEnv({
      TEST_URL: { type: 'url' },
    })
    expect(env.TEST_URL).toBe('https://example.com')
  })

  test('rejects invalid url', () => {
    process.env.TEST_URL = 'not-a-url'
    expect(() => {
      defineEnv({ TEST_URL: { type: 'url' } })
    }).toThrow('Environment validation failed')
  })

  test('validates email type', () => {
    process.env.TEST_EMAIL = 'test@example.com'
    const env = defineEnv({
      TEST_EMAIL: { type: 'email' },
    })
    expect(env.TEST_EMAIL).toBe('test@example.com')
  })

  test('rejects invalid email', () => {
    process.env.TEST_EMAIL = 'not-an-email'
    expect(() => {
      defineEnv({ TEST_EMAIL: { type: 'email' } })
    }).toThrow('Environment validation failed')
  })

  test('enforces choices constraint', () => {
    process.env.TEST_MODE = 'staging'
    expect(() => {
      defineEnv({
        TEST_MODE: { type: 'string', choices: ['development', 'production'] },
      })
    }).toThrow('must be one of')
  })

  test('passes custom validation', () => {
    process.env.TEST_CUSTOM = '50'
    const env = defineEnv({
      TEST_CUSTOM: { type: 'number', validate: (v: number) => v >= 0 && v <= 100 },
    })
    expect(env.TEST_CUSTOM).toBe(50)
  })

  test('rejects failed custom validation', () => {
    process.env.TEST_CUSTOM = '200'
    expect(() => {
      defineEnv({
        TEST_CUSTOM: { type: 'number', validate: (v: number) => v >= 0 && v <= 100 },
      })
    }).toThrow('failed custom validation')
  })

  test('rejects invalid port range', () => {
    process.env.TEST_PORT = '99999'
    expect(() => {
      defineEnv({ TEST_PORT: { type: 'port' } })
    }).toThrow('valid port')
  })

  test('boolean accepts various truthy values', () => {
    for (const val of ['true', '1', 'yes', 'TRUE', 'Yes']) {
      process.env.TEST_BOOL = val
      const env = defineEnv({ TEST_BOOL: { type: 'boolean' } })
      expect(env.TEST_BOOL).toBe(true)
    }
  })

  test('boolean accepts various falsy values', () => {
    for (const val of ['false', '0', 'no', 'FALSE', 'No']) {
      process.env.TEST_BOOL = val
      const env = defineEnv({ TEST_BOOL: { type: 'boolean' } })
      expect(env.TEST_BOOL).toBe(false)
    }
  })
})

describe('environment helpers', () => {
  test('isProduction returns true when NODE_ENV is production', () => {
    process.env.NODE_ENV = 'production'
    expect(isProduction()).toBe(true)
  })

  test('isProduction returns false when NODE_ENV is not production', () => {
    process.env.NODE_ENV = 'development'
    expect(isProduction()).toBe(false)
  })

  test('isDevelopment returns true when not production', () => {
    process.env.NODE_ENV = 'development'
    expect(isDevelopment()).toBe(true)
  })

  test('isTest returns true when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test'
    expect(isTest()).toBe(true)
  })
})
