import { describe, expect, test } from 'bun:test'
import { importOnce } from '../src/lazy-module'

describe('lazy compiler modules', () => {
  test('shares one cold import across concurrent renders', async () => {
    const key = `test/concurrent/${crypto.randomUUID()}`
    let imports = 0
    const importer = async () => {
      imports++
      await Bun.sleep(20)
      return { ready: true }
    }

    const modules = await Promise.all(
      Array.from({ length: 16 }, () => importOnce(key, importer)),
    )

    expect(imports).toBe(1)
    expect(modules.every(module => module === modules[0])).toBe(true)
  })

  test('allows a failed cold import to retry', async () => {
    const key = `test/retry/${crypto.randomUUID()}`
    let imports = 0
    const importer = async () => {
      imports++
      if (imports === 1)
        throw new Error('cold compile failed')
      return { ready: true }
    }

    await expect(importOnce(key, importer)).rejects.toThrow('cold compile failed')
    expect(await importOnce(key, importer)).toEqual({ ready: true })
    expect(imports).toBe(2)
  })
})
