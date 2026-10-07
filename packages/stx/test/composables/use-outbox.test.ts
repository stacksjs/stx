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
