import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { clearServerData, useAsyncData, useFetch } from '../../src/composables/use-fetch'
import { generateSignalsRuntime } from '../../src/signals'

const host = window as any
const originalFetch = globalThis.fetch
const originalData = host.__STX_DATA__
const originalStx = host.stx
beforeAll(() => { new Function(generateSignalsRuntime())() })
afterAll(() => { host.stx = originalStx })
afterEach(() => {
  globalThis.fetch = originalFetch
  if (originalData === undefined) delete host.__STX_DATA__
  else host.__STX_DATA__ = originalData
  document.querySelectorAll('[data-stx-server-data]').forEach(tag => tag.remove())
})

for (const implementation of ['module', 'runtime', 'async'] as const) {
  describe(`SSR hydration (${implementation})`, () => {
    const make = (options: Record<string, unknown> = {}) => implementation === 'async'
      ? useAsyncData(() => fetch('/data').then(r => r.json()), options)
      : implementation === 'module'
        ? useFetch(() => '/data', options)
        : host.stx.useFetch(() => '/data', options)

    it('shares a snapshot, preserves null, transforms per consumer, and refreshes', async () => {
      host.__STX_DATA__ = { value: { count: 2 }, empty: null }
      let requests = 0
      globalThis.fetch = (async () => { requests++; return Response.json({ count: 3 }) }) as any
      const first = make({ key: 'value', transform: (x: any) => x.count * 2 })
      const second = make({ key: 'value', transform: (x: any) => x.count * 3 })
      const empty = make({ key: 'empty' })
      await Bun.sleep(10)
      expect(requests).toBe(0)
      expect(first.data()).toBe(4)
      expect(second.data()).toBe(6)
      expect(empty.data()).toBeNull()
      expect(first.loading()).toBe(false)
      expect(first.isFetching()).toBe(false)
      await first.refetch()
      expect(requests).toBe(1)
      expect(first.data()).toBe(6)
    })

    it('fetches for missing/invalidated/opted-out keys and honors immediate:false', async () => {
      host.__STX_DATA__ = { value: 1 }
      let requests = 0
      globalThis.fetch = (async () => { requests++; return Response.json(99) }) as any
      const deferred = make({ key: 'missing', immediate: false })
      expect(requests).toBe(0)
      expect(deferred.loading()).toBe(false)
      const optedOut = make({ key: 'value', hydrate: false })
      await Bun.sleep(10)
      expect(requests).toBe(1)
      expect(optedOut.data()).toBe(99)
      clearServerData('value')
      const invalidated = make({ key: 'value' })
      await Bun.sleep(10)
      expect(requests).toBe(2)
      expect(invalidated.data()).toBe(99)
      expect(deferred.data()).toBeNull()
    })

    it('reports hydration transform failures through error and can refresh afterward', async () => {
      host.__STX_DATA__ = { value: 1 }
      let fail = true
      let requests = 0
      globalThis.fetch = (async () => { requests++; return Response.json(2) }) as any
      const result = make({ key: 'value', transform: (value: number) => {
        if (fail) throw new Error('invalid shape')
        return value
      } })
      expect(result.error()?.message).toBe('invalid shape')
      expect(result.loading()).toBe(false)
      expect(requests).toBe(0)
      fail = false
      await result.refetch()
      expect(result.data()).toBe(2)
      expect(result.error()).toBeNull()
      expect(requests).toBe(1)
    })
  })
}

it('clears the tag snapshot before the first reader and handles malformed payloads', () => {
  delete host.__STX_DATA__
  const tag = document.createElement('script')
  tag.setAttribute('type', 'application/json')
  tag.setAttribute('data-stx-server-data', '')
  tag.textContent = '{"private":42}'
  document.head.appendChild(tag)
  host.stx.clearServerData('private')
  expect(useFetch('/data', { key: 'private', immediate: false }).data()).toBeNull()
  delete host.__STX_DATA__
  tag.textContent = 'invalid JSON'
  expect(useFetch('/data', { key: 'private', immediate: false }).data()).toBeNull()
})

it('fetches on reactive URL changes after suppressing only the hydrated first evaluation', async () => {
  host.__STX_DATA__ = { item: 'first' }
  const urls: string[] = []
  globalThis.fetch = (async (url: string) => { urls.push(url); return Response.json('second') }) as any
  const url = host.stx.state('/first')
  const result = host.stx.useFetch(() => url(), { key: 'item' })
  expect(result.data()).toBe('first')
  expect(urls).toEqual([])
  url.set('/second')
  await Bun.sleep(10)
  expect(urls).toEqual(['/second'])
  expect(result.data()).toBe('second')
})
