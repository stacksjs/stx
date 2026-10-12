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
 * `TextEncoder` and `TextDecoder`, which JavaScriptCore does not have either:
 * they are web APIs. UTF-8 only, which is all the web's TextEncoder speaks
 * and what code shared with a page (hashing a nonce) hands them.
 */
class NativeTextEncoder {
  readonly encoding = 'utf-8'

  encode(input = ''): Uint8Array {
    const bytes: number[] = []
    const text = String(input)
    for (let i = 0; i < text.length; i++) {
      let code = text.charCodeAt(i)
      // A surrogate pair is one code point; a lone surrogate is U+FFFD.
      if (code >= 0xD800 && code <= 0xDBFF && i + 1 < text.length) {
        const low = text.charCodeAt(i + 1)
        if (low >= 0xDC00 && low <= 0xDFFF) {
          code = 0x10000 + ((code - 0xD800) << 10) + (low - 0xDC00)
          i++
        }
        else {
          code = 0xFFFD
        }
      }
      else if (code >= 0xD800 && code <= 0xDFFF) {
        code = 0xFFFD
      }
      if (code < 0x80) bytes.push(code)
      else if (code < 0x800) bytes.push(0xC0 | (code >> 6), 0x80 | (code & 63))
      else if (code < 0x10000) bytes.push(0xE0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63))
      else bytes.push(0xF0 | (code >> 18), 0x80 | ((code >> 12) & 63), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63))
    }
    return new Uint8Array(bytes)
  }
}

class NativeTextDecoder {
  readonly encoding = 'utf-8'

  decode(input?: ArrayBuffer | ArrayBufferView): string {
    if (!input) return ''
    const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    let out = ''
    for (let i = 0; i < bytes.length;) {
      const first = bytes[i]!
      const need = first < 0x80 ? 0 : first >= 0xF0 ? 3 : first >= 0xE0 ? 2 : first >= 0xC0 ? 1 : -1
      if (need < 0 || i + need >= bytes.length) {
        out += '\uFFFD'
        i++
        continue
      }
      let code = need === 0 ? first : first & (0x3F >> need)
      let valid = true
      for (let k = 1; k <= need; k++) {
        const next = bytes[i + k]
        if (next === undefined || (next & 0xC0) !== 0x80) {
          valid = false
          break
        }
        code = (code << 6) | (next & 0x3F)
      }
      if (!valid) {
        out += '\uFFFD'
        i++
        continue
      }
      out += String.fromCodePoint(code)
      i += need + 1
    }
    return out
  }
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
  target.TextEncoder ??= NativeTextEncoder
  target.TextDecoder ??= NativeTextDecoder
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
