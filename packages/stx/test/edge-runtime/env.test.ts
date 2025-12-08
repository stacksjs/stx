import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { createEnvAccessor } from '../../src/edge-runtime'

describe('createEnvAccessor', () => {
  let originalTestVar: string | undefined

  beforeEach(() => {
    originalTestVar = process.env.TEST_VAR
  })

  afterEach(() => {
    if (originalTestVar !== undefined) {
      process.env.TEST_VAR = originalTestVar
    }
    else {
      delete process.env.TEST_VAR
    }
  })

  describe('get', () => {
    it('should get environment variable from process.env', () => {
      process.env.TEST_VAR = 'test-value'
      const env = createEnvAccessor()

      expect(env.get('TEST_VAR')).toBe('test-value')
    })

    it('should return undefined for non-existent variable', () => {
      const env = createEnvAccessor()
      expect(env.get('DOES_NOT_EXIST_12345')).toBeUndefined()
    })

    it('should prefer platform env over process.env', () => {
      process.env.TEST_VAR = 'process-value'
      const env = createEnvAccessor({ TEST_VAR: 'platform-value' })

      expect(env.get('TEST_VAR')).toBe('platform-value')
    })

    it('should fall back to process.env if not in platform env', () => {
      process.env.TEST_VAR = 'process-value'
      const env = createEnvAccessor({ OTHER_VAR: 'other-value' })

      expect(env.get('TEST_VAR')).toBe('process-value')
    })

    it('should return undefined for non-string platform env values', () => {
      process.env.TEST_VAR = 'process-value'
      const env = createEnvAccessor({ TEST_VAR: 123 as unknown as string })

      // Platform env check happens first - if key exists but value is not string, returns undefined
      // This is because 'TEST_VAR' in platformEnv is true, but value is not string
      expect(env.get('TEST_VAR')).toBeUndefined()
    })
  })

  describe('getOrThrow', () => {
    it('should return value if exists', () => {
      process.env.TEST_VAR = 'test-value'
      const env = createEnvAccessor()

      expect(env.getOrThrow('TEST_VAR')).toBe('test-value')
    })

    it('should throw if variable does not exist', () => {
      const env = createEnvAccessor()

      expect(() => {
        env.getOrThrow('DOES_NOT_EXIST_12345')
      }).toThrow('Environment variable "DOES_NOT_EXIST_12345" is not set')
    })
  })

  describe('has', () => {
    it('should return true for existing variable', () => {
      process.env.TEST_VAR = 'value'
      const env = createEnvAccessor()

      expect(env.has('TEST_VAR')).toBe(true)
    })

    it('should return false for non-existent variable', () => {
      const env = createEnvAccessor()
      expect(env.has('DOES_NOT_EXIST_12345')).toBe(false)
    })

    it('should return true for platform env variable', () => {
      const env = createEnvAccessor({ PLATFORM_VAR: 'value' })
      expect(env.has('PLATFORM_VAR')).toBe(true)
    })
  })

  describe('all', () => {
    it('should return all environment variables', () => {
      process.env.TEST_VAR = 'test-value'
      const env = createEnvAccessor()
      const all = env.all()

      expect(all.TEST_VAR).toBe('test-value')
    })

    it('should include platform env in result', () => {
      const env = createEnvAccessor({ PLATFORM_VAR: 'platform-value' })
      const all = env.all()

      expect(all.PLATFORM_VAR).toBe('platform-value')
    })

    it('should merge process.env and platform env', () => {
      process.env.TEST_VAR = 'process-value'
      const env = createEnvAccessor({ PLATFORM_VAR: 'platform-value' })
      const all = env.all()

      expect(all.TEST_VAR).toBe('process-value')
      expect(all.PLATFORM_VAR).toBe('platform-value')
    })
  })
})
