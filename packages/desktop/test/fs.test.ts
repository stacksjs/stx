import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { fs } from '../src/fs'
import { findCall, installMockBridge } from './_mock-bridge'

describe('fs', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['fs'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('readFile pulls .data out of the response', async () => {
    bridge.whenCalled('fs', 'readFile', { data: 'file contents' })
    expect(await fs.readFile('/tmp/x')).toBe('file contents')
    expect(findCall(bridge.calls, 'fs', 'readFile')!.args).toEqual(['/tmp/x'])
  })

  it('readFile returns "" when bridge returns nothing', async () => {
    expect(await fs.readFile('/tmp/x')).toBe('')
  })

  it('writeFile forwards path + data', async () => {
    await fs.writeFile('/tmp/y', 'hi')
    expect(findCall(bridge.calls, 'fs', 'writeFile')!.args).toEqual(['/tmp/y', 'hi'])
  })

  it('exists returns boolean directly', async () => {
    bridge.whenCalled('fs', 'exists', true)
    expect(await fs.exists('/tmp/y')).toBe(true)
  })

  it('stat normalizes second-precision timestamps to ms', async () => {
    bridge.whenCalled('fs', 'stat', {
      isFile: true,
      isDirectory: false,
      isSymlink: false,
      size: 42,
      modifiedAt: 1700000000, // seconds
    })
    const s = await fs.stat('/tmp/y')
    expect(s.size).toBe(42)
    expect(s.modifiedAt).toBe(1700000000 * 1000)
  })

  it('stat preserves ms-precision timestamps', async () => {
    bridge.whenCalled('fs', 'stat', {
      isFile: true,
      isDirectory: false,
      isSymlink: false,
      size: 1,
      modifiedAt: 1700000000000, // ms
    })
    const s = await fs.stat('/tmp/y')
    expect(s.modifiedAt).toBe(1700000000000)
  })

  it('readDir extracts the .entries array and synthesizes path', async () => {
    bridge.whenCalled('fs', 'readDir', {
      entries: [{ name: 'a', isDirectory: false }],
    })
    const e = await fs.readDir('/tmp')
    expect(e).toHaveLength(1)
    expect(e[0].name).toBe('a')
    // Path is synthesized in the TS layer because the native side
    // returns just the basename — verify the join is correct.
    expect(e[0].path).toBe('/tmp/a')
  })

  it('readDir handles trailing slash on the dir path', async () => {
    bridge.whenCalled('fs', 'readDir', {
      entries: [{ name: 'b', isDirectory: true }],
    })
    const e = await fs.readDir('/tmp/')
    expect(e[0].path).toBe('/tmp/b')
  })

  it('homeDir / tempDir / appDataDir all forward', async () => {
    bridge.whenCalled('fs', 'homeDir', '/Users/me')
    bridge.whenCalled('fs', 'tempDir', '/tmp')
    bridge.whenCalled('fs', 'appDataDir', '/Users/me/Library/AppSupport')
    expect(await fs.homeDir()).toBe('/Users/me')
    expect(await fs.tempDir()).toBe('/tmp')
    expect(await fs.appDataDir()).toBe('/Users/me/Library/AppSupport')
  })
})

describe('fs (no bridge)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('throws a clear error when called without a Craft window', async () => {
    await expect(fs.readFile('/x')).rejects.toThrow(/Craft native window/)
  })
})
