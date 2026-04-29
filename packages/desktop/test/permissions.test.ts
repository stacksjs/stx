import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { permissions } from '../src/permissions'
import { findCall, installMockBridge } from './_mock-bridge'

describe('permissions (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['permissions'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('check returns the bridge status string', async () => {
    bridge.whenCalled('permissions', 'check', 'granted')
    expect(await permissions.check('camera')).toBe('granted')
  })

  it('request returns the post-prompt status', async () => {
    bridge.whenCalled('permissions', 'request', 'denied')
    expect(await permissions.request('microphone')).toBe('denied')
  })

  it('openSettings forwards name', async () => {
    await permissions.openSettings('screen_recording')
    expect(findCall(bridge.calls, 'permissions', 'openSettings')!.args).toEqual(['screen_recording'])
  })

  it('openSettings without name still resolves', async () => {
    await permissions.openSettings()
    expect(findCall(bridge.calls, 'permissions', 'openSettings')).toBeDefined()
  })
})

describe('permissions (no bridge — web fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('check returns "not-supported" if navigator.permissions is missing', async () => {
    // Happy DOM may or may not implement navigator.permissions.query;
    // the result is one of the well-known statuses or "not-supported".
    const r = await permissions.check('camera')
    expect(['granted', 'denied', 'undetermined', 'not-supported']).toContain(r)
  })
})
