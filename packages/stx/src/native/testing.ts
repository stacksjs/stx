/**
 * `@stacksjs/stx/native/testing`: a phone for native screens, in a vm.
 *
 * A compiled native bundle (`compileNativeBundle`, `compileNativeScreen`) runs
 * against a fake `craft` and a fake host that applies the mutation protocol
 * the way Craft's Swift host does, so a test reads the tree the phone would
 * draw, presses what a person would press, and sees what the screen asked of
 * the network and the host.
 *
 * @example
 * ```ts
 * import { compileNativeScreen, mountNativeScreen, status } from '@stacksjs/stx/native/testing'
 *
 * const { code } = await compileNativeBundle({ root, screens: { Today: 'screens/Today.stx' } })
 * const phone = mountNativeScreen(code, 'Today', {
 *   apiBase: 'https://fixture.invalid/api',
 *   api: path => path === '/today' ? { sessions: [] } : status(404),
 *   secureStorage: { 'auth.token': 'fixture-token' },
 * })
 * await phone.settle()
 * expect(phone.texts()).toContain('Nothing planned')
 * phone.press(phone.byTestID('refresh')!)
 * await phone.waitFor(() => phone.requests.length === 2, 'the refresh')
 * ```
 *
 * A screen ends when its test does (or at `unmount()`), as it does on a phone:
 * its own unmount runs, then no timer fires, every request fails as with no
 * network, every stream closes and no message reaches it. A screen left
 * running in its vm kept retrying (an outbox flushing, intervals ticking) into
 * whichever test came next.
 *
 * Nothing here is any one app's: seed what the screen expects to find (header
 * snapshots, a signed-in token) through `snapshots`, `secureStorage` and
 * `storage`.
 */
import path from 'node:path'
import vm from 'node:vm'
import { compileSharedScreenBundle } from './compiler/bundle'
import { NativeFormData } from './runtime/jsc-globals'
import { type TestMutationError, validateTestMutations } from './testing-mutations'
import { createTempDir } from '../temp-dir'

export interface NativeNode {
  id: string
  type: string
  props: Record<string, any>
  style: Record<string, any>
  events: Record<string, string>
  children: Array<NativeNode | string>
  key?: string
}

export interface NativeOperation { op: string, id: string, parentId?: string, childId?: string, index?: number, node?: NativeNode, patch?: Partial<NativeNode> }
export interface NativeMessage { id: string, type: string, payload: { document?: NativeNode, operations?: NativeOperation[], handlerId?: string } & Record<string, unknown> }

/** An API answer other than 200, for `api` to return: `status(403, { error })`. */
export class StatusAnswer {
  constructor(readonly status: number, readonly body: unknown = {}) {}
}

/** An API answer with this status and body. */
export const status = (code: number, body?: unknown): StatusAnswer => new StatusAnswer(code, body)

/** Wait for `check` to hold, polling every 5ms; throws after `timeoutMs`. */
export async function waitFor(check: () => boolean, description: string, timeoutMs = 5000): Promise<void> {
  const started = performance.now()
  while (!check()) {
    if (performance.now() - started >= timeoutMs)
      throw new Error(`Timed out waiting for ${description}`)
    await Bun.sleep(5)
  }
}

/**
 * Compile one screen from its source, as the single-screen native compiler
 * does: for a test that writes the template inline.
 */
export async function compileNativeScreen(source: string, options: { name?: string, minify?: boolean } = {}): Promise<{ code: string, diagnostics: Array<{ message: string }> }> {
  const root = createTempDir('stx-native-testing-')
  const file = path.join(root, `${options.name || 'Screen'}.stx`)
  await Bun.write(file, source)
  const result = await compileSharedScreenBundle(file, { root, minify: options.minify })
  return { code: result.code, diagnostics: result.diagnostics }
}

/**
 * A response the screen reads as it arrives (`Accept: text/event-stream`), as
 * Craft's host streams one (`eventStream`): the test writes what the server
 * would, and sees whether the screen still reads it.
 */
export interface OpenStream {
  path: string
  /** Until the screen cancels it (or aborts its request), or the server ends it. */
  open: boolean
  /** Text as the server writes it: `data: {...}\n\n`. */
  write: (text: string) => void
  /** The server closing it. */
  end: () => void
}

export interface NativeScreenOptions {
  /** How the app was launched: 'background' for a background refresh or a silent push. */
  initialAppState?: 'active' | 'background'
  /**
   * Where the API is. A request under it is answered (and recorded) by its
   * path below it (`/today?d=1`); without it, by the whole URL.
   */
  apiBase?: string
  /**
   * The API's answer for a path (with its query), or undefined for a 404. A
   * `StatusAnswer` (`status(403, body)`) is another status. A promise is an
   * answer still on its way (a slow network); the request's `signal` gives up
   * on it, as Craft's fetch does.
   */
  api?: (path: string, init: { method?: string, body?: any, headers?: Record<string, string>, signal?: AbortSignal }) => unknown
  /** How a request is recorded in `requests`. Default `GET /path`, with ` (guest)` when it sent no Authorization header. */
  requestLabel?: (method: string, path: string, init: { headers?: Record<string, string> }) => string
  /** Snapshots the screen finds, by name (`craft.snapshots`). */
  snapshots?: Record<string, unknown>
  /** A disk write can fail after an API save has already succeeded. */
  snapshotWrite?: (name: string, value: unknown) => Promise<unknown>
  /** The phone's sheets (`craft.dialog`); `alert` is always recorded in `alerts`. */
  dialog?: { actionSheet?: (options: any) => Promise<string>, confirm?: (options: any) => Promise<boolean> }
  colorScheme?: 'light' | 'dark'
  /** The params the screen was opened with (`craft.route.params`). */
  params?: Record<string, unknown>
  /** What the app reports it can do (`health`, `haptics`, ...), as Craft's host does. */
  capabilities?: string[]
  capabilityTimeoutMs?: number
  /** The phone: an iPhone (the default) or Android, as Craft's host says (`craft.platform`). */
  platform?: 'ios' | 'android' | 'web'
  /**
   * The host's answer to a capability request (`Health`, `getWorkouts`,
   * args): data, or a thrown `{ code, message }` for an API_ERROR. Null when
   * unset. `SecureStorage.set/remove` and `Storage.set/remove` also update
   * `secureStorage` / `stored` unless this answers `false`.
   */
  native?: (module: string, method: string, args: unknown[]) => unknown
  /**
   * The photo picker and its temporary files (`craft.files`). Give it the
   * file `pickImage` should answer with, or `null` for a picker the person
   * cancels. Absent by default, so a screen that offers a picture only when
   * the host can pick one is tested both ways.
   */
  files?: { pickImage: { path: string, name: string, type: string, size: number } | null }
  /** The keychain (`craft.secureStorage`), by key: a sign-in token, a page's shared values. */
  secureStorage?: Record<string, string>
  /**
   * The keychain key the signed-in token lives under (Craft's
   * `sessionTokenKey`, `auth.token` by default). Changing it through
   * `SecureStorage.set/remove` or `setSessionToken` sends `SESSION_CHANGED`
   * (`craft.session.onChange`), as Craft 0.0.245 does.
   */
  sessionTokenKey?: string
  /** False for a host older than Craft 0.0.245, which never sends `SESSION_CHANGED`. */
  sessionEvents?: boolean
  /** Same as `secureStorage`. */
  keychain?: Record<string, string>
  /** What Craft's app storage (`craft.storage`) holds already, by key. */
  storage?: Record<string, unknown>
  /** Observe synchronous host reads, for checks that rendering avoids unnecessary bridge work. */
  onHostRead?: (namespace: 'secureStorage' | 'storage' | 'snapshots', key: string) => void
  /** Airplane mode while it answers true: every request fails as Craft's fetch does with no network. See also `setOnline`. */
  offline?: () => boolean
  /** The answer to a request for a server-sent event stream when it is not the stream (a refusal); undefined opens it. */
  stream?: (path: string) => StatusAnswer | undefined
  /**
   * Globals the host puts in the screen's context besides the kit's own:
   * a fake `AudioContext` (Craft's host installs Web Audio), or a
   * `performance` whose clock the test moves.
   */
  globals?: Record<string, unknown>
  /** Members of the fake `craft` to add or replace (before stx installs its bridge over it). */
  craft?: Record<string, unknown>
  /** The app's site, as Craft hands it to every context (`craft.app.url`). */
  appURL?: string
  appVersion?: string
  appBuild?: string
}

/**
 * Screens still running. When a test ends, each is ended as `unmount` ends
 * it (see the module comment).
 */
const running = new Set<() => void>()

/** End every screen still running. Registered after each test when run under `bun test`. */
export function unmountAllNativeScreens(): void {
  for (const end of [...running]) end()
}

try {
  // Imported lazily so the module loads outside a test runner too.
  // eslint-disable-next-line ts/no-require-imports
  const { afterEach } = require('bun:test') as typeof import('bun:test')
  afterEach(unmountAllNativeScreens)
}
catch {}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** A mounted native screen: what `mountNativeScreen` returns. */
export interface NativeScreen {
  /** Every node on screen, by id. */
  nodes: Map<string, NativeNode>
  /** Every message the screen sent the host (RENDER, MUTATE, API_REQUEST, ...), parsed. */
  messages: NativeMessage[]
  /** Rejected topology batches; settle() fails even if runtime recovery redraws the screen. */
  mutationErrors: TestMutationError[]
  /** Every request, as `requestLabel` writes it (`GET /today`). */
  requests: string[]
  /** The headers each request was sent with, in order. */
  headers: Array<Record<string, string>>
  /** Screens opened (`navigation.open`, NAVIGATE_OPEN, NAVIGATE_REPLACE). */
  opened: string[]
  /** Screens this one was replaced with. */
  replaced: string[]
  /** Back one screen ('back') or to the first of the stack ('root'), as asked of the host. */
  moves: Array<'back' | 'root'>
  /** Craft's app storage, by key. */
  stored: Record<string, unknown>
  /** The keychain, by key. */
  secureStorage: Record<string, string>
  /** Every navigation-bar setting (`navigation.setOptions`), in order. */
  bars: any[]
  /** The snapshots, by name. */
  snapshots: Record<string, unknown>
  /** Every capability request, as `Module.method`. */
  natives: string[]
  streams: OpenStream[]
  /** What `craft.animation.next` asked of the host, in order. */
  animations: Array<Record<string, unknown>>
  /** Every explanation raised in the phone's own alert (`craft.dialog.alert`). */
  alerts: any[]
  /** What `files.pickImage` was asked. */
  picks: any[]
  /** The files the screen removed. */
  removed: Array<string | null>
  /** The vm the screen runs in, for a global the test reads or sets. */
  context: vm.Context
  all: () => NativeNode[]
  find: (predicate: (node: NativeNode) => boolean) => NativeNode | undefined
  /** The node with this `testID`. */
  byTestID: (id: string) => NativeNode | undefined
  ofType: (type: string) => NativeNode[]
  /** Every text on screen, in no particular order. */
  texts: () => string[]
  /** Tap a node (or send it another event, with what the host would say about it). */
  press: (node: NativeNode, event?: string, nativeEvent?: Record<string, unknown>) => void
  /** Type into a text input: its `onChangeText` with the whole new text. */
  type: (node: NativeNode, text: string) => void
  /** The ids the navigation bar is currently offering on the right. */
  barButtons: () => string[]
  /** Tap a button in the navigation bar, by id, as the host does. */
  tapBar: (id: string) => void
  /** The app going to the background (`background`) or coming back (`active`), as the host says. */
  appState: (state: 'active' | 'background' | 'inactive') => void
  /** The app sent to the background. */
  background: () => void
  /** The app back in the foreground. */
  resume: () => void
  appearance: (scheme: 'light' | 'dark') => void
  /** The screen shown again, as the host says when what was over it was popped or its tab chosen again. */
  appear: () => void
  /** The screen covered by another, or its tab left. */
  disappear: () => void
  /** The screen's path opened again with other params (a link to a screen already in the stack). */
  newParams: (params: Record<string, unknown>) => void
  /** An event the page's side sends every screen (`craftLocationUpdate`, `craftPushToken`, ...). */
  craftEvent: (event: string, detail?: unknown) => void
  /** Another context keeping a snapshot (`null` removes it; nothing just says it changed), reaching the screen. */
  /** Another context signing in, out (null) or as someone else: the keychain's token changes and the screen hears `SESSION_CHANGED`. */
  setSessionToken: (token: string | null) => void
  keepSnapshot: (name: string, value?: unknown) => void
  /** Airplane mode off (true) or on (false): while off, every request fails as with no network. */
  setOnline: (online: boolean) => void
  /** A message from the host, as Craft sends one (`{ type, payload }`). */
  send: (type: string, payload?: Record<string, unknown>) => void
  /** Wait for this screen's outcome, stopping if the screen has ended. */
  waitFor: (check: () => boolean, description: string, timeoutMs?: number) => Promise<void>
  /**
   * Let the screen catch up: `ms`, then for as long as a request is still out
   * or was answered less than `ms` ago, since a screen that loads in steps
   * asks again once the first answer lands. Capped at 5s.
   */
  settle: (ms?: number) => Promise<void>
  /** Every operation of the MUTATE batches sent so far, in order. */
  operations: () => NativeOperation[]
  /** Whether the screen has ended. */
  readonly ended: boolean
  /** End the screen: its own unmount runs, then it sends and hears nothing more. */
  unmount: () => void
}

/** Mount a compiled native bundle as screen `screen`, on a fake phone. */
export function mountNativeScreen(code: string, screen: string, options: NativeScreenOptions = {}): NativeScreen {
  /** Ended (unmounted, or its test over): no timer fires, no request goes out, no message comes in. */
  let ended = false
  let online = true
  const timeouts = new Set<ReturnType<typeof setTimeout>>()
  const intervals = new Set<ReturnType<typeof setInterval>>()
  const timers = {
    setTimeout: (run: (...args: any[]) => void, ms?: number, ...args: any[]) => {
      if (ended) return 0 as unknown as ReturnType<typeof setTimeout>
      const id = setTimeout((...rest: any[]) => {
        timeouts.delete(id)
        if (!ended) run(...rest)
      }, ms, ...args)
      timeouts.add(id)
      return id
    },
    clearTimeout: (id: ReturnType<typeof setTimeout>) => {
      timeouts.delete(id)
      clearTimeout(id)
    },
    setInterval: (run: (...args: any[]) => void, ms?: number, ...args: any[]) => {
      if (ended) return 0 as unknown as ReturnType<typeof setInterval>
      const id = setInterval((...rest: any[]) => { if (!ended) run(...rest) }, ms, ...args)
      intervals.add(id)
      return id
    },
    clearInterval: (id: ReturnType<typeof setInterval>) => {
      intervals.delete(id)
      clearInterval(id)
    },
  }
  const apiBase = options.apiBase || ''
  const label = options.requestLabel || ((method: string, at: string, init: { headers?: Record<string, string> }) =>
    `${method} ${at}${init.headers && Object.keys(init.headers).some(name => name.toLowerCase() === 'authorization') ? '' : ' (guest)'}`)
  const nodes = new Map<string, NativeNode>()
  /** Every message the screen sent the host (RENDER, MUTATE, API_REQUEST, ...), parsed. */
  const messages: NativeMessage[] = []
  const mutationErrors: TestMutationError[] = []
  /** Every request, as `requestLabel` writes it. */
  const requests: string[] = []
  /** The headers each request was sent with, in order. */
  const headers: Array<Record<string, string>> = []
  /** Screens opened (`navigation.open`, NAVIGATE_OPEN, NAVIGATE_REPLACE). */
  const opened: string[] = []
  /** Screens this one was replaced with. */
  const replaced: string[] = []
  /** Back one screen ('back') or to the first of the stack ('root'), as asked of the host. */
  const moves: Array<'back' | 'root'> = []
  /** Craft's app storage, by key. */
  const stored: Record<string, unknown> = copy(options.storage ?? {})
  /** Every capability request, as `Module.method`. */
  const natives: string[] = []
  /** What `craft.animation.next` asked of the host, in order. */
  const animations: Array<Record<string, unknown>> = []
  const streams: OpenStream[] = []
  /** The keychain, by key. */
  const secureStorage: Record<string, string> = { ...options.keychain, ...options.secureStorage }
  const sessionTokenKey = options.sessionTokenKey ?? 'auth.token'
  /** After a keychain write: the account change Craft reports, once per change of the token. */
  const sessionWritten = (key: string, previous: string | undefined) => {
    if (key !== sessionTokenKey || options.sessionEvents === false) return
    const token = secureStorage[key] || null
    if (token !== (previous || null)) send('SESSION_CHANGED', { key, token, previous: previous || null })
  }
  /** Every navigation-bar setting (`navigation.setOptions`), in order. */
  const bars: any[] = []
  /** Every explanation raised in the phone's own alert (`craft.dialog.alert`). */
  const alerts: any[] = []
  /** What `files.pickImage` was asked, and which files were removed. */
  const picks: any[] = []
  const removed: Array<string | null> = []
  const snapshots: Record<string, unknown> = { ...options.snapshots }
  let receive: (raw: string) => void = () => {}
  const visit = (node: NativeNode) => {
    nodes.set(node.id, node)
    for (const child of node.children || []) if (typeof child !== 'string') visit(child)
  }
  const openStream = (at: string, signal?: { addEventListener?: (type: string, listener: () => void) => void }) => {
    const queue: string[] = []
    const waiting: Array<(result: { done: boolean, value?: Uint8Array }) => void> = []
    const encode = (text: string) => new TextEncoder().encode(text)
    const stop = () => {
      stream.open = false
      while (waiting.length) waiting.shift()!({ done: true })
    }
    const stream: OpenStream = {
      path: at,
      open: true,
      write: (text) => {
        if (!stream.open) return
        const reader = waiting.shift()
        if (reader) reader({ done: false, value: encode(text) })
        else queue.push(text)
      },
      end: stop,
    }
    streams.push(stream)
    signal?.addEventListener?.('abort', stop)
    const reader = {
      read: () => queue.length
        ? Promise.resolve({ done: false, value: encode(queue.shift()!) })
        : stream.open ? new Promise(resolve => waiting.push(resolve)) : Promise.resolve({ done: true }),
      cancel: async () => stop(),
      releaseLock: () => {},
    }
    return {
      ok: true,
      status: 200,
      headers: { get: (name: string) => name.toLowerCase() === 'content-type' ? 'text/event-stream' : null },
      body: { getReader: () => reader, cancel: async () => stop() },
    }
  }
  /** Requests still waiting for their answer, and when the last was answered (see settle). */
  let fetching = 0
  let answeredAt = 0
  const offlineNow = () => !online || Boolean(options.offline?.())
  const context = vm.createContext({
    // No URLSearchParams or other web APIs: JavaScriptCore has none, and stx
    // installs what a native screen gets (jsc-globals.ts). Craft's host adds
    // the interval timers (CraftNativeScreen.swift).
    console, Promise, Date, Map, Set, WeakMap, WeakSet, ...timers, Intl,
    // A form with file parts is how a picked photo is posted, so the vm phone
    // needs the class the phone gets, not a lookalike.
    FormData: NativeFormData,
    // Craft's host adds crypto too (getRandomValues, randomUUID, subtle.digest).
    crypto: globalThis.crypto,
    ...options.globals,
    __stxNativeRoute: screen,
    __stxNativeParams: options.params ?? {},
    fetch: async (url: string, init: { method?: string, body?: any, headers?: Record<string, string>, signal?: AbortSignal } = {}) => {
      // A screen that has ended has no network: whatever it still sends goes nowhere.
      if (ended) throw Object.assign(new TypeError('The screen has ended.'), { code: 'NETWORK_ERROR' })
      fetching++
      let counted = true
      try {
        await Bun.sleep(2)
        if (ended || offlineNow()) throw Object.assign(new TypeError('The Internet connection appears to be offline.'), { code: 'NETWORK_ERROR' })
        const at = apiBase && String(url).startsWith(apiBase) ? String(url).slice(apiBase.length) : String(url)
        requests.push(label(init.method || 'GET', at, init))
        headers.push(init.headers || {})
        const accepts = Object.entries(init.headers || {}).some(([name, value]) => name.toLowerCase() === 'accept' && /text\/event-stream/i.test(String(value)))
        if (accepts) {
          const refused = options.stream?.(at)
          if (refused) return { ok: refused.status < 300, status: refused.status, headers: { get: () => 'application/json' }, json: async () => refused.body }
          return openStream(at, init.signal as any)
        }
        const given = options.api?.(at, init)
        let answer: unknown = given
        if (given instanceof Promise) {
          // Still on its way, perhaps for good: settle() does not wait on it.
          fetching--
          counted = false
          const signal = init.signal
          answer = await (signal
            ? Promise.race([given, new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('The operation was aborted.'), { name: 'AbortError' }))))])
            : given)
        }
        if (answer === undefined) return { ok: false, status: 404, json: async () => ({}) }
        if (answer instanceof StatusAnswer) return { ok: answer.status < 300, status: answer.status, json: async () => answer.body }
        return { ok: true, status: 200, json: async () => answer }
      }
      finally {
        if (counted) fetching--
        answeredAt = performance.now()
      }
    },
    craft: {
      secureStorage: {
        getSync: (key: string) => {
          options.onHostRead?.('secureStorage', key)
          return secureStorage[key] ?? null
        },
      },
      // Craft's app storage: values kept as JSON, read back parsed.
      storage: {
        getSync: (key: string) => {
          options.onHostRead?.('storage', key)
          return key in stored ? copy(stored[key]) : null
        },
        setSync: (key: string, value: unknown) => {
          if (value === null || value === undefined) delete stored[key]
          else stored[key] = copy(value)
        },
      },
      snapshots: {
        get: (name: string) => {
          options.onHostRead?.('snapshots', name)
          return snapshots[name] ?? null
        },
        // As Craft's files: null deletes one.
        set: async (name: string, value: unknown) => {
          await options.snapshotWrite?.(name, value)
          if (value === null || value === undefined) delete snapshots[name]
          else snapshots[name] = copy(value)
          return true
        },
        // Every snapshot but the ones named.
        clear: async (keep: string[] = []) => {
          for (const name of Object.keys(snapshots)) if (!keep.includes(name)) delete snapshots[name]
          return true
        },
        onChange: () => () => {},
      },
      lifecycle: { onStateChange: () => () => {} },
      ...(options.files
        ? {
            files: {
              pickImage: async (request: any) => {
                picks.push(copy(request ?? {}))
                return options.files!.pickImage
              },
              remove: async (file: any) => {
                removed.push(file?.path ?? null)
                return true
              },
            },
          }
        : {}),
      dialog: {
        ...options.dialog,
        alert: async (alert: any) => {
          alerts.push(copy(alert))
        },
      },
      navigation: {
        setOptions: (value: any) => bars.push(copy(value)),
        open: (where: string) => {
          opened.push(where)
          return ''
        },
        back: () => '',
        push: () => '',
      },
      ...options.craft,
    },
    __stxNativeBridge: {
      platform: options.platform ?? 'ios',
      capabilityTimeoutMs: options.capabilityTimeoutMs ?? 100,
      colorScheme: options.colorScheme ?? 'light',
      capabilities: options.capabilities ?? [],
      initialAppState: options.initialAppState ?? 'active',
      appURL: options.appURL ?? 'https://fixture.invalid/m',
      appVersion: options.appVersion ?? '1.0.0',
      appBuild: options.appBuild ?? '1',
      ...(options.sessionEvents === false ? {} : { sessionTokenKey }),
      postMessage: (raw: string) => {
        const message: NativeMessage = JSON.parse(raw)
        // Its own copy: the tree below is the one the host keeps changing.
        messages.push(JSON.parse(raw))
        if (message.type === 'MUTATE') {
          const error = validateTestMutations(nodes, message.payload.operations || [])
          if (error) {
            mutationErrors.push(error)
            queueMicrotask(() => {
              if (!ended) receive(JSON.stringify({ type: 'MUTATION_ERROR', payload: { ...error, version: 1, batchId: message.payload.batchId } }))
            })
            return
          }
        }
        if (message.payload.document) visit(message.payload.document)
        for (const operation of message.payload.operations || []) {
          if (operation.op === 'removeNode') {
            const drop = (node: NativeNode | undefined) => {
              if (!node) return
              nodes.delete(node.id)
              for (const child of node.children || []) if (typeof child !== 'string') drop(child)
            }
            drop(nodes.get(operation.id))
            for (const parent of nodes.values()) parent.children = parent.children.filter(child => typeof child === 'string' || child.id !== operation.id)
          }
          if (operation.node) visit({ ...operation.node, id: operation.id, events: operation.node.events || {}, children: operation.node.children || [] })
          if (operation.op === 'insertChild' || operation.op === 'moveChild') {
            const child = nodes.get(operation.childId!)
            const parent = nodes.get(operation.parentId!)
            if (child && parent) {
              for (const owner of nodes.values()) owner.children = owner.children.filter(value => typeof value === 'string' || value.id !== child.id)
              parent.children.splice(operation.index ?? parent.children.length, 0, child)
            }
          }
          const node = nodes.get(operation.id)
          if (node && operation.patch) {
            node.style = { ...node.style, ...operation.patch.style }
            node.props = { ...node.props, ...operation.patch.props }
            node.events = { ...node.events, ...operation.patch.events }
            if (operation.patch.children) node.children = operation.patch.children
          }
        }
        // stx's bridge sends navigation as a message, as it does to Craft.
        if (message.type === 'NAVIGATE_OPEN') opened.push(String(message.payload.path))
        if (message.type === 'NAVIGATE_REPLACE') {
          const where = String(message.payload.screen)
          replaced.push(where)
          opened.push(where)
        }
        if (message.type === 'ANIMATE_NEXT') animations.push({ ...message.payload })
        if (message.type === 'NAVIGATE_BACK' || message.type === 'NAVIGATE_POP_TO_ROOT') moves.push(message.type === 'NAVIGATE_BACK' ? 'back' : 'root')
        if (message.type === 'API_REQUEST') {
          const request = message.payload as unknown as { module: string, method: string, args: unknown[] }
          natives.push(`${request.module}.${request.method}`)
          Promise.resolve().then(async () => {
            const answer = await options.native?.(request.module, request.method, request.args)
            if (ended) return null
            if (request.module === 'SecureStorage' && ['set', 'remove'].includes(request.method)) {
              if (answer === false) return false
              const key = String(request.args[0])
              const previous = secureStorage[key]
              if (request.method === 'set') secureStorage[key] = String(request.args[1])
              else delete secureStorage[key]
              sessionWritten(key, previous)
              return true
            }
            if (request.module === 'Storage' && request.method === 'set') {
              if (answer === false) return false
              stored[String(request.args[0])] = copy(request.args[1])
              return true
            }
            if (request.module === 'Storage' && request.method === 'remove') {
              if (answer === false) return false
              delete stored[String(request.args[0])]
              return true
            }
            return answer ?? null
          }).then(
            data => { if (!ended) receive(JSON.stringify({ type: 'API_RESPONSE', correlationId: message.id, payload: { data } })) },
            error => { if (!ended) receive(JSON.stringify({ type: 'API_ERROR', correlationId: message.id, payload: { code: error?.code || 'NATIVE_ERROR', message: error?.message || 'Native request failed' } })) },
          )
        }
      },
      onMessage: (callback: typeof receive) => { receive = (raw: string) => { if (!ended) callback(raw) } },
    },
  })
  vm.runInContext(code, context)

  /**
   * The screen goes: its own unmount runs (what it saves on the way out is
   * kept), then its timers stop and it sends and hears nothing more.
   */
  const end = () => {
    if (ended) return
    running.delete(end)
    try { context.__stxNativeUnmount?.() }
    finally {
      ended = true
      for (const id of timeouts) clearTimeout(id)
      for (const id of intervals) clearInterval(id)
      timeouts.clear()
      intervals.clear()
      streams.forEach(stream => stream.end())
    }
  }
  running.add(end)

  /** A message from the host, as Craft sends one. */
  const send = (type: string, payload: Record<string, unknown> = {}) => receive(JSON.stringify({ type, payload }))
  const all = () => [...nodes.values()]
  const press = (node: NativeNode, event = 'onPress', nativeEvent: Record<string, unknown> = {}) => {
    if (!node) throw new Error(`nothing to ${event}`)
    if (!node.events[event]) throw new Error(`${node.type} has no ${event}`)
    send('EVENT', { handlerId: node.events[event], nativeEvent })
  }
  const appState = (state: 'active' | 'background' | 'inactive') => send('APP_STATE', { state })
  return {
    nodes, messages, mutationErrors, requests, headers, opened, replaced, moves, stored, secureStorage, bars, snapshots, natives, streams, animations, alerts, picks, removed,
    /** The vm the screen runs in, for a global the test reads or sets. */
    context,
    all,
    find: (predicate: (node: NativeNode) => boolean) => all().find(predicate),
    /** The node with this `testID`. */
    byTestID: (id: string) => all().find(node => node.props?.testID === id),
    ofType: (type: string) => all().filter(node => node.type === type),
    /** Every text on screen, in no particular order. */
    texts: () => all().flatMap(node => node.children.filter((child): child is string => typeof child === 'string')),
    /** Tap a node (or send it another event, with what the host would say about it). */
    press,
    /** Type into a text input: its `onChangeText` with the whole new text. */
    type: (node: NativeNode, text: string) => press(node, 'onChangeText', { text }),
    /** The ids the navigation bar is currently offering on the right. */
    barButtons: (): string[] => ((bars.findLast(bar => bar.rightButtons !== undefined)?.rightButtons || []) as { id: string }[]).map(button => button.id),
    /** Tap a button in the navigation bar, by id, as the host does. */
    tapBar: (id: string) => {
      if (!(bars.findLast(bar => bar.rightButtons !== undefined)?.rightButtons || []).some((button: { id: string }) => button.id === id)) throw new Error(`no bar button ${id}`)
      send('NAV_BUTTON', { id })
    },
    /** The app going to the background (`background`) or coming back (`active`), as the host says. */
    appState,
    /** The app sent to the background. */
    background: () => appState('background'),
    /** The app back in the foreground. */
    resume: () => appState('active'),
    appearance: (scheme: 'light' | 'dark') => send('APPEARANCE', { colorScheme: scheme }),
    /** The screen shown again, as the host says when what was over it was popped or its tab chosen again. */
    appear: () => send('SCREEN_FOCUS', { focused: true }),
    /** The screen covered by another, or its tab left. */
    disappear: () => send('SCREEN_FOCUS', { focused: false }),
    /** The screen's path opened again with other params (a link to a screen already in the stack). */
    newParams: (params: Record<string, unknown>) => send('ROUTE_PARAMS', { params }),
    /** An event the page's side sends every screen (`craftLocationUpdate`, `craftPushToken`, ...). */
    craftEvent: (event: string, detail?: unknown) => send('CRAFT_EVENT', { event, detail }),
    /**
     * Another context signing in, out or as someone else (the page, a native
     * sign-in): the keychain's token changes and, on a host that reports it,
     * the screen hears `SESSION_CHANGED`. Null signs out.
     */
    setSessionToken: (token: string | null) => {
      const previous = secureStorage[sessionTokenKey]
      if (token) secureStorage[sessionTokenKey] = token
      else delete secureStorage[sessionTokenKey]
      sessionWritten(sessionTokenKey, previous)
    },
    /** Another context keeping a snapshot (or just word that it changed), reaching the screen. */
    keepSnapshot: (name: string, value?: unknown) => {
      if (value === null) delete snapshots[name]
      else if (value !== undefined) snapshots[name] = copy(value)
      send('SNAPSHOT_CHANGED', { name })
    },
    /** Airplane mode off (true) or on (false): while off, every request fails as with no network. */
    setOnline: (value: boolean) => { online = value },
    /** A message from the host, as Craft sends one (`{ type, payload }`). */
    send,
    /** Wait for this screen's outcome, stopping if the screen has ended. */
    waitFor: (check: () => boolean, description: string, timeoutMs = 5000) => waitFor(() => {
      if (ended) throw new Error(`${screen} ended while waiting for ${description}`)
      return check()
    }, `${screen}: ${description}`, timeoutMs),
    /**
     * Let the screen catch up: `ms`, then for as long as a request is still out
     * or was answered less than `ms` ago, since a screen that loads in steps
     * asks again once the first answer lands. Capped at 5s.
     */
    settle: async (ms = 30) => {
      const started = performance.now()
      await Bun.sleep(ms)
      while (performance.now() - started < 5000 && (fetching > 0 || performance.now() - answeredAt < ms))
        await Bun.sleep(5)
      if (mutationErrors.length) {
        const error = mutationErrors[0]
        throw new Error(`Native mutation rejected (${error.code}, operation ${error.operationIndex}): ${error.message}`)
      }
    },
    /** Every operation of the MUTATE batches sent so far, in order. */
    operations: (): NativeOperation[] => messages.filter(message => message.type === 'MUTATE').flatMap(message => message.payload.operations || []),
    /** Whether the screen has ended. */
    get ended() { return ended },
    unmount: end,
  }
}
