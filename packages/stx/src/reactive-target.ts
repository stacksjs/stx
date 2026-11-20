/** Plain containers can be proxied without changing an object's receiver. */
export function canWrapReactive(value: unknown): value is object {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return true
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

/** Proxy reads must return a locked own data property's exact value. */
export function isLockedReactiveProperty(target: object, key: PropertyKey): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(target, key)
  return descriptor?.configurable === false && descriptor.writable === false
}

/** @internal Closure-free so the module and generated runtime share proxy semantics. */
export function createReactiveProxy(
  canWrap: typeof canWrapReactive,
  isLocked: typeof isLockedReactiveProperty,
  isTracking: () => boolean,
  createDependency: () => { track: () => void, notify: () => void },
  batch: (fn: () => void) => void,
): <T>(target: T) => T {
  const proxies = new WeakMap<object, object>()
  const keys = Symbol('own keys')

  function reactive<T>(target: T): T {
    if (!canWrap(target)) return target
    const existing = proxies.get(target)
    if (existing) return existing as T

    const values = new Map<PropertyKey, ReturnType<typeof createDependency>>()
    const presence = new Map<PropertyKey, ReturnType<typeof createDependency>>()
    const raw: object = target
    const array = Array.isArray(target) ? target : undefined
    let setting: PropertyKey | undefined

    function track(dependencies: typeof values, key: PropertyKey) {
      if (!isTracking()) return
      let dependency = dependencies.get(key)
      if (!dependency) dependencies.set(key, dependency = createDependency())
      dependency.track()
    }

    function removedIndex(key: PropertyKey, length: number, oldLength: number) {
      if (typeof key !== 'string') return false
      const index = Number(key)
      return index >= length && index < oldLength && Number.isInteger(index) && String(index) === key
    }

    function mutate(key: PropertyKey, update: () => boolean, observeSetter = false): boolean {
      const before = Reflect.getOwnPropertyDescriptor(raw, key)
      const had = Reflect.has(raw, key)
      const oldLength = array?.length
      let applied = false
      batch(() => {
        applied = update()
        const after = Reflect.getOwnPropertyDescriptor(raw, key)
        const length = array?.length
        if (!!before !== !!after
          || !Object.is(before?.value, after?.value)
          || before?.get !== after?.get
          || (applied && observeSetter && !!after?.set)) {
          values.get(key)?.notify()
        }
        if (had !== Reflect.has(raw, key)) presence.get(key)?.notify()
        const shrank = length !== undefined && oldLength !== undefined && length < oldLength
        if (!!before !== !!after || before?.enumerable !== after?.enumerable || shrank)
          values.get(keys)?.notify()
        if (length !== oldLength && key !== 'length') values.get('length')?.notify()
        if (shrank) {
          // Setting length can remove tracked slots without invoking deleteProperty.
          for (const [index, dependency] of values)
            if (removedIndex(index, length, oldLength)) dependency.notify()
          for (const [index, dependency] of presence)
            if (removedIndex(index, length, oldLength) && !Reflect.has(raw, index)) dependency.notify()
        }
      })
      return applied
    }

    const proxy = new Proxy(target, {
      get(obj, key, receiver) {
        track(values, key)
        const value = Reflect.get(obj, key, receiver)
        return isLocked(obj, key) ? value : reactive(value)
      },
      has(obj, key) {
        track(presence, key)
        return Reflect.has(obj, key)
      },
      ownKeys(obj) {
        track(values, keys)
        return Reflect.ownKeys(obj)
      },
      set(obj, key, value, receiver) {
        return mutate(key, () => {
          const previous = setting
          setting = key
          try { return Reflect.set(obj, key, value, receiver) }
          finally { setting = previous }
        }, true)
      },
      defineProperty(obj, key, descriptor) {
        // A native set through the proxy receiver can reach this same trap.
        if (setting === key) return Reflect.defineProperty(obj, key, descriptor)
        return mutate(key, () => Reflect.defineProperty(obj, key, descriptor))
      },
      deleteProperty(obj, key) {
        return mutate(key, () => Reflect.deleteProperty(obj, key))
      },
    })
    proxies.set(target, proxy)
    proxies.set(proxy, proxy)
    return proxy
  }

  return reactive
}
