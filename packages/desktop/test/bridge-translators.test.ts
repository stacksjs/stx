/**
 * Test the shape-adapter shims that translate per-bridge legacy callbacks
 * (`__craftFSCallback`, `__craftSystemCallback`, etc) into the unified
 * `__craftBridgeResult` envelope our facades expect.
 *
 * The translators live in `craft-bridge.js` (embedded in the Craft binary
 * and injected at document start). Here we evaluate that script directly
 * against the test's `window` so we can drive the translator inputs
 * synthetically — no Craft binary required.
 */
import { afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import './_mock-bridge'

const BRIDGE_PATH = `${__dirname}/../../../../craft/packages/zig/src/js/craft-bridge.js`

beforeAll(() => {
  const code = readFileSync(BRIDGE_PATH, 'utf8')
  // The bridge file is an IIFE that mutates `window`. Eval it in this
  // test's window context. It's defensive about the missing webkit
  // bridge so it won't throw at install time.
  // eslint-disable-next-line no-eval
  ;(0, eval)(code)
})

afterEach(() => {
  // Drain any pending queues left over from prior tests so each it() is
  // hermetic. We don't reload the bridge — it's idempotent and safe to
  // run once per process.
  ;(window as any).__craftBridgePending = {}
})

function captureResult(action: string): Promise<any> {
  return new Promise((resolve) => {
    const p = ((window as any).__craftBridgePending[action] = (window as any).__craftBridgePending[action] || [])
    p.push({ resolve, reject: resolve })
  })
}

describe('FS callback translator', () => {
  it('wraps getHomeDir payload into {path}', async () => {
    const promise = captureResult('getHomeDir')
    ;(window as any).__craftFSCallback('', 'getHomeDir', '/Users/me')
    expect(await promise).toEqual({ path: '/Users/me' })
  })

  it('passes stat objects through unchanged', async () => {
    const promise = captureResult('stat')
    ;(window as any).__craftFSCallback('', 'stat', {
      isFile: true, isDirectory: false, isSymlink: false, size: 42, modifiedAt: 100,
    })
    const r = await promise
    expect(r.size).toBe(42)
  })
})

describe('System callback translator', () => {
  it('wraps language string into {language}', async () => {
    const promise = captureResult('getLanguage')
    ;(window as any).__craftSystemCallback('', 'getLanguage', 'en')
    expect(await promise).toEqual({ language: 'en' })
  })

  it('wraps reduceMotion bool into {value}', async () => {
    const promise = captureResult('getReduceMotion')
    ;(window as any).__craftSystemCallback('', 'getReduceMotion', true)
    expect(await promise).toEqual({ value: true })
  })
})

describe('Power callback translator', () => {
  it('wraps battery level into {level}', async () => {
    const promise = captureResult('getBatteryLevel')
    ;(window as any).__craftPowerCallback('', 'getBatteryLevel', 0.85)
    expect(await promise).toEqual({ level: 0.85 })
  })

  it('wraps battery state string into {state}', async () => {
    const promise = captureResult('getBatteryState')
    ;(window as any).__craftPowerCallback('', 'getBatteryState', 'charged')
    expect(await promise).toEqual({ state: 'charged' })
  })

  it('wraps isCharging bool into {value}', async () => {
    const promise = captureResult('isCharging')
    ;(window as any).__craftPowerCallback('', 'isCharging', true)
    expect(await promise).toEqual({ value: true })
  })
})

describe('Network callback translator', () => {
  it('wraps connection type into {type}', async () => {
    const promise = captureResult('getConnectionType')
    ;(window as any).__craftNetworkCallback('', 'getConnectionType', 'wifi')
    expect(await promise).toEqual({ type: 'wifi' })
  })

  it('wraps interfaces array into {interfaces}', async () => {
    const promise = captureResult('getNetworkInterfaces')
    ;(window as any).__craftNetworkCallback('', 'getNetworkInterfaces', [{ name: 'en0' }])
    expect(await promise).toEqual({ interfaces: [{ name: 'en0' }] })
  })

  it('passes proxy settings through unchanged', async () => {
    const promise = captureResult('getProxySettings')
    ;(window as any).__craftNetworkCallback('', 'getProxySettings', { http: 'p:8080' })
    expect(await promise).toEqual({ http: 'p:8080' })
  })
})

describe('Bluetooth callback translator', () => {
  it('wraps array payloads into {devices}', async () => {
    const promise = captureResult('getConnectedDevices')
    ;(window as any).__craftBluetoothCallback('', 'getConnectedDevices', [{ id: 'a' }])
    expect(await promise).toEqual({ devices: [{ id: 'a' }] })
  })
})

describe('Menu callback translator', () => {
  it('re-emits as craft:menu:action event', () => {
    let received: string | null = null
    const handler = (e: Event) => { received = (e as CustomEvent).detail.id }
    window.addEventListener('craft:menu:action', handler)
    ;(window as any).__craftMenuCallback('save')
    expect(received).toBe('save')
    window.removeEventListener('craft:menu:action', handler)
  })

  it('ignores empty ids', () => {
    let count = 0
    const handler = () => { count++ }
    window.addEventListener('craft:menu:action', handler)
    ;(window as any).__craftMenuCallback('')
    expect(count).toBe(0)
    window.removeEventListener('craft:menu:action', handler)
  })
})
