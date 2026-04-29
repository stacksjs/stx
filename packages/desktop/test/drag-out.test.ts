import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { dragOut, isDragOutAvailable } from '../src/drag-out'
import { findCall, installMockBridge } from './_mock-bridge'

describe('dragOut', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['dragOut'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('isDragOutAvailable reflects bridge presence', () => {
    expect(isDragOutAvailable()).toBe(true)
    bridge.uninstall()
    expect(isDragOutAvailable()).toBe(false)
  })

  it('forwards a single string path as a one-element array', async () => {
    await dragOut('/Users/me/a.png')
    const c = findCall(bridge.calls, 'dragOut', 'start')!
    expect(c.args[0]).toEqual(['/Users/me/a.png'])
  })

  it('forwards multiple paths', async () => {
    await dragOut(['/a', '/b'])
    expect(findCall(bridge.calls, 'dragOut', 'start')!.args[0]).toEqual(['/a', '/b'])
  })

  it('passes the full options bag to the bridge', async () => {
    const event = new MouseEvent('mousedown', { clientX: 100, clientY: 50 })
    await dragOut('/x', { event })
    const c = findCall(bridge.calls, 'dragOut', 'start')!
    // The TS facade just forwards options; the JS bridge layer is what
    // unpacks `event` into x/y. We assert the second arg has the event.
    expect((c.args[1] as any).event).toBe(event)
  })

  it('rejects on empty path list', async () => {
    await expect(dragOut([])).rejects.toThrow(/at least one path/)
  })

  it('rejects when bridge missing', async () => {
    bridge.uninstall()
    await expect(dragOut('/x')).rejects.toThrow(/Craft native window/)
  })
})
