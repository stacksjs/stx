import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { screenCapture } from '../src/screen-capture'
import { findCall, installMockBridge } from './_mock-bridge'

describe('screenCapture (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['screenCapture'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('captureScreen returns data URL', async () => {
    bridge.whenCalled('screenCapture', 'captureScreen', 'data:image/png;base64,iVBORw==')
    const r = await screenCapture.captureScreen()
    expect(r).toBe('data:image/png;base64,iVBORw==')
  })

  it('captureScreen returns null when bridge gives nothing', async () => {
    bridge.whenCalled('screenCapture', 'captureScreen', null)
    expect(await screenCapture.captureScreen()).toBeNull()
  })

  it('captureWindow forwards numeric id', async () => {
    bridge.whenCalled('screenCapture', 'captureWindow', 'data:image/png;base64,X')
    await screenCapture.captureWindow(42)
    expect(findCall(bridge.calls, 'screenCapture', 'captureWindow')!.args).toEqual([42])
  })

  it('captureWindow rejects invalid ids', async () => {
    await expect(screenCapture.captureWindow(0)).rejects.toThrow(/positive number/)
    await expect(screenCapture.captureWindow(-5)).rejects.toThrow(/positive number/)
    await expect(screenCapture.captureWindow(Number.NaN)).rejects.toThrow(/positive number/)
  })

  it('listWindows returns array', async () => {
    bridge.whenCalled('screenCapture', 'listWindows', [
      { id: 1, name: 'main', ownerName: 'Safari' },
    ])
    const r = await screenCapture.listWindows()
    expect(r).toHaveLength(1)
    expect(r[0].ownerName).toBe('Safari')
  })
})

describe('screenCapture (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all methods return falsy/empty', async () => {
    expect(await screenCapture.captureScreen()).toBeNull()
    expect(await screenCapture.captureWindow(1)).toBeNull()
    expect(await screenCapture.listWindows()).toEqual([])
  })
})
