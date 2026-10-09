import { describe, expect, it } from 'bun:test'
import { useOutbox } from '../../src/composables/use-outbox'

function memory() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => { data.set(key, value) },
    removeItem: (key: string) => { data.delete(key) },
  }
}

let n = 0
const name = () => `test-${++n}`

describe('useOutbox', () => {
  it('sends straight away when the server answers', async () => {
    const calls: string[] = []
    const outbox = useOutbox(name(), { storage: memory(), fetch: async (url) => { calls.push(url); return new Response('{}', { status: 200 }) } })
    const result = await outbox.send('/api/a', { method: 'POST', body: '{"x":1}' })
    expect(result.status).toBe('sent')
    expect(outbox.pending).toBe(0)
    expect(calls).toEqual(['/api/a'])
    outbox.stop()
  })

  it('keeps a write the network dropped and sends it when it can', async () => {
    let online = false
    const bodies: string[] = []
    const sent: string[] = []
    const outbox = useOutbox(name(), {
      storage: memory(),
      retryDelayMs: 10,
      fetch: async (_url, init) => {
        if (!online) throw new TypeError('Load failed')
        bodies.push(String(init.body))
        return new Response('{}', { status: 200 })
      },
      onSent: entry => sent.push(entry.id),
    })
    const counts: number[] = []
    outbox.subscribe(count => counts.push(count))
    const result = await outbox.send('/api/complete', { method: 'POST', body: '{"rpe":6}', headers: { 'Content-Type': 'application/json' }, meta: { workout: 5 } })
    expect(result.status).toBe('queued')
    expect(outbox.pending).toBe(1)
    expect(outbox.entries()[0]!.meta).toEqual({ workout: 5 })

    online = true
    await outbox.flush(true)
    expect(outbox.pending).toBe(0)
    expect(bodies).toEqual(['{"rpe":6}'])
    expect(sent).toHaveLength(1)
    expect(counts).toEqual([1, 0])
    outbox.stop()
  })

  it('treats a 5xx or 429 as not there yet, and a 4xx as an answer', async () => {
    let status = 503
    const rejected: number[] = []
    const outbox = useOutbox(name(), {
      storage: memory(),
      fetch: async () => new Response('{}', { status }),
      onRejected: (_entry, response) => rejected.push(response.status),
    })
    expect((await outbox.send('/api/x', { method: 'POST' })).status).toBe('queued')
    status = 422
    await outbox.flush(true)
    expect(outbox.pending).toBe(0)
    expect(rejected).toEqual([422])
    // A 4xx straight away is the caller's to handle, not queued.
    const direct = await outbox.send('/api/y', { method: 'POST' })
    expect(direct.status).toBe('rejected')
    outbox.stop()
  })

  it('keeps a write whose credentials were not ready, and sends it once they are', async () => {
    let signedIn = false
    const outbox = useOutbox(name(), { storage: memory(), fetch: async () => new Response('{}', { status: signedIn ? 200 : 401 }) })
    expect((await outbox.send('/api/me', { method: 'POST' })).status).toBe('queued')
    signedIn = true
    await outbox.flush(true)
    expect(outbox.pending).toBe(0)
    outbox.stop()
  })

  it('outlives a reload: a new outbox over the same storage sends what was waiting', async () => {
    const storage = memory()
    const id = name()
    const first = useOutbox(id, { storage, fetch: async () => { throw new TypeError('offline') } })
    await first.send('/api/z', { method: 'POST', body: 'a' })
    first.stop()

    const delivered: string[] = []
    const second = useOutbox(id, { storage, fetch: async (url) => { delivered.push(url); return new Response('', { status: 204 }) } })
    await second.flush(true)
    expect(delivered).toEqual(['/api/z'])
    expect(second.pending).toBe(0)
    second.stop()
  })

  it('keeps order: a write behind a waiting one waits too', async () => {
    let online = false
    const order: string[] = []
    const outbox = useOutbox(name(), {
      storage: memory(),
      fetch: async (url) => {
        if (!online) throw new TypeError('offline')
        order.push(url)
        return new Response('', { status: 200 })
      },
    })
    await outbox.send('/api/1', { method: 'POST' })
    online = true
    // The network is back, but /api/1 is still waiting: /api/2 goes after it.
    await outbox.send('/api/2', { method: 'POST' })
    await outbox.flush(true)
    expect(order).toEqual(['/api/1', '/api/2'])
    outbox.stop()
  })
})

describe('useOutbox: delivering once, in time', () => {
  it('sends one Idempotency-Key per entry, the same on every attempt', async () => {
    let online = false
    const keys: string[] = []
    const outbox = useOutbox(name(), {
      storage: memory(),
      fetch: async (_url, init) => {
        keys.push((init.headers as Record<string, string>)['Idempotency-Key']!)
        if (!online) throw new TypeError('Load failed')
        return new Response('{}', { status: 200 })
      },
    })
    const result = await outbox.send('/api/a', { method: 'POST', body: '{}' })
    expect(result.status).toBe('queued')
    await outbox.flush(true)
    online = true
    await outbox.flush(true)
    expect(keys.length).toBe(3)
    expect(new Set(keys).size).toBe(1)
    expect(keys[0]).toBe((result as any).entry.id)

    // A key of the caller's own is left as it is, and the header can be turned off.
    await outbox.send('/api/b', { method: 'POST', headers: { 'idempotency-key': 'mine' } })
    expect(keys.at(-1)).toBeUndefined()
    outbox.stop()
    const plain = useOutbox(name(), { storage: memory(), idempotency: false, fetch: async (_u, init) => { keys.push(JSON.stringify(init.headers)); return new Response('{}') } })
    await plain.send('/api/c', { method: 'POST' })
    expect(keys.at(-1)).toBe('{}')
    plain.stop()
  })

  it('gives up on an attempt after timeoutMs and keeps the write', async () => {
    let aborted = false
    const outbox = useOutbox(name(), {
      storage: memory(),
      timeoutMs: 30,
      fetch: (_url, init) => new Promise((_, reject) => {
        init.signal!.addEventListener('abort', () => {
          aborted = true
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
    })
    const started = Date.now()
    const result = await outbox.send('/api/slow', { method: 'POST' })
    expect(result.status).toBe('queued')
    expect(aborted).toBe(true)
    expect(Date.now() - started).toBeLessThan(500)
    outbox.stop()
  })
})

describe('useOutbox: a waiting write shown on the reads it changes', () => {
  const target = { key: 'weights', url: '/api/health/weight?days=90' }

  it('applies waiting writes that affect a read, oldest first, and lists them', async () => {
    const outbox = useOutbox(name(), {
      storage: memory(),
      fetch: async () => { throw new TypeError('offline') },
      overlays: { addWeight: (list: number[], entry) => [...list, JSON.parse(entry.body!).kg] },
    })
    await outbox.send('/api/health/weight', { method: 'POST', body: '{"kg":80}', affects: ['/api/health/weight'], overlay: 'addWeight' })
    await outbox.send('/api/health/weight', { method: 'POST', body: '{"kg":81}', affects: ['weights'], apply: (list: number[]) => [...list, 81] })
    await outbox.send('/api/other', { method: 'POST', affects: ['/api/other'], apply: () => 'never' })
    expect(outbox.overlay(target, [79])).toEqual([79, 80, 81])
    expect(outbox.pendingFor('/api/health/weight').length).toBe(1)
    expect(outbox.pendingFor('weights').length).toBe(1)
    const first = outbox.entries()[0]!
    expect(outbox.overlay(target, [79], first.id)).toEqual([79, 80])
    outbox.stop()
  })

  it('tells the page when it changes, and which entry reached the server', async () => {
    let online = false
    const heard: any[] = []
    const listener = (event: Event) => heard.push((event as CustomEvent).detail)
    window.addEventListener('stx:outbox', listener)
    const outbox = useOutbox(name(), {
      storage: memory(),
      fetch: async () => {
        if (!online) throw new TypeError('offline')
        return new Response('{}')
      },
    })
    await outbox.send('/api/a', { method: 'POST', affects: ['a'] })
    online = true
    await outbox.flush(true)
    window.removeEventListener('stx:outbox', listener)
    expect(heard.map(d => [d.pending, d.sent ? d.sent.affects : null])).toEqual([[1, null], [1, ['a']], [0, null]])
    outbox.stop()
  })

  it('is on the page registry cached queries read, until stopped', () => {
    const box = name()
    const outbox = useOutbox(box, { storage: memory() })
    expect((globalThis as any).__stx_outboxes.get(box)).toBe(outbox)
    outbox.stop()
    expect((globalThis as any).__stx_outboxes.has(box)).toBe(false)
  })
})
