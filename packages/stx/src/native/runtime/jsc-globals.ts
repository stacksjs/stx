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
  /** Set when these are a URL's `searchParams`: a change rewrites its query, as a browser's does. */
  private owner: ((query: string) => void) | null = null

  /** @internal Tie these to a URL (NativeURL `searchParams`). */
  static linked(query: string, owner: (query: string) => void): NativeURLSearchParams {
    const params = new NativeURLSearchParams(query)
    params.owner = owner
    return params
  }

  private changed(): void {
    this.owner?.(this.toString())
  }

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
  append(name: string, value: unknown): void {
    this.list.push([String(name), String(value)])
    this.changed()
  }

  delete(name: string): void {
    this.list = this.list.filter(([key]) => key !== name)
    this.changed()
  }

  get(name: string): string | null { return this.list.find(([key]) => key === name)?.[1] ?? null }
  getAll(name: string): string[] { return this.list.filter(([key]) => key === name).map(([, value]) => value) }
  has(name: string): boolean { return this.list.some(([key]) => key === name) }
  set(name: string, value: unknown): void {
    const at = this.list.findIndex(([key]) => key === name)
    if (at === -1) { this.append(name, value); return }
    this.list[at] = [String(name), String(value)]
    this.list = this.list.filter(([key], index) => key !== name || index === at)
    this.changed()
  }

  sort(): void {
    this.list.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    this.changed()
  }

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

/** Schemes with a host and a default port, which the URL standard treats specially. */
const SPECIAL_SCHEMES: Record<string, string> = { 'http:': '80', 'https:': '443', 'ws:': '80', 'wss:': '443', 'ftp:': '21', 'file:': '' }

/** Percent-encode what a browser would in one part of a URL, leaving existing escapes alone. */
function escapeURLPart(text: string, unsafe: RegExp): string {
  let out = ''
  for (const char of text) {
    // Outside printable ASCII is always escaped, as UTF-8.
    if (char.charCodeAt(0) > 0x7E || char.charCodeAt(0) < 0x21 || unsafe.test(char)) out += encodeURIComponent(char)
    else out += char
  }
  return out
}

/** `.` and `..` segments resolved away, the way a browser normalizes a path. */
function removeDotSegments(path: string): string {
  const segments = path.split('/')
  const out: string[] = []
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!
    const last = i === segments.length - 1
    if (segment === '.' || segment.toLowerCase() === '%2e') {
      if (last) out.push('')
      continue
    }
    if (segment === '..' || /^(?:\.|%2e){2}$/i.test(segment)) {
      if (out.length > 1) out.pop()
      if (last) out.push('')
      continue
    }
    out.push(segment)
  }
  return out.join('/')
}

interface URLParts {
  protocol: string
  username: string
  password: string
  hostname: string
  port: string
  /** Whether there is a `//host` part at all: `mailto:a@b` has none. */
  authority: boolean
  pathname: string
  query: string | null
  fragment: string | null
}

/**
 * `URL`, which JavaScriptCore does not have either: it is a web API.
 * Sign-in code shared with web pages reads and builds addresses with it (an
 * authorize URL's query, the address a sign-in sheet came back to), and on a
 * native screen it threw. Absolute and relative parsing, special schemes and
 * custom ones (`hqtraining://m/login`), and a live `searchParams`, as a
 * browser's. Hostnames are kept as given, lower-cased: no IDNA mapping.
 */
class NativeURL {
  private parts: URLParts
  private params: NativeURLSearchParams | null = null

  constructor(input: string | { href: string }, base?: string | { href: string }) {
    const text = typeof input === 'string' ? input : String(input?.href ?? input)
    const baseParts = base === undefined ? null : NativeURL.parts(typeof base === 'string' ? base : String(base?.href ?? base), null)
    if (base !== undefined && !baseParts) throw new TypeError(`Invalid base URL: ${String(base)}`)
    const parts = NativeURL.parts(text, baseParts)
    if (!parts) throw new TypeError(`Invalid URL: ${text}`)
    this.parts = parts
  }

  static canParse(input: string, base?: string): boolean {
    try {
      void new NativeURL(input, base)
      return true
    }
    catch {
      return false
    }
  }

  static parse(input: string, base?: string): NativeURL | null {
    try { return new NativeURL(input, base) }
    catch { return null }
  }

  private static parts(input: string, base: URLParts | null): URLParts | null {
    const text = String(input).replace(/[\t\n\r]/g, '').trim()
    const scheme = /^([a-z][a-z\d+.-]*):/i.exec(text)
    if (scheme) {
      const protocol = `${scheme[1]!.toLowerCase()}:`
      const rest = text.slice(scheme[0].length)
      // `http:foo` against an http base is relative, as browsers read it.
      if (base && base.protocol === protocol && protocol in SPECIAL_SCHEMES && !/^[/\\]/.test(rest))
        return NativeURL.relative(rest, base)
      return NativeURL.absolute(protocol, rest)
    }
    if (!base) return null
    return NativeURL.relative(text, base)
  }

  private static absolute(protocol: string, rest: string): URLParts | null {
    const special = protocol in SPECIAL_SCHEMES
    const parts: URLParts = { protocol, username: '', password: '', hostname: '', port: '', authority: false, pathname: '', query: null, fragment: null }
    let remaining = rest
    const hashAt = remaining.indexOf('#')
    if (hashAt !== -1) {
      parts.fragment = remaining.slice(hashAt + 1)
      remaining = remaining.slice(0, hashAt)
    }
    const queryAt = remaining.indexOf('?')
    if (queryAt !== -1) {
      parts.query = remaining.slice(queryAt + 1)
      remaining = remaining.slice(0, queryAt)
    }
    if (special || remaining.startsWith('//')) {
      parts.authority = true
      // `file:///x` has an empty host: only its two slashes open the authority.
      remaining = parts.protocol === 'file:' ? remaining.replace(/^[/\\]{2}/, '') : special ? remaining.replace(/^[/\\]*/, '') : remaining.slice(2)
      const end = remaining.search(special ? /[/\\]/ : /\//)
      const authority = end === -1 ? remaining : remaining.slice(0, end)
      remaining = end === -1 ? '' : remaining.slice(end)
      if (!NativeURL.authority(parts, authority, special)) return null
    }
    parts.pathname = NativeURL.path(remaining, parts)
    return NativeURL.finish(parts)
  }

  /** `user:pass@host:port`, into its parts. */
  private static authority(parts: URLParts, authority: string, special: boolean): boolean {
    const at = authority.lastIndexOf('@')
    if (at !== -1) {
      const info = authority.slice(0, at)
      const colon = info.indexOf(':')
      parts.username = escapeURLPart(colon === -1 ? info : info.slice(0, colon), /[ "#<>?`{}/:;=@[\\\]^|]/)
      parts.password = colon === -1 ? '' : escapeURLPart(info.slice(colon + 1), /[ "#<>?`{}/:;=@[\\\]^|]/)
    }
    const host = at === -1 ? authority : authority.slice(at + 1)
    const portAt = host.startsWith('[') ? host.indexOf(':', host.indexOf(']')) : host.lastIndexOf(':')
    const hostname = portAt === -1 ? host : host.slice(0, portAt)
    const port = portAt === -1 ? '' : host.slice(portAt + 1)
    if (port && (!/^\d+$/.test(port) || Number(port) > 65535)) return false
    if (/[\s#%/:<>?@[\\\]^|]/.test(hostname.replace(/^\[[\da-f:.]+\]$/i, ''))) return false
    if (special && parts.protocol !== 'file:' && !hostname) return false
    parts.hostname = special ? hostname.toLowerCase() : hostname
    parts.port = port === '' ? '' : String(Number(port))
    if (parts.port === SPECIAL_SCHEMES[parts.protocol]) parts.port = ''
    return true
  }

  private static path(path: string, parts: URLParts): string {
    const special = parts.protocol in SPECIAL_SCHEMES
    let out = special ? path.replace(/\\/g, '/') : path
    // A path with no host is opaque (`mailto:a@b`): kept as written.
    if (!parts.authority && !out.startsWith('/')) return escapeURLPart(out, /[ "<>`]/)
    if (special && !out.startsWith('/')) out = `/${out}`
    return escapeURLPart(removeDotSegments(out), /[ "#<>?`{}]/)
  }

  private static finish(parts: URLParts): URLParts {
    const special = parts.protocol in SPECIAL_SCHEMES
    if (parts.query !== null) parts.query = escapeURLPart(parts.query, special ? /[ "#<>']/ : /[ "#<>]/)
    if (parts.fragment !== null) parts.fragment = escapeURLPart(parts.fragment, /[ "<>`]/)
    return parts
  }

  private static relative(input: string, base: URLParts): URLParts | null {
    const special = base.protocol in SPECIAL_SCHEMES
    // An opaque base (`mailto:`) only takes a fragment.
    if (!base.authority && !base.pathname.startsWith('/')) {
      if (!input.startsWith('#')) return null
      return { ...base, fragment: escapeURLPart(input.slice(1), /[ "<>`]/) }
    }
    if (special ? /^[/\\]{2}/.test(input) : input.startsWith('//'))
      return NativeURL.absolute(base.protocol, input)
    const parts: URLParts = { ...base, query: base.query, fragment: null }
    let remaining = input
    const hashAt = remaining.indexOf('#')
    if (hashAt !== -1) {
      parts.fragment = remaining.slice(hashAt + 1)
      remaining = remaining.slice(0, hashAt)
    }
    const queryAt = remaining.indexOf('?')
    if (queryAt !== -1) {
      parts.query = remaining.slice(queryAt + 1)
      remaining = remaining.slice(0, queryAt)
    }
    else if (remaining) {
      parts.query = null
    }
    if (remaining) {
      const absolutePath = special ? /^[/\\]/.test(remaining) : remaining.startsWith('/')
      const directory = base.pathname.slice(0, base.pathname.lastIndexOf('/') + 1) || '/'
      parts.pathname = NativeURL.path(absolutePath ? remaining : directory + remaining, parts)
    }
    return NativeURL.finish(parts)
  }

  get protocol(): string { return this.parts.protocol }
  get username(): string { return this.parts.username }
  set username(value: string) { this.parts.username = escapeURLPart(String(value), /[ "#<>?`{}/:;=@[\\\]^|]/) }
  get password(): string { return this.parts.password }
  set password(value: string) { this.parts.password = escapeURLPart(String(value), /[ "#<>?`{}/:;=@[\\\]^|]/) }
  get hostname(): string { return this.parts.hostname }
  set hostname(value: string) {
    const special = this.parts.protocol in SPECIAL_SCHEMES
    const next = String(value)
    if (/[\s#%/:<>?@[\\\]^|]/.test(next) || (special && !next)) return
    this.parts.hostname = special ? next.toLowerCase() : next
  }

  get port(): string { return this.parts.port }
  set port(value: string | number) {
    const digits = /^\d*/.exec(String(value))![0]
    if (digits === '') { if (String(value) === '') this.parts.port = ''; return }
    if (Number(digits) > 65535) return
    const port = String(Number(digits))
    this.parts.port = port === SPECIAL_SCHEMES[this.parts.protocol] ? '' : port
  }

  get host(): string { return this.parts.port ? `${this.parts.hostname}:${this.parts.port}` : this.parts.hostname }
  set host(value: string) {
    const parts = { ...this.parts }
    if (NativeURL.authority(parts, String(value), this.parts.protocol in SPECIAL_SCHEMES)) {
      this.parts.hostname = parts.hostname
      this.parts.port = parts.port
    }
  }

  get origin(): string {
    const { protocol } = this.parts
    return protocol in SPECIAL_SCHEMES && protocol !== 'file:' ? `${protocol}//${this.host}` : 'null'
  }

  get pathname(): string { return this.parts.pathname }
  set pathname(value: string) {
    if (!this.parts.authority && !this.parts.pathname.startsWith('/')) return
    this.parts.pathname = NativeURL.path(String(value), this.parts)
  }

  get search(): string { return this.parts.query ? `?${this.parts.query}` : '' }
  set search(value: string) {
    const next = String(value).replace(/^\?/, '')
    this.parts.query = next === '' ? null : NativeURL.finish({ ...this.parts, query: next, fragment: null }).query
    this.params = null
  }

  get searchParams(): NativeURLSearchParams {
    this.params ??= NativeURLSearchParams.linked(this.parts.query ?? '', (query) => {
      this.parts.query = query === '' ? null : query
    })
    return this.params
  }

  get hash(): string { return this.parts.fragment ? `#${this.parts.fragment}` : '' }
  set hash(value: string) {
    const next = String(value).replace(/^#/, '')
    this.parts.fragment = next === '' ? null : escapeURLPart(next, /[ "<>`]/)
  }

  get href(): string {
    const { protocol, username, password, authority, pathname, query, fragment } = this.parts
    const credentials = username || password ? `${username}${password ? `:${password}` : ''}@` : ''
    return `${protocol}${authority ? `//${credentials}${this.host}` : ''}${pathname}${query === null ? '' : `?${query}`}${fragment === null ? '' : `#${fragment}`}`
  }

  set href(value: string) {
    const parts = NativeURL.parts(String(value), null)
    if (!parts) throw new TypeError(`Invalid URL: ${String(value)}`)
    this.parts = parts
    this.params = null
  }

  toString(): string { return this.href }
  toJSON(): string { return this.href }
}

export { NativeURL }

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** A browser throws a DOMException named InvalidCharacterError: a plain Error with that name here. */
function invalidCharacter(message: string): Error {
  const error = new Error(message)
  error.name = 'InvalidCharacterError'
  return error
}

/**
 * `btoa`, which JavaScriptCore does not have: it is a web API. Code shared
 * with web pages (a session handoff, base64url) encodes with it. Latin-1 in,
 * as a browser's: anything above U+00FF throws.
 */
function nativeBtoa(input: unknown): string {
  const text = String(input)
  let out = ''
  for (let i = 0; i < text.length; i += 3) {
    const a = text.charCodeAt(i)
    const b = i + 1 < text.length ? text.charCodeAt(i + 1) : -1
    const c = i + 2 < text.length ? text.charCodeAt(i + 2) : -1
    if (a > 0xFF || b > 0xFF || c > 0xFF) throw invalidCharacter('btoa: the string has characters outside Latin-1')
    out += BASE64[a >> 2]!
    out += BASE64[((a & 3) << 4) | (b === -1 ? 0 : b >> 4)]!
    out += b === -1 ? '=' : BASE64[((b & 15) << 2) | (c === -1 ? 0 : c >> 6)]!
    out += c === -1 ? '=' : BASE64[c & 63]!
  }
  return out
}

/** `atob`, the other way, with a browser's forgiveness: whitespace ignored, padding optional. */
function nativeAtob(input: unknown): string {
  let text = String(input).replace(/[\t\n\f\r ]/g, '')
  if (text.length % 4 === 0) text = text.replace(/={1,2}$/, '')
  if (text.length % 4 === 1 || /[^A-Z\d+/]/i.test(text)) throw invalidCharacter('atob: the string is not correctly encoded')
  let out = ''
  let buffer = 0
  let bits = 0
  for (const char of text) {
    buffer = (buffer << 6) | BASE64.indexOf(char)
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out += String.fromCharCode((buffer >> bits) & 0xFF)
    }
  }
  return out
}

export { nativeAtob, nativeBtoa }

/** The error an aborted `fetch` rejects with, named as the web names it. */
export function abortError(reason?: unknown): Error {
  if (reason instanceof Error) return reason
  const error = new Error(typeof reason === 'string' ? reason : 'The operation was aborted.')
  error.name = 'AbortError'
  return error
}

/**
 * `AbortController` and `AbortSignal`, which are DOM APIs JavaScriptCore does
 * not have. Code shared with the page cancels its requests with them (a
 * broadcast stream closing), and `fetch` on a native screen honours them.
 */
class NativeAbortSignal {
  aborted = false
  reason: unknown = undefined
  onabort: ((event: unknown) => void) | null = null
  private listeners = new Set<(event: unknown) => void>()

  static abort(reason?: unknown): NativeAbortSignal {
    const signal = new NativeAbortSignal()
    signal.abortWith(reason)
    return signal
  }

  static timeout(milliseconds: number): NativeAbortSignal {
    const signal = new NativeAbortSignal()
    const error = new Error('The operation timed out.')
    error.name = 'TimeoutError'
    ;(globalThis as AnyRecord).setTimeout(() => signal.abortWith(error), milliseconds)
    return signal
  }

  addEventListener(type: string, listener: (event: unknown) => void): void {
    if (type === 'abort' && typeof listener === 'function') this.listeners.add(listener)
  }

  removeEventListener(type: string, listener: (event: unknown) => void): void {
    if (type === 'abort') this.listeners.delete(listener)
  }

  throwIfAborted(): void {
    if (this.aborted) throw this.reason
  }

  /** @internal */
  abortWith(reason?: unknown): void {
    if (this.aborted) return
    this.aborted = true
    this.reason = abortError(reason)
    const event = new NativeEvent('abort')
    event.target = this
    this.onabort?.(event)
    for (const listener of [...this.listeners]) listener(event)
    this.listeners.clear()
  }
}

class NativeAbortController {
  readonly signal = new NativeAbortSignal()

  abort(reason?: unknown): void {
    this.signal.abortWith(reason)
  }
}

export { NativeAbortController, NativeAbortSignal }

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
  target.URL ??= NativeURL
  target.atob ??= nativeAtob
  target.btoa ??= nativeBtoa
  target.TextEncoder ??= NativeTextEncoder
  target.TextDecoder ??= NativeTextDecoder
  target.AbortController ??= NativeAbortController
  target.AbortSignal ??= NativeAbortSignal
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
