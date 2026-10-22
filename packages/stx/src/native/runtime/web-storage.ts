/**
 * `localStorage` and `sessionStorage` on a native screen.
 *
 * Web views keep what must be there on the first draw in web storage: a
 * signed-in token (a store reads it before anything renders), a remembered
 * tab, `keptState`'s small values. JavaScriptCore has no web storage, so a
 * web view compiled for native threw on its first `localStorage.getItem`.
 *
 * Both are the web's synchronous `Storage`, kept in the app's storage
 * (`craft.storage.getSync` / `setSync`, which Craft's host answers without a
 * bridge round trip): every screen of the app reads what any other wrote, as
 * every tab of a site does. Values are read through on every call, never
 * cached, so a write from another screen is seen at once.
 *
 * - `localStorage` lasts until it is removed, as a site's does.
 * - `sessionStorage` lasts for the app's run, as a tab's does for its visit:
 *   each value carries the run it was written in, and the app script
 *   (`prepareNativeApp`, once per launch) starts a new run, so a sign-in that
 *   was not to be remembered is gone after the app is quit. A host that runs
 *   no app script never starts one, and its sessionStorage lasts as long as
 *   localStorage.
 *
 * Neither is scoped to the signed-in account: a site's storage is not, and
 * the token that says which account is signed in is kept here.
 */

type AnyRecord = Record<string, any> // eslint-disable-line ts/no-explicit-any

/** The synchronous half of `craft.storage`. */
export interface NativeSyncStore {
  getSync: (key: string) => unknown
  setSync: (key: string, value: unknown) => void
}

/** Where each storage area keeps its values in the app's storage. */
export const NATIVE_WEB_STORAGE_PREFIX = { local: 'stx.localStorage:', session: 'stx.sessionStorage:' } as const

/** The app's current run, which sessionStorage values belong to. */
export const NATIVE_SESSION_RUN_KEY = 'stx.sessionStorage.run'

const INDEX = '\u0000keys'

/** A `Storage` (the web's interface) kept in `store()`, under `prefix`. */
export class NativeWebStorage {
  // Private, not properties: `Object.keys(localStorage)` names stored keys
  // on the web, and code shared with the page may read them.
  readonly #read: () => NativeSyncStore | null
  readonly #prefix: string
  /** The run a value must carry to be read; null for none (localStorage). */
  readonly #run: (() => string) | null

  constructor(store: () => NativeSyncStore | null, prefix: string, run: (() => string) | null = null) {
    this.#read = store
    this.#prefix = prefix
    this.#run = run
  }

  #store(): NativeSyncStore {
    const store = this.#read()
    if (!store || typeof store.getSync !== 'function' || typeof store.setSync !== 'function')
      throw Object.assign(new Error('This app keeps no storage for native screens'), { name: 'SecurityError' })
    return store
  }

  #keys(): string[] {
    const keys = this.#store().getSync(this.#prefix + INDEX)
    return Array.isArray(keys) ? keys.filter((key): key is string => typeof key === 'string') : []
  }

  #writeKeys(keys: string[]): void {
    this.#store().setSync(this.#prefix + INDEX, keys.length ? keys : null)
  }

  /** The keys whose values are readable now: a past run's are not. */
  #liveKeys(): string[] {
    return this.#run ? this.#keys().filter(key => this.getItem(key) !== null) : this.#keys()
  }

  get length(): number {
    return this.#liveKeys().length
  }

  key(index: number): string | null {
    return this.#liveKeys()[Number(index)] ?? null
  }

  getItem(key: string): string | null {
    const value = this.#store().getSync(this.#prefix + String(key))
    if (this.#run) {
      if (!value || typeof value !== 'object' || (value as AnyRecord).run !== this.#run()) return null
      const kept = (value as AnyRecord).value
      return typeof kept === 'string' ? kept : null
    }
    return typeof value === 'string' ? value : null
  }

  setItem(key: string, value: unknown): void {
    const name = String(key)
    const text = String(value)
    this.#store().setSync(this.#prefix + name, this.#run ? { run: this.#run(), value: text } : text)
    const keys = this.#keys()
    if (!keys.includes(name)) this.#writeKeys([...keys, name])
  }

  removeItem(key: string): void {
    const name = String(key)
    this.#store().setSync(this.#prefix + name, null)
    const keys = this.#keys()
    if (keys.includes(name)) this.#writeKeys(keys.filter(other => other !== name))
  }

  clear(): void {
    for (const key of this.#keys()) this.#store().setSync(this.#prefix + key, null)
    this.#writeKeys([])
  }

  get [Symbol.toStringTag](): string {
    return 'Storage'
  }
}

/** A run id: different on every launch, readable as a string. */
function newRun(): string {
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Install `localStorage` and `sessionStorage` over `craft.storage`, unless the
 * host gave the context its own. For a native realm only (craft-bridge.ts).
 */
export function installNativeWebStorage(target: AnyRecord, craft: AnyRecord): void {
  const store = (): NativeSyncStore | null => craft.storage ?? null
  if (target.localStorage == null) target.localStorage = new NativeWebStorage(store, NATIVE_WEB_STORAGE_PREFIX.local)
  if (target.sessionStorage == null) {
    target.sessionStorage = new NativeWebStorage(store, NATIVE_WEB_STORAGE_PREFIX.session, () => {
      const run = store()?.getSync(NATIVE_SESSION_RUN_KEY)
      return typeof run === 'string' && run ? run : ''
    })
  }
}

/** A new run of the app: what sessionStorage held is gone. The app script calls it once per launch. */
export function startNativeSessionRun(craft: AnyRecord): void {
  const storage = craft.storage
  if (storage && typeof storage.setSync === 'function') {
    try {
      storage.setSync(NATIVE_SESSION_RUN_KEY, newRun())
    }
    catch (error) {
      console.error(`[stx native] could not start a new sessionStorage run: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
