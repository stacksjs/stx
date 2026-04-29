import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { deepLinks } from '../src/deep-link'
import { installMockBridge } from './_mock-bridge'

describe('deepLinks.consumeInitialUrl', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['deepLink'])
  })
  afterEach(() => {
    bridge.uninstall()
    delete (window as any).__craftPendingDeepLink
  })

  it('returns the same URL as getInitialUrl on first call', () => {
    bridge.whenCalled('deepLink', 'getInitialUrl', () => 'myapp://launch')
    expect(deepLinks.consumeInitialUrl()).toBe('myapp://launch')
  })

  it('clears the JS-side mirror after reading', () => {
    ;(window as any).__craftPendingDeepLink = 'myapp://x'
    bridge.uninstall()
    delete (window as any).craft

    expect(deepLinks.consumeInitialUrl()).toBe('myapp://x')
    // Second read returns null because mirror was cleared.
    expect(deepLinks.consumeInitialUrl()).toBeNull()
  })

  it('returns null when nothing pending', () => {
    bridge.uninstall()
    delete (window as any).craft
    expect(deepLinks.consumeInitialUrl()).toBeNull()
  })
})
