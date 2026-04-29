import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { clipboard } from '../src/clipboard'
import { findCall, installMockBridge } from './_mock-bridge'

describe('clipboard (with native bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['clipboard'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('writeText forwards to craft.clipboard.writeText', async () => {
    await clipboard.writeText('hello')
    const c = findCall(bridge.calls, 'clipboard', 'writeText')
    expect(c).toBeDefined()
    expect(c!.args).toEqual(['hello'])
  })

  it('readText returns the bridge value', async () => {
    bridge.whenCalled('clipboard', 'readText', 'hi there')
    expect(await clipboard.readText()).toBe('hi there')
  })

  it('readText returns "" when bridge returns undefined', async () => {
    expect(await clipboard.readText()).toBe('')
  })

  it('writeHTML / readHTML round-trip', async () => {
    bridge.whenCalled('clipboard', 'readHTML', '<b>hi</b>')
    await clipboard.writeHTML('<i>x</i>')
    expect(await clipboard.readHTML()).toBe('<b>hi</b>')

    expect(findCall(bridge.calls, 'clipboard', 'writeHTML')!.args).toEqual(['<i>x</i>'])
  })

  it('clear forwards to bridge', async () => {
    await clipboard.clear()
    expect(findCall(bridge.calls, 'clipboard', 'clear')).toBeDefined()
  })

  it('hasText / hasHTML / hasImage return booleans from bridge', async () => {
    bridge.whenCalled('clipboard', 'hasText', true)
    bridge.whenCalled('clipboard', 'hasHTML', false)
    bridge.whenCalled('clipboard', 'hasImage', true)
    expect(await clipboard.hasText()).toBe(true)
    expect(await clipboard.hasHTML()).toBe(false)
    expect(await clipboard.hasImage()).toBe(true)
  })
})

describe('clipboard (no bridge — web fallback)', () => {
  beforeEach(() => {
    delete (window as any).craft
  })

  it('hasImage falls back to false (no permission-prompty API)', async () => {
    expect(await clipboard.hasImage()).toBe(false)
  })

  it('writeText is best-effort when navigator.clipboard is missing', async () => {
    // Happy DOM exposes navigator.clipboard via `clipboard` (returns
    // undefined for readText). The call should not throw either way.
    await expect(clipboard.writeText('x')).resolves.toBeUndefined()
  })
})
