/**
 * Generate the extension's PNG icons (stacksjs/stx#1754).
 *
 * Chrome requires real PNGs at 16/32/48/128 — an SVG will not do — and the
 * repo had no icons at all, which is a hard blocker on store submission.
 *
 * Written as a dependency-free encoder rather than pulling in an image library
 * for four flat squares. `Bun.deflateSync` supplies the zlib stream a PNG IDAT
 * needs, and CRC32 is a dozen lines; the whole thing is deterministic, so the
 * committed icons can be regenerated and diffed.
 *
 * Run: bun scripts/gen-icons.ts
 */

import fs from 'node:fs'
import path from 'node:path'

/** stx's progress-bar cyan — the one brand colour the runtime already ships. */
const BRAND: [number, number, number] = [0x78, 0xDC, 0xE8]
const BACKDROP: [number, number, number] = [0x14, 0x18, 0x22]

const SIZES = [16, 32, 48, 128]

function crc32(bytes: Uint8Array): number {
  let crc = ~0
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i]
    for (let bit = 0; bit < 8; bit++)
      crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1))
  }
  return ~crc >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const body = new Uint8Array(typeBytes.length + data.length)
  body.set(typeBytes, 0)
  body.set(data, typeBytes.length)

  const out = new Uint8Array(8 + data.length + 4)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out.set(body, 4)
  view.setUint32(4 + body.length, crc32(body))
  return out
}

/**
 * Encode RGBA pixels as a PNG.
 *
 * Filter byte 0 (None) on every scanline — the images are flat colour, so a
 * predictor would buy nothing and cost clarity.
 */
function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1)
  }

  const ihdr = new Uint8Array(13)
  const ihdrView = new DataView(ihdr.buffer)
  ihdrView.setUint32(0, width)
  ihdrView.setUint32(4, height)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA
  ihdr[10] = 0 // deflate
  ihdr[11] = 0 // adaptive filtering
  ihdr[12] = 0 // no interlace

  const parts = [
    new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', Bun.deflateSync(raw)),
    chunk('IEND', new Uint8Array(0)),
  ]

  const total = parts.reduce((n, p) => n + p.length, 0)
  const png = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    png.set(part, offset)
    offset += part.length
  }
  return png
}

/**
 * Draw the mark: a rounded backdrop with a bracketed signal glyph.
 *
 * Deliberately simple geometry — it has to stay legible at 16px, where anything
 * with interior detail turns to mud in the toolbar.
 */
function drawIcon(size: number): Uint8Array {
  const rgba = new Uint8Array(size * size * 4)
  const radius = Math.max(2, Math.round(size * 0.22))
  const bar = Math.max(1, Math.round(size * 0.11))
  const inset = Math.round(size * 0.24)

  const put = (x: number, y: number, [r, g, b]: [number, number, number], a = 255) => {
    const i = (y * size + x) * 4
    rgba[i] = r
    rgba[i + 1] = g
    rgba[i + 2] = b
    rgba[i + 3] = a
  }

  const insideRounded = (x: number, y: number) => {
    const nx = Math.min(x, size - 1 - x)
    const ny = Math.min(y, size - 1 - y)
    if (nx >= radius || ny >= radius)
      return true
    const dx = radius - nx
    const dy = radius - ny
    return dx * dx + dy * dy <= radius * radius
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!insideRounded(x, y)) {
        put(x, y, BACKDROP, 0)
        continue
      }
      put(x, y, BACKDROP)
    }
  }

  // Left and right brackets, and a centre bar — reads as "[ | ]", a template
  // expression, at every size.
  for (let y = inset; y < size - inset; y++) {
    for (let t = 0; t < bar; t++) {
      put(inset + t, y, BRAND)
      put(size - 1 - inset - t, y, BRAND)
    }
  }
  for (let t = 0; t < bar; t++) {
    for (let x = inset; x < inset + bar * 2; x++) {
      put(x, inset + t, BRAND)
      put(x, size - 1 - inset - t, BRAND)
    }
    for (let x = size - inset - bar * 2; x < size - inset; x++) {
      put(x, inset + t, BRAND)
      put(x, size - 1 - inset - t, BRAND)
    }
  }
  const mid = Math.floor(size / 2) - Math.floor(bar / 2)
  for (let y = inset + bar * 2; y < size - inset - bar * 2; y++) {
    for (let t = 0; t < bar; t++)
      put(mid + t, y, BRAND)
  }

  return rgba
}

const outDir = path.join(import.meta.dir, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

for (const size of SIZES) {
  const png = encodePng(size, size, drawIcon(size))
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png)
  console.log(`icon-${size}.png  ${png.length} bytes`)
}
