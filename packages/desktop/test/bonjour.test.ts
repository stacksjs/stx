import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { bonjour } from '../src/bonjour'
import { installMockBridge } from './_mock-bridge'

describe('bonjour', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['bonjour']) })
  afterEach(() => { bridge.uninstall() })

  it('browse forwards service type', async () => {
    bridge.whenCalled('bonjour', 'browse', { started: true })
    const r = await bonjour.browse('_http._tcp.')
    expect(r.started).toBe(true)
  })

  it('onFound subscribes to event', () => {
    let svc: any = null
    const off = bonjour.onFound((s) => { svc = s })
    window.dispatchEvent(new CustomEvent('craft:bonjour:found', { detail: { name: 'x', type: '_http._tcp.' } }))
    expect(svc?.name).toBe('x')
    off()
  })

  it('returns started:false without bridge', async () => {
    bridge.uninstall()
    const r = await bonjour.browse('_http._tcp.')
    expect(r.started).toBe(false)
  })
})
