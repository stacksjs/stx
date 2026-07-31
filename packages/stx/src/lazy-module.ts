/**
 * Deduplicate cold dynamic imports across concurrent template renders.
 *
 * Bun normally caches evaluated modules, but separate first-use import()
 * calls can still enter its TypeScript compilation path concurrently. A dev
 * server prewarming several routes exposed that race as partial module builds
 * such as "Unexpected end of file" from forms-validation.ts. Keeping the
 * pending promise makes first compilation single-flight while preserving lazy
 * loading and the circular-dependency boundaries that require import().
 */

const LAZY_MODULE_PROMISES = Symbol.for('stx.lazy-module-promises')

interface LazyModuleGlobal {
  [LAZY_MODULE_PROMISES]?: Map<string, Promise<unknown>>
}

function modulePromises(): Map<string, Promise<unknown>> {
  const shared = globalThis as LazyModuleGlobal
  shared[LAZY_MODULE_PROMISES] ??= new Map<string, Promise<unknown>>()
  return shared[LAZY_MODULE_PROMISES]
}

export function importOnce<T>(key: string, importer: () => Promise<T>): Promise<T> {
  const promises = modulePromises()
  // Include the physical helper URL so two installed STX versions in one
  // process never exchange incompatible compiler modules through globalThis.
  const scopedKey = `${import.meta.url}\0${key}`
  const pending = promises.get(scopedKey) as Promise<T> | undefined
  if (pending)
    return pending

  const imported = importer()
  promises.set(scopedKey, imported)
  void imported.catch(() => {
    if (promises.get(scopedKey) === imported)
      promises.delete(scopedKey)
  })
  return imported
}
