import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { appleScript } from '../src/apple-script'
import { installMockBridge } from './_mock-bridge'

describe('appleScript', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['appleScript']) })
  afterEach(() => { bridge.uninstall() })

  it('execute forwards source and returns result', async () => {
    bridge.whenCalled('appleScript', 'execute', { ok: true, result: 'hello' })
    const r = await appleScript.execute('return "hello"')
    expect(r.ok).toBe(true)
    expect(r.result).toBe('hello')
  })

  it('execute rejects empty source', async () => {
    await expect(appleScript.execute('')).rejects.toThrow(/source is required/)
  })

  it('returns ok:false without bridge', async () => {
    bridge.uninstall()
    const r = await appleScript.execute('beep')
    expect(r.ok).toBe(false)
  })
})
