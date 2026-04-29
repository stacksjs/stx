import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { biometric } from '../src/biometric'
import { findCall, installMockBridge } from './_mock-bridge'

describe('biometric (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['biometric'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('isAvailable returns boolean', async () => {
    bridge.whenCalled('biometric', 'isAvailable', true)
    expect(await biometric.isAvailable()).toBe(true)
  })

  it('getBiometryType returns the type string', async () => {
    bridge.whenCalled('biometric', 'getBiometryType', 'touchID')
    expect(await biometric.getBiometryType()).toBe('touchID')
  })

  it('evaluate forwards reason and returns success', async () => {
    bridge.whenCalled('biometric', 'evaluate', { success: true })
    const r = await biometric.evaluate('Unlock vault')
    expect(r.success).toBe(true)
    expect(findCall(bridge.calls, 'biometric', 'evaluate')!.args[0]).toBe('Unlock vault')
  })

  it('evaluate forwards options', async () => {
    bridge.whenCalled('biometric', 'evaluate', { success: false, errorCode: -2 })
    const r = await biometric.evaluate('test', { allowPasscodeFallback: true })
    expect(r.success).toBe(false)
    expect(r.errorCode).toBe(-2)
    const c = findCall(bridge.calls, 'biometric', 'evaluate')!
    expect((c.args[1] as any).allowPasscodeFallback).toBe(true)
  })

  it('evaluate rejects empty reason', async () => {
    await expect(biometric.evaluate('')).rejects.toThrow(/reason is required/)
  })
})

describe('biometric (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('isAvailable returns false', async () => {
    expect(await biometric.isAvailable()).toBe(false)
  })

  it('getBiometryType returns "none"', async () => {
    expect(await biometric.getBiometryType()).toBe('none')
  })

  it('evaluate returns failure result', async () => {
    const r = await biometric.evaluate('test')
    expect(r.success).toBe(false)
  })
})
