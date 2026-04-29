import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { printing } from '../src/printing'
import { installMockBridge } from './_mock-bridge'

describe('printing.printToPDF path validation', () => {
  let bridge: ReturnType<typeof installMockBridge>

  beforeEach(() => {
    bridge = installMockBridge(['printing'])
    bridge.whenCalled('printing', 'printToPDF', { ok: true })
  })
  afterEach(() => {
    bridge.uninstall()
  })

  it('accepts POSIX absolute paths', async () => {
    await expect(printing.printToPDF('/Users/me/out.pdf')).resolves.toMatchObject({ ok: true })
  })

  it('accepts Windows drive-letter paths with backslash', async () => {
    await expect(printing.printToPDF('C:\\Users\\me\\out.pdf')).resolves.toMatchObject({ ok: true })
  })

  it('accepts Windows drive-letter paths with forward slash', async () => {
    await expect(printing.printToPDF('C:/Users/me/out.pdf')).resolves.toMatchObject({ ok: true })
  })

  it('accepts UNC paths', async () => {
    await expect(printing.printToPDF('\\\\server\\share\\out.pdf')).resolves.toMatchObject({ ok: true })
  })

  it('rejects relative paths', async () => {
    await expect(printing.printToPDF('out.pdf')).rejects.toThrow(/absolute/)
    await expect(printing.printToPDF('./out.pdf')).rejects.toThrow(/absolute/)
    await expect(printing.printToPDF('subdir/out.pdf')).rejects.toThrow(/absolute/)
  })

  it('rejects empty paths', async () => {
    await expect(printing.printToPDF('')).rejects.toThrow(/required/)
  })
})
