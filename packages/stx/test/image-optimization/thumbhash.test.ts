/**
 * Tests for thumbhash placeholder strategy.
 *
 * v1 ships the *visualized* thumbhash (decoded PNG dataURL produced by
 * ts-images) — ~1KB on the wire vs 24 bytes for the raw hash. Smoother
 * gradient + better color fidelity than the blur strategy. The 24-byte
 * raw-hash wire-size win is a follow-up that needs a raw-RGBA decode
 * path (Sharp `.raw()` or a minimal PNG decoder).
 *
 * Uses a real JPEG fixture (the stx repo's cover image) — ts-images
 * needs an actual file on disk, mocks would just be testing the mock.
 */
import { describe, expect, it } from 'bun:test'
import { processImage } from '../../src/image-optimization/processor'

const FIXTURE = `${__dirname}/../../../../.github/art/cover.jpg`

describe('thumbhash placeholder strategy', () => {
  it('returns a base64 PNG dataURL when placeholder=thumbhash', async () => {
    const result = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'thumbhash',
      outputDir: `${__dirname}/../../.stx/thumbhash-test-out`,
    })
    expect(result.placeholder).toBeDefined()
    expect(result.placeholder!.startsWith('data:image/png;base64,')).toBe(true)
    // Visualized thumbhash should be much smaller than a full PNG — somewhere
    // between 500 bytes and 5KB. Anything outside that range suggests the
    // strategy mapping went wrong (e.g. fell through to the blur path).
    expect(result.placeholder!.length).toBeGreaterThan(500)
    expect(result.placeholder!.length).toBeLessThan(5000)
  })

  it('still works alongside the other placeholder strategies', async () => {
    const out = `${__dirname}/../../.stx/thumbhash-test-out`

    const thumb = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'thumbhash',
      outputDir: out,
    })

    const blur = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'blur',
      outputDir: out,
    })

    const color = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'dominant-color',
      outputDir: out,
    })

    const none = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'none',
      outputDir: out,
    })

    expect(thumb.placeholder!.startsWith('data:image/png')).toBe(true)
    expect(blur.placeholder!.startsWith('data:image')).toBe(true)
    // color returns either rgb(...) or a dataURL depending on backend
    expect(color.placeholder).toBeDefined()
    expect(none.placeholder).toBeUndefined()
  })

  it('reuses cached output across calls with the same hash', async () => {
    // Two back-to-back runs should produce identical placeholder data
    // because the image hash is deterministic.
    const out = `${__dirname}/../../.stx/thumbhash-test-out`
    const a = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'thumbhash',
      outputDir: out,
    })
    const b = await processImage(FIXTURE, {
      widths: [320],
      formats: ['webp'],
      placeholder: 'thumbhash',
      outputDir: out,
    })
    expect(a.placeholder).toBe(b.placeholder)
    expect(a.hash).toBe(b.hash)
  })
})
