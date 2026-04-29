import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { shell } from '../src/shell'
import { findCall, installMockBridge } from './_mock-bridge'

describe('shell.spawn input validation', () => {
  let bridge: ReturnType<typeof installMockBridge>
  let nextSpawnId = 0
  function uniqueId(prefix = 'p') { return `${prefix}_${nextSpawnId++}` }

  beforeEach(() => {
    bridge = installMockBridge(['shell'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('rejects empty id', async () => {
    await expect(shell.spawn('', '/bin/echo')).rejects.toThrow(/non-empty string/)
  })

  it('rejects non-string id', async () => {
    await expect(shell.spawn(123 as any, '/bin/echo')).rejects.toThrow(/non-empty string/)
  })

  it('rejects empty command', async () => {
    await expect(shell.spawn('p1', '')).rejects.toThrow(/non-empty string/)
  })

  it('rejects non-array args', async () => {
    await expect(shell.spawn('p1', '/bin/echo', 'not-an-array' as any)).rejects.toThrow(/array/)
  })

  it('rejects non-string args entries', async () => {
    await expect(shell.spawn('p1', '/bin/echo', ['ok', 42 as any])).rejects.toThrow(/strings/)
  })

  it('rejects duplicate ids', async () => {
    const id = uniqueId('dup')
    await shell.spawn(id, '/bin/sleep', ['10'])
    await expect(shell.spawn(id, '/bin/echo')).rejects.toThrow(/already in use/)
  })

  it('allows reusing id after explicit kill', async () => {
    const id = uniqueId('kill')
    await shell.spawn(id, '/bin/sleep', ['10'])
    await shell.kill(id)
    await expect(shell.spawn(id, '/bin/echo')).resolves.toBeUndefined()
  })

  it('allows reusing id after exit event', async () => {
    const id = uniqueId('exit')
    await shell.spawn(id, '/bin/sleep', ['10'])
    window.dispatchEvent(new CustomEvent('craft:shell:exit', { detail: { id, exitCode: 0 } }))
    await expect(shell.spawn(id, '/bin/echo')).resolves.toBeUndefined()
  })

  it('preserves valid spawn args through to bridge', async () => {
    const id = uniqueId('args')
    await shell.spawn(id, '/bin/cat', ['file.txt'], { cwd: '/tmp' })
    const c = findCall(bridge.calls, 'shell', 'spawn')!
    expect(c.args).toEqual([id, '/bin/cat', ['file.txt'], { cwd: '/tmp' }])
  })
})
