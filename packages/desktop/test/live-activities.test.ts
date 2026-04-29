/**
 * Live Activities is a thin wrapper over Handoff — these tests just
 * verify the field-mapping is correct (state → userInfo, etc.) and
 * that the "no-bridge" default falls through cleanly.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { liveActivities } from '../src/live-activities'
import { findCall, installMockBridge } from './_mock-bridge'

describe('liveActivities', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['handoff'])
    bridge.whenCalled('handoff', 'startActivity', { ok: true })
    bridge.whenCalled('handoff', 'updateActivity', { ok: true })
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('start maps state → userInfo on the underlying handoff call', async () => {
    await liveActivities.start('com.example.timer', {
      title: 'Workout',
      webpageURL: 'https://example.com',
      state: { elapsedSec: 300 },
    })
    const c = findCall(bridge.calls, 'handoff', 'startActivity')!
    expect(c.args[0]).toBe('com.example.timer')
    const opts = c.args[1] as any
    expect(opts.title).toBe('Workout')
    expect(opts.webpageURL).toBe('https://example.com')
    expect(opts.userInfo).toEqual({ elapsedSec: 300 })
  })

  it('update maps state → userInfo', async () => {
    await liveActivities.update({ state: { score: 12 } })
    const c = findCall(bridge.calls, 'handoff', 'updateActivity')!
    expect((c.args[0] as any).userInfo).toEqual({ score: 12 })
  })

  it('stop forwards to handoff.stopActivity', async () => {
    await liveActivities.stop()
    expect(findCall(bridge.calls, 'handoff', 'stopActivity')).toBeDefined()
  })
})

describe('liveActivities (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('start returns false', async () => {
    expect(await liveActivities.start('com.example.x')).toBe(false)
  })

  it('update returns false', async () => {
    expect(await liveActivities.update({})).toBe(false)
  })
})
