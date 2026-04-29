import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { spotlight } from '../src/spotlight'
import { findCall, installMockBridge } from './_mock-bridge'

describe('spotlight', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['spotlight']) })
  afterEach(() => { bridge.uninstall() })

  it('index forwards items', async () => {
    bridge.whenCalled('spotlight', 'index', { ok: true })
    await spotlight.index([{ id: '1', title: 'A' }])
    expect(findCall(bridge.calls, 'spotlight', 'index')).toBeDefined()
  })

  it('returns ok:false without bridge', async () => {
    bridge.uninstall()
    const r = await spotlight.index([])
    expect(r.ok).toBe(false)
  })

  it('removeAll forwards', async () => {
    bridge.whenCalled('spotlight', 'removeAll', { ok: true })
    const r = await spotlight.removeAll()
    expect(r.ok).toBe(true)
  })
})
