import { AsyncLocalStorage } from 'node:async_hooks'

interface ServerDataScope {
  pending: Map<string, Promise<unknown>>
  values: Map<string, unknown>
}

const currentScope = new AsyncLocalStorage<ServerDataScope>()

/** @internal Shared by nested contexts, never by separate render requests. */
export function serverDataScope(context: Record<string, any>): ServerDataScope {
  return context.__stx_server_data ??= { pending: new Map(), values: new Map() }
}

/** @internal Run server scripts with their render's data scope, including imports. */
export function withServerData<T>(context: Record<string, any>, run: () => T): T {
  return currentScope.run(serverDataScope(context), run)
}

/**
 * Load JSON data once per key in this server render and expose it for hydration.
 * Only call in a server script. Everything returned is sent to the browser;
 * never return credentials or other server-only data.
 */
export async function useServerData<T>(key: string, loader: () => T | Promise<T>): Promise<T> {
  const scope = currentScope.getStore()
  if (!scope)
    throw new Error('useServerData must run inside a <script server> render')
  if (typeof key !== 'string' || !key.trim())
    throw new TypeError('useServerData requires a non-empty string key')
  const existing = scope.pending.get(key)
  if (existing)
    return existing as Promise<T>

  const pending = Promise.resolve().then(loader).then((value) => {
    // Normalize once so SSR and hydration see the same JSON shape. Reject
    // values JSON would silently discard; circular objects also fail here.
    const json = JSON.stringify(value, (_name, entry) => {
      if (entry === undefined || typeof entry === 'function' || typeof entry === 'symbol'
        || typeof entry === 'bigint' || (typeof entry === 'number' && !Number.isFinite(entry)))
        throw new TypeError(`useServerData(${JSON.stringify(key)}) requires JSON-serializable data`)
      if (entry && typeof entry === 'object' && !Array.isArray(entry)
        && Object.getPrototypeOf(entry) !== Object.prototype && Object.getPrototypeOf(entry) !== null)
        throw new TypeError(`useServerData(${JSON.stringify(key)}) requires JSON-serializable data`)
      return entry
    })
    const normalized = JSON.parse(json)
    scope.values.set(key, normalized)
    return normalized as T
  }).catch((error) => {
    scope.pending.delete(key)
    throw error
  })
  scope.pending.set(key, pending)
  return pending
}

/** @internal Data-only tag: no executable serialization or script-breakout. */
export function serverDataTag(context: Record<string, any>): string {
  const scope = context.__stx_server_data as ServerDataScope | undefined
  if (!scope?.values.size)
    return ''
  const json = JSON.stringify(Object.fromEntries(scope.values))
    .replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  return `<script data-stx-scoped data-stx-server-data type="application/json">${json}</script>`
}
