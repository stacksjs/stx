/**
 * Where kept values live: `keptState` and persisted queries.
 *
 * A phone app opens on last time's data, so a kept value has to be there
 * synchronously when a screen first draws. localStorage is, but every write
 * to it is a synchronous disk write on the main thread, and an API answer of a
 * few hundred kilobytes (a month of calendar, a year of fitness data) written
 * on every refresh stalled scrolling, and past ~5 MB it is refused outright.
 *
 * So a value is kept in three places, each for what it is good at:
 *
 * - memory: what every read after the first answers from;
 * - localStorage, for small values: read synchronously on the first draw;
 * - IndexedDB, for large ones: written off the main thread's critical path,
 *   coalesced, and read back asynchronously (a few milliseconds, well before
 *   any network answer).
 *
 * Values written before this existed sit in localStorage under the same key
 * and are read from there, so nothing kept is lost; a large one moves to
 * IndexedDB the next time it is written. Where IndexedDB is not available
 * (some private modes, an old web view) everything stays in localStorage, and
 * where neither is, in memory.
 *
 * `createKeptStore` is closure-free: the browser runtime embeds its source
 * (signals.ts), so it may use nothing from this module's scope.
 */

/** An asynchronous key-value store behind localStorage, for large values. */
export interface KeptBackend {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: unknown) => Promise<void>
  remove: (key: string) => Promise<void>
  /** Remove every key starting with this prefix. */
  removePrefix: (prefix: string) => Promise<void>
}

export interface KeptStoreOptions {
  /** Synchronous storage for small values. Default localStorage; null for none. */
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'> | null
  /** Asynchronous storage for large values. Default IndexedDB where there is one; null for none. */
  backend?: KeptBackend | null
  /** Characters of JSON past which a value goes to the backend rather than localStorage. Default 32768. */
  limit?: number
  /** Defer a backend write (default: when idle, or 200 ms at the latest). */
  defer?: (fn: () => void) => void
}

export interface KeptStore {
  /** The value kept under `key`, synchronously: from memory, or localStorage. */
  peek: (key: string) => { value: unknown } | undefined
  /** The value kept under `key`, wherever it is, IndexedDB included. */
  load: (key: string) => Promise<{ value: unknown } | undefined>
  /** Keep a value. Readable from memory at once; stored behind. */
  set: (key: string, value: unknown) => void
  /** Forget every key that starts with `prefix`. */
  forget: (prefix: string) => Promise<void>
  /** Finish every write that is waiting. */
  flush: () => Promise<void>
}

/** IndexedDB as a KeptBackend, or null where there is none. Closure-free. */
export function indexedDbBackend(name?: string): KeptBackend | null {
  let factory: IDBFactory | null = null
  try {
    factory = typeof indexedDB !== 'undefined' ? indexedDB : null
  }
  catch {
    factory = null
  }
  if (!factory)
    return null
  const idb = factory
  const dbName = name || 'stx-kept'
  let opened: Promise<IDBDatabase> | null = null
  const open = (): Promise<IDBDatabase> => {
    if (!opened) {
      opened = new Promise<IDBDatabase>((resolve, reject) => {
        const request = idb.open(dbName, 1)
        request.onupgradeneeded = () => { request.result.createObjectStore('kv') }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        request.onblocked = () => reject(new Error('blocked'))
      })
      // A failed open is not cached: the next call tries again.
      opened.catch(() => { opened = null })
    }
    return opened
  }
  const run = <T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest | void): Promise<T> =>
    open().then(db => new Promise<T>((resolve, reject) => {
      const tx = db.transaction('kv', mode)
      const request = fn(tx.objectStore('kv'))
      tx.oncomplete = () => resolve((request ? request.result : undefined) as T)
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    }))
  return {
    get: key => run('readonly', store => store.get(key)),
    set: (key, value) => run('readwrite', (store) => { store.put(value, key) }),
    remove: key => run('readwrite', (store) => { store.delete(key) }),
    removePrefix: prefix => run('readwrite', (store) => { store.delete(IDBKeyRange.bound(prefix, `${prefix}￿`)) }),
  }
}

/**
 * A kept store. Closure-free: embedded in the browser runtime by source, with
 * `indexedDbBackend` passed in rather than referenced.
 */
export function createKeptStore(options?: KeptStoreOptions, openBackend?: () => KeptBackend | null): KeptStore {
  const opts = options || {}
  let storage: KeptStoreOptions['storage'] = null
  if (opts.storage !== undefined) {
    storage = opts.storage
  }
  else {
    try {
      storage = typeof localStorage !== 'undefined' ? localStorage : null
    }
    catch {
      storage = null
    }
  }
  // Opened at first need, so a page that keeps nothing never creates a database.
  let backend: KeptBackend | null = null
  let backendOpened = opts.backend !== undefined
  if (backendOpened)
    backend = opts.backend || null
  const useBackend = (): KeptBackend | null => {
    if (backendOpened)
      return backend
    backendOpened = true
    try {
      backend = openBackend ? openBackend() : null
    }
    catch {
      backend = null
    }
    // One that cannot open is no backend: everything goes to localStorage.
    if (backend) {
      const probe = backend
      probe.get('__stx_probe__').catch(() => {
        if (backend === probe)
          backend = null
      })
    }
    return backend
  }
  const limit = opts.limit || 32768
  const defer = opts.defer || ((fn: () => void): void => {
    const idle = typeof requestIdleCallback === 'function' ? requestIdleCallback : null
    if (idle)
      idle(fn, { timeout: 200 })
    else setTimeout(fn, 16)
  })

  const memory = new Map<string, unknown>()
  // Keys whose value is in the backend. Their next write goes there too, so
  // the one copy that is read back is always the newest.
  const inBackend = new Set<string>()
  const waiting = new Map<string, unknown>()
  let scheduled = false
  let writes: Promise<void> = Promise.resolve()

  const parse = (raw: string): unknown => {
    try {
      return JSON.parse(raw)
    }
    catch {
      // A value that is not JSON is returned as the string it is, as
      // useLocalStorage does, rather than lost.
      return raw
    }
  }

  const writeStorage = (key: string, json: string): boolean => {
    if (!storage)
      return false
    try {
      storage.setItem(key, json)
      return true
    }
    catch {
      return false
    }
  }
  const removeStorage = (key: string): void => {
    try {
      if (storage)
        storage.removeItem(key)
    }
    catch {}
  }

  const drain = (): Promise<void> => {
    scheduled = false
    if (!waiting.size)
      return writes
    const batch = Array.from(waiting.entries())
    waiting.clear()
    writes = writes.then(() => Promise.all(batch.map(([key, value]) => {
      if (!backend) {
        // The backend went away after this was scheduled for it.
        inBackend.delete(key)
        try {
          writeStorage(key, JSON.stringify(value === undefined ? null : value))
        }
        catch {}
        return undefined
      }
      let record: unknown
      try {
        // Structured-cloned by IndexedDB: no JSON on the main thread.
        record = { v: value }
        return backend.set(key, record).catch(() => {
          // Not cloneable (a function inside), or the database went away:
          // as JSON, and in localStorage when even that fails.
          let json: string
          try {
            json = JSON.stringify(value)
          }
          catch {
            return undefined
          }
          return backend ? backend.set(key, { j: json }).catch(() => { writeStorage(key, json) }) : undefined
        })
      }
      catch {
        return undefined
      }
    }))).then(() => {})
    return writes
  }

  const schedule = (key: string, value: unknown): void => {
    waiting.set(key, value)
    inBackend.add(key)
    if (scheduled)
      return
    scheduled = true
    defer(() => { void drain() })
  }

  const unwrap = (record: unknown): { value: unknown } | undefined => {
    if (!record || typeof record !== 'object')
      return undefined
    const r = record as { v?: unknown, j?: string }
    if ('v' in r)
      return { value: r.v }
    if (typeof r.j === 'string')
      return { value: parse(r.j) }
    return undefined
  }

  const store: KeptStore = {
    peek(key) {
      if (memory.has(key))
        return { value: memory.get(key) }
      let raw: string | null = null
      try {
        raw = storage ? storage.getItem(key) : null
      }
      catch {
        raw = null
      }
      if (raw === null || raw === undefined)
        return undefined
      const value = parse(raw)
      memory.set(key, value)
      return { value }
    },

    load(key) {
      const hit = store.peek(key)
      const from = hit ? null : useBackend()
      if (hit || !from)
        return Promise.resolve(hit)
      return from.get(key).then((record) => {
        // Written while this read was out: what was written is newer.
        if (memory.has(key))
          return { value: memory.get(key) }
        const found = unwrap(record)
        if (found) {
          memory.set(key, found.value)
          inBackend.add(key)
        }
        return found
      }, () => undefined)
    },

    set(key, value) {
      memory.set(key, value)
      // Known to be large: straight to the backend, without serialising it
      // again only to find that out.
      if (backend && inBackend.has(key)) {
        schedule(key, value)
        return
      }
      let json: string
      try {
        json = JSON.stringify(value === undefined ? null : value)
      }
      catch {
        return
      }
      if (json.length <= limit && writeStorage(key, json))
        return
      // Too large for localStorage (or refused by it): the backend keeps it,
      // and the old small copy goes, or it would be read first next launch.
      if (!useBackend()) {
        if (json.length > limit)
          writeStorage(key, json)
        return
      }
      removeStorage(key)
      schedule(key, value)
    },

    forget(prefix) {
      for (const key of Array.from(memory.keys())) {
        if (key.indexOf(prefix) === 0)
          memory.delete(key)
      }
      for (const key of Array.from(waiting.keys())) {
        if (key.indexOf(prefix) === 0)
          waiting.delete(key)
      }
      for (const key of Array.from(inBackend)) {
        if (key.indexOf(prefix) === 0)
          inBackend.delete(key)
      }
      try {
        if (storage) {
          for (let i = storage.length - 1; i >= 0; i--) {
            const key = storage.key(i)
            if (key && key.indexOf(prefix) === 0)
              storage.removeItem(key)
          }
        }
      }
      catch {}
      const gone = useBackend()
      if (!gone)
        return writes
      // After any write already under way, or it would land after the forget.
      writes = writes.then(() => gone.removePrefix(prefix)).catch(() => {})
      return writes
    },

    flush() {
      return drain()
    },
  }

  // What is waiting is written before the page goes away (iOS suspends a
  // backgrounded web view without unloading it).
  try {
    if (typeof document !== 'undefined' && document.addEventListener) {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden')
          void drain()
      })
    }
    if (typeof addEventListener === 'function')
      addEventListener('pagehide', () => { void drain() })
  }
  catch {}

  return store
}
