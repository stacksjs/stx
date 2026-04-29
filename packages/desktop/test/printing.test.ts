import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { printing } from '../src/printing'
import { findCall, installMockBridge } from './_mock-bridge'

describe('printing', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['printing'])
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('print forwards to bridge', async () => {
    await printing.print()
    expect(findCall(bridge.calls, 'printing', 'print')).toBeDefined()
  })

  it('printToPDF forwards path and returns result', async () => {
    bridge.whenCalled('printing', 'printToPDF', { ok: true, path: '/tmp/out.pdf' })
    const r = await printing.printToPDF('/tmp/out.pdf')
    expect(r.ok).toBe(true)
    expect(r.path).toBe('/tmp/out.pdf')
  })

  it('printToPDF rejects relative paths', async () => {
    await expect(printing.printToPDF('out.pdf')).rejects.toThrow(/absolute/)
  })

  it('printToPDF rejects empty paths', async () => {
    await expect(printing.printToPDF('')).rejects.toThrow(/required/)
  })
})

describe('printing (no bridge — web fallback)', () => {
  beforeEach(() => { delete (window as any).craft })

  it('print is best-effort — uses window.print if present', async () => {
    await expect(printing.print()).resolves.toBeUndefined()
  })

  it('printToPDF throws — no web equivalent', async () => {
    await expect(printing.printToPDF('/tmp/out.pdf')).rejects.toThrow(/Craft native window/)
  })
})
