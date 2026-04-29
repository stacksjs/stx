import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { fs } from '../src/fs'
import { findCall, installMockBridge } from './_mock-bridge'

describe('fs.watch + fs.copy/move guards', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['fs'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('watch + onChange round-trip', () => {
    let received: any = null
    const off = fs.onChange((e) => { received = e })
    window.dispatchEvent(new CustomEvent('craft:fs:change', {
      detail: { id: 'w1', path: '/tmp/file', kind: 'modified' },
    }))
    expect(received).toEqual({ id: 'w1', path: '/tmp/file', kind: 'modified' })
    off()
  })

  it('copy rejects same source and destination', async () => {
    await expect(fs.copy('/a/b', '/a/b')).rejects.toThrow(/source and destination/)
  })

  it('move rejects same source and destination', async () => {
    await expect(fs.move('/x', '/x')).rejects.toThrow(/source and destination/)
  })

  it('copy forwards distinct paths', async () => {
    await fs.copy('/a', '/b')
    expect(findCall(bridge.calls, 'fs', 'copy')!.args).toEqual(['/a', '/b'])
  })

  it('move forwards distinct paths', async () => {
    await fs.move('/a', '/b')
    expect(findCall(bridge.calls, 'fs', 'move')!.args).toEqual(['/a', '/b'])
  })
})
