import { describe, expect, it } from 'bun:test'
import { createEdgeCache } from '../../src/edge-runtime'

describe('createEdgeCache', () => {
  it('should create an in-memory cache for Bun', () => {
    const cache = createEdgeCache()
    expect(cache).toBeDefined()
  })

  describe('in-memory cache operations', () => {
    it('should put and match a request', async () => {
      const cache = createEdgeCache()
      if (!cache)
        throw new Error('Cache should be defined')

      const request = new Request('http://localhost/test')
      const response = new Response('Test content', {
        headers: { 'Cache-Control': 'max-age=60' },
      })

      await cache.put(request, response)
      const cached = await cache.match(request)

      expect(cached).toBeDefined()
      expect(await cached?.text()).toBe('Test content')
    })

    it('should return undefined for non-cached request', async () => {
      const cache = createEdgeCache()
      if (!cache)
        throw new Error('Cache should be defined')

      const request = new Request('http://localhost/not-cached')
      const cached = await cache.match(request)

      expect(cached).toBeUndefined()
    })

    it('should delete cached request', async () => {
      const cache = createEdgeCache()
      if (!cache)
        throw new Error('Cache should be defined')

      const request = new Request('http://localhost/to-delete')
      const response = new Response('Content')

      await cache.put(request, response)
      const deleted = await cache.delete(request)
      const cached = await cache.match(request)

      expect(deleted).toBe(true)
      expect(cached).toBeUndefined()
    })

    it('should clone responses', async () => {
      const cache = createEdgeCache()
      if (!cache)
        throw new Error('Cache should be defined')

      const request = new Request('http://localhost/clone-test')
      const response = new Response('Content')

      await cache.put(request, response)

      // Get twice to ensure cloning works
      const cached1 = await cache.match(request)
      const cached2 = await cache.match(request)

      expect(await cached1?.text()).toBe('Content')
      expect(await cached2?.text()).toBe('Content')
    })

    it('should expire entries based on Cache-Control max-age', async () => {
      const cache = createEdgeCache()
      if (!cache)
        throw new Error('Cache should be defined')

      const request = new Request('http://localhost/expiring')
      const response = new Response('Content', {
        headers: { 'Cache-Control': 'max-age=0' }, // Immediate expiration
      })

      await cache.put(request, response)

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10))

      const cached = await cache.match(request)
      expect(cached).toBeUndefined()
    })

    it('should use default TTL without Cache-Control header', async () => {
      const cache = createEdgeCache()
      if (!cache)
        throw new Error('Cache should be defined')

      const request = new Request('http://localhost/default-ttl')
      const response = new Response('Content') // No Cache-Control

      await cache.put(request, response)
      const cached = await cache.match(request)

      // Should still be cached (default TTL is 1 minute)
      expect(cached).toBeDefined()
    })
  })
})
