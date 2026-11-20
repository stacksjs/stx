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
