import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { keychain } from '../src/keychain'
import { findCall, installMockBridge } from './_mock-bridge'

describe('keychain', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['keychain'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('set forwards service, account, password', async () => {
    await keychain.set('com.app', 'alice@example.com', 's3cret')
    expect(findCall(bridge.calls, 'keychain', 'set')!.args).toEqual([
      'com.app', 'alice@example.com', 's3cret',
    ])
  })

  it('get returns string when bridge returns a string', async () => {
    bridge.whenCalled('keychain', 'get', 'returned')
    expect(await keychain.get('s', 'a')).toBe('returned')
  })

  it('get returns null for missing entries', async () => {
    bridge.whenCalled('keychain', 'get', null)
    expect(await keychain.get('s', 'a')).toBeNull()
  })

  it('delete and has forward args', async () => {
    bridge.whenCalled('keychain', 'has', true)
    await keychain.delete('s', 'a')
    expect(await keychain.has('s', 'a')).toBe(true)
  })

  it('rejects calls with empty service or account', async () => {
    await expect(keychain.set('', 'a', 'p')).rejects.toThrow(/service is required/)
    await expect(keychain.set('s', '', 'p')).rejects.toThrow(/account is required/)
    await expect(keychain.get('', 'a')).rejects.toThrow(/service is required/)
    await expect(keychain.delete('s', '')).rejects.toThrow(/account is required/)
    await expect(keychain.has('', '')).rejects.toThrow(/service is required/)
  })
})

describe('keychain (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('throws "requires Craft native window"', async () => {
    await expect(keychain.set('s', 'a', 'p')).rejects.toThrow(/Craft native window/)
  })
})
