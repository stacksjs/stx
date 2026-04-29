import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { midi } from '../src/midi'
import { findCall, installMockBridge } from './_mock-bridge'

describe('midi', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['midi']) })
  afterEach(() => { bridge.uninstall() })

  it('listSources / listDestinations return arrays', async () => {
    bridge.whenCalled('midi', 'listSources', [{ index: 0, name: 'Loopback' }])
    bridge.whenCalled('midi', 'listDestinations', [{ index: 0, name: 'Loopback' }])
    expect((await midi.listSources())[0].name).toBe('Loopback')
    expect((await midi.listDestinations())[0].name).toBe('Loopback')
  })

  it('send forwards index + data array', async () => {
    bridge.whenCalled('midi', 'send', { ok: true })
    await midi.send(0, new Uint8Array([0x90, 60, 127]))
    const c = findCall(bridge.calls, 'midi', 'send')!
    expect(c.args[0]).toBe(0)
    // Uint8Array gets converted to a regular array for the bridge.
    expect(Array.isArray(c.args[1]) || c.args[1] instanceof Uint8Array).toBe(true)
  })

  it('subscribe / unsubscribe forward source index', async () => {
    bridge.whenCalled('midi', 'subscribe', { ok: true })
    bridge.whenCalled('midi', 'unsubscribe', { ok: true })
    await midi.subscribe(2)
    await midi.unsubscribe(2)
    expect(findCall(bridge.calls, 'midi', 'subscribe')!.args).toEqual([2])
  })

  it('onMessage subscribes to craft:midi:message', () => {
    let received: any = null
    const off = midi.onMessage((e) => { received = e })
    window.dispatchEvent(new CustomEvent('craft:midi:message', { detail: { index: 0, data: [144, 60, 127] } }))
    expect(received.data).toEqual([144, 60, 127])
    off()
  })

  it('returns [] without bridge', async () => {
    bridge.uninstall()
    expect(await midi.listSources()).toEqual([])
  })
})
