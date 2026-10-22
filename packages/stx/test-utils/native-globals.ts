import { afterEach } from 'bun:test'

/**
 * What the native runtime installs on the global it runs in: `craft`, and the
 * web's localStorage/sessionStorage over craft.storage (runtime/web-storage.ts).
 * On a phone that global is the app's. A test that runs the runtime in this
 * process's own global leaves them for every later file: a host-backed
 * localStorage with no host behind it, whose writes vanish, failed the store
 * persistence and useStorage suites in CI's file order.
 */
export const NATIVE_RUNTIME_GLOBALS = ['craft', 'localStorage', 'sessionStorage'] as const

/** Put `names` back as they were when this was called (or remove them) after each test. */
export function restoreGlobalsAfterEach(names: readonly string[] = NATIVE_RUNTIME_GLOBALS): void {
  const original = new Map(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]))
  afterEach(() => {
    for (const [name, descriptor] of original) {
      if (descriptor)
        Object.defineProperty(globalThis, name, descriptor)
      else
        Reflect.deleteProperty(globalThis, name)
    }
  })
}
