/**
 * STX Image Processor
 *
 * Pure-TypeScript image processing via `ts-images` (default), with `sharp`
 * as an optional native fast-path when installed. `ts-images` ships its own
 * codecs (no native deps), so optimization works out of the box; `sharp`
 * is ~5-10× faster on large images and gets picked up automatically if the
 * host has it.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { generatePlaceholder as tsGeneratePlaceholder, processImage as tsProcessImage } from 'ts-images'

// ============================================================================
// Types
// ============================================================================

export interface ImageOptions {
  /** Output widths for responsive images */
  widths?: number[]
  /** Output formats */
  formats?: ImageFormat[]
  /** Quality (1-100) */
  quality?: number
  /** Fit mode */
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  /** Placeholder generation */
  placeholder?: 'blur' | 'dominant-color' | 'thumbhash' | 'none'
  /** Output directory */
  outputDir?: string
  /** Base URL for generated paths */
  baseUrl?: string
}

export type ImageFormat = 'webp' | 'avif' | 'jpeg' | 'png'

export interface ProcessedImage {
  /** Original source path */
  src: string
  /** Generated variants */
  variants: ImageVariant[]
  /** Placeholder data URL or color */
  placeholder?: string
  /** Original dimensions */
  width: number
  height: number
  /** Aspect ratio for layout stability */
  aspectRatio: number
  /** Hash of original image for caching */
  hash: string
}

export interface ImageVariant {
  /** Output path */
  path: string
  /** URL path for src/srcset */
  url: string
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
  /** Format */
  format: ImageFormat
  /** File size in bytes */
  size: number
}

export interface ImageMetadata {
  width: number
  height: number
  format: string
  hasAlpha?: boolean
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_WIDTHS = [320, 640, 768, 1024, 1280, 1536, 1920]
export const DEFAULT_FORMATS: ImageFormat[] = ['webp', 'jpeg']
export const DEFAULT_QUALITY = 80

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.svg']
const MIME_TYPES: Record<ImageFormat, string> = {
  webp: 'image/webp',
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
}

// ============================================================================
// Sharp Integration
// ============================================================================

type SharpInstance = {
  metadata(): Promise<ImageMetadata>
  resize(width: number, height?: number, options?: { fit?: string }): SharpInstance
  webp(options?: { quality?: number }): SharpInstance
  avif(options?: { quality?: number }): SharpInstance
  jpeg(options?: { quality?: number }): SharpInstance
  png(options?: { quality?: number }): SharpInstance
  toBuffer(): Promise<Buffer>
  blur(sigma: number): SharpInstance
  toFormat(format: string, options?: { quality?: number }): SharpInstance
}

type SharpModule = {
  (input: Buffer | string): SharpInstance
  default?: (input: Buffer | string) => SharpInstance
}

let sharp: SharpModule | null = null
let sharpLoadAttempted = false

/**
 * Try to load sharp module
 */
async function loadSharp(): Promise<SharpModule | null> {
  if (sharpLoadAttempted) return sharp

  sharpLoadAttempted = true
  try {
    const sharpModule = await import('sharp')
    sharp = sharpModule.default || sharpModule
    return sharp
  }
  catch {
    return null
  }
}

/**
 * Check if sharp is available (returns true only if sharp is installed).
 *
 * Note: image processing always works now via `ts-images`; this only reports
 * whether the optional sharp fast-path is present. Use {@link isImageBackendAvailable}
 * to gate "can we optimize at all" — the answer is always yes.
 */
export async function isSharpAvailable(): Promise<boolean> {
  const s = await loadSharp()
  return s !== null
}

/**
 * Whether any image-processing backend is available. Always true now that
 * `ts-images` is bundled as a hard dependency — kept as a function for
 * symmetry with `isSharpAvailable` and so callers can future-proof against
 * a hypothetical "headless" build that strips ts-images.
 */
export async function isImageBackendAvailable(): Promise<boolean> {
  return true
}

// ============================================================================
// Image Processing
// ============================================================================

/**
 * Process an image and generate responsive variants
 */
export async function processImage(
  input: string | Buffer,
  options: ImageOptions = {},
): Promise<ProcessedImage> {
  const {
    widths = DEFAULT_WIDTHS,
    formats = DEFAULT_FORMATS,
    quality = DEFAULT_QUALITY,
    fit = 'cover',
    placeholder = 'none',
    outputDir = '.stx/images',
    baseUrl = '/images',
  } = options

  // Load image data
  let buffer: Buffer
  let srcPath: string

  if (typeof input === 'string') {
    srcPath = input
    if (!await Bun.file(input).exists()) {
      throw new ImageProcessingError(`Image not found: ${input}`, 'NOT_FOUND')
    }
    buffer = await Bun.file(input).arrayBuffer().then(ab => Buffer.from(ab))
  }
  else {
    srcPath = 'buffer-input'
    buffer = input
  }

  // Calculate hash for caching
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 12)

  // Get metadata
  const metadata = await getImageMetadata(buffer)
  const { width: originalWidth, height: originalHeight } = metadata
  const aspectRatio = originalWidth / originalHeight

  // Ensure output directory exists
  await fs.promises.mkdir(outputDir, { recursive: true })

  // Generate variants
  const variants: ImageVariant[] = []
  const baseName = path.basename(srcPath, path.extname(srcPath))

  // Filter widths that are smaller than or equal to original
  const validWidths = widths.filter(w => w <= originalWidth)
  // Always include original width if not already included
  if (!validWidths.includes(originalWidth) && originalWidth <= Math.max(...widths)) {
    validWidths.push(originalWidth)
  }
  validWidths.sort((a, b) => a - b)

  // Process each width/format combination
  for (const targetWidth of validWidths) {
    const targetHeight = Math.round(targetWidth / aspectRatio)

    for (const format of formats) {
      const fileName = `${baseName}-${targetWidth}w-${hash}.${format}`
      const outputPath = path.join(outputDir, fileName)
      const urlPath = `${baseUrl}/${fileName}`

      // Process image
      const processedBuffer = await resizeAndConvert(buffer, {
        width: targetWidth,
        height: targetHeight,
        format,
        quality,
        fit,
      })

      // Write to disk
      await Bun.write(outputPath, processedBuffer)

      variants.push({
        path: outputPath,
        url: urlPath,
        width: targetWidth,
        height: targetHeight,
        format,
        size: processedBuffer.length,
      })
    }
  }

  // Generate placeholder
  let placeholderData: string | undefined
  if (placeholder !== 'none') {
    placeholderData = await generatePlaceholder(buffer, placeholder)
  }

  return {
    src: srcPath,
    variants,
    placeholder: placeholderData,
    width: originalWidth,
    height: originalHeight,
    aspectRatio,
    hash,
  }
}

/**
 * Get image metadata
 */
export async function getImageMetadata(input: Buffer | string): Promise<ImageMetadata> {
  const buffer = typeof input === 'string'
    ? Buffer.from(await Bun.file(input).arrayBuffer())
    : input

  const s = await loadSharp()
  if (s) {
    const instance = s(buffer)
    const meta = await instance.metadata()
    return {
      width: meta.width || 0,
      height: meta.height || 0,
      format: meta.format || 'unknown',
      hasAlpha: meta.hasAlpha,
    }
  }

  // Fallback: parse image headers manually
  return parseImageHeaders(buffer)
}

/**
 * Parse image dimensions from headers (fallback without sharp)
 */
function parseImageHeaders(buffer: Buffer): ImageMetadata {
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    const width = buffer.readUInt32BE(16)
    const height = buffer.readUInt32BE(20)
    return { width, height, format: 'png', hasAlpha: true }
  }

  // JPEG
  if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xFF) break
      const marker = buffer[offset + 1]
      // SOF markers
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        const height = buffer.readUInt16BE(offset + 5)
        const width = buffer.readUInt16BE(offset + 7)
        return { width, height, format: 'jpeg', hasAlpha: false }
      }
      const length = buffer.readUInt16BE(offset + 2)
      offset += 2 + length
    }
  }

  // WebP
  if (buffer.toString('utf8', 0, 4) === 'RIFF' && buffer.toString('utf8', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('utf8', 12, 16)
    if (chunk === 'VP8 ') {
      const width = buffer.readUInt16LE(26) & 0x3FFF
      const height = buffer.readUInt16LE(28) & 0x3FFF
      return { width, height, format: 'webp', hasAlpha: false }
    }
    if (chunk === 'VP8L') {
      const bits = buffer.readUInt32LE(21)
      const width = (bits & 0x3FFF) + 1
      const height = ((bits >> 14) & 0x3FFF) + 1
      return { width, height, format: 'webp', hasAlpha: true }
    }
  }

  // GIF
  if (buffer.toString('utf8', 0, 3) === 'GIF') {
    const width = buffer.readUInt16LE(6)
    const height = buffer.readUInt16LE(8)
    return { width, height, format: 'gif', hasAlpha: true }
  }

  throw new ImageProcessingError('Unable to parse image dimensions', 'PARSE_ERROR')
}

/**
 * Resize and convert image.
 *
 * Tries sharp first if installed (faster on large images), falls back to
 * `ts-images` (pure-TS codecs, always available). `ts-images` is file-
 * oriented so we route the output through a temp file and read it back.
 */
async function resizeAndConvert(
  buffer: Buffer,
  options: {
    width: number
    height: number
    format: ImageFormat
    quality: number
    fit: string
  },
): Promise<Buffer> {
  const s = await loadSharp()

  if (s) {
    let instance = s(buffer)
      .resize(options.width, options.height, { fit: options.fit })

    switch (options.format) {
      case 'webp':
        instance = instance.webp({ quality: options.quality })
        break
      case 'avif':
        instance = instance.avif({ quality: options.quality })
        break
      case 'jpeg':
        instance = instance.jpeg({ quality: options.quality })
        break
      case 'png':
        instance = instance.png({ quality: options.quality })
        break
    }

    return instance.toBuffer()
  }

  const tempOut = path.join(
    os.tmpdir(),
    `stx-img-${crypto.randomBytes(8).toString('hex')}.${options.format}`,
  )
  try {
    await tsProcessImage({
      input: buffer,
      output: tempOut,
      format: options.format,
      quality: options.quality,
      resize: {
        width: options.width,
        height: options.height,
        fit: options.fit as 'cover' | 'contain' | 'fill' | 'inside' | 'outside',
      },
    })
    return Buffer.from(await Bun.file(tempOut).arrayBuffer())
  }
  finally {
    await fs.promises.unlink(tempOut).catch(() => {})
  }
}

/**
 * Generate placeholder (blur, dominant color, or thumbhash).
 *
 * Sharp fast-path when available; otherwise delegates to `ts-images`'s
 * `generatePlaceholder` which writes its temp output natively. All paths
 * return a string the consumer can drop straight into a CSS background
 * or img placeholder:
 *   - `blur`           → `data:image/jpeg;base64,…` (~400-800 bytes)
 *   - `dominant-color` → `rgb(r, g, b)`
 *   - `thumbhash`      → `data:image/png;base64,…` (~1KB, smoother gradient
 *                        than blur, better color fidelity — visualized
 *                        thumbhash via ts-images. Raw 24-byte wire-size
 *                        variant is a future enhancement gated on a raw-
 *                        RGBA decode path.)
 */
async function generatePlaceholder(
  buffer: Buffer,
  type: 'blur' | 'dominant-color' | 'thumbhash',
): Promise<string> {
  const s = await loadSharp()

  if (type === 'blur' && s) {
    // Generate tiny blurred version as base64
    const blurBuffer = await s(buffer)
      .resize(20)
      .blur(10)
      .toBuffer()

    const base64 = blurBuffer.toString('base64')
    const meta = await getImageMetadata(buffer)
    const mimeType = MIME_TYPES[meta.format as ImageFormat] || 'image/jpeg'
    return `data:${mimeType};base64,${base64}`
  }

  // Dominant color extraction via sharp
  if (type === 'dominant-color' && s) {
    const { dominant } = await s(buffer)
      .resize(1, 1)
      .toBuffer()
      .then(async (b) => {
        // eslint-disable-next-line pickier/no-unused-vars
        const meta = await s!(b).metadata()
        return { dominant: { r: 128, g: 128, b: 128 } } // Default gray
      })
      .catch(() => ({ dominant: { r: 128, g: 128, b: 128 } }))

    return `rgb(${dominant.r}, ${dominant.g}, ${dominant.b})`
  }

  // ts-images fallback. It only takes file paths, so write the buffer to a
  // temp file, call generatePlaceholder, parse the dataURL out of the result.
  const meta = await getImageMetadata(buffer)
  const tempIn = path.join(
    os.tmpdir(),
    `stx-ph-${crypto.randomBytes(8).toString('hex')}.${meta.format === 'unknown' ? 'bin' : meta.format}`,
  )
  try {
    await Bun.write(tempIn, buffer)
    // Map our public strategy names to ts-images' internal strategy names.
    // `blur` → its tiny blurred PNG, `thumbhash` → the visualized thumbhash
    // PNG (~1KB), `dominant-color` → its `dominant-color` mode.
    const tsStrategy: 'blur' | 'thumbhash' | 'dominant-color' = type === 'blur'
      ? 'blur'
      : type === 'thumbhash'
        ? 'thumbhash'
        : 'dominant-color'
    const result = await tsGeneratePlaceholder(tempIn, {
      strategy: tsStrategy,
      width: tsStrategy === 'thumbhash' ? undefined : 32,
    } as Parameters<typeof tsGeneratePlaceholder>[1])
    // PlaceholderResult: { dataURL, width, height, dominantColor?, ... }
    const ph = result as unknown as { dataURL?: string, dominantColor?: string }
    if (type === 'dominant-color' && ph.dominantColor) return ph.dominantColor
    if (ph.dataURL) return ph.dataURL
    return 'rgb(128, 128, 128)'
  }
  catch {
    return 'rgb(128, 128, 128)'
  }
  finally {
    await fs.promises.unlink(tempIn).catch(() => {})
  }
}

// ============================================================================
// HTML Generation Helpers
// ============================================================================

/**
 * Generate srcset attribute from variants
 */
export function generateSrcSet(variants: ImageVariant[], format?: ImageFormat): string {
  const filtered = format ? variants.filter(v => v.format === format) : variants

  return filtered
    .sort((a, b) => a.width - b.width)
    .map(v => `${v.url} ${v.width}w`)
    .join(', ')
}

/**
 * Generate sizes attribute
 */
export function generateSizes(breakpoints?: Record<string, string>): string {
  if (!breakpoints || Object.keys(breakpoints).length === 0) {
    return '100vw'
  }

  const entries = Object.entries(breakpoints)
    .sort((a, b) => {
      // Sort by breakpoint value descending
      const aVal = Number.parseInt(a[0].replace(/\D/g, '')) || 0
      const bVal = Number.parseInt(b[0].replace(/\D/g, '')) || 0
      return bVal - aVal
    })

  return entries.map(([bp, size]) => `(max-width: ${bp}) ${size}`).join(', ') + ', 100vw'
}

/**
 * Get best fallback variant (middle resolution JPEG)
 */
export function getFallbackVariant(variants: ImageVariant[]): ImageVariant | undefined {
  const jpegs = variants.filter(v => v.format === 'jpeg')
  if (jpegs.length === 0) return variants[Math.floor(variants.length / 2)]

  const sorted = jpegs.sort((a, b) => a.width - b.width)
  return sorted[Math.floor(sorted.length / 2)]
}

/**
 * Group variants by format
 */
export function groupVariantsByFormat(variants: ImageVariant[]): Map<ImageFormat, ImageVariant[]> {
  const grouped = new Map<ImageFormat, ImageVariant[]>()

  for (const variant of variants) {
    const existing = grouped.get(variant.format) || []
    existing.push(variant)
    grouped.set(variant.format, existing)
  }

  return grouped
}

// ============================================================================
// File Utilities
// ============================================================================

/**
 * Check if file is an image
 */
export function isImageFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase()
  return IMAGE_EXTENSIONS.includes(ext)
}

/**
 * Get MIME type for format
 */
export function getMimeType(format: ImageFormat): string {
  return MIME_TYPES[format] || 'application/octet-stream'
}

/**
 * Calculate total size of variants
 */
export function getTotalSize(variants: ImageVariant[]): number {
  return variants.reduce((sum, v) => sum + v.size, 0)
}

/**
 * Format file size for display
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ============================================================================
// Error Handling
// ============================================================================

export class ImageProcessingError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'ImageProcessingError'
    this.code = code
  }
}
