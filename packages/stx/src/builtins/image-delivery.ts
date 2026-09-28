import type { ImageDeliveryManifest, ImageDeliveryStorage } from 'ts-images/delivery'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { decode, generateThumbHash } from 'ts-images'
import { createImageDeliveryCatalog } from 'ts-images/delivery'

const RASTER_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp'])
const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920] as const
const DELIVERY_URL = '/_stx/images'

/**
 * Namespace for sources that can carry transparency.
 *
 * Variant filenames hash the source bytes and the encode options, not the
 * encoder, so a WebP written by an encoder that dropped alpha (ts-webp before
 * 0.1.6 wrote a plain lossy `VP8 ` frame) kept its name after the encoder was
 * fixed. The delivery directory reused it on every boot, and a browser or CDN
 * that had fetched it holds it for a year under `immutable`. Giving alpha
 * sources their own namespace moves them to new URLs once, which neither the
 * disk cache nor any HTTP cache has ever seen an opaque copy of.
 */
const ALPHA_NAMESPACE = `stx:${DELIVERY_URL}:alpha-1`

let deliveryCatalog = new Map<string, ImageDeliveryManifest>()

/** Catalog keys whose source has visible transparency. */
let transparentSources = new Set<string>()

/** Stale-variant warnings already printed, so a watch rebuild does not repeat them. */
const warnedOpaqueWebp = new Set<string>()

function publicUrl(relativePath: string): string {
  return `/${relativePath.split(path.sep).map(encodeURIComponent).join('/')}`
}

function catalogName(relativePath: string): string {
  const extension = path.extname(relativePath)
  const readable = relativePath
    .slice(0, -extension.length)
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const pathHash = createHash('sha256').update(relativePath).digest('hex').slice(0, 8)
  return `${readable || 'image'}-${pathHash}`
}

/**
 * Where delivery variants are written, and — crucially — under what identity.
 *
 * ts-images folds `storage.cacheNamespace` into the content hash that names
 * every variant, and its built-in local adapter builds that namespace out of
 * the absolute output directory. That is stable for a checkout that lives in
 * one place forever and wrong for anything deploying atomic releases, where
 * the same tree is served from a new absolute path every time:
 *
 *   releases/<sha-1>/…/_stx/images  ->  hero-6f21e0aa-44338d78039b57e4-640.webp
 *   releases/<sha-2>/…/_stx/images  ->  hero-6f21e0aa-301f828bdc402f4a-640.webp
 *
 * Same bytes, same encode options, different filename — so `stat()` misses for
 * every variant, a warm cache carried over from the previous release is never
 * read, and each deploy re-encodes the entire public directory while the old
 * generation stays on disk forever. On a site with a couple of hundred source
 * images that is minutes of CPU during which the server is bound but cannot
 * answer, repeated per deploy, plus unbounded disk growth.
 *
 * The namespace below describes what the variant *is* — the URL space it is
 * published into — and not where this particular release happens to write it.
 * Two builds of identical bytes therefore agree on the filename, which is what
 * makes the on-disk cache reusable at all.
 */
function deliveryStorage(outDir: string, cacheNamespace = `stx:${DELIVERY_URL}`): ImageDeliveryStorage {
  const url = (key: string) => `${DELIVERY_URL}/${key.split('/').map(encodeURIComponent).join('/')}`

  return {
    cacheNamespace,
    async stat(key) {
      const file = path.join(outDir, key)
      try {
        const stats = await fs.promises.stat(file)
        // A zero-byte file is a half-finished write from a previous run that
        // was killed mid-encode. Treat it as absent so it gets rewritten
        // rather than served as a broken image forever.
        return stats.size > 0 ? { bytes: stats.size, path: file, url: url(key) } : null
      }
      catch {
        return null
      }
    },
    async write(key, bytes) {
      const file = path.join(outDir, key)
      await fs.promises.mkdir(path.dirname(file), { recursive: true })
      // Write-then-rename: a reader that arrives mid-write sees either the
      // old file or the new one, never a truncated one. The delivery directory
      // is commonly shared between a running server and a build.
      const pending = `${file}.${process.pid}.tmp`
      await fs.promises.writeFile(pending, bytes)
      await fs.promises.rename(pending, file)
      return { bytes: bytes.byteLength, path: file, url: url(key) }
    },
    url,
  }
}

async function collectRasterImages(root: string, directory = root): Promise<Array<{ absolutePath: string, relativePath: string }>> {
  const entries = await fs.promises.readdir(directory, { withFileTypes: true })
  entries.sort((a, b) => a.name.localeCompare(b.name))

  const files: Array<{ absolutePath: string, relativePath: string }> = []
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectRasterImages(root, absolutePath))
      continue
    }
    if (!entry.isFile() || !RASTER_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue
    files.push({ absolutePath, relativePath: path.relative(root, absolutePath) })
  }
  return files
}

type RasterFile = Awaited<ReturnType<typeof collectRasterImages>>[number]

function deliveryEntries(files: RasterFile[], alphaStorage: ImageDeliveryStorage) {
  return files.map(file => ({
    key: publicUrl(file.relativePath),
    input: file.absolutePath,
    name: catalogName(file.relativePath),
    ...(mayHaveAlpha(file.absolutePath) ? { options: { storage: alphaStorage } } : {}),
  }))
}

function readAt(fd: number, position: number, length: number): Buffer {
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
 * Whether a source file can carry transparency, from its header alone.
 *
 * Read before the catalog is built, since the answer picks the namespace the
 * variants are named under. PNG says so with its colour type or a `tRNS` chunk
 * (which must precede the first `IDAT`, so the walk stops there and never reads
 * pixel data). JPEG cannot; AVIF is left to the decode that follows.
 */
function mayHaveAlpha(file: string): boolean {
  let fd: number | undefined
  try {
    fd = fs.openSync(file, 'r')
    const head = readAt(fd, 0, 33)
    if (head.length >= 26 && head[0] === 0x89 && head.toString('latin1', 1, 4) === 'PNG') {
      const colorType = head[25]
      if (colorType === 4 || colorType === 6) return true
      let offset = 8
      for (let i = 0; i < 64; i++) {
        const chunk = readAt(fd, offset, 8)
        if (chunk.length < 8) return false
        const type = chunk.toString('latin1', 4, 8)
        if (type === 'tRNS') return true
        if (type === 'IDAT' || type === 'IEND') return false
        offset += 12 + chunk.readUInt32BE(0)
      }
      return false
    }
    if (head.length >= 25 && head.toString('latin1', 0, 4) === 'RIFF')
      return webpHeaderHasAlpha(head)
    return false
  }
  catch {
    return false
  }
  finally {
    if (fd !== undefined) fs.closeSync(fd)
  }
}

function hasVisibleAlpha(rgba: Uint8Array | Uint8ClampedArray): boolean {
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] !== 255) return true
  }
  return false
}

/**
 * Which catalog entries are really transparent, not just alpha-capable.
 *
 * ts-images falls back to PNG exactly when the decoded source has an alpha
 * channel, so only those are candidates; plenty of them are RGBA exports with
 * every pixel opaque. The smallest PNG variant answers that for a fraction of
 * the cost of the source.
 */
async function findTransparent(entries: Record<string, ImageDeliveryManifest>): Promise<Set<string>> {
  const candidates = Object.entries(entries).filter(([, manifest]) => manifest.fallback.format === 'png')
  const transparent = new Set<string>()
  const concurrency = 8

  for (let offset = 0; offset < candidates.length; offset += concurrency) {
    await Promise.all(candidates.slice(offset, offset + concurrency).map(async ([key, manifest]) => {
      const smallest = manifest.variants
        .filter(variant => variant.format === 'png')
        .sort((a, b) => a.width - b.width)[0]
      try {
        // The ambient `ts-images` declaration (ts-images.d.ts) still types
        // `decode` as returning bytes; at runtime it is RGBA ImageData.
        const image = await decode(new Uint8Array(await fs.promises.readFile(smallest?.path ?? manifest.fallback.path))) as unknown as { data: Uint8Array }
        if (hasVisibleAlpha(image.data)) transparent.add(key)
      }
      catch {
        // Unreadable here means unknown. Assume transparent: the cost of being
        // wrong is a missing placeholder, not an opaque box over the page.
        transparent.add(key)
      }
    }))
  }

  return transparent
}

/**
 * Drop WebP variants of a transparent source that cannot show transparency.
 *
 * An encoder without alpha support writes a plain `VP8 ` frame and the
 * browser, picking the first `<source>` it understands, paints the
 * transparent pixels solid. The PNG fallback is always right, so serve that
 * instead. Returns the keys that lost their WebP family.
 */
function dropOpaqueWebp(entries: Record<string, ImageDeliveryManifest>, transparent: Set<string>): string[] {
  const dropped: string[] = []

  for (const key of transparent) {
    const manifest = entries[key]
    const webp = manifest?.variants.filter(variant => variant.format === 'webp') ?? []
    if (!manifest || webp.length === 0) continue

    const opaque = webp.some((variant) => {
      let fd: number | undefined
      try {
        fd = fs.openSync(variant.path, 'r')
        return !webpHeaderHasAlpha(readAt(fd, 0, 32))
      }
      catch {
        return true
      }
      finally {
        if (fd !== undefined) fs.closeSync(fd)
      }
    })
    if (!opaque) continue

    manifest.variants = manifest.variants.filter(variant => variant.format !== 'webp')
    delete manifest.sources.webp
    dropped.push(key)

    if (!warnedOpaqueWebp.has(key)) {
      warnedOpaqueWebp.add(key)
      console.warn(`[stx-images] ${key} is transparent but its WebP variants have no alpha channel; serving PNG instead. Upgrade @stacksjs/ts-webp to 0.1.6 or later.`)
    }
  }

  return dropped
}

async function decodableFiles(files: RasterFile[]): Promise<RasterFile[]> {
  const supported: RasterFile[] = []
  const concurrency = 8

  for (let offset = 0; offset < files.length; offset += concurrency) {
    const batch = files.slice(offset, offset + concurrency)
    const results = await Promise.all(batch.map(async (file) => {
      try {
        await generateThumbHash(file.absolutePath)
        return file
      }
      catch {
        console.warn(`[stx-images] Skipping unreadable raster: ${file.relativePath}`)
        return null
      }
    }))
    supported.push(...results.filter((file): file is RasterFile => file !== null))
  }

  return supported
}

/**
 * Rasters that could not be decoded last time, by path and stat identity.
 *
 * A single corrupt file makes `createImageDeliveryCatalog` reject the whole
 * batch, and the recovery below costs a full decode of every file plus a
 * second catalog build. Nothing about that changes on the next boot — the file
 * is still corrupt — so without a record the server pays it forever. This is
 * that record: the next boot filters the known-bad out before the first
 * attempt and takes the single-pass path.
 *
 * Keyed by mtime and size like the placeholder cache, so replacing a bad file
 * with a good one retries it.
 */
interface UndecodableRecord { mtimeMs: number, size: number }
type UndecodableCache = Record<string, UndecodableRecord>

/**
 * Sits beside the variant directory rather than inside it: everything under
 * `<outputDir>/_stx/images` is served at `/_stx/images`, and this is internal
 * bookkeeping, not a public asset.
 */
function undecodableCachePath(outputDir: string): string {
  return path.join(outputDir, 'undecodable.json')
}

function readUndecodableCache(outputDir: string): UndecodableCache {
  try {
    const raw = fs.readFileSync(undecodableCachePath(outputDir), 'utf-8')
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as UndecodableCache : {}
  }
  catch {
    // Absent, unreadable or corrupt: worth nothing, costs a slow boot at most.
    return {}
  }
}

function writeUndecodableCache(outputDir: string, cache: UndecodableCache): void {
  try {
    fs.mkdirSync(path.dirname(undecodableCachePath(outputDir)), { recursive: true })
    fs.writeFileSync(undecodableCachePath(outputDir), JSON.stringify(cache))
  }
  catch {
    // A cache we cannot persist is a slower boot, not a failure.
  }
}

function statIdentity(absolutePath: string): UndecodableRecord | undefined {
  try {
    const stats = fs.statSync(absolutePath)
    return { mtimeMs: stats.mtimeMs, size: stats.size }
  }
  catch {
    return undefined
  }
}

function normalizeLookupSource(src: string): string | undefined {
  if (!src || src.startsWith('data:') || src.startsWith('blob:') || /^https?:\/\//i.test(src) || src.startsWith('//')) return undefined
  const sourcePath = src.split(/[?#]/, 1)[0]
  if (!sourcePath) return undefined

  try {
    return `/${sourcePath.replace(/^\/+/, '').split('/').map(decodeURIComponent).map(encodeURIComponent).join('/')}`
  }
  catch {
    return undefined
  }
}

/** Return build-time delivery metadata for one public image URL. */
export function getImageDelivery(src: string): ImageDeliveryManifest | undefined {
  const key = normalizeLookupSource(src)
  return key ? deliveryCatalog.get(key) : undefined
}

/**
 * Whether the delivered image at `src` has transparent pixels.
 *
 * Anything painted behind such an image shows through it for as long as it is
 * there, so a placeholder has to stay out of it entirely.
 */
export function isTransparentImage(src: string): boolean {
  const key = normalizeLookupSource(src)
  return key ? transparentSources.has(key) : false
}

/** Clear process-global delivery state between builds and tests. */
export function clearImageDeliveryCatalog(): void {
  deliveryCatalog = new Map()
  transparentSources = new Set()
}

/**
 * Optimize every raster in the public directory before templates render.
 *
 * The builtin render pass is synchronous, so it consumes this in-memory
 * catalog. Its content fingerprint is folded into the SSG cache key to ensure
 * changing image bytes can never reuse HTML pointing at an older asset hash.
 */
export async function prepareImageDelivery(
  publicDir: string,
  outputDir: string,
): Promise<{ count: number, fingerprint: string }> {
  if (!publicDir || !fs.existsSync(publicDir)) {
    clearImageDeliveryCatalog()
    return { count: 0, fingerprint: '' }
  }

  const allFiles = await collectRasterImages(publicDir)
  if (allFiles.length === 0) {
    clearImageDeliveryCatalog()
    return { count: 0, fingerprint: '' }
  }

  // Drop rasters a previous run already proved undecodable, so one corrupt
  // file does not buy a full decode pass and a second catalog build on every
  // boot for the rest of the project's life. A file whose bytes changed is no
  // longer the file that failed, so it goes back in the batch.
  const undecodable = readUndecodableCache(outputDir)
  const files = allFiles.filter((file) => {
    const known = undecodable[file.relativePath]
    if (!known) return true
    const identity = statIdentity(file.absolutePath)
    return !identity || identity.mtimeMs !== known.mtimeMs || identity.size !== known.size
  })
  if (files.length === 0) {
    clearImageDeliveryCatalog()
    return { count: 0, fingerprint: '' }
  }

  const alphaStorage = deliveryStorage(path.join(outputDir, '_stx', 'images'), ALPHA_NAMESPACE)
  const catalogOptions = {
    outDir: path.join(outputDir, '_stx', 'images'),
    storage: deliveryStorage(path.join(outputDir, '_stx', 'images')),
    baseUrl: DELIVERY_URL,
    widths: DEFAULT_WIDTHS,
    formats: ['avif', 'webp'] as const,
    quality: { avif: 70, webp: 78, jpeg: 82, png: 100 },
    // Delivery variants top out at 1920px. Keeping an additional source-sized
    // variant wastes build time and can exceed a pure TypeScript encoder's
    // frame limits for otherwise valid, very large source photography.
    includeOriginal: false,
    placeholder: true,
    batchConcurrency: 4,
    concurrency: 4,
  }

  let optimizedFiles = files
  let catalog: Awaited<ReturnType<typeof createImageDeliveryCatalog>>
  try {
    catalog = await createImageDeliveryCatalog({
      ...catalogOptions,
      entries: deliveryEntries(files, alphaStorage),
    })
  }
  catch (error) {
    optimizedFiles = await decodableFiles(files)
    // If every file decodes independently, this was not a bad input. Preserve
    // the real catalog error instead of quietly turning an encoder or I/O
    // failure into an unoptimized build.
    if (optimizedFiles.length === files.length)
      throw error

    // Record what failed, so the next boot skips straight to the single pass.
    const survived = new Set(optimizedFiles.map(file => file.relativePath))
    let changed = false
    for (const file of files) {
      if (survived.has(file.relativePath)) continue
      const identity = statIdentity(file.absolutePath)
      if (!identity) continue
      undecodable[file.relativePath] = identity
      changed = true
    }
    if (changed)
      writeUndecodableCache(outputDir, undecodable)

    if (optimizedFiles.length === 0) {
      clearImageDeliveryCatalog()
      return { count: 0, fingerprint: '' }
    }

    catalog = await createImageDeliveryCatalog({
      ...catalogOptions,
      entries: deliveryEntries(optimizedFiles, alphaStorage),
    })
  }

  // Swap the complete catalog in atomically. The production server may refresh
  // this after a watched public image changes; clearing it before codecs finish
  // creates a window where concurrent renders silently fall back to originals.
  const transparent = await findTransparent(catalog.entries)
  const droppedWebp = dropOpaqueWebp(catalog.entries, transparent)

  deliveryCatalog = new Map(Object.entries(catalog.entries))
  transparentSources = transparent

  // Both decisions change the markup — no placeholder, no WebP <source> —
  // without changing a single variant name, so they have to reach the key
  // the rendered HTML is cached under as well.
  const fingerprint = transparent.size === 0 && droppedWebp.length === 0
    ? catalog.fingerprint
    : createHash('sha256')
        .update(catalog.fingerprint)
        .update(JSON.stringify({ transparent: [...transparent].sort(), droppedWebp: droppedWebp.sort() }))
        .digest('hex')

  return { count: optimizedFiles.length, fingerprint }
}
