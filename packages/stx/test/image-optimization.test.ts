/**
 * Image Optimization Tests
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'

// Import from the module
import {
  // Processor
  processImage,
  getImageMetadata,
  isSharpAvailable,
  generateSrcSet,
  generateSizes,
  getFallbackVariant,
  groupVariantsByFormat,
  isImageFile,
  getMimeType,
  getTotalSize,
  formatSize,
  ImageProcessingError,
  DEFAULT_WIDTHS,
  DEFAULT_FORMATS,
  DEFAULT_QUALITY,
  type ImageVariant,
  type ImageFormat,

  // Component
  renderImageComponent,
  parseImageComponent,
  processImageComponents,
  type ImageComponentProps,

  // Directive
  imageDirective,
  createImageDirective,
  clearImageCache,

  // Build plugin
  createImagePlugin,
  optimizeDirectory,
  generateImageManifest,

  // Config
  defaultImageConfig,
} from '../src/image-optimization'

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_DIR = path.join(process.cwd(), '.test-images')
const OUTPUT_DIR = path.join(TEST_DIR, 'output')

// Create a simple 1x1 PNG for testing (minimal valid PNG)
const MINIMAL_PNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width = 1
  0x00, 0x00, 0x00, 0x01, // height = 1
  0x08, 0x02, // bit depth = 8, color type = 2 (RGB)
  0x00, 0x00, 0x00, // compression, filter, interlace
  0x90, 0x77, 0x53, 0xDE, // IHDR CRC
  0x00, 0x00, 0x00, 0x0C, // IDAT length
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x08, 0xD7, 0x63, 0xF8, 0xFF, 0xFF, 0xFF, 0x00,
  0x05, 0xFE, 0x02, 0xFE, // IDAT data + CRC
  0x00, 0x00, 0x00, 0x00, // IEND length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82, // IEND CRC
])

// Create a 2x2 PNG for testing
const SMALL_PNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  0x00, 0x00, 0x00, 0x0D,
  0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x02, // width = 2
  0x00, 0x00, 0x00, 0x02, // height = 2
  0x08, 0x02,
  0x00, 0x00, 0x00,
  0x6D, 0x76, 0x82, 0x9D,
  0x00, 0x00, 0x00, 0x12,
  0x49, 0x44, 0x41, 0x54,
  0x08, 0xD7, 0x63, 0xFC, 0xFF, 0xFF, 0x3F, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x05, 0xFE, 0x02, 0xFE,
  0x00, 0x00, 0x00, 0x00,
  0x49, 0x45, 0x4E, 0x44,
  0xAE, 0x42, 0x60, 0x82,
])

// Create a minimal JPEG for testing
const MINIMAL_JPEG = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, // SOI + APP0
  0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
  0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
  0xFF, 0xDB, 0x00, 0x43, 0x00, // DQT
  0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07,
  0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14,
  0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13,
  0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A,
  0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22,
  0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C,
  0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39,
  0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32,
  0xFF, 0xC0, 0x00, 0x0B, 0x08, // SOF0
  0x00, 0x01, // height = 1
  0x00, 0x01, // width = 1
  0x01, 0x01, 0x11, 0x00,
  0xFF, 0xC4, 0x00, 0x1F, 0x00, // DHT
  0x00, 0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01,
  0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07,
  0x08, 0x09, 0x0A, 0x0B,
  0xFF, 0xC4, 0x00, 0xB5, 0x10, // DHT AC
  0x00, 0x02, 0x01, 0x03, 0x03, 0x02, 0x04, 0x03,
  0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
  0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12,
  0x21, 0x31, 0x41, 0x06, 0x13, 0x51, 0x61, 0x07,
  // ... truncated for brevity
  0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00,
  0x3F, 0x00, 0x7F, 0xFF, 0xD9, // SOS + EOI
])

// ============================================================================
// Setup & Teardown
// ============================================================================

beforeEach(async () => {
  // Create test directories
  await fs.promises.mkdir(TEST_DIR, { recursive: true })
  await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
})

afterEach(async () => {
  // Clean up
  try {
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true })
  }
  catch {
    // Ignore cleanup errors
  }
  clearImageCache()
})

// ============================================================================
// Processor Tests
// ============================================================================

describe('Image Processor', () => {
  describe('Constants', () => {
    test('DEFAULT_WIDTHS should be array of numbers', () => {
      expect(Array.isArray(DEFAULT_WIDTHS)).toBe(true)
      expect(DEFAULT_WIDTHS.length).toBeGreaterThan(0)
      expect(DEFAULT_WIDTHS.every(w => typeof w === 'number')).toBe(true)
    })

    test('DEFAULT_FORMATS should include webp and jpeg', () => {
      expect(DEFAULT_FORMATS).toContain('webp')
      expect(DEFAULT_FORMATS).toContain('jpeg')
    })

    test('DEFAULT_QUALITY should be between 1 and 100', () => {
      expect(DEFAULT_QUALITY).toBeGreaterThanOrEqual(1)
      expect(DEFAULT_QUALITY).toBeLessThanOrEqual(100)
    })
  })

  describe('isSharpAvailable', () => {
    test('should return boolean', async () => {
      const result = await isSharpAvailable()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getImageMetadata', () => {
    test('should parse PNG dimensions from buffer', async () => {
      const metadata = await getImageMetadata(MINIMAL_PNG)
      expect(metadata.width).toBe(1)
      expect(metadata.height).toBe(1)
      expect(metadata.format).toBe('png')
    })

    test('should parse PNG dimensions from file', async () => {
      const testFile = path.join(TEST_DIR, 'test.png')
      await fs.promises.writeFile(testFile, MINIMAL_PNG)

      const metadata = await getImageMetadata(testFile)
      expect(metadata.width).toBe(1)
      expect(metadata.height).toBe(1)
    })

    test('should throw for invalid image', async () => {
      const invalidBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03])
      await expect(getImageMetadata(invalidBuffer)).rejects.toThrow()
    })
  })

  describe('generateSrcSet', () => {
    test('should generate srcset string from variants', () => {
      const variants: ImageVariant[] = [
        { path: '/img/test-320.webp', url: '/images/test-320.webp', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/img/test-640.webp', url: '/images/test-640.webp', width: 640, height: 480, format: 'webp', size: 2000 },
      ]

      const srcset = generateSrcSet(variants)
      expect(srcset).toContain('/images/test-320.webp 320w')
      expect(srcset).toContain('/images/test-640.webp 640w')
    })

    test('should filter by format', () => {
      const variants: ImageVariant[] = [
        { path: '/img/test-320.webp', url: '/images/test-320.webp', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/img/test-320.jpg', url: '/images/test-320.jpg', width: 320, height: 240, format: 'jpeg', size: 1500 },
      ]

      const srcset = generateSrcSet(variants, 'webp')
      expect(srcset).toContain('webp')
      expect(srcset).not.toContain('jpg')
    })

    test('should sort by width', () => {
      const variants: ImageVariant[] = [
        { path: '/img/test-640.webp', url: '/images/test-640.webp', width: 640, height: 480, format: 'webp', size: 2000 },
        { path: '/img/test-320.webp', url: '/images/test-320.webp', width: 320, height: 240, format: 'webp', size: 1000 },
      ]

      const srcset = generateSrcSet(variants)
      const parts = srcset.split(', ')
      expect(parts[0]).toContain('320w')
      expect(parts[1]).toContain('640w')
    })
  })

  describe('generateSizes', () => {
    test('should return 100vw for empty breakpoints', () => {
      expect(generateSizes()).toBe('100vw')
      expect(generateSizes({})).toBe('100vw')
    })

    test('should generate sizes from breakpoints', () => {
      const breakpoints = {
        '768px': '100vw',
        '1024px': '50vw',
      }

      const sizes = generateSizes(breakpoints)
      expect(sizes).toContain('(max-width: 1024px) 50vw')
      expect(sizes).toContain('(max-width: 768px) 100vw')
      expect(sizes).toContain('100vw')
    })
  })

  describe('getFallbackVariant', () => {
    test('should return middle JPEG variant', () => {
      const variants: ImageVariant[] = [
        { path: '/a', url: '/a', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/b', url: '/b', width: 320, height: 240, format: 'jpeg', size: 1500 },
        { path: '/c', url: '/c', width: 640, height: 480, format: 'jpeg', size: 3000 },
        { path: '/d', url: '/d', width: 1024, height: 768, format: 'jpeg', size: 5000 },
      ]

      const fallback = getFallbackVariant(variants)
      expect(fallback?.format).toBe('jpeg')
      expect(fallback?.width).toBe(640)
    })

    test('should return middle variant if no JPEG', () => {
      const variants: ImageVariant[] = [
        { path: '/a', url: '/a', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/b', url: '/b', width: 640, height: 480, format: 'webp', size: 2000 },
      ]

      const fallback = getFallbackVariant(variants)
      expect(fallback).toBeDefined()
    })
  })

  describe('groupVariantsByFormat', () => {
    test('should group variants correctly', () => {
      const variants: ImageVariant[] = [
        { path: '/a', url: '/a', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/b', url: '/b', width: 320, height: 240, format: 'jpeg', size: 1500 },
        { path: '/c', url: '/c', width: 640, height: 480, format: 'webp', size: 2000 },
      ]

      const grouped = groupVariantsByFormat(variants)
      expect(grouped.get('webp')?.length).toBe(2)
      expect(grouped.get('jpeg')?.length).toBe(1)
    })
  })

  describe('isImageFile', () => {
    test('should identify image files', () => {
      expect(isImageFile('photo.jpg')).toBe(true)
      expect(isImageFile('photo.jpeg')).toBe(true)
      expect(isImageFile('photo.png')).toBe(true)
      expect(isImageFile('photo.webp')).toBe(true)
      expect(isImageFile('photo.avif')).toBe(true)
      expect(isImageFile('photo.gif')).toBe(true)
      expect(isImageFile('photo.svg')).toBe(true)
    })

    test('should reject non-image files', () => {
      expect(isImageFile('file.txt')).toBe(false)
      expect(isImageFile('file.js')).toBe(false)
      expect(isImageFile('file.html')).toBe(false)
    })

    test('should handle uppercase extensions', () => {
      expect(isImageFile('photo.JPG')).toBe(true)
      expect(isImageFile('photo.PNG')).toBe(true)
    })
  })

  describe('getMimeType', () => {
    test('should return correct MIME types', () => {
      expect(getMimeType('webp')).toBe('image/webp')
      expect(getMimeType('avif')).toBe('image/avif')
      expect(getMimeType('jpeg')).toBe('image/jpeg')
      expect(getMimeType('png')).toBe('image/png')
    })
  })

  describe('getTotalSize', () => {
    test('should sum variant sizes', () => {
      const variants: ImageVariant[] = [
        { path: '/a', url: '/a', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/b', url: '/b', width: 640, height: 480, format: 'webp', size: 2000 },
      ]

      expect(getTotalSize(variants)).toBe(3000)
    })

    test('should return 0 for empty array', () => {
      expect(getTotalSize([])).toBe(0)
    })
  })

  describe('formatSize', () => {
    test('should format bytes', () => {
      expect(formatSize(500)).toBe('500 B')
    })

    test('should format kilobytes', () => {
      expect(formatSize(1024)).toBe('1.0 KB')
      expect(formatSize(2048)).toBe('2.0 KB')
    })

    test('should format megabytes', () => {
      expect(formatSize(1024 * 1024)).toBe('1.00 MB')
      expect(formatSize(2.5 * 1024 * 1024)).toBe('2.50 MB')
    })
  })

  describe('ImageProcessingError', () => {
    test('should have correct properties', () => {
      const error = new ImageProcessingError('Test error', 'TEST_CODE')
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_CODE')
      expect(error.name).toBe('ImageProcessingError')
    })
  })
})

// ============================================================================
// Component Tests
// ============================================================================

describe('Image Component', () => {
  describe('parseImageComponent', () => {
    test('should parse basic Image component', () => {
      const html = '<Image src="/images/test.jpg" alt="Test image" />'
      const props = parseImageComponent(html)

      expect(props).not.toBeNull()
      expect(props?.src).toBe('/images/test.jpg')
      expect(props?.alt).toBe('Test image')
    })

    test('should parse all props', () => {
      const html = '<Image src="/img.jpg" alt="Alt" width="800" height="600" loading="eager" priority class="img-class" />'
      const props = parseImageComponent(html)

      expect(props?.src).toBe('/img.jpg')
      expect(props?.alt).toBe('Alt')
      expect(props?.width).toBe(800)
      expect(props?.height).toBe(600)
      expect(props?.loading).toBe('eager')
      expect(props?.priority).toBe(true)
      expect(props?.class).toBe('img-class')
    })

    test('should return null for invalid component', () => {
      expect(parseImageComponent('<div>test</div>')).toBeNull()
      expect(parseImageComponent('<Image />')).toBeNull() // Missing required props
    })
  })

  describe('renderImageComponent', () => {
    test('should render simple img in dev mode', () => {
      const props: ImageComponentProps = {
        src: '/images/test.jpg',
        alt: 'Test image',
      }

      const result = renderImageComponent(props, { isDev: true })
      expect(result.html).toContain('<img')
      expect(result.html).toContain('src="/images/test.jpg"')
      expect(result.html).toContain('alt="Test image"')
    })

    test('should include loading="lazy" by default', () => {
      const props: ImageComponentProps = {
        src: '/images/test.jpg',
        alt: 'Test image',
      }

      const result = renderImageComponent(props, { isDev: true })
      expect(result.html).toContain('loading="lazy"')
    })

    test('should not include loading="lazy" with priority', () => {
      const props: ImageComponentProps = {
        src: '/images/test.jpg',
        alt: 'Test image',
        priority: true,
      }

      const result = renderImageComponent(props, { isDev: true })
      expect(result.html).not.toContain('loading="lazy"')
      expect(result.html).toContain('fetchpriority="high"')
    })

    test('should include decoding="async"', () => {
      const props: ImageComponentProps = {
        src: '/images/test.jpg',
        alt: 'Test image',
      }

      const result = renderImageComponent(props, { isDev: true })
      expect(result.html).toContain('decoding="async"')
    })

    test('should render picture element with variants', () => {
      const props: ImageComponentProps = {
        src: '/images/test.jpg',
        alt: 'Test image',
        width: 800,
        height: 600,
      }

      const variants: ImageVariant[] = [
        { path: '/a', url: '/images/test-320.webp', width: 320, height: 240, format: 'webp', size: 1000 },
        { path: '/b', url: '/images/test-320.jpg', width: 320, height: 240, format: 'jpeg', size: 1500 },
      ]

      const result = renderImageComponent(props, { variants })
      expect(result.html).toContain('<picture>')
      expect(result.html).toContain('</picture>')
      expect(result.html).toContain('<source')
      expect(result.html).toContain('type="image/webp"')
    })

    test('should escape HTML in alt text', () => {
      const props: ImageComponentProps = {
        src: '/images/test.jpg',
        alt: 'Test <script>alert("xss")</script>',
      }

      const result = renderImageComponent(props, { isDev: true })
      expect(result.html).not.toContain('<script>')
      expect(result.html).toContain('&lt;script&gt;')
    })
  })

  describe('processImageComponents', () => {
    test('should process multiple Image components', async () => {
      const content = `
        <div>
          <Image src="/img1.jpg" alt="Image 1" />
          <p>Some text</p>
          <Image src="/img2.jpg" alt="Image 2" />
        </div>
      `

      const result = await processImageComponents(content, async (props) => ({
        html: `<img src="${props.src}" alt="${props.alt}" />`,
      }))

      expect(result.html).toContain('<img src="/img1.jpg"')
      expect(result.html).toContain('<img src="/img2.jpg"')
      expect(result.html).toContain('Some text')
    })

    test('should collect preload links', async () => {
      const content = '<Image src="/hero.jpg" alt="Hero" priority />'

      const result = await processImageComponents(content, async () => ({
        html: '<img src="/hero.jpg" />',
        preloadLink: '<link rel="preload" href="/hero.jpg" />',
      }))

      expect(result.preloadLinks).toContain('<link rel="preload" href="/hero.jpg" />')
    })
  })
})

// ============================================================================
// Directive Tests
// ============================================================================

describe('Image Directive', () => {
  test('imageDirective should be defined', () => {
    expect(imageDirective).toBeDefined()
    expect(imageDirective.name).toBe('image')
  })

  test('createImageDirective should create directive', () => {
    const directive = createImageDirective()
    expect(directive.name).toBe('image')
    expect(directive.hasEndTag).toBe(false)
  })

  test('clearImageCache should not throw', () => {
    expect(() => clearImageCache()).not.toThrow()
  })
})

// ============================================================================
// Build Plugin Tests
// ============================================================================

describe('Build Plugin', () => {
  describe('createImagePlugin', () => {
    test('should create plugin with default options', () => {
      const plugin = createImagePlugin()
      expect(plugin.name).toBe('stx-image-optimization')
      expect(plugin.setup).toBeDefined()
      expect(plugin.buildStart).toBeDefined()
      expect(plugin.transform).toBeDefined()
      expect(plugin.buildEnd).toBeDefined()
    })

    test('should accept custom options', () => {
      const plugin = createImagePlugin({
        formats: ['avif', 'webp'],
        widths: [640, 1024],
        quality: 90,
      })
      expect(plugin.name).toBe('stx-image-optimization')
    })
  })

  describe('generateImageManifest', () => {
    test('should generate manifest from processed images', () => {
      const images = [
        {
          src: '/images/test.jpg',
          variants: [
            { path: '/a', url: '/images/test-320.webp', width: 320, height: 240, format: 'webp' as ImageFormat, size: 1000 },
          ],
          placeholder: 'rgb(128,128,128)',
          width: 800,
          height: 600,
          aspectRatio: 1.33,
          hash: 'abc123',
        },
      ]

      const manifest = generateImageManifest(images)
      expect(manifest['/images/test.jpg']).toBeDefined()
      expect(manifest['/images/test.jpg'].variants.length).toBe(1)
      expect(manifest['/images/test.jpg'].placeholder).toBe('rgb(128,128,128)')
    })
  })
})

// ============================================================================
// Configuration Tests
// ============================================================================

describe('Configuration', () => {
  test('defaultImageConfig should have required fields', () => {
    expect(defaultImageConfig.enabled).toBe(true)
    expect(Array.isArray(defaultImageConfig.widths)).toBe(true)
    expect(Array.isArray(defaultImageConfig.formats)).toBe(true)
    expect(defaultImageConfig.quality).toBe(80)
    expect(defaultImageConfig.placeholder).toBe('none')
  })

  test('defaultImageConfig widths should be sorted ascending', () => {
    const widths = defaultImageConfig.widths!
    for (let i = 1; i < widths.length; i++) {
      expect(widths[i]).toBeGreaterThan(widths[i - 1])
    }
  })

  test('defaultImageConfig formats should include webp', () => {
    expect(defaultImageConfig.formats).toContain('webp')
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration', () => {
  test('should export all required functions', () => {
    // Processor
    expect(typeof processImage).toBe('function')
    expect(typeof getImageMetadata).toBe('function')
    expect(typeof isSharpAvailable).toBe('function')
    expect(typeof generateSrcSet).toBe('function')
    expect(typeof generateSizes).toBe('function')
    expect(typeof isImageFile).toBe('function')

    // Component
    expect(typeof renderImageComponent).toBe('function')
    expect(typeof parseImageComponent).toBe('function')

    // Directive
    expect(typeof createImageDirective).toBe('function')

    // Build plugin
    expect(typeof createImagePlugin).toBe('function')
    expect(typeof optimizeDirectory).toBe('function')
  })

  test('end-to-end: parse image metadata and generate srcset', async () => {
    // Write test image
    const testFile = path.join(TEST_DIR, 'test.png')
    await fs.promises.writeFile(testFile, MINIMAL_PNG)

    // Get metadata
    const metadata = await getImageMetadata(testFile)
    expect(metadata.width).toBe(1)
    expect(metadata.height).toBe(1)

    // Generate srcset (would use processed variants in real usage)
    const variants: ImageVariant[] = [
      { path: testFile, url: '/images/test-1.webp', width: 1, height: 1, format: 'webp', size: 100 },
    ]
    const srcset = generateSrcSet(variants)
    expect(srcset).toContain('/images/test-1.webp 1w')
  })
})
