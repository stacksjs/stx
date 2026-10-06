import { describe, expect, it } from 'bun:test'
import { parseSTX } from '../src/compiler/parser'
import { STXCLI } from '../src/cli/index'

function generate(script: string = ''): string {
  const source = `<script>${script}</script><template><View><Text>Capabilities</Text></View></template>`
  const cli = new STXCLI() as unknown as { generateBundle: (document: unknown) => string }
  return cli.generateBundle(parseSTX(source, 'Capabilities.stx'))
}

function runtime(script: string = '', options: { timeout?: number, initialAppState?: string } = {}) {
  const sent: Array<Record<string, any>> = []
  let callback: (message: Record<string, any>) => void = () => {}
  const scope: Record<string, any> = {
    __stxNativeBridge: {
      capabilityProtocolVersion: 1,
      capabilityTimeoutMs: options.timeout ?? 100,
      initialAppState: options.initialAppState ?? 'active',
      capabilities: ['storage', 'database', 'lifecycle', 'deepLinks', 'notifications'],
      onMessage: (receiver: typeof callback) => { callback = receiver },
      postMessage: (raw: string) => { sent.push(JSON.parse(raw)) },
    },
  }
  new Function('globalThis', generate(script))(scope)
  return { scope, sent, receive: (message: Record<string, any>) => callback(message) }
}

describe('generated native capability protocol', () => {
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
})
