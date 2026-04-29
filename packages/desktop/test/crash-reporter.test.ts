import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { crashReporter } from '../src/crash-reporter'
import { findCall, installMockBridge } from './_mock-bridge'

describe('crashReporter (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['crashReporter'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('report normalizes Error objects', async () => {
    const err = new Error('boom')
    await crashReporter.report(err)
    const c = findCall(bridge.calls, 'crashReporter', 'report')!
    expect(c.args[0]).toBe(err)
  })

  it('report forwards plain CrashReport objects', async () => {
    await crashReporter.report({ message: 'oops', severity: 'warning' })
    const c = findCall(bridge.calls, 'crashReporter', 'report')!
    expect((c.args[0] as any).message).toBe('oops')
  })

  it('flush returns array from native', async () => {
    bridge.whenCalled('crashReporter', 'flush', [
      { timestamp: 1, severity: 'error', message: 'a', source: 'js', stack: '' },
    ])
    const r = await crashReporter.flush()
    expect(r).toHaveLength(1)
    expect(r[0].message).toBe('a')
  })

  it('clear / setEnabled / setUser / setAppVersion forward', async () => {
    await crashReporter.clear()
    await crashReporter.setEnabled(false)
    await crashReporter.setUser('u-1')
    await crashReporter.setAppVersion('1.2.3')
    expect(findCall(bridge.calls, 'crashReporter', 'clear')).toBeDefined()
    expect(findCall(bridge.calls, 'crashReporter', 'setEnabled')).toBeDefined()
    expect(findCall(bridge.calls, 'crashReporter', 'setUser')).toBeDefined()
    expect(findCall(bridge.calls, 'crashReporter', 'setAppVersion')).toBeDefined()
  })

  it('isEnabled returns boolean', async () => {
    bridge.whenCalled('crashReporter', 'isEnabled', true)
    expect(await crashReporter.isEnabled()).toBe(true)
  })
})

describe('crashReporter (no bridge — JS fallback queue)', () => {
  beforeEach(() => {
    delete (window as any).craft
    // Reset the JS-side queue between tests via the public API
    crashReporter.clear()
  })

  it('queues reports up to 64 entries (ring buffer)', async () => {
    for (let i = 0; i < 70; i++) {
      await crashReporter.report({ message: `m${i}` })
    }
    const r = await crashReporter.flush()
    expect(r).toHaveLength(64)
    // Oldest 6 dropped — first remaining should be m6.
    expect(r[0].message).toBe('m6')
  })

  it('Error normalisation pulls message + stack', async () => {
    const err = new Error('boom')
    await crashReporter.report(err)
    const r = await crashReporter.flush()
    expect(r[0].message).toBe('boom')
    expect(r[0].stack).toContain('boom')
  })

  it('respects setEnabled(false)', async () => {
    await crashReporter.setEnabled(false)
    await crashReporter.report({ message: 'should-not-store' })
    expect(await crashReporter.flush()).toHaveLength(0)
    await crashReporter.setEnabled(true)
  })

  it('attachGlobalHandlers wires window.error/unhandledrejection', () => {
    crashReporter.clear()
    const off = crashReporter.attachGlobalHandlers()

    // Synthetic error event (Happy DOM-ish — fire ErrorEvent directly).
    window.dispatchEvent(Object.assign(new Event('error'), {
      message: 'global-error',
      filename: 'a.js',
      lineno: 1,
      colno: 2,
      error: new Error('global-error'),
    }))
    // Microtask drain so async report() landed.
    return Promise.resolve().then(async () => {
      const r = await crashReporter.flush()
      expect(r.length).toBeGreaterThanOrEqual(1)
      expect(r[r.length - 1].message).toBe('global-error')
      off()
    })
  })

  it('user + appVersion get attached to entries', async () => {
    await crashReporter.setUser('alice')
    await crashReporter.setAppVersion('2.0.0')
    await crashReporter.report({ message: 'tagged' })
    const r = await crashReporter.flush()
    expect(r[0].userId).toBe('alice')
    expect(r[0].appVersion).toBe('2.0.0')
  })
})
