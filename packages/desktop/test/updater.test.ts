import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { updater } from '../src/updater'
import { findCall, installMockBridge } from './_mock-bridge'

describe('updater (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['updater'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('checkForUpdates / checkInBackground forward', async () => {
    await updater.checkForUpdates()
    await updater.checkInBackground()
    expect(findCall(bridge.calls, 'updater', 'checkForUpdates')).toBeDefined()
    expect(findCall(bridge.calls, 'updater', 'checkInBackground')).toBeDefined()
  })

  it('setAutomaticChecks / setCheckInterval / setFeedURL forward args', async () => {
    await updater.setAutomaticChecks(true)
    await updater.setCheckInterval(3600)
    await updater.setFeedURL('https://example.com/appcast.xml')
    expect(findCall(bridge.calls, 'updater', 'setAutomaticChecks')!.args).toEqual([true])
    expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([3600])
    expect(findCall(bridge.calls, 'updater', 'setFeedURL')!.args).toEqual(['https://example.com/appcast.xml'])
  })

  it('getLastUpdateCheckDate normalizes empty to null', async () => {
    bridge.whenCalled('updater', 'getLastUpdateCheckDate', '2024-01-01T00:00:00Z')
    expect(await updater.getLastUpdateCheckDate()).toBe('2024-01-01T00:00:00Z')

    bridge.whenCalled('updater', 'getLastUpdateCheckDate', '')
    expect(await updater.getLastUpdateCheckDate()).toBeNull()
  })

  it('getUpdateInfo returns null for malformed payloads', async () => {
    bridge.whenCalled('updater', 'getUpdateInfo', { version: '' })
    expect(await updater.getUpdateInfo()).toBeNull()

    bridge.whenCalled('updater', 'getUpdateInfo', { version: '1.2.3', releaseNotes: 'hi' })
    const info = await updater.getUpdateInfo()
    expect(info?.version).toBe('1.2.3')
    expect(info?.releaseNotes).toBe('hi')
  })

  it('onAvailable / onDownloaded fire on the right events', () => {
    let avail: any = null
    let downloaded: any = null
    const offA = updater.onAvailable((i) => { avail = i })
    const offD = updater.onDownloaded((i) => { downloaded = i })

    window.dispatchEvent(new CustomEvent('craft:updateAvailable', {
      detail: { version: '1.2.3' },
    }))
    window.dispatchEvent(new CustomEvent('craft:updateDownloaded', {
      detail: { version: '1.2.3' },
    }))

    expect(avail.version).toBe('1.2.3')
    expect(downloaded.version).toBe('1.2.3')
    offA()
    offD()
  })
})

describe('updater (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('all calls are graceful no-ops', async () => {
    await expect(updater.checkForUpdates()).resolves.toBeUndefined()
    await expect(updater.setFeedURL('x')).resolves.toBeUndefined()
    expect(await updater.getLastUpdateCheckDate()).toBeNull()
    expect(await updater.getUpdateInfo()).toBeNull()
  })
})
