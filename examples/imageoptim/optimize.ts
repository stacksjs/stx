/**
 * Image optimization dispatcher.
 *
 * Detects format from magic bytes, decodes via the appropriate ts-* lib,
 * re-encodes with stronger settings, returns whichever is smaller.
 *
 * No external deps — only Bun + our own ts-{png,jpeg,webp,avif,gif,bmp,svg}.
 */

import { Buffer } from 'node:buffer'

import png from '../../../../Libraries/ts-png/src/index.ts'
import * as jpeg from '../../../../Libraries/ts-jpeg/src/index.ts'
import * as webp from '../../../../Libraries/ts-webp/src/index.ts'
import * as bmp from '../../../../Libraries/ts-bmp/src/index.ts'
import * as gif from '../../../../Libraries/ts-gif/src/index.ts'
import * as avif from '../../../../Libraries/ts-avif/src/index.ts'

export type ImageFormat =
  | 'png' | 'jpeg' | 'webp' | 'avif' | 'gif' | 'bmp' | 'svg'
  // Detected but not optimised — return passthrough with a useful note so
  // the UI can surface "no optimiser yet" instead of "unknown".
  | 'tiff' | 'ico' | 'heic'
  | 'unknown'

export interface OptimizeResult {
  format: ImageFormat
  inputSize: number
  outputSize: number
  saved: number
  savedPct: number
  bytes: Uint8Array
  /** True if the output is the same as the input (no gain). */
  passthrough: boolean
  /** Optional human-readable note (e.g. "lossless PNG re-deflate"). */
  note?: string
  /** Format-specific extra detail (e.g. AVIF's stripped item types). */
  detail?: Record<string, unknown>
}

/** Detect format from leading magic bytes. */
export function detectFormat(buf: Uint8Array): ImageFormat {
  if (buf.length < 4) return 'unknown'

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'png'

  // JPEG: FF D8 FF
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'jpeg'

  // GIF: 'GIF87a' or 'GIF89a'
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'gif'

  // BMP: 'BM'
  if (buf[0] === 0x42 && buf[1] === 0x4D) return 'bmp'

  // ICO: 00 00 01 00 (icon) — `02 00` would be cursor, both worth detecting.
  if (buf[0] === 0x00 && buf[1] === 0x00 && (buf[2] === 0x01 || buf[2] === 0x02) && buf[3] === 0x00) return 'ico'

  // TIFF: 'II' + 42 (little-endian) or 'MM' + 42 (big-endian).
  if ((buf[0] === 0x49 && buf[1] === 0x49 && buf[2] === 0x2A && buf[3] === 0x00)
    || (buf[0] === 0x4D && buf[1] === 0x4D && buf[2] === 0x00 && buf[3] === 0x2A)) {
    return 'tiff'
  }

  // RIFF...WEBP / RIFF...other
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    if (buf.length >= 12 && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
      return 'webp'
    }
  }

  // ISOBMFF box-based (AVIF / HEIC / HEIF). Skip 4-byte size, look for 'ftyp'.
  if (buf.length >= 12 && buf[4] === 0x66 && buf[5] === 0x74 && buf[6] === 0x79 && buf[7] === 0x70) {
    const brand = String.fromCharCode(buf[8], buf[9], buf[10], buf[11])
    if (brand === 'avif' || brand === 'avis') return 'avif'
    if (brand === 'heic' || brand === 'heix' || brand === 'hevc' || brand === 'hevx') return 'heic'
    // `mif1` is generic MIAF — could be either. Look at compatible-brand list.
    if (brand === 'mif1') {
      const end = Math.min(buf.length, 8 + new DataView(buf.buffer, buf.byteOffset).getUint32(0))
      for (let off = 16; off + 4 <= end; off += 4) {
        const tag = String.fromCharCode(buf[off], buf[off + 1], buf[off + 2], buf[off + 3])
        if (tag === 'avif' || tag === 'avis') return 'avif'
        if (tag === 'heic' || tag === 'heix' || tag === 'hevc' || tag === 'hevx') return 'heic'
      }
      return 'avif' // default to AVIF — most mif1-major files in the wild are AVIF
    }
  }

  // SVG: '<?xml' or '<svg' (allow leading whitespace + optional BOM)
  let i = 0
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) i = 3
  while (i < buf.length && buf[i] <= 0x20) i++
  if (buf[i] === 0x3C) {
    const head = new TextDecoder().decode(buf.subarray(i, Math.min(buf.length, i + 100))).toLowerCase()
    if (head.startsWith('<?xml') || head.startsWith('<svg') || head.startsWith('<!doctype svg')) return 'svg'
  }

  return 'unknown'
}

/** Run optimization. Returns the original bytes if no gain was possible. */
export async function optimize(input: Uint8Array, hintExt?: string): Promise<OptimizeResult> {
  const inputSize = input.length
  const detected = detectFormat(input)
  const format = detected === 'unknown' ? formatFromExt(hintExt) : detected

  let result: { bytes: Uint8Array, note?: string, detail?: Record<string, unknown> }
  try {
    result = await runFormat(format, input)
  }
  catch (err) {
    return {
      format,
      inputSize,
      outputSize: inputSize,
      saved: 0,
      savedPct: 0,
      bytes: input,
      passthrough: true,
      note: `decode/encode failed: ${(err as Error).message}`,
    }
  }

  // Only keep the new bytes if they're actually smaller.
  const winning = result.bytes.length < inputSize ? result.bytes : input
  const passthrough = winning === input
  const outputSize = winning.length
  const saved = inputSize - outputSize
  const savedPct = inputSize === 0 ? 0 : (saved / inputSize) * 100

  return {
    format,
    inputSize,
    outputSize,
    saved,
    savedPct,
    bytes: winning,
    passthrough,
    note: result.note,
    detail: result.detail,
  }
}

async function runFormat(format: ImageFormat, input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string, detail?: Record<string, unknown> }> {
  switch (format) {
    case 'png': return optimizePng(input)
    case 'jpeg': return optimizeJpeg(input)
    case 'webp': return optimizeWebp(input)
    case 'bmp': return optimizeBmp(input)
    case 'svg': return optimizeSvg(input)
    case 'gif': return optimizeGif(input)
    case 'avif': return optimizeAvif(input)
    case 'tiff': return { bytes: input, note: 'tiff passthrough (no ts-tiff lib yet)' }
    case 'ico': return { bytes: input, note: 'ico passthrough (no ts-ico lib yet)' }
    case 'heic': return { bytes: input, note: 'heic passthrough (no ts-heic decoder)' }
    default: return { bytes: input, note: 'unknown format passthrough' }
  }
}

function formatFromExt(ext?: string): ImageFormat {
  if (!ext) return 'unknown'
  const e = ext.toLowerCase().replace(/^\./, '')
  if (e === 'jpg' || e === 'jpeg') return 'jpeg'
  if (e === 'tif') return 'tiff'
  if (e === 'heif') return 'heic'
  if (e === 'png' || e === 'webp' || e === 'avif' || e === 'gif' || e === 'bmp'
    || e === 'svg' || e === 'tiff' || e === 'ico' || e === 'heic') {
    return e as ImageFormat
  }
  return 'unknown'
}

// ---------------------------------------------------------------------------
// PNG — decode then re-deflate at level 9 with strategy sweep
// ---------------------------------------------------------------------------
async function optimizePng(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string }> {
  const decoded = png.sync.read(Buffer.from(input))
  let smallest: Buffer | null = null
  // Sweep deflate strategies at level 9 and keep the smallest. We don't
  // sweep PNG filter types because ts-png's PNGSync.write doesn't expose a
  // `filterType` knob — it picks adaptively. The earlier 4×6 sweep was 4×
  // slower with identical output.
  for (const deflateStrategy of [0, 1, 2, 3]) {
    try {
      const out = png.sync.write(
        { width: decoded.width, height: decoded.height, data: decoded.data, gamma: decoded.gamma ?? 0 },
        { deflateLevel: 9, deflateStrategy } as Parameters<typeof png.sync.write>[1],
      )
      if (!smallest || out.length < smallest.length) smallest = out
    }
    catch {
      // Some strategy combos may not be supported — skip and continue.
    }
  }
  if (!smallest) return { bytes: input, note: 'png re-encode produced no candidates' }
  return { bytes: new Uint8Array(smallest.buffer, smallest.byteOffset, smallest.byteLength), note: 'png re-deflate (level 9, 4 strategies)' }
}

// ---------------------------------------------------------------------------
// JPEG — decode then re-encode at quality 85 (matches ImageOptim default)
// ---------------------------------------------------------------------------
async function optimizeJpeg(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string }> {
  const decoded = jpeg.decode(input, { useTArray: true, formatAsRGBA: true }) as { width: number, height: number, data: Uint8Array | Buffer }
  const data = decoded.data instanceof Uint8Array ? decoded.data : new Uint8Array((decoded.data as Buffer).buffer)
  const encoded = jpeg.encode({ width: decoded.width, height: decoded.height, data }, 85)
  const buf = encoded.data
  const u8 = buf instanceof Uint8Array ? buf : new Uint8Array((buf as { buffer: ArrayBufferLike }).buffer)
  return { bytes: u8, note: 'jpeg q=85 re-encode (note: drops EXIF / orientation)' }
}

// ---------------------------------------------------------------------------
// WebP — decode then re-encode lossless (matches ImageOptim's WebP behaviour)
// ---------------------------------------------------------------------------
async function optimizeWebp(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string }> {
  const decoded = webp.decode(input)
  const out = webp.encode(decoded, { lossless: true })
  return { bytes: out, note: 'webp lossless re-encode' }
}

// ---------------------------------------------------------------------------
// BMP — decode then re-encode (BMP is mostly uncompressed; rarely a win)
// ---------------------------------------------------------------------------
async function optimizeBmp(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string }> {
  const decoded = bmp.decode(input)
  // Drop alpha if the image is fully opaque — saves ~25 % on RGBA bitmaps.
  const fullyOpaque = isFullyOpaque(decoded.data)
  const out = bmp.encode(decoded, { bitsPerPixel: fullyOpaque ? 24 : 32 })
  return { bytes: out, note: fullyOpaque ? 'bmp re-encode (drop alpha)' : 'bmp re-encode' }
}

function isFullyOpaque(rgba: Uint8Array): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] !== 0xFF) return false
  }
  return true
}

// ---------------------------------------------------------------------------
// GIF — palette tightening + global-palette consolidation (lossless)
// ---------------------------------------------------------------------------
async function optimizeGif(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string }> {
  const out = gif.optimize(input)
  return { bytes: out, note: 'gif palette tighten + global consolidate' }
}

// ---------------------------------------------------------------------------
// AVIF — lossless ISOBMFF re-mux (strip Exif/XMP/thumbnails/extra brands)
// ---------------------------------------------------------------------------
async function optimizeAvif(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string, detail?: Record<string, unknown> }> {
  const result = avif.optimizeWithStats(input)
  const droppedTypes = result.stats.droppedItemTypes
  const note = droppedTypes.length > 0
    ? `avif strip ${droppedTypes.join(', ')}`
    : 'avif container re-mux'
  return {
    bytes: result.bytes,
    note,
    detail: {
      keptItemIds: result.stats.keptItemIds,
      droppedItemIds: result.stats.droppedItemIds,
      droppedItemTypes: droppedTypes,
    },
  }
}

// ---------------------------------------------------------------------------
// SVG — pure-text minifier (no svgo dep). Conservative: comments, whitespace,
// XML declaration, doctype. Leaves attribute values + CDATA contents alone.
// ---------------------------------------------------------------------------
async function optimizeSvg(input: Uint8Array): Promise<{ bytes: Uint8Array, note?: string }> {
  let svg = new TextDecoder().decode(input)
  // Strip BOM
  if (svg.charCodeAt(0) === 0xFEFF) svg = svg.slice(1)

  // Walk the document and skip the body of every <![CDATA[ ... ]]> block,
  // so we don't strip HTML-style comments inside embedded <style> or
  // <script> CDATA sections (which corrupt CSS / JS).
  svg = mapOutsideCdata(svg, (chunk) => {
    let s = chunk
    s = s.replace(/<!--[\s\S]*?-->/g, '')
    s = s.replace(/<\?xml[\s\S]*?\?>/g, '')
    s = s.replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    s = s.replace(/>\s+</g, '><')
    s = s.replace(/\s{2,}/g, ' ')
    return s
  })

  return { bytes: new TextEncoder().encode(svg.trim()), note: 'svg text minify' }
}

/** Run `transform` over every part of `input` that is OUTSIDE a CDATA section. */
function mapOutsideCdata(input: string, transform: (chunk: string) => string): string {
  const open = '<![CDATA['
  const close = ']]>'
  let result = ''
  let i = 0
  while (i < input.length) {
    const cdataStart = input.indexOf(open, i)
    if (cdataStart === -1) {
      result += transform(input.slice(i))
      break
    }
    result += transform(input.slice(i, cdataStart))
    const cdataEnd = input.indexOf(close, cdataStart + open.length)
    if (cdataEnd === -1) {
      // Unterminated CDATA — preserve the rest verbatim.
      result += input.slice(cdataStart)
      break
    }
    // Preserve the CDATA section (including delimiters) byte-for-byte.
    result += input.slice(cdataStart, cdataEnd + close.length)
    i = cdataEnd + close.length
  }
  return result
}
