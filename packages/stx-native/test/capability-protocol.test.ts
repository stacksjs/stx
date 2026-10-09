import { describe, expect, it } from 'bun:test'
import { parseSTX } from '../src/compiler/parser'
import { STXCLI } from '../src/cli/index'

function generate(script: string = '', template: string = '<View><Text>Capabilities</Text></View>'): string {
  const source = `<script>${script}</script><template>${template}</template>`
  const cli = new STXCLI() as unknown as { generateBundle: (document: unknown) => string }
  return cli.generateBundle(parseSTX(source, 'Capabilities.stx'))
}

function runtime(script: string = '', options: {
  timeout?: number
  initialAppState?: string
  timers?: boolean
  template?: string
  capabilities?: string[]
} = {}) {
  const sent: Array<Record<string, any>> = []
  let callback: (message: Record<string, any>) => void = () => {}
  const scope: Record<string, any> = {
    __stxNativeBridge: {
      platform: 'ios',
      mutationProtocolVersion: 1,
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: options.timeout ?? 100,
      initialAppState: options.initialAppState ?? 'active',
      capabilities: options.capabilities ?? ['storage', 'database', 'lifecycle', 'deepLinks', 'notifications'],
      onMessage: (receiver: typeof callback) => { callback = receiver },
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
  }
  if (options.timers !== false) {
    scope.setTimeout = setTimeout
    scope.clearTimeout = clearTimeout
  }
  new Function('globalThis', generate(script, options.template))(scope)
  return { scope, sent, receive: (message: Record<string, any>) => callback(message) }
}

describe('generated native capability protocol', () => {
  it('publishes the platform and capability flags through the existing Craft shape', () => {
    const { scope } = runtime()
    expect(scope.craft.platform).toBe('ios')
    expect(scope.craft.capabilityProtocolVersion).toBe(1)
    expect(scope.craft.capabilities).toMatchObject({
      storage: true,
      localDatabase: true,
      lifecycle: true,
      deepLinks: true,
      localNotifications: true,
      camera: false,
    })
  })

  it('exposes the existing Craft API shapes over versioned requests', () => {
    const { scope, sent, receive } = runtime()
    scope.craft.storage.get('theme')
    scope.craft.db.execute('BEGIN TRANSACTION')
    expect(scope.craft.lifecycle.getState()).toBe('active')
    scope.craft.deepLinks.getInitialURL()
    scope.craft.notifications.schedule({ id: 'wake', title: 'Wake up' })

    const requests = sent.filter(message => message.type === 'API_REQUEST')
    expect(requests.map(message => message.payload)).toEqual([
      { version: 1, module: 'Storage', method: 'get', args: ['theme'] },
      { version: 1, module: 'Database', method: 'execute', args: ['BEGIN TRANSACTION', []] },
      { version: 1, module: 'DeepLinks', method: 'getInitialURL', args: [] },
      { version: 1, module: 'Notifications', method: 'schedule', args: [{ id: 'wake', title: 'Wake up' }] },
    ])
    requests.forEach(request => receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: null },
    }))
  })

  it('exposes typed secure storage and biometric APIs only through native capability requests', () => {
    /*
     * No timers: this asserts what was SENT and never answers any of it.
     *
     * With timers on, each of the seven requests below leaves a promise that
     * rejects when the capability timeout elapses, and nothing is awaiting any
     * of them -- so seven unhandled rejections fired about 100ms later, inside
     * whichever test file happened to be running by then. The whole suite saw
     * it as five failures in cli.test.ts attributed to a line in this file,
     * and each file passed when run on its own.
     */
    const { scope, sent } = runtime('', { capabilities: ['biometric', 'secureStorage'], timers: false })
    scope.craft.secureStorage.set('token', 'secret')
    scope.craft.secureStorage.get('token')
    scope.craft.secureStorage.delete('token')
    scope.craft.secureStorage.clear()
    scope.craft.biometrics.isAvailable()
    scope.craft.biometrics.getBiometricType()
    scope.craft.biometrics.authenticate('Unlock WildLoop')
    expect(scope.craft.capabilities).toMatchObject({ biometric: true, secureStorage: true })
    expect(sent.filter(message => message.type === 'API_REQUEST').map(message => message.payload)).toEqual([
      { version: 1, module: 'SecureStorage', method: 'set', args: ['token', 'secret'] },
      { version: 1, module: 'SecureStorage', method: 'get', args: ['token'] },
      { version: 1, module: 'SecureStorage', method: 'remove', args: ['token'] },
      { version: 1, module: 'SecureStorage', method: 'clear', args: [] },
      { version: 1, module: 'Biometrics', method: 'isAvailable', args: [] },
      { version: 1, module: 'Biometrics', method: 'getBiometricType', args: [] },
      { version: 1, module: 'Biometrics', method: 'authenticate', args: ['Unlock WildLoop'] },
    ])
  })

  it('preserves synchronous lifecycle and legacy notification aliases', () => {
    const { scope, sent, receive } = runtime('', { initialAppState: 'background' })
    expect(scope.craft.getAppState()).toBe('background')
    expect(scope.craft.lifecycle.getState()).toBe('background')

    const states: string[] = []
    scope.craft.lifecycle.onStateChange((state: string) => states.push(state))
    receive({ type: 'APP_STATE', payload: { state: 'active' } })
    receive({ type: 'APP_STATE', payload: { state: 'active' } })
    expect(states).toEqual(['active'])

    scope.craft.scheduleNotification({ id: 'legacy', title: 'Legacy' })
    scope.craft.cancelNotification('legacy')
    scope.craft.cancelAllNotifications()
    scope.craft.getPendingNotifications()
    expect(sent.slice(-4).map(message => [message.payload.module, message.payload.method])).toEqual([
      ['Notifications', 'schedule'],
      ['Notifications', 'cancel'],
      ['Notifications', 'cancelAll'],
      ['Notifications', 'pending'],
    ])
    sent.slice(-4).forEach(request => receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: null },
    }))
  })

  it('does not deliver an initial link after getInitialURL claims it', () => {
    const { scope, sent, receive } = runtime()
    const links: string[] = []
    scope.craft.deepLinks.getInitialURL()
    scope.craft.deepLinks.onLink((link: { url: string }) => links.push(link.url))
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://launch', initial: true } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://later', initial: false } })
    expect(links).toEqual(['craft://later'])
    const request = sent.find(message => message.type === 'API_REQUEST')!
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: null },
    })
  })

  it('uses host responses when a bare JavaScript runtime has no timers', async () => {
    const { scope, sent, receive } = runtime('', { timers: false })
    const read = scope.craft.storage.get('bare-runtime')
    const request = sent.at(-1)!
    expect(request.type).toBe('API_REQUEST')
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: 'works' },
    })
    expect(await read).toBe('works')
  })

  it('settles responses, dispatches subscriptions, and cancels timed-out work', async () => {
    const { scope, sent, receive } = runtime('', { timeout: 5 })
    const states: string[] = []
    const links: string[] = []
    const removeState = scope.craft.lifecycle.onChange((state: string) => states.push(state))
    const removeLink = scope.craft.deepLinks.onLink((link: { url: string }) => links.push(link.url))
    receive({ type: 'APP_STATE', payload: { state: 'background' } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://notes/1', initial: false } })
    removeState()
    removeLink()
    receive({ type: 'APP_STATE', payload: { state: 'active' } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://notes/2', initial: false } })
    expect(states).toEqual(['background'])
    expect(links).toEqual(['craft://notes/1'])

    const read = scope.craft.storage.get('theme')
    const request = sent.at(-1)!
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: 'dark' },
    })
    expect(await read).toBe('dark')

    const timedOut = scope.craft.storage.get('missing')
    await expect(timedOut).rejects.toMatchObject({ code: 'TIMEOUT' })
    expect(sent.at(-1)).toMatchObject({
      type: 'API_CANCEL',
      payload: { version: 1, reason: 'timeout' },
    })
  })

  it('re-renders lifecycle and deep-link subscription state', () => {
    const { sent, receive } = runtime(`
      let state = 'active'
      let link = 'none'
      globalThis.craft.lifecycle.onStateChange(function(next) { state = next })
      globalThis.craft.deepLinks.onLink(function(next) { link = next.url })
    `, { template: '<View><Text testID="state">{state}</Text><Text testID="link">{link}</Text></View>' })
    sent.length = 0
    receive({ type: 'APP_STATE', payload: { state: 'background' } })
    receive({ type: 'DEEP_LINK', payload: { url: 'craft://notes/1', initial: false } })
    const updates = sent.filter(message => message.type === 'MUTATE')
      .flatMap(message => message.payload.operations)
      .filter(operation => operation.op === 'updateNode')
    expect(updates).toEqual(expect.arrayContaining([
      expect.objectContaining({ patch: expect.objectContaining({ children: ['background'] }) }),
      expect.objectContaining({ patch: expect.objectContaining({ children: ['craft://notes/1'] }) }),
    ]))
  })

  it('installs fetch only when the host advertises it', () => {
    expect(runtime('', { capabilities: ['storage'] }).scope.fetch).toBeUndefined()
    const { scope } = runtime('', { capabilities: ['storage', 'fetch'] })
    expect(typeof scope.fetch).toBe('function')
    expect(scope.craft.capabilities.fetch).toBe(true)
  })

  it('sends fetch as one Network request and reads the answer like a Response', async () => {
    const { scope, sent, receive } = runtime('', { capabilities: ['fetch'] })
    const answer = scope.fetch('http://localhost:3011/api/profile', {
      method: 'post',
      headers: { Authorization: 'Bearer abc', 'Content-Type': 'application/json' },
      body: '{"a":1}',
    })
    const request = sent.at(-1)!
    expect(request.payload).toEqual({
      version: 1,
      module: 'Network',
      method: 'fetch',
      args: [{
        url: 'http://localhost:3011/api/profile',
        method: 'POST',
        headers: { 'authorization': 'Bearer abc', 'content-type': 'application/json' },
        body: '{"a":1}',
      }],
    })
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: {
        version: 1,
        requestId: request.id,
        data: { url: 'http://localhost:3011/api/profile', status: 201, statusText: 'created', redirected: false, headers: { 'content-type': 'application/json' }, body: '{"name":"Ava"}' },
      },
    })
    const response = await answer
    expect(response.ok).toBe(true)
    expect(response.status).toBe(201)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('missing')).toBeNull()
    expect(await response.json()).toEqual({ name: 'Ava' })
    expect(response.bodyUsed).toBe(true)
    await expect(response.text()).rejects.toThrow('already been consumed')

    const missing = scope.fetch('http://localhost:3011/api/nope')
    const second = sent.at(-1)!
    expect(second.payload.args[0]).toEqual({ url: 'http://localhost:3011/api/nope', method: 'GET', headers: {}, body: null })
    receive({
      type: 'API_RESPONSE',
      correlationId: second.id,
      payload: { version: 1, requestId: second.id, data: { status: 404, statusText: 'not found', headers: {}, body: 'Not found' } },
    })
    const notFound = await missing
    expect(notFound.ok).toBe(false)
    expect(await notFound.text()).toBe('Not found')
  })

  it('rejects bodies the host cannot send and turns transport failures into TypeErrors', async () => {
    const { scope, sent, receive } = runtime('', { capabilities: ['fetch'] })
    const before = sent.length
    await expect(scope.fetch('https://example.com', { body: 'x' })).rejects.toThrow('cannot have a body')
    await expect(scope.fetch('https://example.com', { method: 'POST', body: { a: 1 } })).rejects.toThrow('string bodies only')
    expect(sent.length).toBe(before)

    const offline = scope.fetch('https://example.com')
    const request = sent.at(-1)!
    receive({
      type: 'API_ERROR',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, code: 'NETWORK_ERROR', message: 'The Internet connection appears to be offline.' },
    })
    const failure = await offline.catch((error: Error & { code?: string }) => error)
    expect(failure).toBeInstanceOf(TypeError)
    expect(failure.code).toBe('NETWORK_ERROR')
  })

  it('re-renders once top-level async work has used a capability answer', async () => {
    const { sent, receive } = runtime(`
      let name = 'loading'
      globalThis.fetch('https://example.com/me').then(function(r) { return r.json() }).then(function(me) { name = me.name })
    `, { capabilities: ['fetch'], template: '<View><Text testID="name">{name}</Text></View>' })
    const request = sent.find(message => message.type === 'API_REQUEST')!
    receive({
      type: 'API_RESPONSE',
      correlationId: request.id,
      payload: { version: 1, requestId: request.id, data: { status: 200, headers: {}, body: '{"name":"Ava"}' } },
    })
    await new Promise(resolve => setTimeout(resolve, 5))
    const updates = sent.filter(message => message.type === 'MUTATE')
      .flatMap(message => message.payload.operations)
      .filter(operation => operation.op === 'updateNode')
    expect(updates).toEqual([expect.objectContaining({ patch: { children: ['Ava'] } })])
  })
})
