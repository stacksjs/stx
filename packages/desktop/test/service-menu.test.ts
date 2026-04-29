import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { serviceMenu } from '../src/service-menu'
import { findCall, installMockBridge } from './_mock-bridge'

describe('serviceMenu', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['serviceMenu']) })
  afterEach(() => { bridge.uninstall() })

  it('register forwards name', async () => {
    bridge.whenCalled('serviceMenu', 'register', { ok: true })
    await serviceMenu.register('Translate Selection')
    expect(findCall(bridge.calls, 'serviceMenu', 'register')!.args).toEqual(['Translate Selection'])
  })

  it('unregister forwards name', async () => {
    await serviceMenu.unregister('Translate Selection')
    expect(findCall(bridge.calls, 'serviceMenu', 'unregister')).toBeDefined()
  })

  it('rejects empty name', async () => {
    await expect(serviceMenu.register('')).rejects.toThrow(/required/)
    await expect(serviceMenu.unregister('')).rejects.toThrow(/required/)
  })

  it('onInvoked subscribes to event', () => {
    let evt: any = null
    const off = serviceMenu.onInvoked((e) => { evt = e })
    window.dispatchEvent(new CustomEvent('craft:serviceMenu:invoked', { detail: { name: 'X' } }))
    expect(evt.name).toBe('X')
    off()
  })

  it('returns ok:false without bridge', async () => {
    bridge.uninstall()
    const r = await serviceMenu.register('Test')
    expect(r.ok).toBe(false)
  })
})
