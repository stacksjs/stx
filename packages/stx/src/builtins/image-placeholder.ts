/**
 * Real placeholders for `<StxImage>`, derived from the image's own pixels.
 *
 * `placeholder="blur"` used to render a flat grey rectangle — the same one for
 * every image on the page, because the component had no way to look at the file
 * it was pointing at. It renders synchronously; reading and decoding a JPEG does
 * not. So the work moves earlier: the build warms a cache from disk, and the
 * component reads it with a synchronous lookup.
 *
 * What lands in the HTML is a thumbhash (evanw/thumbhash) rendered as a blurred
 * SVG mesh, with the image's average colour painted underneath it. Both are
 * inline, so there is no second request and nothing to wait for — and no
 * JavaScript, which is the point. A placeholder that needs a script has already
 * lost to the image it was supposed to cover for.
 *
 * Size was the deciding constraint. thumbhash's own 32×32 PNG is ~4.2KB per
 * image; nine of those roughly doubles a page here. The mesh below carries the
 * same information as twelve colours and gzips against its neighbours, because
 * every one of them is the same markup with different hex — about 480 bytes for
 * nine images, against 3.3KB for the PNGs.
 *
 * @module builtins/image-placeholder
 */

import fs from 'node:fs'
import path from 'node:path'

/** A placeholder ready to be dropped into markup. */
export interface ImagePlaceholder {
  /** `data:image/svg+xml;base64,…` — the blurred mesh. */
  dataUrl: string
  /** `#rrggbb` average, painted under the mesh and used alone as a fallback. */
  color: string
}

/** Extensions worth deriving a placeholder from. */
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])

/**
 * Resolved placeholders, keyed by the URL path a template writes
 * (`/images/hero.jpg`) rather than the file path, because that is all the
 * component knows at render time.
 */
const placeholders = new Map<string, ImagePlaceholder>()

/** Whether a warm has run, so the component can stay quiet when it has not. */
let warmed = false

/**
 * The placeholder for `src`, or undefined when there is none.
 *
 * Synchronous by requirement: builtin components render inside a synchronous
 * pass. A miss is normal and never an error — an unwarmed build, an image
 * outside the public directory, or a remote URL all land here, and the caller
 * falls back to what it did before.
 */
export function getImagePlaceholder(src: string): ImagePlaceholder | undefined {
  if (!src) return undefined
  // Ignore a query string or fragment; the file on disk has neither.
  const clean = src.split('?')[0].split('#')[0]
  return placeholders.get(clean)
}

/** Whether {@link warmImagePlaceholders} has run in this process. */
export function placeholdersWarmed(): boolean {
  return warmed
}

/** Drop everything, for tests and for a watch-mode rebuild. */
export function clearImagePlaceholders(): void {
  placeholders.clear()
  warmed = false
}

/**
 * Register a placeholder directly. Used by the warm below, and by tests that
 * would rather not decode a real JPEG to check the markup.
 */
export function setImagePlaceholder(urlPath: string, placeholder: ImagePlaceholder): void {
  placeholders.set(urlPath, placeholder)
  warmed = true
}

/** Average colour of a decoded thumbhash, as `#rrggbb`. */
function averageColor(rgba: Uint8Array | Uint8ClampedArray | number[]): string {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i < rgba.length; i += 4) {
    r += rgba[i]
    g += rgba[i + 1]
    b += rgba[i + 2]
    n++
  }
  if (n === 0) return '#e5e7eb'
  const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

/**
 * A blurred SVG mesh from decoded thumbhash pixels.
 *
 * Four by three is deliberate. It is enough cells to carry where the light and
 * the subject are — which is all a placeholder has to say — and few enough that
 * the markup stays shorter than the image it stands in for. The Gaussian blur
 * does the rest, so the cell edges never show.
 */
export function meshSvg(
  rgba: Uint8Array | Uint8ClampedArray | number[],
  width: number,
  height: number,
  cols = 4,
  rows = 3,
): string {
  const cells: string[] = []

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const x0 = Math.floor((x * width) / cols)
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * width) / cols))
      const y0 = Math.floor((y * height) / rows)
      const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * height) / rows))

      let r = 0
      let g = 0
      let b = 0
      let n = 0
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * width + xx) * 4
          r += rgba[i]
          g += rgba[i + 1]
          b += rgba[i + 2]
          n++
        }
      }
      const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, '0')
      cells.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="#${hex(r)}${hex(g)}${hex(b)}"/>`)
    }
  }

  // `preserveAspectRatio="none"` so the mesh stretches to whatever box the
  // image occupies rather than letter-boxing inside it.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols} ${rows}" preserveAspectRatio="none">`
    + `<filter id="b"><feGaussianBlur stdDeviation=".6"/></filter>`
    + `<g filter="url(#b)">${cells.join('')}</g></svg>`
}

/** Base64 rather than percent-encoding: the same SVG, roughly 400 bytes shorter. */
export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

/** On-disk cache entry, so a rebuild does not decode the same file twice. */
interface CacheEntry {
  mtimeMs: number
  size: number
  dataUrl: string
  color: string
}

function readCache(cachePath: string): Record<string, CacheEntry> {
  try {
    return JSON.parse(fs.readFileSync(cachePath, 'utf8')) as Record<string, CacheEntry>
  }
  catch {
    return {}
  }
}

function writeCache(cachePath: string, cache: Record<string, CacheEntry>): void {
  try {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true })
    fs.writeFileSync(cachePath, JSON.stringify(cache))
  }
  catch {
    // A cache we cannot write is a slower build, not a broken one.
  }
}

/** Every image file under `dir`, as [urlPath, filePath] pairs. */
function collectImages(dir: string, baseUrl: string, out: Array<[string, string]> = []): Array<[string, string]> {
  let entries: fs.Dirent[]
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  }
  catch {
    return out
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectImages(full, `${baseUrl}/${entry.name}`, out)
      continue
    }
    if (!IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
    out.push([`${baseUrl}/${entry.name}`, full])
  }

  return out
}

export interface WarmOptions {
  /** Where the on-disk cache lives. Omit to recompute every build. */
  cachePath?: string
  /** Skip files larger than this. Decoding a 40MB source costs more than it returns. */
  maxBytes?: number
  /** Stop after this many images, so an enormous asset tree cannot stall a build. */
  limit?: number
}

/**
 * Derive placeholders for every image under `publicDir` and hold them for
 * {@link getImagePlaceholder}.
 *
 * Called once per build, before any page renders. Failures are per-file and
 * silent by design: a placeholder is decoration, and one unreadable image must
 * not take a build down with it.
 *
 * Returns how many placeholders are available afterwards.
 */
export async function warmImagePlaceholders(
  publicDir: string,
  options: WarmOptions = {},
): Promise<number> {
  const { cachePath, maxBytes = 32 * 1024 * 1024, limit = 2000 } = options

  if (!publicDir || !fs.existsSync(publicDir)) {
    warmed = true
    return placeholders.size
  }

  let tsImages: typeof import('ts-images')
  try {
    tsImages = await import('ts-images')
  }
  catch {
    // Without the codec there is nothing to derive from. The component keeps
    // its previous behaviour rather than failing.
    warmed = true
    return placeholders.size
  }

  const cache = cachePath ? readCache(cachePath) : {}
  let cacheDirty = false

  const images = collectImages(publicDir, '').slice(0, limit)

  // In batches rather than all at once. Decoding is native work that does not
  // yield, so a hundred of them in flight together pins the loop — long enough,
  // on a server, that everything else still starting up simply stops. Eight
  // keeps the machine busy without taking it over.
  const CONCURRENCY = 8

  const derive = async ([urlPath, filePath]: [string, string]) => {
    let stat: fs.Stats
    try {
      stat = fs.statSync(filePath)
    }
    catch {
      return
    }
    if (stat.size > maxBytes) return

    const cached = cache[urlPath]
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) {
      placeholders.set(urlPath, { dataUrl: cached.dataUrl, color: cached.color })
      return
    }

    try {
      const { hash } = await tsImages.generateThumbHash(filePath)
      if (!hash) return
      const { rgba, w, h } = tsImages.thumbHashToRGBA(hash)
      const placeholder: ImagePlaceholder = {
        dataUrl: svgDataUrl(meshSvg(rgba, w, h)),
        color: averageColor(rgba),
      }
      placeholders.set(urlPath, placeholder)
      cache[urlPath] = { mtimeMs: stat.mtimeMs, size: stat.size, ...placeholder }
      cacheDirty = true
    }
    catch {
      // Unreadable or an unsupported codec — no placeholder for this one.
    }
  }

  for (let i = 0; i < images.length; i += CONCURRENCY)
    await Promise.all(images.slice(i, i + CONCURRENCY).map(derive))

  if (cachePath && cacheDirty) writeCache(cachePath, cache)

  warmed = true
  return placeholders.size
}
