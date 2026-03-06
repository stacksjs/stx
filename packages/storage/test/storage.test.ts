import { afterEach, describe, expect, test } from 'bun:test'
import { MemoryDriver } from '../src/drivers/memory'
import { configureStorage, resetStorage, useStorage } from '../src/storage'

afterEach(() => {
  resetStorage()
})

describe('configureStorage', () => {
  test('configures disks', () => {
    const memory = new MemoryDriver()
    configureStorage({
      default: 'memory',
      disks: { memory },
    })

    const driver = useStorage()
    expect(driver.name).toBe('memory')
  })

  test('merges disk configurations', () => {
    const mem1 = new MemoryDriver()
    const mem2 = new MemoryDriver()

    configureStorage({ disks: { disk1: mem1 } })
    configureStorage({ disks: { disk2: mem2 } })

    expect(useStorage('disk1').name).toBe('memory')
    expect(useStorage('disk2').name).toBe('memory')
  })

  test('updates default disk', () => {
    const memory = new MemoryDriver()
    configureStorage({ disks: { memory } })
    configureStorage({ default: 'memory' })

    const driver = useStorage()
    expect(driver.name).toBe('memory')
  })
})

describe('useStorage', () => {
  test('returns the default disk', () => {
    const memory = new MemoryDriver()
    configureStorage({ default: 'memory', disks: { memory } })

    const driver = useStorage()
    expect(driver).toBe(memory)
  })

  test('returns a named disk', () => {
    const primary = new MemoryDriver()
    const secondary = new MemoryDriver()

    configureStorage({
      default: 'primary',
      disks: { primary, secondary },
    })

    expect(useStorage('secondary')).toBe(secondary)
  })

  test('throws for unconfigured disk', () => {
    expect(() => useStorage('nonexistent')).toThrow('Storage disk "nonexistent" is not configured')
  })

  test('throws with helpful message listing available disks', () => {
    const memory = new MemoryDriver()
    configureStorage({ disks: { memory } })

    expect(() => useStorage('missing')).toThrow('Available disks: memory')
  })

  test('throws with empty disks message when none configured', () => {
    expect(() => useStorage('any')).toThrow('(none)')
  })
})

describe('resetStorage', () => {
  test('resets all configuration', () => {
    const memory = new MemoryDriver()
    configureStorage({ default: 'memory', disks: { memory } })

    resetStorage()

    expect(() => useStorage('memory')).toThrow()
  })
})
