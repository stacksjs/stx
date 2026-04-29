import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { notifications } from '../src/notifications'
import { updater } from '../src/updater'
import { findCall, installMockBridge } from './_mock-bridge'

describe('input validation', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['notifications', 'updater'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  describe('notifications.setBadge', () => {
    it('clamps negative counts to 0', async () => {
      await notifications.setBadge(-3)
      expect(findCall(bridge.calls, 'notifications', 'setBadge')!.args).toEqual([0])
    })

    it('rounds fractional counts', async () => {
      await notifications.setBadge(2.7)
      expect(findCall(bridge.calls, 'notifications', 'setBadge')!.args).toEqual([3])
    })

    it('treats NaN as 0', async () => {
      await notifications.setBadge(Number.NaN)
      expect(findCall(bridge.calls, 'notifications', 'setBadge')!.args).toEqual([0])
    })

    it('treats Infinity as 0', async () => {
      await notifications.setBadge(Number.POSITIVE_INFINITY)
      expect(findCall(bridge.calls, 'notifications', 'setBadge')!.args).toEqual([0])
    })
  })

  describe('updater.setCheckInterval', () => {
    it('forwards 0 (means disable)', async () => {
      await updater.setCheckInterval(0)
      expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([0])
    })

    it('clamps positive intervals to a minimum of 60s', async () => {
      await updater.setCheckInterval(5)
      expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([60])
    })

    it('preserves intervals above the floor', async () => {
      await updater.setCheckInterval(3600)
      expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([3600])
    })

    it('rounds fractional values', async () => {
      await updater.setCheckInterval(120.5)
      expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([121])
    })

    it('rejects non-finite values', async () => {
      await expect(updater.setCheckInterval(Number.NaN)).rejects.toThrow(/finite/)
      await expect(updater.setCheckInterval(Number.POSITIVE_INFINITY)).rejects.toThrow(/finite/)
    })

    it('treats negative as 0 (disabled)', async () => {
      await updater.setCheckInterval(-100)
      expect(findCall(bridge.calls, 'updater', 'setCheckInterval')!.args).toEqual([0])
    })
  })
})
