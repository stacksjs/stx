/**
 * Real runtime ↔ bridge integration (stacksjs/stx#1747).
 *
 * Every other test exercises the bridge/protocol against a MOCK __stxDevtools.
 * This one boots the ACTUAL signals runtime (via the #1741 DOM shim), so
 * `window.__stxDevtools` is the real thing, installs the page-injected bridge,
 * and drives protocol requests through it over a real `message` event — proving
 * the extension's contract matches the runtime it ships against (tree / graph /
 * store / mutations, not just hand-written fixtures).
 */
import { beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../stx/src/signals'
import { setupStxTestDom, shimAttributes } from '../../stx/src/testing'
import { installDevtoolsBridge } from '../src/inject'
import type { DevtoolsRequestType } from '../src/protocol'
import { STX_DEVTOOLS_CHANNEL } from '../src/protocol'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

describe('real runtime ↔ bridge integration (#1747)', () => {
  beforeAll(() => {
    setupStxTestDom()
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
    installDevtoolsBridge(window)
  })

  // Drive one protocol request through the bridge over a real message event;
  // handleDevtoolsRequest is synchronous, so the response is posted before this
  // returns. Capture it by intercepting postMessage.
  // eslint-disable-next-line ts/no-explicit-any
  function ask(type: DevtoolsRequestType, payload?: Record<string, unknown>): any {
    const posted: any[] = []
    const orig = window.postMessage
    window.postMessage = (m: unknown) => posted.push(m)
    try {
      window.dispatchEvent(new window.MessageEvent('message', {
        data: { channel: STX_DEVTOOLS_CHANNEL, direction: 'request', request: { id: 1, type, payload } },
      }))
    }
    finally {
      window.postMessage = orig
    }
    const msg = posted.find(m => m && m.direction === 'response')
    return msg?.response
  }

  it('answers version from the real __stxDevtools', () => {
    const res = ask('version')
    expect(res.ok).toBe(true)
    expect(res.result).toBe(window.__stxDevtools.version) // whatever the runtime ships
  })

  it('builds the component tree from real [data-stx-scope] elements', () => {
    document.body.innerHTML = '<div data-stx-scope="Cart"><span data-stx-scope="Item"></span></div>'
    shimAttributes(document.body)
    window.stx._scopes = { Cart: {}, Item: {} }

    const res = ask('tree')
    expect(res.ok).toBe(true)
    const cart = res.result.find((n: any) => n.scopeId === 'Cart')
    expect(cart).toBeTruthy()
    expect(cart.children.map((c: any) => c.scopeId)).toContain('Item')
  })

  it('reports the real reactive graph + a real store via the protocol', () => {
    window.__stxDevtools.enable()
    const count = window.stx.state(3)
    const doubled = window.stx.derived(() => count() * 2)
    window.stx._scopes = { Counter: { count, doubled } }

    const graph = ask('graph')
    const scope = graph.result.find((s: any) => s.scopeId === 'Counter')
    expect(scope.nodes.find((n: any) => n.name === 'count').value).toBe(3)
    expect(scope.nodes.find((n: any) => n.name === 'doubled').type).toBe('derived')

    // a real store, inspected through the protocol
    const items = window.stx.state([{ id: 1 }])
    window.stx._stores.set('cart', { items, add: () => {} })
    const store = ask('store', { storeId: 'cart' })
    expect(Array.isArray(store.result.signals.items)).toBe(true)
    expect(store.result.methods).toContain('add')
  })

  it('streams real state mutations through the protocol', () => {
    window.__stxDevtools.enable()
    window.__stxDevtools.resetStats()
    const open = window.stx.state(false)
    window.stx._scopes = { Drawer: { open } }

    open.set(true)
    open.set(false)

    const res = ask('mutations')
    expect(res.result.length).toBe(2)
    expect(res.result[0]).toMatchObject({ name: 'open', scope: 'Drawer', prev: false, next: true })
  })

  it('reports an error response for an unknown request type (real handler)', () => {
    // eslint-disable-next-line ts/no-explicit-any
    const res = ask('nope' as any)
    expect(res.ok).toBe(false)
    expect(res.error).toContain('unknown request type')
  })
})
