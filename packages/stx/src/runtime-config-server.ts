import { AsyncLocalStorage } from 'node:async_hooks'
import type { PublicRuntimeConfig } from './runtime-config'

export type RuntimeConfigValue = string | number | boolean | null | RuntimeConfigValue[] | { [key: string]: RuntimeConfigValue }
export interface RuntimeConfigDefaults {
  public?: Record<string, RuntimeConfigValue>
  private?: Record<string, RuntimeConfigValue>
}
export interface PrivateRuntimeConfig {}
export interface ResolvedRuntimeConfig {
  public: Record<string, RuntimeConfigValue>
  private: Record<string, RuntimeConfigValue>
}

// Endpoint bundles and the host must share the SAME async context, not copies
// of an AsyncLocalStorage instance produced by separate bundler invocations.
const key = Symbol.for('stx.runtime-config.scope')
const registry = globalThis as any
const scope: AsyncLocalStorage<ResolvedRuntimeConfig> = registry[key] ??= new AsyncLocalStorage()

export function withRuntimeConfig<T>(config: ResolvedRuntimeConfig, run: () => T): T {
  return scope.run(config, run)
}

export function currentRuntimeConfig(): ResolvedRuntimeConfig | undefined {
  return scope.getStore()
}

export function useServerRuntimeConfig(): Readonly<{ public: PublicRuntimeConfig, private: PrivateRuntimeConfig }> {
  const config = scope.getStore()
  if (!config)
    throw new Error('useServerRuntimeConfig requires a server request or template render')
  // Non-enumerable private section prevents accidental whole-object exposure
  // through the implicit client-payload bridge or JSON serialization.
  return Object.freeze(Object.defineProperty({ public: config.public }, 'private', { value: config.private })) as any
}

/** Server version of the public-only accessor. */
export function useRuntimeConfig(): Readonly<PublicRuntimeConfig> {
  return useServerRuntimeConfig().public
}

/** Resolve ONLY declared keys. Double underscores separate path segments. */
export function resolveRuntimeConfig(defaults: RuntimeConfigDefaults = {}, env: Record<string, string | undefined> = process.env): ResolvedRuntimeConfig {
  const names = new Set<string>()
  function matchesDefault(value: RuntimeConfigValue, shape: RuntimeConfigValue): boolean {
    if (shape === null) return value === null
    if (Array.isArray(shape))
      return Array.isArray(value) && (!shape.length || value.every(item => shape.some(sample => matchesDefault(item, sample))))
    if (typeof shape === 'object')
      return value !== null && typeof value === 'object' && !Array.isArray(value)
        && Object.entries(shape).every(([key, sample]) => Object.hasOwn(value, key) && matchesDefault(value[key], sample))
    return typeof value === typeof shape
  }
  function visit(value: RuntimeConfigValue, path: string[]): RuntimeConfigValue {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
        throw new TypeError(`Runtime config ${path.join('.')} must contain JSON values`)
      const result: Record<string, RuntimeConfigValue> = Object.create(null)
      for (const [name, entry] of Object.entries(value)) {
        if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(name) || ['constructor', 'prototype', '__proto__'].includes(name))
          throw new TypeError(`Invalid runtime config key: ${name}`)
        result[name] = visit(entry, [...path, name])
      }
      return Object.freeze(result)
    }
    const name = `STX_RUNTIME_${path.map(segment => segment.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase()).join('__')}`
    if (names.has(name))
      throw new TypeError(`Ambiguous runtime config environment key: ${name}`)
    names.add(name)
    const raw = env[name]
    let resolved = value
    if (raw !== undefined) {
      try { resolved = typeof value === 'string' ? raw : JSON.parse(raw) }
      catch { throw new TypeError(`Invalid runtime config override: ${name}`) }
      if (!matchesDefault(resolved, value))
        throw new TypeError(`Wrong runtime config override type: ${name}`)
    }
    function clone(entry: RuntimeConfigValue): RuntimeConfigValue {
      if (entry === null || typeof entry === 'string' || typeof entry === 'boolean') return entry
      if (typeof entry === 'number' && Number.isFinite(entry)) return entry
      if (Array.isArray(entry)) return Object.freeze(entry.map(clone)) as unknown as RuntimeConfigValue[]
      if (entry && typeof entry === 'object' && (Object.getPrototypeOf(entry) === Object.prototype || Object.getPrototypeOf(entry) === null))
        return Object.freeze(Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, clone(v)])))
      throw new TypeError(`Runtime config ${path.join('.')} must contain JSON values`)
    }
    return clone(resolved)
  }
  return Object.freeze({ public: visit(defaults.public ?? {}, ['public']), private: visit(defaults.private ?? {}, ['private']) }) as ResolvedRuntimeConfig
}

export function runtimeConfigTag(config: ResolvedRuntimeConfig): string {
  const json = JSON.stringify(config.public).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')
  return `<script data-stx-scoped data-stx-runtime-config type="application/json">${json}</script>`
}

export function injectRuntimeConfig(html: string, config: ResolvedRuntimeConfig): string {
  const clean = html.replace(/<script\b[^>]*\bdata-stx-runtime-config\b[^>]*>[\s\S]*?<\/script>/gi, '')
  const head = /<head\b[^>]*>/i.exec(clean)
  const at = head ? head.index + head[0].length : 0
  return clean.slice(0, at) + runtimeConfigTag(config) + clean.slice(at)
}
