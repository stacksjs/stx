/**
 * Panel orchestration (stacksjs/stx#1747): view → request → render → sink, plus
 * the error and JSON-fallback paths. Verified with a fake transport + sink.
 */
import { describe, expect, it } from 'bun:test'
import type { DevtoolsRequestType, DevtoolsResponse } from '../src/protocol'
import { createPanelController } from '../src/panel-controller'

function harness(responder: (view: DevtoolsRequestType) => DevtoolsResponse | Promise<DevtoolsResponse>) {
  let html = ''
  const controller = createPanelController({
    request: async view => responder(view),
    setHtml: (h) => { html = h },
  })
  return { controller, get html() { return html } }
}

describe('createPanelController', () => {
  it('renders a successful view through its renderer', async () => {
    const h = harness(() => ({ id: 1, ok: true, result: [{ scopeId: 'A', tag: 'div', children: [] }] }))
    await h.controller.show('tree')
    expect(h.html).toContain('A')
    expect(h.html).toContain('ul class="tree"')
  })

  it('renders graph/queries/stats via their renderers', async () => {
    const g = harness(() => ({ id: 1, ok: true, result: [{ scopeId: 'G', nodes: [{ name: 'n', type: 'signal', value: 1, setCount: 0, subscribers: 0 }] }] }))
    await g.controller.show('graph')
    expect(g.html).toContain('<table>')
    expect(g.html).toContain('n')
  })

  it('falls back to JSON for a view with no dedicated renderer (stores)', async () => {
    const h = harness(() => ({ id: 1, ok: true, result: { cart: true } }))
    await h.controller.show('stores')
    expect(h.html).toContain('<pre>')
    expect(h.html).toContain('cart')
  })

  it('shows an error for an unsuccessful response', async () => {
    const h = harness(() => ({ id: 1, ok: false, error: 'no runtime' }))
    await h.controller.show('tree')
    expect(h.html).toContain('error: no runtime')
  })

  it('shows an error when the transport itself rejects', async () => {
    const h = harness(() => { throw new Error('port closed') })
    await h.controller.show('graph')
    expect(h.html).toContain('error: port closed')
  })

  it('escapes error text (no injection from the page)', async () => {
    const h = harness(() => ({ id: 1, ok: false, error: '<img src=x onerror=alert(1)>' }))
    await h.controller.show('tree')
    expect(h.html).not.toContain('<img')
    expect(h.html).toContain('&lt;img')
  })

  it('tracks the current view and refresh() re-renders it', async () => {
    let calls = 0
    let html = ''
    const controller = createPanelController({
      request: async () => { calls++; return { id: calls, ok: true, result: [{ scopeId: `S${calls}`, tag: 'div', children: [] }] } },
      setHtml: (h) => { html = h },
    })
    expect(controller.current()).toBeNull()

    await controller.show('tree')
    expect(controller.current()).toBe('tree')
    expect(html).toContain('S1')

    await controller.refresh() // re-fetches the current view
    expect(calls).toBe(2)
    expect(html).toContain('S2')
  })

  it('refresh() is a no-op before any view is shown', async () => {
    let calls = 0
    const controller = createPanelController({ request: async () => { calls++; return { id: 1, ok: true, result: [] } }, setHtml: () => {} })
    await controller.refresh()
    expect(calls).toBe(0)
  })

  it('inspectScope requests scope(id) and renders the inspector', async () => {
    let askedType = ''
    let askedPayload: Record<string, unknown> | undefined
    let html = ''
    const controller = createPanelController({
      request: async (type, payload) => {
        askedType = type
        askedPayload = payload
        return { id: 1, ok: true, result: { signals: { n: 7 }, methods: ['go'] } }
      },
      setHtml: (h) => { html = h },
    })
    await controller.inspectScope('Cart')
    expect(askedType).toBe('scope')
    expect(askedPayload).toEqual({ scopeId: 'Cart' })
    expect(html).toContain('signals')
    expect(html).toContain('go')
  })
})
