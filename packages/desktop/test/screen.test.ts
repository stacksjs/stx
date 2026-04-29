import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { screen } from '../src/screen'
import { installMockBridge } from './_mock-bridge'

const sampleDisplay = {
  id: 0, x: 0, y: 0, width: 1920, height: 1080,
  workX: 0, workY: 25, workWidth: 1920, workHeight: 1055,
  scaleFactor: 2.0,
}

describe('screen (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['screen'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('getDisplays returns the array from the bridge', async () => {
    bridge.whenCalled('screen', 'getDisplays', [sampleDisplay])
    const r = await screen.getDisplays()
    expect(r).toHaveLength(1)
    expect(r[0].scaleFactor).toBe(2.0)
  })

  it('getPrimary returns the bridge value when shape is valid', async () => {
    bridge.whenCalled('screen', 'getPrimary', sampleDisplay)
    const r = await screen.getPrimary()
    expect(r?.id).toBe(0)
    expect(r?.width).toBe(1920)
  })

  it('getPrimary returns null when bridge returns malformed payload', async () => {
    bridge.whenCalled('screen', 'getPrimary', {})
    expect(await screen.getPrimary()).toBeNull()
  })
})

describe('screen (no bridge — web fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('getDisplays returns [] or one synthesized display depending on DOM availability', async () => {
    const r = await screen.getDisplays()
    // happy-dom may or may not provide window.screen — both shapes are
    // valid here. We just want the call to resolve without throwing.
    expect(Array.isArray(r)).toBe(true)
    expect(r.length === 0 || r.length === 1).toBe(true)
  })
})
