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

/**
 * `URLSearchParams`, which JavaScriptCore does not have: it is a web API, not
 * a language one. Helpers shared with web pages build query strings with it,
 * and on a native screen they threw. The form encoding a browser uses:
 * spaces as `+`, everything else outside the unreserved set percent-encoded.
 */
class NativeURLSearchParams {
  private list: Array<[string, string]> = []

  constructor(init?: string | Record<string, unknown> | Iterable<[unknown, unknown]> | NativeURLSearchParams) {
    if (init == null) return
    if (typeof init === 'string') {
      for (const part of init.replace(/^\?/, '').split('&')) {
        if (!part) continue
        const at = part.indexOf('=')
        const name = at === -1 ? part : part.slice(0, at)
        const value = at === -1 ? '' : part.slice(at + 1)
        this.list.push([NativeURLSearchParams.decode(name), NativeURLSearchParams.decode(value)])
      }
      return
    }
    if (typeof (init as any)[Symbol.iterator] === 'function') {
      for (const pair of init as Iterable<[unknown, unknown]>) this.list.push([String(pair[0]), String(pair[1])])
      return
    }
    for (const [name, value] of Object.entries(init)) this.list.push([name, String(value)])
  }

  private static decode(text: string): string {
    try { return decodeURIComponent(text.replace(/\+/g, ' ')) }
    catch { return text }
  }

  private static encode(text: string): string {
    return encodeURIComponent(text).replace(/[!'()~]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase()}`).replace(/%20/g, '+')
  }

  get size(): number { return this.list.length }
  append(name: string, value: unknown): void { this.list.push([String(name), String(value)]) }
  delete(name: string): void { this.list = this.list.filter(([key]) => key !== name) }
  get(name: string): string | null { return this.list.find(([key]) => key === name)?.[1] ?? null }
  getAll(name: string): string[] { return this.list.filter(([key]) => key === name).map(([, value]) => value) }
  has(name: string): boolean { return this.list.some(([key]) => key === name) }
  set(name: string, value: unknown): void {
    const at = this.list.findIndex(([key]) => key === name)
    if (at === -1) { this.append(name, value); return }
    this.list[at] = [String(name), String(value)]
    this.list = this.list.filter(([key], index) => key !== name || index === at)
  }
  sort(): void { this.list.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)) }
  forEach(callback: (value: string, name: string, params: NativeURLSearchParams) => void): void {
    for (const [name, value] of [...this.list]) callback(value, name, this)
  }
  entries(): IterableIterator<[string, string]> { return this.list.map(([name, value]) => [name, value] as [string, string])[Symbol.iterator]() }
  keys(): IterableIterator<string> { return this.list.map(([name]) => name)[Symbol.iterator]() }
  values(): IterableIterator<string> { return this.list.map(([, value]) => value)[Symbol.iterator]() }
  [Symbol.iterator](): IterableIterator<[string, string]> { return this.entries() }
  toString(): string {
    return this.list.map(([name, value]) => `${NativeURLSearchParams.encode(name)}=${NativeURLSearchParams.encode(value)}`).join('&')
  }
}

export { NativeURLSearchParams }

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
  target.URLSearchParams ??= NativeURLSearchParams
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
