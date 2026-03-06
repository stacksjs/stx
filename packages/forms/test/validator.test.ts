import { describe, expect, test } from 'bun:test'
import { Validator, v } from '../src'

describe('Validator', () => {
  test('v is a Validator instance', () => {
    expect(v).toBeInstanceOf(Validator)
  })

  describe('required', () => {
    test('fails on empty string', async () => {
      const errors = await v.required().validate('')
      expect(errors.length).toBe(1)
      expect(errors[0]).toBe('This field is required')
    })

    test('fails on null', async () => {
      const errors = await v.required().validate(null)
      expect(errors.length).toBe(1)
    })

    test('fails on undefined', async () => {
      const errors = await v.required().validate(undefined)
      expect(errors.length).toBe(1)
    })

    test('fails on whitespace-only string', async () => {
      const errors = await v.required().validate('   ')
      expect(errors.length).toBe(1)
    })

    test('passes on non-empty string', async () => {
      const errors = await v.required().validate('hello')
      expect(errors.length).toBe(0)
    })

    test('passes on number', async () => {
      const errors = await v.required().validate(42)
      expect(errors.length).toBe(0)
    })
  })

  describe('email', () => {
    test('validates correct email', async () => {
      const errors = await v.email().validate('user@example.com')
      expect(errors.length).toBe(0)
    })

    test('fails on invalid email', async () => {
      const errors = await v.email().validate('not-an-email')
      expect(errors.length).toBe(1)
    })

    test('passes on empty (not required)', async () => {
      const errors = await v.email().validate('')
      expect(errors.length).toBe(0)
    })
  })

  describe('url', () => {
    test('validates correct URL', async () => {
      const errors = await v.url().validate('https://example.com')
      expect(errors.length).toBe(0)
    })

    test('fails on invalid URL', async () => {
      const errors = await v.url().validate('not-a-url')
      expect(errors.length).toBe(1)
    })
  })

  describe('min', () => {
    test('passes when length >= min', async () => {
      const errors = await v.min(3).validate('abc')
      expect(errors.length).toBe(0)
    })

    test('fails when length < min', async () => {
      const errors = await v.min(3).validate('ab')
      expect(errors.length).toBe(1)
    })
  })

  describe('max', () => {
    test('passes when length <= max', async () => {
      const errors = await v.max(3).validate('abc')
      expect(errors.length).toBe(0)
    })

    test('fails when length > max', async () => {
      const errors = await v.max(3).validate('abcd')
      expect(errors.length).toBe(1)
    })
  })

  describe('number and between', () => {
    test('number validates numeric values', async () => {
      expect(await v.number().validate('42')).toEqual([])
      expect(await v.number().validate('abc')).toHaveLength(1)
    })

    test('between validates range', async () => {
      expect(await v.number().between(1, 10).validate('5')).toEqual([])
      expect(await v.number().between(1, 10).validate('15')).toHaveLength(1)
    })

    test('integer validates whole numbers', async () => {
      expect(await v.integer().validate('5')).toEqual([])
      expect(await v.integer().validate('5.5')).toHaveLength(1)
    })

    test('positive validates positive numbers', async () => {
      expect(await v.positive().validate('5')).toEqual([])
      expect(await v.positive().validate('-5')).toHaveLength(1)
    })
  })

  describe('string patterns', () => {
    test('hasUppercase', async () => {
      expect(await v.hasUppercase().validate('Hello')).toEqual([])
      expect(await v.hasUppercase().validate('hello')).toHaveLength(1)
    })

    test('hasLowercase', async () => {
      expect(await v.hasLowercase().validate('Hello')).toEqual([])
      expect(await v.hasLowercase().validate('HELLO')).toHaveLength(1)
    })

    test('hasNumber', async () => {
      expect(await v.hasNumber().validate('abc1')).toEqual([])
      expect(await v.hasNumber().validate('abc')).toHaveLength(1)
    })

    test('hasSpecial', async () => {
      expect(await v.hasSpecial().validate('abc!')).toEqual([])
      expect(await v.hasSpecial().validate('abc')).toHaveLength(1)
    })

    test('alphanumeric', async () => {
      expect(await v.alphanumeric().validate('abc123')).toEqual([])
      expect(await v.alphanumeric().validate('abc 123')).toHaveLength(1)
    })
  })

  describe('chaining', () => {
    test('required + email + min', async () => {
      const validator = v.required().email().min(5)
      expect(await validator.validate('')).toHaveLength(1) // required fails
      expect(await validator.validate('a@b')).toHaveLength(2) // email + min fail
      expect(await validator.validate('user@example.com')).toEqual([])
    })

    test('chaining creates new instances (immutable)', () => {
      const a = v.required()
      const b = a.email()
      expect(a.getRules().length).toBe(1)
      expect(b.getRules().length).toBe(2)
    })
  })

  describe('custom validator', () => {
    test('custom sync validator', async () => {
      const validator = v.custom(
        value => value === 'yes' ? true : 'Must be yes',
        'Must be yes',
      )
      expect(await validator.validate('yes')).toEqual([])
      expect(await validator.validate('no')).toEqual(['Must be yes'])
    })
  })

  describe('async validator', () => {
    test('async validator function', async () => {
      const validator = v.async(
        async value => value === 'unique' ? true : 'Already taken',
        'Already taken',
      )
      expect(await validator.validate('unique')).toEqual([])
      expect(await validator.validate('taken')).toEqual(['Already taken'])
    })
  })

  describe('default value', () => {
    test('getDefaultValue returns undefined by default', () => {
      expect(v.required().getDefaultValue()).toBeUndefined()
    })

    test('default sets default value', () => {
      expect(v.default('hello').getDefaultValue()).toBe('hello')
    })
  })
})
