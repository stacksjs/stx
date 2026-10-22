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
 *
 * A key the app shares with its native side (Craft's `shareStorage`, such as
 * `{ auth_token: 'auth.token' }`) is also the Keychain item it names, as it
 * is for Craft's hybrid page: a write in either area keeps the item at the
 * key's value (sessionStorage's, else localStorage's), and a change made
 * elsewhere (a native sign-in, a sign-out on another screen) is adopted into
 * localStorage when the key is next read, and announced as the page's
 * `craftsharedstorage` event. A web view's sign-in is then `craft.session`'s,
 * and a native sign-in is the web view's.
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

/** Hook-free access to an area's values, for the shared keys' bookkeeping. */
const RAW = Symbol('stx.nativeWebStorage.raw')

interface RawArea {
  get: (key: string) => string | null
  set: (key: string, value: string) => void
  remove: (key: string) => void
}

/** What an area tells the shared keys (`createSharedKeys`). */
interface SharedHooks {
  /** Before `key` is read or written: adopt a change made elsewhere. */
  read: (key: string) => void
  /** After `key` was written or removed: keep the native item in step. */
  wrote: (key: string) => void
  /** Before the keys are listed. */
  readAll: () => void
}

/** A `Storage` (the web's interface) kept in `store()`, under `prefix`. */
export class NativeWebStorage {
  // Private, not properties: `Object.keys(localStorage)` names stored keys
  // on the web, and code shared with the page may read them.
  readonly #read: () => NativeSyncStore | null
  readonly #prefix: string
  /** The run a value must carry to be read; null for none (localStorage). */
  readonly #run: (() => string) | null
  #hooks: SharedHooks | null = null

  constructor(store: () => NativeSyncStore | null, prefix: string, run: (() => string) | null = null) {
    this.#read = store
    this.#prefix = prefix
    this.#run = run
  }

  /** @internal The shared keys' view: values without the hooks. */
  get [RAW](): RawArea {
    return { get: key => this.#get(key), set: (key, value) => this.#set(key, value), remove: key => this.#remove(key) }
  }

  /** @internal */
  set [RAW](hooks: SharedHooks | null) {
    this.#hooks = hooks
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
    this.#hooks?.readAll()
    return this.#run ? this.#keys().filter(key => this.#get(key) !== null) : this.#keys()
  }

  get length(): number {
    return this.#liveKeys().length
  }

  key(index: number): string | null {
    return this.#liveKeys()[Number(index)] ?? null
  }

  getItem(key: string): string | null {
    this.#hooks?.read(String(key))
    return this.#get(String(key))
  }

  setItem(key: string, value: unknown): void {
    const name = String(key)
    this.#hooks?.read(name)
    this.#set(name, String(value))
    this.#hooks?.wrote(name)
  }

  removeItem(key: string): void {
    const name = String(key)
    this.#hooks?.read(name)
    this.#remove(name)
    this.#hooks?.wrote(name)
  }

  clear(): void {
    const keys = this.#keys()
    for (const key of keys) this.#store().setSync(this.#prefix + key, null)
    this.#writeKeys([])
    for (const key of keys) this.#hooks?.wrote(key)
  }

  #get(key: string): string | null {
    const value = this.#store().getSync(this.#prefix + key)
    if (this.#run) {
      if (!value || typeof value !== 'object' || (value as AnyRecord).run !== this.#run()) return null
      const kept = (value as AnyRecord).value
      return typeof kept === 'string' ? kept : null
    }
    return typeof value === 'string' ? value : null
  }

  #set(key: string, text: string): void {
    this.#store().setSync(this.#prefix + key, this.#run ? { run: this.#run(), value: text } : text)
    const keys = this.#keys()
    if (!keys.includes(key)) this.#writeKeys([...keys, key])
  }

  #remove(key: string): void {
    this.#store().setSync(this.#prefix + key, null)
    const keys = this.#keys()
    if (keys.includes(key)) this.#writeKeys(keys.filter(other => other !== key))
  }

  get [Symbol.toStringTag](): string {
    return 'Storage'
  }
}

/** A run id: different on every launch, readable as a string. */
function newRun(): string {
  return `${Date.now().toString(36)}.${Math.random().toString(36).slice(2, 10)}`
}

/** The native item a shared key is kept in: Craft's secure storage. */
export interface NativeSecureStore {
  getSync: (key: string) => unknown
  set: (key: string, value: string) => unknown
  remove: (key: string) => unknown
}

export interface NativeWebStorageOptions {
  /** Web-storage key to the native item it is shared as (Craft's `shareStorage`). */
  shareStorage?: Record<string, string>
  /** Where shared keys are kept; required for them to be shared at all. */
  secure?: () => NativeSecureStore | null
  /** A shared key changed elsewhere and was adopted: the page's `craftsharedstorage`. */
  adopted?: (key: string, value: string | null) => void
}

export interface NativeSharedKeys {
  /** The native item `nativeKey` changed elsewhere (`SESSION_CHANGED`): adopt it now. */
  changed: (nativeKey: string) => void
}

/** Keep each shared key and its native item in step (see the module comment). */
function createSharedKeys(local: NativeWebStorage, session: NativeWebStorage, options: Required<NativeWebStorageOptions>): NativeSharedKeys {
  const share = options.shareStorage
  // Writes on their way to the native item, which reads must already see.
  const pending = new Map<string, string | null>()
  const native = (key: string): string | null => {
    const item = share[key]!
    if (pending.has(item)) return pending.get(item)!
    const value = options.secure()?.getSync(item)
    return typeof value === 'string' && value !== '' ? value : null
  }
  const current = (key: string): string | null => session[RAW].get(key) ?? local[RAW].get(key)
  const adopt = (key: string): boolean => {
    const value = native(key)
    if (value === current(key)) return false
    session[RAW].remove(key)
    if (value === null) local[RAW].remove(key)
    else local[RAW].set(key, value)
    return true
  }
  const hooks: SharedHooks = {
    read(key) {
      if (Object.prototype.hasOwnProperty.call(share, key)) adopt(key)
    },
    wrote(key) {
      if (!Object.prototype.hasOwnProperty.call(share, key)) return
      const value = current(key)
      if (value === native(key)) return
      const item = share[key]!
      pending.set(item, value)
      const settled = (): void => {
        if (pending.get(item) === value) pending.delete(item)
      }
      try {
        const store = options.secure()
        Promise.resolve(value === null ? store?.remove(item) : store?.set(item, value)).then(settled, (error: unknown) => {
          settled()
          console.error(`[stx native] could not share ${key}: ${error instanceof Error ? error.message : String(error)}`)
        })
      }
      catch (error) {
        settled()
        console.error(`[stx native] could not share ${key}: ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    readAll() {
      for (const key of Object.keys(share)) adopt(key)
    },
  }
  local[RAW] = hooks
  session[RAW] = hooks
  return {
    changed(nativeKey) {
      for (const [key, item] of Object.entries(share)) {
        if (item !== nativeKey || pending.has(item)) continue
        if (adopt(key)) options.adopted(key, current(key))
      }
    },
  }
}

/**
 * Install `localStorage` and `sessionStorage` over `craft.storage`, unless the
 * host gave the context its own. For a native realm only (craft-bridge.ts).
 * Returns the shared keys, when there are any.
 */
export function installNativeWebStorage(target: AnyRecord, craft: AnyRecord, options: NativeWebStorageOptions = {}): NativeSharedKeys | null {
  const store = (): NativeSyncStore | null => craft.storage ?? null
  if (target.localStorage != null || target.sessionStorage != null) return null
  const local = new NativeWebStorage(store, NATIVE_WEB_STORAGE_PREFIX.local)
  const session = new NativeWebStorage(store, NATIVE_WEB_STORAGE_PREFIX.session, () => {
    const run = store()?.getSync(NATIVE_SESSION_RUN_KEY)
    return typeof run === 'string' && run ? run : ''
  })
  target.localStorage = local
  target.sessionStorage = session
  const share = options.shareStorage ?? {}
  if (!Object.keys(share).length || !options.secure) return null
  return createSharedKeys(local, session, {
    shareStorage: share,
    secure: options.secure,
    adopted: options.adopted ?? (() => {}),
  })
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
