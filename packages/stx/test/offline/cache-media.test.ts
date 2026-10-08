/**
 * cacheMedia from the page: the download happens here, streamed into the
 * media cache, and the worker is then told to keep (index and evict) it.
 * A web view whose worker never registered keeps nothing and says so.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { cacheMedia } from '../../src/composables/use-offline'

const saved = { navigator: globalThis.navigator, caches: (globalThis as any).caches, fetch: globalThis.fetch, location: (globalThis as any).location }
afterEach(() => {
  Object.defineProperty(globalThis, 'navigator', { value: saved.navigator, configurable: true, writable: true })
  ;(globalThis as any).caches = saved.caches
  globalThis.fetch = saved.fetch
  ;(globalThis as any).location = saved.location
})

function setUp(options: { worker: boolean }) {
  const store = new Map<string, Response>()
  const fetched: string[] = []
  const messages: any[] = []
  ;(globalThis as any).location = { href: 'http://app.test/m' }
  ;(globalThis as any).caches = {
    open: async () => ({
      match: async (key: string) => store.get(key)?.clone(),
      put: async (key: string, response: Response) => { store.set(key, new Response(await response.arrayBuffer(), { headers: response.headers })) },
    }),
  }
  globalThis.fetch = (async (url: string) => {
    fetched.push(url)
    return new Response(new Uint8Array(64), { status: 200, headers: { 'Content-Type': 'video/mp4' } })
  }) as any
  const worker = {
    postMessage: (data: any, ports: MessagePort[]) => {
      messages.push(data)
      ports[0]!.postMessage({ ok: true, kept: data.urls })
    },
  }
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    writable: true,
    value: { serviceWorker: options.worker ? { ready: Promise.resolve({ active: worker }), controller: worker } : undefined },
  })
  return { store, fetched, messages }
}

describe('cacheMedia', () => {
  it('downloads what is not kept, from the page, then has the worker keep it', async () => {
    const { store, fetched, messages } = setUp({ worker: true })
    const kept = await cacheMedia(['/api/exercise-videos/a.mp4', '/api/exercise-videos/a.mp4', '/api/exercise-videos/b.mp4'])
    expect(kept).toEqual(['http://app.test/api/exercise-videos/a.mp4', 'http://app.test/api/exercise-videos/b.mp4'])
    expect(fetched).toEqual(kept)
    expect(store.size).toBe(2)
    expect(messages[0].type).toBe('stx:cache-media')

    // Asked again, nothing is fetched twice.
    await cacheMedia(['/api/exercise-videos/a.mp4'])
    expect(fetched.length).toBe(2)
  })

  it('keeps nothing where no worker registered, as in an iOS web view without app-bound domains', async () => {
    const { fetched } = setUp({ worker: false })
    expect(await cacheMedia(['/api/exercise-videos/a.mp4'])).toEqual([])
    expect(fetched).toEqual([])
  })
})
