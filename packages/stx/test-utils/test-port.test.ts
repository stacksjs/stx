import { describe, expect, test } from 'bun:test'
import { freePort, freePorts } from './test-port'

describe('test ports', () => {
  test('returns the requested number of distinct kernel-assigned ports', () => {
    const ports = freePorts(4)

    expect(ports).toHaveLength(4)
    expect(new Set(ports).size).toBe(4)
    expect(ports.every(port => Number.isInteger(port) && port > 0)).toBeTrue()
  })

  test('keeps the single-port helper compatible', () => {
    expect(freePort()).toBeGreaterThan(0)
  })

  test('rejects invalid reservation counts', () => {
    expect(() => freePorts(0)).toThrow('positive integer')
    expect(() => freePorts(1.5)).toThrow('positive integer')
  })
})
