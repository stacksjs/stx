import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import {
  DEFAULT_WATCH_INTERVAL_MS,
  MAX_WATCH_INTERVAL_MS,
  MIN_WATCH_INTERVAL_MS,
  screenSharing,
  watchScreenSharing,
} from '../src/screen-sharing'
import { findCall, installMockBridge } from './_mock-bridge'

const SHARING = {
  sharing: true,
  signals: {
    systemScreenShare: false,
    remoteSession: false,
    conferenceSharing: true,
    screenRecording: false,
  },
  sources: [{ app: 'zoom.us', window: 'as_toolbar', kind: 'conference' }],
}

describe('screenSharing (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['screenSharing'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('getState passes the native payload through', async () => {
    bridge.whenCalled('screenSharing', 'getState', SHARING)
    const state = await screenSharing.getState()
    expect(state.sharing).toBe(true)
    expect(state.signals.conferenceSharing).toBe(true)
    expect(state.sources[0].app).toBe('zoom.us')
  })

  it('watch defaults to the documented interval', async () => {
    bridge.whenCalled('screenSharing', 'watch', { ok: true, intervalMs: DEFAULT_WATCH_INTERVAL_MS })
    await screenSharing.watch()
    expect(findCall(bridge.calls, 'screenSharing', 'watch')!.args).toEqual([DEFAULT_WATCH_INTERVAL_MS])
  })

  it('watch clamps before hitting the bridge so both sides agree', async () => {
    bridge.whenCalled('screenSharing', 'watch', { ok: true, intervalMs: MIN_WATCH_INTERVAL_MS })
    await screenSharing.watch(10)
    expect(findCall(bridge.calls, 'screenSharing', 'watch')!.args).toEqual([MIN_WATCH_INTERVAL_MS])

    bridge.calls.length = 0
    bridge.whenCalled('screenSharing', 'watch', { ok: true, intervalMs: MAX_WATCH_INTERVAL_MS })
    await screenSharing.watch(999_999)
    expect(findCall(bridge.calls, 'screenSharing', 'watch')!.args).toEqual([MAX_WATCH_INTERVAL_MS])
  })

  it('watch reports the interval the native side settled on', async () => {
    bridge.whenCalled('screenSharing', 'watch', { ok: true, intervalMs: 5000 })
    expect(await screenSharing.watch(5000)).toBe(5000)
  })

  it('watchScreenSharing subscribes, starts, and tears both down together', async () => {
    bridge.whenCalled('screenSharing', 'watch', { ok: true, intervalMs: 1000 })
    bridge.whenCalled('screenSharing', 'unwatch', { ok: true })

    const seen: any[] = []
    const stop = await watchScreenSharing(state => seen.push(state), 1000)

    expect(findCall(bridge.calls, 'screenSharing', 'watch')).toBeDefined()

    window.dispatchEvent(new CustomEvent('craft:screenSharing:change', { detail: SHARING }))
    expect(seen).toHaveLength(1)
    expect(seen[0].sharing).toBe(true)

    stop()
    await Promise.resolve()
    expect(findCall(bridge.calls, 'screenSharing', 'unwatch')).toBeDefined()

    // Unsubscribed: a further event must not reach the callback.
    window.dispatchEvent(new CustomEvent('craft:screenSharing:change', { detail: SHARING }))
    expect(seen).toHaveLength(1)
  })
})

describe('screenSharing (no bridge)', () => {
  beforeEach(() => {
    delete (window as any).craft
  })

  it('getState reports nothing detected rather than throwing', async () => {
    const state = await screenSharing.getState()
    expect(state.sharing).toBe(false)
    expect(state.sources).toEqual([])
    expect(Object.values(state.signals).every(v => v === false)).toBe(true)
  })

  it('getState hands back a fresh object each call', async () => {
    const a = await screenSharing.getState()
    a.sources.push({ app: 'x', window: 'y', kind: 'conference' })
    const b = await screenSharing.getState()
    expect(b.sources).toEqual([])
  })

  it('watch still reports the clamped interval, stop is a no-op', async () => {
    expect(await screenSharing.watch(10)).toBe(MIN_WATCH_INTERVAL_MS)
    await screenSharing.stop()
  })

  it('onChange returns a callable unsubscribe', () => {
    const off = screenSharing.onChange(() => {})
    expect(() => off()).not.toThrow()
  })
})
