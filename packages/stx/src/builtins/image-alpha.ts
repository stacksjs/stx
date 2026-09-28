/**
 * What an image file's header says about transparency, without decoding it.
 *
 * Shared by the delivery catalog, which names alpha-capable sources under their
 * own namespace, and the placeholder warm, which can skip a decode it already
 * knows the answer to.
 */
import fs from 'node:fs'

/**
 * - `none`: the format or header rules transparency out entirely (JPEG, a PNG
 *   with no alpha channel and no `tRNS`, a WebP that declares no alpha).
 * - `possible`: the header declares an alpha channel. Every pixel may still be
 *   opaque; only a decode can say.
 * - `unknown`: the header does not settle it (AVIF, anything unrecognised).
 */
export type SourceAlpha = 'none' | 'possible' | 'unknown'

export function readAt(fd: number, position: number, length: number): Buffer {
  const buffer = Buffer.alloc(length)
  const read = fs.readSync(fd, buffer, 0, length, position)
  return buffer.subarray(0, read)
}

/**
 * Whether a WebP header declares an alpha channel.
 *
 * A simple `VP8 ` frame cannot hold one at all; `VP8X` says so in its flags and
 * `VP8L` in the `alpha_is_used` bit after the dimensions.
 */
export function webpHeaderHasAlpha(header: Uint8Array): boolean {
  if (header.length < 25) return false
  const text = (start: number, end: number) => String.fromCharCode(...header.subarray(start, end))
  if (text(0, 4) !== 'RIFF' || text(8, 12) !== 'WEBP') return false
  const chunk = text(12, 16)
  if (chunk === 'VP8X') return (header[20] & 0x10) !== 0
  if (chunk === 'VP8L') {
    const bits = header[21] | (header[22] << 8) | (header[23] << 16) | (header[24] << 24)
    return ((bits >>> 28) & 1) === 1
  }
  return false
}

/**
 * Classify a source file's transparency from its header alone.
 *
 * PNG says so with its colour type or a `tRNS` chunk (which must precede the
 * first `IDAT`, so the walk stops there and never reads pixel data). A WebP
 * `VP8 ` frame cannot carry alpha and a `VP8X` without the alpha flag declares
 * none; `VP8L`'s `alpha_is_used` bit is only a hint, so without it the answer
 * stays `unknown`. JPEG cannot carry alpha at all.
 */
export function sourceAlpha(file: string): SourceAlpha {
  let fd: number | undefined
  try {
    fd = fs.openSync(file, 'r')
    const head = readAt(fd, 0, 33)
    if (head.length >= 3 && head[0] === 0xFF && head[1] === 0xD8 && head[2] === 0xFF)
      return 'none'
    if (head.length >= 26 && head[0] === 0x89 && head.toString('latin1', 1, 4) === 'PNG') {
      const colorType = head[25]
      if (colorType === 4 || colorType === 6) return 'possible'
      let offset = 8
      for (let i = 0; i < 64; i++) {
        const chunk = readAt(fd, offset, 8)
        if (chunk.length < 8) return 'unknown'
        const type = chunk.toString('latin1', 4, 8)
        if (type === 'tRNS') return 'possible'
        if (type === 'IDAT' || type === 'IEND') return 'none'
        offset += 12 + chunk.readUInt32BE(0)
      }
      return 'unknown'
    }
    if (head.length >= 25 && head.toString('latin1', 0, 4) === 'RIFF' && head.toString('latin1', 8, 12) === 'WEBP') {
      if (webpHeaderHasAlpha(head)) return 'possible'
      const chunk = head.toString('latin1', 12, 16)
      return chunk === 'VP8 ' || chunk === 'VP8X' ? 'none' : 'unknown'
    }
    return 'unknown'
  }
  catch {
    return 'unknown'
  }
  finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}
