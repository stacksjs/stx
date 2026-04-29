import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { pdf } from '../src/pdf'
import { installMockBridge } from './_mock-bridge'

describe('pdf', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['pdf']) })
  afterEach(() => { bridge.uninstall() })

  it('countPages returns number', async () => {
    bridge.whenCalled('pdf', 'countPages', 12)
    expect(await pdf.countPages('/tmp/doc.pdf')).toBe(12)
  })

  it('extractText returns concatenated text', async () => {
    bridge.whenCalled('pdf', 'extractText', 'Hello\nWorld')
    expect(await pdf.extractText('/tmp/doc.pdf')).toBe('Hello\nWorld')
  })

  it('rejects empty path', async () => {
    await expect(pdf.countPages('')).rejects.toThrow(/required/)
    await expect(pdf.extractText('')).rejects.toThrow(/required/)
  })
})
