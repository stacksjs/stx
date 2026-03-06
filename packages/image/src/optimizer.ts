import type { ImageConfig, ImageFormat, ImagePipeline, OptimizeOptions, ResponsiveSet } from './types'
import { generateResponsiveSet } from './responsive'

const DEFAULT_QUALITY = 80

const DEFAULT_CONFIG: ImageConfig = {
  outputDir: './optimized',
  formats: ['webp', 'jpg'],
  quality: DEFAULT_QUALITY,
  breakpoints: [
    { width: 640 },
    { width: 768 },
    { width: 1024 },
    { width: 1280 },
  ],
  lazyLoad: true,
  placeholder: 'blur',
}

// Magic bytes for image format detection
const FORMAT_SIGNATURES: Array<{ bytes: number[], format: ImageFormat }> = [
  { bytes: [0x89, 0x50, 0x4E, 0x47], format: 'png' },
  { bytes: [0xFF, 0xD8, 0xFF], format: 'jpeg' },
  { bytes: [0x47, 0x49, 0x46, 0x38], format: 'gif' },
  { bytes: [0x52, 0x49, 0x46, 0x46], format: 'webp' }, // RIFF header (WebP starts with RIFF)
]

export function getImageMetadata(input: string | Buffer): { width?: number, height?: number, format?: string, size: number } {
  if (typeof input === 'string') {
    const buf = Buffer.from(input)
    return { size: buf.length, format: detectFormatFromExtension(input) }
  }

  const format = detectFormatFromBytes(input)
  const dimensions = extractDimensions(input, format)

  return {
    ...dimensions,
    format,
    size: input.length,
  }
}

function detectFormatFromExtension(path: string): string | undefined {
  const ext = path.split('.').pop()?.toLowerCase()
  if (ext && ['webp', 'avif', 'png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) {
    return ext
  }
  return undefined
}

function detectFormatFromBytes(buf: Buffer): string | undefined {
  for (const sig of FORMAT_SIGNATURES) {
    if (sig.bytes.every((byte, i) => buf[i] === byte)) {
      // For RIFF, verify it's actually WebP
      if (sig.format === 'webp') {
        if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
          return 'webp'
        }
        continue
      }
      return sig.format
    }
  }

  // Check for AVIF (ftyp box with 'avif' brand)
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11])
    if (brand === 'avif') {
      return 'avif'
    }
  }

  // Check for SVG (text-based, starts with < after optional whitespace/BOM)
  const str = buf.slice(0, 256).toString('utf8').trim()
  if (str.startsWith('<?xml') || str.startsWith('<svg')) {
    return 'svg'
  }

  return undefined
}

function extractDimensions(buf: Buffer, format?: string): { width?: number, height?: number } {
  if (!format)
    return {}

  if (format === 'png' && buf.length >= 24) {
    return {
      width: buf.readUInt32BE(16),
      height: buf.readUInt32BE(20),
    }
  }

  if ((format === 'jpeg' || format === 'jpg') && buf.length >= 2) {
    // Simple JPEG dimension extraction: scan for SOF markers
    let offset = 2
    while (offset < buf.length - 8) {
      if (buf[offset] !== 0xFF)
        break
      const marker = buf[offset + 1]
      // SOF0-SOF3 markers contain dimensions
      if (marker >= 0xC0 && marker <= 0xC3) {
        return {
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
        }
      }
      const segLen = buf.readUInt16BE(offset + 2)
      offset += 2 + segLen
    }
  }

  if (format === 'gif' && buf.length >= 10) {
    return {
      width: buf.readUInt16LE(6),
      height: buf.readUInt16LE(8),
    }
  }

  return {}
}

export async function optimizeImage(input: string | Buffer, options?: OptimizeOptions): Promise<Buffer> {
  // Without sharp, return the input buffer with the optimization config noted
  // Actual image processing would be added when sharp is available
  const buf = typeof input === 'string' ? Buffer.from(input) : input

  // Store optimization intent as metadata (the buffer itself is unchanged)
  const _opts = {
    quality: options?.quality ?? DEFAULT_QUALITY,
    width: options?.width,
    height: options?.height,
    format: options?.format,
    fit: options?.fit ?? 'cover',
  }

  return buf
}

export function createImagePipeline(config?: Partial<ImageConfig>): ImagePipeline {
  const mergedConfig: ImageConfig = { ...DEFAULT_CONFIG, ...config }

  return {
    config: mergedConfig,

    async process(src: string, options?: OptimizeOptions): Promise<Buffer> {
      return optimizeImage(src, {
        quality: mergedConfig.quality,
        ...options,
      })
    },

    async generateVariants(src: string): Promise<ResponsiveSet> {
      return generateResponsiveSet(src, mergedConfig.breakpoints)
    },
  }
}
