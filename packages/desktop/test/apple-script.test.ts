import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { appleScript, classifyAppleScriptError } from '../src/apple-script'
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

  it('passes the error number and message of a failed script through', async () => {
    bridge.whenCalled('appleScript', 'execute', { ok: false, error: { code: -1743, message: 'Not authorized to send Apple events to Contacts.' } })
    const r = await appleScript.execute('tell application "Contacts" to get name of first person')
    expect(r.ok).toBe(false)
    expect(r.error).toEqual({ code: -1743, message: 'Not authorized to send Apple events to Contacts.' })
  })

  it('still resolves for hosts that report no detail', async () => {
    bridge.whenCalled('appleScript', 'execute', { ok: false })
    const r = await appleScript.execute('bad')
    expect(r).toEqual({ ok: false })
  })
})

describe('classifyAppleScriptError', () => {
  it('returns null for a script that worked', () => {
    expect(classifyAppleScriptError({ ok: true })).toBeNull()
  })

  it('sorts the errors an app can act on', () => {
    const kind = (code: number) => classifyAppleScriptError({ ok: false, error: { code } })?.kind
    expect(kind(-1743)).toBe('automation-denied')
    expect(kind(-1744)).toBe('automation-denied')
    expect(kind(-25211)).toBe('accessibility-denied')
    expect(kind(-1719)).toBe('accessibility-denied')
    expect(kind(-128)).toBe('cancelled')
    expect(kind(-2741)).toBe('syntax')
    expect(kind(-600)).toBe('app-not-running')
    expect(kind(-1728)).toBe('unknown')
  })

  it('keeps the message and tolerates hosts that report nothing', () => {
    expect(classifyAppleScriptError({ ok: false, error: { code: -1728, message: "Can't get window 3." } })).toEqual({ kind: 'unknown', code: -1728, message: "Can't get window 3." })
    expect(classifyAppleScriptError({ ok: false })).toEqual({ kind: 'unknown', code: undefined, message: undefined })
  })

  it('never treats an inherited property or a non-number as a known code', () => {
    expect(classifyAppleScriptError({ ok: false, error: { code: Number.NaN } })?.kind).toBe('unknown')
    expect(classifyAppleScriptError({ ok: false, error: { code: '-1743' as unknown as number } })?.kind).toBe('unknown')
  })
})
