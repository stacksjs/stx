import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { localServer } from '../src/local-server'
import { findCall, installMockBridge } from './_mock-bridge'

describe('localServer (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['localServer'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('start with default port → 0 (let OS pick)', async () => {
    bridge.whenCalled('localServer', 'start', { port: 49234, started: true })
    const r = await localServer.start()
    expect(r.started).toBe(true)
    expect(r.port).toBe(49234)
    expect(findCall(bridge.calls, 'localServer', 'start')!.args).toEqual([0, '127.0.0.1'])
  })

  it('start with explicit port', async () => {
    bridge.whenCalled('localServer', 'start', { port: 9000, started: true })
    await localServer.start(9000, '0.0.0.0')
    expect(findCall(bridge.calls, 'localServer', 'start')!.args).toEqual([9000, '0.0.0.0'])
  })

  it('respond forwards options', async () => {
    await localServer.respond({ status: 302, body: 'redirect', contentType: 'text/plain' })
    expect(findCall(bridge.calls, 'localServer', 'respond')).toBeDefined()
  })

  it('stop forwards', async () => {
    await localServer.stop()
    expect(findCall(bridge.calls, 'localServer', 'stop')).toBeDefined()
  })

  it('onRequest fires on craft:localServer:request', () => {
    let received: any = null
    const off = localServer.onRequest((e) => { received = e })
    window.dispatchEvent(new CustomEvent('craft:localServer:request', {
      detail: { method: 'GET', url: '/cb?code=abc' },
    }))
    expect(received).toEqual({ method: 'GET', url: '/cb?code=abc' })
    off()
  })

  it('awaitOAuthCallback resolves on first request + auto-stops', async () => {
    bridge.whenCalled('localServer', 'start', { port: 12345, started: true })

    const promise = localServer.awaitOAuthCallback({ timeoutMs: 1000 })

    // queueMicrotask was too eager — start() awaits a real Promise
    // before attaching its listener. Use a small setTimeout to schedule
    // the synthetic request after start() has finished.
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('craft:localServer:request', {
        detail: { method: 'GET', url: '/cb?code=xyz' },
      }))
    }, 10)

    const r = await promise
    expect(r.url).toBe('/cb?code=xyz')
    expect(r.port).toBe(12345)
    // Should have called respond + stop
    expect(findCall(bridge.calls, 'localServer', 'respond')).toBeDefined()
  })

  it('awaitOAuthCallback times out', async () => {
    bridge.whenCalled('localServer', 'start', { port: 12345, started: true })
    await expect(localServer.awaitOAuthCallback({ timeoutMs: 50 })).rejects.toThrow(/timed out/)
  })

  it('awaitOAuthCallback throws on start failure', async () => {
    bridge.whenCalled('localServer', 'start', { port: 0, started: false, reason: 'port in use' })
    await expect(localServer.awaitOAuthCallback({ timeoutMs: 50 })).rejects.toThrow(/port in use/)
  })
})

describe('localServer (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('start returns started:false', async () => {
    const r = await localServer.start()
    expect(r.started).toBe(false)
  })

  it('awaitOAuthCallback throws — bridge required', async () => {
    await expect(localServer.awaitOAuthCallback()).rejects.toThrow(/Craft native window/)
  })
})
