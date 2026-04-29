import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { continuityCamera } from '../src/continuity-camera'
import { installMockBridge } from './_mock-bridge'

describe('continuityCamera', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['continuityCamera']) })
  afterEach(() => { bridge.uninstall() })

  it('listCameras returns array with isContinuity flag', async () => {
    bridge.whenCalled('continuityCamera', 'listCameras', [
      { id: 'a', name: 'iPhone Camera', manufacturer: 'Apple', isContinuity: true },
      { id: 'b', name: 'FaceTime HD', manufacturer: 'Apple', isContinuity: false },
    ])
    const r = await continuityCamera.listCameras()
    expect(r).toHaveLength(2)
    expect(r[0].isContinuity).toBe(true)
    expect(r[1].isContinuity).toBe(false)
  })

  it('returns [] without bridge', async () => {
    bridge.uninstall()
    expect(await continuityCamera.listCameras()).toEqual([])
  })
})
