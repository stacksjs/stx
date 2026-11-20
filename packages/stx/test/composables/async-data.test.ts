import { describe, expect, it } from 'bun:test'
import { clearFetchCache, useAsyncData } from '../../src/composables/use-fetch'
import { generateSignalsRuntime } from '../../src/signals'

function controlledLoader() {
  const calls: { signal: AbortSignal, resolve: (value: number | null) => void }[] = []
  return {
    calls,
    fetcher: (signal: AbortSignal) => new Promise<number | null>(resolve => calls.push({ signal, resolve })),
  }
}

for (const target of ['module', 'browser'] as const) {
  const useData = () => {
    if (target === 'module') return useAsyncData
    new Function(generateSignalsRuntime())()
    return window.stx!.useAsyncData
  }

  describe(`useAsyncData in the ${target}`, () => {
    it('preserves successful null, rejects stale results, and aborts on demand', async () => {
      const { calls, fetcher } = controlledLoader()
      const resource = useData()(fetcher, { immediate: false })
      expect(resource.loading()).toBe(false)
      const first = resource.execute()
      expect(resource.loading()).toBe(true)
      calls[0].resolve(null)
      await first

      const second = resource.refetch()
      const third = resource.refetch()
      expect(resource.loading()).toBe(false)
      expect(resource.isFetching()).toBe(true)
      expect(calls[1].signal.aborted).toBe(true)
      calls[2].resolve(3)
      calls[1].resolve(2)
      await Promise.all([second, third])
      expect(resource.data()).toBe(3)

      const fourth = resource.refetch()
      resource.abort()
      expect(calls[3].signal.aborted).toBe(true)
      expect(resource.isFetching()).toBe(false)
      calls[3].resolve(4)
      await fourth
      expect(resource.data()).toBe(3)
    })

    it('caches the newest payload for a key and applies each consumer’s transform', async () => {
      const asyncData = useData()
      const key = `async-data-cache-${target}`
      const { calls, fetcher } = controlledLoader()
      const older = asyncData(fetcher, { key, cacheTime: 60_000, immediate: false })
      const newer = asyncData(fetcher, { key, cacheTime: 60_000, immediate: false })
      const first = older.refetch()
      const second = newer.refetch()
      calls[1].resolve(2)
      await second
      calls[0].resolve(1)
      await first
      expect(older.data()).toBe(1)
      expect(newer.data()).toBe(2)

      const consumer = asyncData(fetcher, {
        key, cacheTime: 60_000, immediate: false, transform: value => (value ?? 0) * 10,
      })
      await consumer.refetch()
      expect(calls).toHaveLength(2)
      expect(consumer.data()).toBe(20)
      if (target === 'module') clearFetchCache(key)
    })
  })
}
