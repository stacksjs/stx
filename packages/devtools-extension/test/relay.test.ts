/**
 * The background relay routing core (stacksjs/stx#1747): pairs a devtools-panel
 * port with the inspected tab's content-script port and forwards both ways,
 * keyed by tab id. Verified with fake ports, no chrome.
 */
import { describe, expect, it } from 'bun:test'
import type { RelayPort } from '../src/relay'
import { createPortRelay } from '../src/relay'

interface FakePort extends RelayPort {
  received: unknown[]
  emit: (m: unknown) => void
  disconnect: () => void
}

function makePort(name: string, tabId?: number): FakePort {
  let onMsg: ((m: unknown) => void) | null = null
  let onDisc: (() => void) | null = null
  const received: unknown[] = []
  return {
    name,
    tabId,
    received,
    postMessage: m => received.push(m),
    onMessage: (h) => { onMsg = h },
    onDisconnect: (h) => { onDisc = h },
    emit: m => onMsg?.(m),
    disconnect: () => onDisc?.(),
  }
}

describe('createPortRelay', () => {
  it('forwards panel requests to its tab page, and page responses back to the panel', () => {
    const relay = createPortRelay()
    const page = makePort('stx-devtools', 7)
    const panel = makePort('stx-devtools:panel:7')
    relay.register(page)
    relay.register(panel)

    panel.emit({ id: 1, type: 'tree' }) // panel → page
    expect(page.received).toEqual([{ id: 1, type: 'tree' }])

    page.emit({ id: 1, ok: true, result: [] }) // page → panel
    expect(panel.received).toEqual([{ id: 1, ok: true, result: [] }])
  })

  it('routes by tab id — messages stay on their own tab', () => {
    const relay = createPortRelay()
    const page7 = makePort('stx-devtools', 7)
    const panel7 = makePort('stx-devtools:panel:7')
    const page9 = makePort('stx-devtools', 9)
    const panel9 = makePort('stx-devtools:panel:9')
    for (const p of [page7, panel7, page9, panel9]) relay.register(p)

    panel7.emit({ id: 1 })
    expect(page7.received).toHaveLength(1)
    expect(page9.received).toHaveLength(0)
    void panel9
  })

  it('drops ports on disconnect', () => {
    const relay = createPortRelay()
    const page = makePort('stx-devtools', 3)
    const panel = makePort('stx-devtools:panel:3')
    relay.register(page)
    relay.register(panel)
    expect(relay.panels.has(3)).toBe(true)

    panel.disconnect()
    expect(relay.panels.has(3)).toBe(false)
    page.disconnect()
    expect(relay.pages.has(3)).toBe(false)
  })

  it('ignores unrelated port names', () => {
    const relay = createPortRelay()
    relay.register(makePort('some-other-port', 1))
    expect(relay.pages.size).toBe(0)
    expect(relay.panels.size).toBe(0)
  })

  it('tolerates a panel with no connected page yet (no throw)', () => {
    const relay = createPortRelay()
    const panel = makePort('stx-devtools:panel:5')
    relay.register(panel)
    expect(() => panel.emit({ id: 1 })).not.toThrow() // page absent → dropped
  })
})
