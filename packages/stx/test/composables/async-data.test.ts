import { describe, expect, it } from 'bun:test'
import { clearFetchCache, useAsyncData } from '../../src/composables/use-fetch'
import { generateSignalsRuntime } from '../../src/signals'
import { effect, state } from '../../src/signals-api'

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

    it('keys unlabelled loaders by identity and reuses only the same function', async () => {
      const asyncData = useData()
      const options = { cacheTime: 60_000, immediate: false }
      let calls = 0
      const factory = (id: string) => () => { calls++; return id }
      const firstLoader = factory('first')
      const first = asyncData(firstLoader, options)
      const second = asyncData(factory('second'), options)
      const repeated = asyncData(firstLoader, options)
      await first.execute()
      await second.execute()
      await repeated.execute()
      expect([first.data(), second.data(), repeated.data(), calls]).toEqual(['first', 'second', 'first', 2])
      if (target === 'module') {
        clearFetchCache()
        await repeated.execute()
        expect(calls).toBe(3)
      }
    })

    it('shares concurrent loads, caches the newest run, and transforms per consumer', async () => {
      const asyncData = useData()
      const key = `async-data-cache-${target}`
      const { calls, fetcher } = controlledLoader()
      const older = asyncData(fetcher, { key, cacheTime: 60_000, immediate: false })
      const newer = asyncData(fetcher, { key, cacheTime: 60_000, immediate: false })
      const first = older.refetch()
      const joined = newer.refetch()
      expect(calls).toHaveLength(1)
      const second = newer.refetch()
      expect(calls).toHaveLength(2)
      calls[1].resolve(2)
      await Promise.all([joined, second])
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

    it('follows a source, cancels its old load, and commits the value and flags together', async () => {
      const asyncData = useData()
      const track = target === 'module' ? { effect, state } : window.stx!
      const selected = track.state('a')
      const calls: { value: string, signal: AbortSignal, resolve: (value: string) => void }[] = []
      const resource = asyncData(selected, (value, signal) => new Promise<string>(resolve => calls.push({ value, signal, resolve })), {
        immediate: false, cacheTime: 60_000,
      })
      const snapshots: unknown[][] = []
      const stop = track.effect(() => { snapshots.push([resource.data(), resource.loading(), resource.isFetching()]) })
      const first = resource.refetch()
      selected.set('b')
      expect(calls.map(call => call.value)).toEqual(['a', 'b'])
      expect(calls[0].signal.aborted).toBe(true)
      await first
      calls[0].resolve('late')
      calls[1].resolve('second')
      await Bun.sleep(0)
      expect(snapshots).toEqual([[null, false, false], [null, true, true], ['second', false, false]])
      resource.abort()
      selected.set('c')
      expect(calls).toHaveLength(2)
      stop()
    })

    it('shares streamed values, replays the current value and closes only after the last reader aborts', async () => {
      const asyncData = useData()
      let starts = 0
      let closes = 0
      let signal!: AbortSignal
      const steps: Array<(value: IteratorResult<number>) => void> = []
      const loader = (requestSignal: AbortSignal): AsyncIterable<number> => {
        starts++
        signal = requestSignal
        return {
          [Symbol.asyncIterator]() {
            return {
              next: () => new Promise<IteratorResult<number>>(resolve => steps.push(resolve)),
              return: async () => { closes++; return { done: true, value: undefined } },
            }
          },
        }
      }
      const first = asyncData(loader, { immediate: false })
      const second = asyncData(loader, { immediate: false, transform: value => value * 2 })
      const a = first.refetch()
      await Bun.sleep(0)
      steps[0]({ done: false, value: 2 })
      await Bun.sleep(0)
      expect([first.data(), first.loading(), first.isFetching()]).toEqual([2, false, true])
      const b = second.refetch()
      expect(second.data()).toBe(4)
      expect(starts).toBe(1)
      first.abort()
      await a
      expect(signal.aborted).toBe(false)
      expect(closes).toBe(0)
      steps[1]({ done: false, value: 3 })
      await Bun.sleep(0)
      expect([first.data(), second.data()]).toEqual([2, 6])
      second.abort()
      await b
      expect(signal.aborted).toBe(true)
      expect(closes).toBe(1)
      expect(second.isFetching()).toBe(false)
      steps[2]({ done: true, value: undefined })
    })

    it('starts a shared load even if its first reader leaves during loading notification', async () => {
      const asyncData = useData()
      const track = target === 'module' ? effect : window.stx!.effect
      const { calls, fetcher } = controlledLoader()
      const first = asyncData(fetcher, { immediate: false })
      const second = asyncData(fetcher, { immediate: false })
      let shared: Promise<void> | undefined
      const stop = track(() => {
        if (first.loading()) {
          shared = second.refetch()
          first.abort()
        }
      })
      await first.refetch()
      expect(calls).toHaveLength(1)
      expect(calls[0].signal.aborted).toBe(false)
      calls[0].resolve(42)
      await shared
      expect(first.data()).toBeNull()
      expect(second.data()).toBe(42)
      stop()
    })

    it('caches only the final value of a successfully completed stream', async () => {
      const asyncData = useData()
      let calls = 0
      const loader = async function* () { calls++; yield 1; yield 2 }
      const options = { immediate: false, cacheTime: 60_000 }
      const resource = asyncData(loader, options)
      await resource.refetch()
      const next = asyncData(loader, { ...options, transform: value => value * 10 })
      await next.refetch()
      expect([resource.data(), next.data(), calls]).toEqual([2, 20, 1])
    })
  })
}
