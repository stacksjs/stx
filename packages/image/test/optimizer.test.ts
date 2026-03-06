import { describe, expect, test } from 'bun:test'
import { createImagePipeline, getImageMetadata, optimizeImage } from '../src/optimizer'

describe('optimizeImage', () => {
  test('returns buffer unchanged without sharp', async () => {
    const input = Buffer.from('test image data')
    const result = await optimizeImage(input)
    expect(result).toEqual(input)
  })

  test('accepts string input', async () => {
    const result = await optimizeImage('test string input')
    expect(result).toBeInstanceOf(Buffer)
  })

  test('accepts options', async () => {
    const input = Buffer.from('test')
    const result = await optimizeImage(input, { width: 800, height: 600, quality: 90, format: 'webp' })
    expect(result).toEqual(input)
  })
})

describe('getImageMetadata', () => {
  test('detects PNG format from magic bytes', () => {
    const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x64, // width: 100
      0x00, 0x00, 0x00, 0xC8, // height: 200
      0x08, 0x06, 0x00, 0x00, 0x00,
    ])
    const meta = getImageMetadata(pngHeader)
    expect(meta.format).toBe('png')
    expect(meta.width).toBe(100)
    expect(meta.height).toBe(200)
    expect(meta.size).toBe(pngHeader.length)
  })

  test('detects JPEG format from magic bytes', () => {
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10])
    const meta = getImageMetadata(jpegHeader)
    expect(meta.format).toBe('jpeg')
    expect(meta.size).toBe(jpegHeader.length)
  })

  test('detects GIF format from magic bytes', () => {
    const gifHeader = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61,
      0x40, 0x00, // width: 64
      0x30, 0x00, // height: 48
    ])
    const meta = getImageMetadata(gifHeader)
    expect(meta.format).toBe('gif')
    expect(meta.width).toBe(64)
    expect(meta.height).toBe(48)
  })

  test('detects format from file extension for string input', () => {
    const meta = getImageMetadata('/images/photo.webp')
    expect(meta.format).toBe('webp')
  })

  test('returns undefined format for unknown bytes', () => {
    const unknown = Buffer.from([0x00, 0x01, 0x02, 0x03])
    const meta = getImageMetadata(unknown)
    expect(meta.format).toBeUndefined()
  })

  test('detects SVG format from text content', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>')
    const meta = getImageMetadata(svg)
    expect(meta.format).toBe('svg')
  })
})

describe('createImagePipeline', () => {
  test('creates pipeline with default config', () => {
    const pipeline = createImagePipeline()
    expect(pipeline.config.quality).toBe(80)
    expect(pipeline.config.lazyLoad).toBe(true)
    expect(pipeline.config.placeholder).toBe('blur')
    expect(pipeline.config.formats).toEqual(['webp', 'jpg'])
    expect(pipeline.config.breakpoints).toHaveLength(4)
  })

  test('merges custom config', () => {
    const pipeline = createImagePipeline({ quality: 90, lazyLoad: false })
    expect(pipeline.config.quality).toBe(90)
    expect(pipeline.config.lazyLoad).toBe(false)
    expect(pipeline.config.placeholder).toBe('blur') // default preserved
  })

  test('process returns buffer', async () => {
    const pipeline = createImagePipeline()
    const result = await pipeline.process('test')
    expect(result).toBeInstanceOf(Buffer)
  })

  test('generateVariants returns responsive set', async () => {
    const pipeline = createImagePipeline()
    const set = await pipeline.generateVariants('images/photo.jpg')
    expect(set.original).toBe('images/photo.jpg')
    expect(set.variants.length).toBe(4)
    expect(set.srcset).toContain('640w')
  })
})
