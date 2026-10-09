/**
 * The kept store: small values in localStorage (read on the first draw),
 * large ones in an asynchronous backend (IndexedDB in a browser), memory in
 * front of both. Driven here with in-memory storage and backend.
 */
import { describe, expect, it } from 'bun:test'
import type { KeptBackend } from '../../src/offline/kept-store'
import { createKeptStore, indexedDbBackend } from '../../src/offline/kept-store'

class MemoryStorage {
  data = new Map<string, string>()
  writes = 0
  get length(): number { return this.data.size }
  key(i: number): string | null { return Array.from(this.data.keys())[i] ?? null }
  getItem(k: string): string | null { return this.data.has(k) ? this.data.get(k)! : null }
  setItem(k: string, v: string): void { this.writes++; this.data.set(k, String(v)) }
  removeItem(k: string): void { this.data.delete(k) }
}

function memoryBackend(options: { failing?: boolean, uncloneable?: boolean } = {}) {
  const data = new Map<string, unknown>()
  let sets = 0
  const backend: KeptBackend & { data: Map<string, unknown>, readonly sets: number } = {
    data,
    get sets() { return sets },
    get: async (key) => {
      if (options.failing) throw new Error('no database')
      return data.get(key)
    },
    set: async (key, value) => {
      if (options.failing) throw new Error('no database')
      sets++
      if (options.uncloneable && value && typeof value === 'object' && 'v' in (value as object))
        throw new DOMException('could not be cloned', 'DataCloneError')
      data.set(key, structuredClone(value))
    },
    remove: async (key) => { data.delete(key) },
    removePrefix: async (prefix) => {
      for (const key of [...data.keys()]) {
        if (key.startsWith(prefix)) data.delete(key)
      }
    },
  }
  return backend
}

const now = (fn: () => void) => fn()
const big = (n = 40_000) => ({ rows: 'x'.repeat(n) })

describe('the kept store', () => {
  it('keeps a small value in localStorage, read back synchronously after a reload', () => {
    const storage = new MemoryStorage()
    const backend = memoryBackend()
    createKeptStore({ storage, backend, defer: now }).set('stx:kept:1:calendar', { a: 1 })
    expect(storage.getItem('stx:kept:1:calendar')).toBe('{"a":1}')
    expect(createKeptStore({ storage, backend }).peek('stx:kept:1:calendar')).toEqual({ value: { a: 1 } })
    expect(backend.data.size).toBe(0)
  })

  it('keeps a large value in the backend, off localStorage, and loads it back', async () => {
    const storage = new MemoryStorage()
    const backend = memoryBackend()
    const kept = createKeptStore({ storage, backend })
    kept.set('k', big())
    // Readable from memory at once, written behind.
    expect(kept.peek('k')).toEqual({ value: big() })
    expect(backend.data.size).toBe(0)
    await kept.flush()
    expect(storage.getItem('k')).toBeNull()
    const reloaded = createKeptStore({ storage, backend })
    expect(reloaded.peek('k')).toBeUndefined()
    expect(await reloaded.load('k')).toEqual({ value: big() })
    expect(reloaded.peek('k')).toEqual({ value: big() })
  })

  it('writes a large value once per burst, not once per change', async () => {
    const backend = memoryBackend()
    const kept = createKeptStore({ storage: new MemoryStorage(), backend })
    for (let i = 0; i < 5; i++) kept.set('k', big(40_000 + i))
    await kept.flush()
    expect(backend.sets).toBe(1)
    expect((backend.data.get('k') as any).v.rows.length).toBe(40_004)
  })

  it('moves a value that grew past the limit, so the old small copy is not read first', async () => {
    const storage = new MemoryStorage()
    const backend = memoryBackend()
    const kept = createKeptStore({ storage, backend })
    kept.set('k', { small: true })
    expect(storage.getItem('k')).not.toBeNull()
    kept.set('k', big())
    await kept.flush()
    expect(storage.getItem('k')).toBeNull()
    expect(await createKeptStore({ storage, backend }).load('k')).toEqual({ value: big() })
  })

  it('keeps writing a once-large value to the backend, where it is read from', async () => {
    const storage = new MemoryStorage()
    const backend = memoryBackend()
    const kept = createKeptStore({ storage, backend })
    kept.set('k', big())
    kept.set('k', { small: true })
    await kept.flush()
    expect(storage.getItem('k')).toBeNull()
    expect(await createKeptStore({ storage, backend }).load('k')).toEqual({ value: { small: true } })
  })

  it('reads what keptState kept in localStorage before it existed', () => {
    const storage = new MemoryStorage()
    storage.setItem('stx:kept:7:unread', '3')
    storage.setItem('stx:kept:7:tab', 'plan')
    const kept = createKeptStore({ storage, backend: memoryBackend() })
    expect(kept.peek('stx:kept:7:unread')).toEqual({ value: 3 })
    expect(kept.peek('stx:kept:7:tab')).toEqual({ value: 'plan' })
  })

  it('keeps everything in localStorage where there is no backend, or it cannot open', async () => {
    const storage = new MemoryStorage()
    createKeptStore({ storage, backend: null }).set('k', big())
    expect(storage.getItem('k')!.length).toBeGreaterThan(40_000)

    const failing = new MemoryStorage()
    const kept = createKeptStore({ storage: failing }, () => memoryBackend({ failing: true }))
    kept.set('a', big())
    await new Promise(resolve => setTimeout(resolve, 5))
    await kept.flush()
    expect(failing.getItem('a')!.length).toBeGreaterThan(40_000)
  })

  it('falls back to JSON for a value the backend cannot clone', async () => {
    const backend = memoryBackend({ uncloneable: true })
    const kept = createKeptStore({ storage: new MemoryStorage(), backend })
    kept.set('k', big())
    await kept.flush()
    expect(typeof (backend.data.get('k') as any).j).toBe('string')
    expect(await createKeptStore({ storage: new MemoryStorage(), backend }).load('k')).toEqual({ value: big() })
  })

  it('forgets a prefix everywhere, and nothing else', async () => {
    const storage = new MemoryStorage()
    const backend = memoryBackend()
    const kept = createKeptStore({ storage, backend })
    kept.set('stx:kept:1:a', 1)
    kept.set('stx:kept:1:b', big())
    kept.set('stx:kept:12:a', 2)
    storage.setItem('auth_token', 'x')
    await kept.flush()
    await kept.forget('stx:kept:1:')
    expect(kept.peek('stx:kept:1:a')).toBeUndefined()
    expect(await kept.load('stx:kept:1:b')).toBeUndefined()
    expect(kept.peek('stx:kept:12:a')).toEqual({ value: 2 })
    expect(storage.getItem('auth_token')).toBe('x')
    expect(backend.data.size).toBe(0)
  })

  it('does not let a forget be overtaken by a write already waiting', async () => {
    const backend = memoryBackend()
    const kept = createKeptStore({ storage: new MemoryStorage(), backend })
    kept.set('stx:kept:1:b', big())
    await kept.forget('stx:kept:1:')
    await kept.flush()
    expect(backend.data.size).toBe(0)
  })

  it('opens no database for a page that keeps only small values', () => {
    let opened = 0
    const kept = createKeptStore({ storage: new MemoryStorage() }, () => { opened++; return memoryBackend() })
    kept.set('a', 1)
    kept.peek('a')
    expect(opened).toBe(0)
  })

  it('has no IndexedDB backend where there is no IndexedDB', () => {
    expect(typeof indexedDB).toBe('undefined')
    expect(indexedDbBackend()).toBeNull()
  })
})
