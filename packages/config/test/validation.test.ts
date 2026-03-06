import { describe, expect, test } from 'bun:test'
import { validateEnv } from '../src/validation'

describe('validateEnv', () => {
  test('returns errors for missing required fields', () => {
    const { errors } = validateEnv(
      { API_KEY: { type: 'string', required: true } },
      {},
    )
    expect(errors).toHaveLength(1)
    expect(errors[0].key).toBe('API_KEY')
  })

  test('uses defaults for missing optional fields', () => {
    const { values, errors } = validateEnv(
      { PORT: { type: 'number', default: 3000 } },
      {},
    )
    expect(errors).toHaveLength(0)
    expect(values.PORT).toBe(3000)
  })

  test('coerces number type', () => {
    const { values, errors } = validateEnv(
      { COUNT: { type: 'number' } },
      { COUNT: '42' },
    )
    expect(errors).toHaveLength(0)
    expect(values.COUNT).toBe(42)
  })

  test('errors on invalid number', () => {
    const { errors } = validateEnv(
      { COUNT: { type: 'number' } },
      { COUNT: 'abc' },
    )
    expect(errors).toHaveLength(1)
  })

  test('coerces boolean type', () => {
    const { values } = validateEnv(
      { DEBUG: { type: 'boolean' } },
      { DEBUG: 'true' },
    )
    expect(values.DEBUG).toBe(true)
  })

  test('validates port range', () => {
    const { errors } = validateEnv(
      { PORT: { type: 'port' } },
      { PORT: '70000' },
    )
    expect(errors).toHaveLength(1)
  })

  test('validates url format', () => {
    const { errors } = validateEnv(
      { URL: { type: 'url' } },
      { URL: 'not-a-url' },
    )
    expect(errors).toHaveLength(1)
  })

  test('validates email format', () => {
    const { errors } = validateEnv(
      { EMAIL: { type: 'email' } },
      { EMAIL: 'invalid' },
    )
    expect(errors).toHaveLength(1)
  })

  test('enforces choices', () => {
    const { errors } = validateEnv(
      { MODE: { type: 'string', choices: ['a', 'b'] } },
      { MODE: 'c' },
    )
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('must be one of')
  })

  test('runs custom validation', () => {
    const { errors } = validateEnv(
      { VAL: { type: 'number', validate: (v: number) => v > 10 } },
      { VAL: '5' },
    )
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('failed custom validation')
  })

  test('handles multiple errors', () => {
    const { errors } = validateEnv(
      {
        A: { type: 'string', required: true },
        B: { type: 'number', required: true },
        C: { type: 'url', required: true },
      },
      {},
    )
    expect(errors).toHaveLength(3)
  })

  test('optional fields with no value and no default resolve to undefined', () => {
    const { values, errors } = validateEnv(
      { OPT: { type: 'string', required: false } },
      {},
    )
    expect(errors).toHaveLength(0)
    expect(values.OPT).toBeUndefined()
  })
})
