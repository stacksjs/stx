import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { serial } from '../src/serial'
import { findCall, installMockBridge } from './_mock-bridge'

describe('serial', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['serial']) })
  afterEach(() => { bridge.uninstall() })

  it('list returns array of ports', async () => {
    bridge.whenCalled('serial', 'list', [{ path: '/dev/cu.usbmodem14101' }])
    const r = await serial.list()
    expect(r[0].path).toContain('/dev/')
  })

  it('open forwards path + baud', async () => {
    bridge.whenCalled('serial', 'open', { ok: true, id: 'h1' })
    await serial.open('/dev/cu.usbmodem14101', 115200)
    const c = findCall(bridge.calls, 'serial', 'open')!
    expect(c.args).toEqual(['/dev/cu.usbmodem14101', 115200])
  })

  it('open defaults baud to 9600', async () => {
    bridge.whenCalled('serial', 'open', { ok: true })
    await serial.open('/dev/cu.X')
    const c = findCall(bridge.calls, 'serial', 'open')!
    expect(c.args[1]).toBe(9600)
  })

  it('write forwards id + data', async () => {
    bridge.whenCalled('serial', 'write', { ok: true })
    await serial.write('h1', 'AT\r\n')
    const c = findCall(bridge.calls, 'serial', 'write')!
    expect(c.args).toEqual(['h1', 'AT\r\n'])
  })

  it('rejects empty path / id', async () => {
    await expect(serial.open('')).rejects.toThrow(/required/)
    await expect(serial.write('', 'x')).rejects.toThrow(/required/)
  })

  it('onData subscribes to event', () => {
    let evt: any = null
    const off = serial.onData((e) => { evt = e })
    window.dispatchEvent(new CustomEvent('craft:serial:data', { detail: { id: 'h1', data: [65] } }))
    expect(evt.id).toBe('h1')
    off()
  })

  it('returns [] without bridge', async () => {
    bridge.uninstall()
    expect(await serial.list()).toEqual([])
  })
})
