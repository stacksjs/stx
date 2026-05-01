import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import type { FSChangeEvent } from '../src/fs'
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

describe('fs.watchTree', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => { bridge = installMockBridge(['fs']) })
  afterEach(() => { bridge.uninstall() })

  function dispatch(id: string, path: string, kind?: FSChangeEvent['kind']): void {
    window.dispatchEvent(new CustomEvent('craft:fs:change', {
      detail: { id, path, kind },
    }))
  }

  it('returns a handle and forwards the watch call to the bridge', async () => {
    const handle = await fs.watchTree('/tmp/proj', {}, () => {})
    expect(handle.id).toMatch(/^watch-/)
    const c = findCall(bridge.calls, 'fs', 'watch')!
    expect(c.args[0]).toBe('/tmp/proj')
    expect(c.args[1]).toBe(handle.id)
    expect((c.args[2] as any).recursive).toBe(false)
    await handle.stop()
  })

  it('forwards { recursive: true } to the bridge', async () => {
    const handle = await fs.watchTree('/tmp/proj', { recursive: true }, () => {})
    const c = findCall(bridge.calls, 'fs', 'watch')!
    expect((c.args[2] as any).recursive).toBe(true)
    await handle.stop()
  })

  it('delivers events synchronously when coalesceMs is 0', async () => {
    const batches: FSChangeEvent[][] = []
    const handle = await fs.watchTree('/tmp/proj', {}, batch => batches.push(batch))
    dispatch(handle.id, '/tmp/proj/a.ts', 'modified')
    dispatch(handle.id, '/tmp/proj/b.ts', 'modified')
    expect(batches).toHaveLength(2)
    expect(batches[0][0].path).toBe('/tmp/proj/a.ts')
    await handle.stop()
  })

  it('coalesces events that arrive within the window', async () => {
    const batches: FSChangeEvent[][] = []
    const handle = await fs.watchTree('/tmp/proj', { coalesceMs: 50 }, batch => batches.push(batch))
    dispatch(handle.id, '/tmp/proj/a.ts', 'modified')
    dispatch(handle.id, '/tmp/proj/b.ts', 'modified')
    dispatch(handle.id, '/tmp/proj/c.ts', 'modified')
    expect(batches).toHaveLength(0) // not yet flushed
    await new Promise(r => setTimeout(r, 80))
    expect(batches).toHaveLength(1)
    expect(batches[0]).toHaveLength(3)
    await handle.stop()
  })

  it('filters events by kind when kinds is set', async () => {
    const batches: FSChangeEvent[][] = []
    const handle = await fs.watchTree('/tmp/proj', { kinds: ['created', 'deleted'] }, batch => batches.push(batch))
    dispatch(handle.id, '/tmp/proj/a.ts', 'modified') // dropped
    dispatch(handle.id, '/tmp/proj/b.ts', 'created')  // kept
    dispatch(handle.id, '/tmp/proj/c.ts', 'deleted')  // kept
    expect(batches).toHaveLength(2)
    expect(batches[0][0].kind).toBe('created')
    expect(batches[1][0].kind).toBe('deleted')
    await handle.stop()
  })

  it('ignores events from other watcher ids', async () => {
    const batches: FSChangeEvent[][] = []
    const handle = await fs.watchTree('/tmp/proj', {}, batch => batches.push(batch))
    dispatch('different-id', '/tmp/proj/a.ts', 'modified')
    expect(batches).toHaveLength(0)
    await handle.stop()
  })

  it('flushes pending buffered events on stop()', async () => {
    const batches: FSChangeEvent[][] = []
    const handle = await fs.watchTree('/tmp/proj', { coalesceMs: 5000 }, batch => batches.push(batch))
    dispatch(handle.id, '/tmp/proj/a.ts', 'modified')
    expect(batches).toHaveLength(0)
    await handle.stop()
    expect(batches).toHaveLength(1)
    expect(batches[0]).toHaveLength(1)
  })

  it('stop() unwatches via the bridge and is idempotent', async () => {
    const handle = await fs.watchTree('/tmp/proj', {}, () => {})
    await handle.stop()
    await handle.stop() // should not throw or double-call
    const unwatchCalls = bridge.calls.filter(c => c.ns === 'fs' && c.method === 'unwatch')
    expect(unwatchCalls).toHaveLength(1)
    expect(unwatchCalls[0].args).toEqual([handle.id])
  })

  it('drops events that arrive after stop()', async () => {
    const batches: FSChangeEvent[][] = []
    const handle = await fs.watchTree('/tmp/proj', {}, batch => batches.push(batch))
    await handle.stop()
    dispatch(handle.id, '/tmp/proj/a.ts', 'modified')
    expect(batches).toHaveLength(0)
  })
})
