type AnyRecord = Record<string, any> // eslint-disable-line ts/no-explicit-any

class NativeEvent {
  type: string
  detail: unknown
  target: unknown = null
  key = ''
  ctrlKey = false
  altKey = false
  shiftKey = false
  metaKey = false

  constructor(type: string, options: { detail?: unknown } = {}) {
    this.type = type
    this.detail = options.detail
  }

  preventDefault(): void {}
  stopPropagation(): void {}
}

/** Install only the browser-shaped globals the shared runtime needs to boot in JSC. */
export function installJSCGlobals(target: AnyRecord = globalThis as AnyRecord): void {
  const listeners = new Map<string, Set<(event: unknown) => void>>()
  const addEventListener = (name: string, listener: (event: unknown) => void): void => {
    const group = listeners.get(name) ?? new Set()
    group.add(listener)
    listeners.set(name, group)
  }
  const removeEventListener = (name: string, listener: (event: unknown) => void): void => {
    listeners.get(name)?.delete(listener)
  }
  const dispatchEvent = (event: { type: string }): boolean => {
    for (const listener of listeners.get(event.type) ?? []) listener(event)
    return true
  }
  const emptyList: unknown[] = []
  const documentElement = { setAttribute() {}, removeAttribute() {}, getAttribute() { return null } }
  const head = { appendChild() {} }

  target.window = target
  target.Node ??= { ELEMENT_NODE: 1, TEXT_NODE: 3, COMMENT_NODE: 8 }
  target.Event ??= NativeEvent
  target.CustomEvent ??= NativeEvent
  target.addEventListener ??= addEventListener
  target.removeEventListener ??= removeEventListener
  target.dispatchEvent ??= dispatchEvent
  target.performance ??= { now: () => Date.now() }
  target.queueMicrotask ??= (callback: () => void) => Promise.resolve().then(callback)
  target.requestAnimationFrame ??= (callback: (time: number) => void) => target.setTimeout(() => callback(Date.now()), 0)
  target.cancelAnimationFrame ??= (id: unknown) => target.clearTimeout(id)
  target.location ??= { href: '', pathname: '/', search: '', hash: '' }
  target.history ??= { back() {}, forward() {}, pushState() {}, replaceState() {} }
  target.navigator ??= { language: 'en' }
  target.document ??= {
    body: null,
    head,
    hidden: false,
    documentElement,
    addEventListener,
    removeEventListener,
    dispatchEvent,
    querySelectorAll: () => emptyList,
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({
      setAttribute() {},
      removeAttribute() {},
      appendChild() {},
      style: {},
      textContent: '',
    }),
  }
}
