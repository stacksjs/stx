import { afterEach, describe, expect, test } from 'bun:test'
import { MemoryDriver } from '../src'

describe('MemoryDriver', () => {
  let driver: MemoryDriver

  afterEach(async () => {
    if (driver)
      await driver.flush()
  })

  test('set and get a value', async () => {
    driver = new MemoryDriver()
    await driver.set('key', 'value')
    const result = await driver.get<string>('key')
    expect(result).toBe('value')
  })

  test('get returns null for missing key', async () => {
    driver = new MemoryDriver()
    const result = await driver.get('missing')
    expect(result).toBeNull()
  })

  test('has returns true for existing key', async () => {
    driver = new MemoryDriver()
    await driver.set('key', 'value')
    expect(await driver.has('key')).toBe(true)
  })

  test('has returns false for missing key', async () => {
    driver = new MemoryDriver()
    expect(await driver.has('missing')).toBe(false)
  })

  test('delete removes a key', async () => {
    driver = new MemoryDriver()
    await driver.set('key', 'value')
    await driver.delete('key')
    expect(await driver.get('key')).toBeNull()
  })

  test('flush clears all entries', async () => {
    driver = new MemoryDriver()
    await driver.set('a', 1)
    await driver.set('b', 2)
    await driver.flush()
    expect(await driver.get('a')).toBeNull()
    expect(await driver.get('b')).toBeNull()
  })

  test('TTL expiry', async () => {
    driver = new MemoryDriver()
    // Set with very short TTL (negative = already expired)
    await driver.set('key', 'value', -1)
    const result = await driver.get('key')
    expect(result).toBeNull()
  })

  test('TTL not expired', async () => {
    driver = new MemoryDriver()
    await driver.set('key', 'value', 3600)
    const result = await driver.get<string>('key')
    expect(result).toBe('value')
  })

  test('LRU eviction at maxSize', async () => {
    driver = new MemoryDriver(3)
    await driver.set('a', 1)
    await driver.set('b', 2)
    await driver.set('c', 3)
    expect(driver.size).toBe(3)

    // Adding a 4th should evict the oldest (a)
    await driver.set('d', 4)
    expect(driver.size).toBe(3)
    expect(await driver.get('a')).toBeNull()
    expect(await driver.get('d')).toBe(4)
  })

  test('stores complex objects', async () => {
    driver = new MemoryDriver()
    const obj = { name: 'test', nested: { value: 42 } }
    await driver.set('obj', obj)
    const result = await driver.get<typeof obj>('obj')
    expect(result).toEqual(obj)
  })

  test('overwriting existing key does not increase size', async () => {
    driver = new MemoryDriver(3)
    await driver.set('a', 1)
    await driver.set('b', 2)
    await driver.set('a', 10) // overwrite
    expect(driver.size).toBe(2)
    expect(await driver.get('a')).toBe(10)
  })
})
