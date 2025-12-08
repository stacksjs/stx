import { describe, expect, it } from 'bun:test'
import { createKVNamespace } from '../../src/edge-runtime'

describe('createKVNamespace', () => {
  it('should create an in-memory KV for Bun', () => {
    const kv = createKVNamespace()
    expect(kv).toBeDefined()
  })

  describe('in-memory KV operations', () => {
    it('should put and get a value', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      await kv.put('key1', 'value1')
      const value = await kv.get('key1')

      expect(value).toBe('value1')
    })

    it('should return null for non-existent key', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      const value = await kv.get('non-existent')
      expect(value).toBeNull()
    })

    it('should delete a value', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      await kv.put('key1', 'value1')
      await kv.delete('key1')
      const value = await kv.get('key1')

      expect(value).toBeNull()
    })

    it('should put with metadata', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      await kv.put('key1', 'value1', {
        metadata: { tag: 'test' },
      })

      const { value, metadata } = await kv.getWithMetadata<{ tag: string }>('key1')

      expect(value).toBe('value1')
      expect(metadata?.tag).toBe('test')
    })

    it('should return null metadata for non-existent key', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      const { value, metadata } = await kv.getWithMetadata('non-existent')

      expect(value).toBeNull()
      expect(metadata).toBeNull()
    })

    it('should list keys', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      await kv.put('prefix:a', 'a')
      await kv.put('prefix:b', 'b')
      await kv.put('other:c', 'c')

      const result = await kv.list({ prefix: 'prefix:' })

      expect(result.keys.length).toBe(2)
      expect(result.keys.map(k => k.name)).toContain('prefix:a')
      expect(result.keys.map(k => k.name)).toContain('prefix:b')
    })

    it('should list with limit', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      await kv.put('key1', 'a')
      await kv.put('key2', 'b')
      await kv.put('key3', 'c')

      const result = await kv.list({ limit: 2 })

      expect(result.keys.length).toBe(2)
    })

    it('should expire keys with expirationTtl', async () => {
      const kv = createKVNamespace()
      if (!kv)
        throw new Error('KV should be defined')

      // Set a very short TTL (1ms)
      await kv.put('expiring', 'value', { expirationTtl: 0.001 })

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))

      const value = await kv.get('expiring')
      expect(value).toBeNull()
    })
  })
})
