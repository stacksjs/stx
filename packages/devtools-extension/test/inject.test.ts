/**
 * The page-injected bridge (stacksjs/stx#1747). Verified against a fake
 * window-like target: a request message in → a serialized response posted back.
 */
import { describe, expect, it } from 'bun:test'
import type { BridgeTarget } from '../src/inject'
import { installDevtoolsBridge } from '../src/inject'
import { STX_DEVTOOLS_CHANNEL } from '../src/protocol'

function fakeWindow(devtools?: unknown): BridgeTarget & { _emit: (data: unknown) => void, posted: unknown[] } {
  // eslint-disable-next-line ts/no-explicit-any
  let handler: ((event: { data: unknown }) => void) | null = null
  const posted: unknown[] = []
  return {
    __stxDevtools: devtools,
    posted,
    addEventListener: (_t, h) => { handler = h },
    removeEventListener: (_t, h) => { if (handler === h) handler = null },
    postMessage: msg => { posted.push(msg) },
    _emit: data => handler && handler({ data }),
  }
}

describe('installDevtoolsBridge', () => {
  it('answers a request message from __stxDevtools and posts the response', () => {
    const win = fakeWindow({ version: 2, tree: () => ['t'] } as any)
    const dispose = installDevtoolsBridge(win)

    win._emit({ channel: STX_DEVTOOLS_CHANNEL, direction: 'request', request: { id: 1, type: 'version' } })

    expect(win.posted).toHaveLength(1)
    expect(win.posted[0]).toMatchObject({
      channel: STX_DEVTOOLS_CHANNEL,
      direction: 'response',
      response: { id: 1, ok: true, result: 2 },
    })
    dispose()
  })

  it('ignores messages that are not stx-devtools requests', () => {
    const win = fakeWindow({ version: 2 } as any)
    installDevtoolsBridge(win)

    win._emit({ channel: 'something-else', direction: 'request', request: { id: 1, type: 'version' } })
    win._emit({ channel: STX_DEVTOOLS_CHANNEL, direction: 'response', response: { id: 1, ok: true } })
    win._emit(null)
    win._emit('garbage')

    expect(win.posted).toHaveLength(0)
  })

  it('reports an error response when the page has no __stxDevtools', () => {
    const win = fakeWindow(undefined)
    installDevtoolsBridge(win)
    win._emit({ channel: STX_DEVTOOLS_CHANNEL, direction: 'request', request: { id: 5, type: 'tree' } })
    expect((win.posted[0] as any).response.ok).toBe(false)
  })

  it('the disposer removes the listener', () => {
    const win = fakeWindow({ version: 2 } as any)
    const dispose = installDevtoolsBridge(win)
    dispose()
    win._emit({ channel: STX_DEVTOOLS_CHANNEL, direction: 'request', request: { id: 1, type: 'version' } })
    expect(win.posted).toHaveLength(0)
  })
})
