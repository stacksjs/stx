import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { fs } from '../src/fs'
import { findCall, installMockBridge } from './_mock-bridge'

describe('fs binary read/write', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['fs'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('readBuffer treats unmarked text as UTF-8 bytes', async () => {
    bridge.whenCalled('fs', 'readFile', { data: 'hi' })
    const r = await fs.readBuffer('/tmp/x')
    expect(r).toBeInstanceOf(Uint8Array)
    // 'hi' = 0x68 0x69
    expect(Array.from(r)).toEqual([0x68, 0x69])
  })

  it('readBuffer base64-decodes when bridge sets base64:true', async () => {
    // PNG header magic: 89 50 4E 47 = base64 "iVBO" + tail
    bridge.whenCalled('fs', 'readFile', { data: 'iVBORg==', base64: true })
    const r = await fs.readBuffer('/tmp/x')
    expect(Array.from(r).slice(0, 4)).toEqual([0x89, 0x50, 0x4E, 0x46])
  })

  it('writeBuffer base64-encodes the payload', async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4E, 0x47])
    await fs.writeBuffer('/tmp/x', bytes)
    // writeBuffer prefers `writeFileBytes` (future native) and falls
    // back to `writeFile`. The mock auto-vivifies methods, so the
    // optimistic path wins; either is acceptable here.
    const c = findCall(bridge.calls, 'fs', 'writeFileBytes') ?? findCall(bridge.calls, 'fs', 'writeFile')!
    // base64("\x89PNG") = "iVBORw=="
    expect(c.args).toEqual(['/tmp/x', 'iVBORw=='])
  })

  it('readBuffer round-trips identical bytes', async () => {
    const original = new Uint8Array([0xff, 0x00, 0x42, 0xa3])
    bridge.whenCalled('fs', 'readFile', () => ({
      data: btoa(String.fromCharCode(...original)),
      base64: true,
    }))
    const r = await fs.readBuffer('/x')
    expect(Array.from(r)).toEqual([0xff, 0x00, 0x42, 0xa3])
  })
})
