import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { rmSync } from 'node:fs'
import { FileDriver } from '../src'

const TEST_CACHE_DIR = '/tmp/stx-cache-test'

describe('FileDriver', () => {
  let driver: FileDriver

  beforeEach(() => {
    driver = new FileDriver(TEST_CACHE_DIR)
  })

  afterEach(async () => {
    await driver.flush()
    try {
      rmSync(TEST_CACHE_DIR, { recursive: true, force: true })
    }
    catch {
      // ignore cleanup errors
    }
  })

  test('set and get a value', async () => {
    await driver.set('key', 'value')
    const result = await driver.get<string>('key')
    expect(result).toBe('value')
  })

  test('get returns null for missing key', async () => {
    const result = await driver.get('missing')
    expect(result).toBeNull()
  })

  test('has returns true for existing key', async () => {
    await driver.set('key', 'value')
    expect(await driver.has('key')).toBe(true)
  })

  test('has returns false for missing key', async () => {
    expect(await driver.has('missing')).toBe(false)
  })

  test('delete removes a key', async () => {
    await driver.set('key', 'value')
    await driver.delete('key')
    expect(await driver.get('key')).toBeNull()
  })

  test('flush clears all entries', async () => {
    await driver.set('a', 1)
    await driver.set('b', 2)
    await driver.flush()
    expect(await driver.get('a')).toBeNull()
    expect(await driver.get('b')).toBeNull()
  })

  test('TTL expiry', async () => {
    await driver.set('key', 'value', -1) // already expired
    const result = await driver.get('key')
    expect(result).toBeNull()
  })

  test('TTL not expired', async () => {
    await driver.set('key', 'value', 3600)
    const result = await driver.get<string>('key')
    expect(result).toBe('value')
  })

  test('stores complex objects', async () => {
    const obj = { name: 'test', items: [1, 2, 3] }
    await driver.set('obj', obj)
    const result = await driver.get<typeof obj>('obj')
    expect(result).toEqual(obj)
  })
})
