import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { deepLinks } from '../src/deep-link'
import { installMockBridge } from './_mock-bridge'

describe('deepLinks', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['deepLink'])
  })
  afterEach(() => {
    bridge.uninstall()
    delete (window as any).__craftPendingDeepLink
  })

  it('isAvailable reflects bridge presence', () => {
    expect(deepLinks.isAvailable()).toBe(true)
    bridge.uninstall()
    expect(deepLinks.isAvailable()).toBe(false)
  })

  it('onUrl fires when craft:deepLink is dispatched', () => {
    let received: string | null = null
    const off = deepLinks.onUrl(({ url }) => { received = url })
    window.dispatchEvent(new CustomEvent('craft:deepLink', {
      detail: { url: 'myapp://path' },
    }))
    expect(received).toBe('myapp://path')
    off()
  })

  it('onUrl unsubscribe stops receiving', () => {
    let count = 0
    const off = deepLinks.onUrl(() => { count++ })
    window.dispatchEvent(new CustomEvent('craft:deepLink', { detail: { url: 'a' } }))
    off()
    window.dispatchEvent(new CustomEvent('craft:deepLink', { detail: { url: 'b' } }))
    expect(count).toBe(1)
  })

  it('getInitialUrl reads from the native bridge', () => {
    bridge.whenCalled('deepLink', 'getInitialUrl', () => 'myapp://launch')
    expect(deepLinks.getInitialUrl()).toBe('myapp://launch')
  })

  it('getInitialUrl falls back to window.__craftPendingDeepLink without bridge', () => {
    bridge.uninstall()
    ;(window as any).__craftPendingDeepLink = 'myapp://x'
    expect(deepLinks.getInitialUrl()).toBe('myapp://x')
  })

  it('getInitialUrl returns null when nothing pending', () => {
    bridge.uninstall()
    delete (window as any).__craftPendingDeepLink
    expect(deepLinks.getInitialUrl()).toBeNull()
  })
})
