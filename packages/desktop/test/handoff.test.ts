import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { handoff } from '../src/handoff'
import { findCall, installMockBridge } from './_mock-bridge'

describe('handoff (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['handoff'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('startActivity forwards type + opts and returns boolean', async () => {
    bridge.whenCalled('handoff', 'startActivity', { ok: true })
    const ok = await handoff.startActivity('com.example.read', {
      title: 'Reading chapter 3',
      webpageURL: 'https://example.com/book/3',
    })
    expect(ok).toBe(true)
    const c = findCall(bridge.calls, 'handoff', 'startActivity')!
    expect(c.args[0]).toBe('com.example.read')
    expect((c.args[1] as any).webpageURL).toBe('https://example.com/book/3')
  })

  it('startActivity rejects empty type', async () => {
    await expect(handoff.startActivity('')).rejects.toThrow(/type is required/)
  })

  it('updateActivity forwards options', async () => {
    bridge.whenCalled('handoff', 'updateActivity', { ok: true })
    await handoff.updateActivity({ title: 'Chapter 4' })
    expect(findCall(bridge.calls, 'handoff', 'updateActivity')).toBeDefined()
  })

  it('stopActivity forwards', async () => {
    await handoff.stopActivity()
    expect(findCall(bridge.calls, 'handoff', 'stopActivity')).toBeDefined()
  })

  it('getCurrentActivity normalizes shape', async () => {
    bridge.whenCalled('handoff', 'getCurrentActivity', {
      type: 'com.example.read',
      title: 'A',
      webpageURL: '',
    })
    const r = await handoff.getCurrentActivity()
    expect(r?.type).toBe('com.example.read')
  })

  it('getCurrentActivity returns null for malformed payload', async () => {
    bridge.whenCalled('handoff', 'getCurrentActivity', null)
    expect(await handoff.getCurrentActivity()).toBeNull()
  })

  it('onIncoming fires on craft:handoff:incoming', () => {
    let received: any = null
    const off = handoff.onIncoming((e) => { received = e })
    window.dispatchEvent(new CustomEvent('craft:handoff:incoming', {
      detail: { type: 'com.example.read', title: 'A' },
    }))
    expect(received.type).toBe('com.example.read')
    off()
  })
})

describe('handoff (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('startActivity returns false', async () => {
    expect(await handoff.startActivity('com.example.x')).toBe(false)
  })

  it('getCurrentActivity returns null', async () => {
    expect(await handoff.getCurrentActivity()).toBeNull()
  })

  it('updateActivity / stopActivity are no-ops', async () => {
    expect(await handoff.updateActivity({})).toBe(false)
    await expect(handoff.stopActivity()).resolves.toBeUndefined()
  })
})
