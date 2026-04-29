import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { vision } from '../src/vision'
import { installMockBridge } from './_mock-bridge'

describe('vision', () => {
  let bridge: ReturnType<typeof installMockBridge>
  beforeEach(() => { bridge = installMockBridge(['vision']) })
  afterEach(() => { bridge.uninstall() })

  it('recognizeText returns array', async () => {
    bridge.whenCalled('vision', 'recognizeText', [{ text: 'A', confidence: 0.99 }])
    const r = await vision.recognizeText('/tmp/img.png')
    expect(r).toEqual([{ text: 'A', confidence: 0.99 }])
  })

  it('detectFaces returns array of bounds', async () => {
    bridge.whenCalled('vision', 'detectFaces', [{ bounds: { x: 10, y: 20, width: 30, height: 40 } }])
    const r = await vision.detectFaces('/tmp/img.png')
    expect(r[0].bounds.width).toBe(30)
  })

  it('detectBarcodes returns array of payloads', async () => {
    bridge.whenCalled('vision', 'detectBarcodes', [{ payload: 'https://a.b', type: 'qr' }])
    const r = await vision.detectBarcodes('/tmp/qr.png')
    expect(r[0].payload).toBe('https://a.b')
  })

  it('rejects empty path', async () => {
    await expect(vision.recognizeText('')).rejects.toThrow(/required/)
    await expect(vision.detectFaces('')).rejects.toThrow(/required/)
    await expect(vision.detectBarcodes('')).rejects.toThrow(/required/)
  })

  it('returns [] without bridge', async () => {
    bridge.uninstall()
    expect(await vision.recognizeText('/x.png')).toEqual([])
  })
})
