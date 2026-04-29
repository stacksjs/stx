import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { shell } from '../src/shell'
import { findCall, installMockBridge } from './_mock-bridge'

describe('shell (with bridge)', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['shell'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('openExternal forwards url', async () => {
    await shell.openExternal('https://example.com')
    expect(findCall(bridge.calls, 'shell', 'openExternal')!.args).toEqual(['https://example.com'])
  })

  it('openPath / showInFinder forward', async () => {
    await shell.openPath('/tmp')
    await shell.showInFinder('/tmp/file')
    expect(findCall(bridge.calls, 'shell', 'openPath')!.args).toEqual(['/tmp'])
    expect(findCall(bridge.calls, 'shell', 'showInFinder')!.args).toEqual(['/tmp/file'])
  })

  it('spawn passes id, command, args, options', async () => {
    await shell.spawn('proc1', '/bin/echo', ['hi'], { cwd: '/tmp' })
    const c = findCall(bridge.calls, 'shell', 'spawn')!
    expect(c.args[0]).toBe('proc1')
    expect(c.args[1]).toBe('/bin/echo')
    expect(c.args[2]).toEqual(['hi'])
    expect((c.args[3] as any).cwd).toBe('/tmp')
  })

  it('kill forwards id', async () => {
    await shell.kill('proc1')
    expect(findCall(bridge.calls, 'shell', 'kill')!.args).toEqual(['proc1'])
  })

  it('getEnv returns string or undefined', async () => {
    bridge.whenCalled('shell', 'getEnv', 'production')
    expect(await shell.getEnv('NODE_ENV')).toBe('production')

    bridge.whenCalled('shell', 'getEnv', null)
    expect(await shell.getEnv('MISSING')).toBeUndefined()
  })

  it('setEnv forwards name + value', async () => {
    await shell.setEnv('FOO', 'bar')
    expect(findCall(bridge.calls, 'shell', 'setEnv')!.args).toEqual(['FOO', 'bar'])
  })
})

describe('shell (no bridge — web fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('openExternal falls back to window.open without throwing', async () => {
    // window.open exists in Happy DOM but is a no-op. We just need this
    // to resolve cleanly — there's no return value to assert on.
    await expect(shell.openExternal('https://example.com')).resolves.toBeUndefined()
  })

  it('openPath throws (no web fallback)', async () => {
    await expect(shell.openPath('/tmp')).rejects.toThrow(/Craft native window/)
  })

  it('getEnv returns undefined', async () => {
    expect(await shell.getEnv('PATH')).toBeUndefined()
  })
})
