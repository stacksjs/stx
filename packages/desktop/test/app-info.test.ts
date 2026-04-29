import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { appInfo } from '../src/index'
import { findCall, installMockBridge } from './_mock-bridge'

describe('appInfo', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['app'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('hideDockIcon / showDockIcon / quit forward', async () => {
    await appInfo.hideDockIcon()
    await appInfo.showDockIcon()
    await appInfo.quit()
    expect(findCall(bridge.calls, 'app', 'hideDockIcon')).toBeDefined()
    expect(findCall(bridge.calls, 'app', 'showDockIcon')).toBeDefined()
    expect(findCall(bridge.calls, 'app', 'quit')).toBeDefined()
  })

  it('getInfo merges defaults so callers see consistent shape', async () => {
    bridge.whenCalled('app', 'getInfo', { name: 'TestApp', version: '1.2.3', bundleId: 'com.t' })
    const info = await appInfo.getInfo()
    expect(info.name).toBe('TestApp')
    expect(info.version).toBe('1.2.3')
    expect(info.bundleId).toBe('com.t')
  })

  it('getInfo defaults to empty info without bridge', async () => {
    bridge.uninstall()
    const info = await appInfo.getInfo()
    expect(info.name).toBe('')
    expect(info.version).toBe('0.0.0')
  })

  it('notify requires a title', async () => {
    await expect(appInfo.notify({ title: '' } as any)).rejects.toThrow(/title/)
  })

  it('notify forwards to bridge', async () => {
    await appInfo.notify({ title: 'Hi', body: 'There' })
    const c = findCall(bridge.calls, 'app', 'notify')
    expect(c).toBeDefined()
    expect((c!.args[0] as any).title).toBe('Hi')
  })

  it('setBadge / bounce forward', async () => {
    await appInfo.setBadge(7)
    await appInfo.bounce('critical')
    expect(findCall(bridge.calls, 'app', 'setBadge')!.args).toEqual([7])
    expect(findCall(bridge.calls, 'app', 'bounce')!.args).toEqual(['critical'])
  })

  it('bounce defaults to informational', async () => {
    await appInfo.bounce()
    expect(findCall(bridge.calls, 'app', 'bounce')!.args).toEqual(['informational'])
  })
})
