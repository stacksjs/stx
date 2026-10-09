import type { ImageDeliveryManifest, ImageDeliveryStorage } from 'ts-images/delivery'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { decode, generateThumbHash } from 'ts-images'
import { createImageDeliveryCatalog } from 'ts-images/delivery'
import { readAt, sourceAlpha, webpHeaderHasAlpha } from './image-alpha'
import { runImageTask, WORKER_UNAVAILABLE } from './image-worker'

export { webpHeaderHasAlpha }

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
 * that had fetched it holds it for a year under `immutable`.
 *
 * Moving alpha sources to a fresh namespace once (`alpha-1`) was not enough:
 * a release that still resolved the old encoder wrote opaque WebPs under the
 * new names too, into a variant cache shared by every release, and every
 * later release found them there and fell back to PNG for good. So the
 * namespace now carries the encoders' identity ({@link imageEncoderIdentity}),
 * and an encoder upgrade moves these variants to URLs that nothing, on disk or
 * in any HTTP cache, has seen written by an older encoder.
 *
 * Only for alpha-capable sources. They are the ones an encoder's alpha
 * handling decides the correctness of, and they are few (logos, icons,
 * cut-outs). Keying every photo by encoder version would re-encode a whole
 * site on each encoder patch release: the cold-cache boot that failed deploys.
 */
const ALPHA_NAMESPACE = `stx:${DELIVERY_URL}:alpha-1`

/** The packages that write delivery variants, as ts-images resolves them. */
const ENCODER_PACKAGES = ['@stacksjs/ts-webp', '@stacksjs/ts-avif'] as const

let encoderIdentity: string | undefined

function packageVersion(specifier: string, fromDir: string): string | undefined {
  let dir = path.dirname(Bun.resolveSync(specifier, fromDir))
  while (dir !== path.dirname(dir)) {
    const manifest = path.join(dir, 'package.json')
    if (fs.existsSync(manifest)) {
      const pkg = JSON.parse(fs.readFileSync(manifest, 'utf8')) as { name?: string, version?: string }
      if (pkg.name === specifier)
        return pkg.version
    }
    dir = path.dirname(dir)
  }
  return undefined
}

/**
 * Which encoders this process writes variants with, e.g.
 * `ts-webp@0.1.6+ts-avif@0.1.4`. Resolved the way ts-images resolves them,
 * so a vendored or hoisted copy reports the copy that actually runs. An
 * encoder that cannot be identified reads as `unknown`, which is still a
 * namespace no older release wrote into.
 */
/**
 * Override {@link imageEncoderIdentity}, or with no argument go back to
 * resolving it. For tests that need a variant cache written by another
 * encoder than the one installed.
 */
export function setImageEncoderIdentity(identity?: string): void {
  encoderIdentity = identity
}

export function imageEncoderIdentity(): string {
  if (encoderIdentity !== undefined)
    return encoderIdentity
  let from: string | undefined
  try {
    from = path.dirname(Bun.resolveSync('ts-images', import.meta.dir))
  }
  catch {}
  encoderIdentity = ENCODER_PACKAGES.map((specifier) => {
    let version: string | undefined
    try {
      version = from ? packageVersion(specifier, from) : undefined
    }
    catch {}
    return `${specifier.replace('@stacksjs/', '')}@${version ?? 'unknown'}`
  }).join('+')
  return encoderIdentity
}

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

/**
 * Whether a source file can carry transparency, from its header alone.
 *
 * Read before the catalog is built, since the answer picks the namespace the
 * variants are named under. Only a header that declares alpha counts: JPEG
 * cannot carry it, and AVIF is left to the decode that follows.
 */
function mayHaveAlpha(file: string): boolean {
  return sourceAlpha(file) === 'possible'
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

/**
 * The modern-format `<source>` families worth offering for a delivered image,
 * smallest first.
 *
 * A modern extension is not automatically an optimization. Browsers use the
 * first supported `<source>`, so any family that costs at least as much as the
 * fallback is left out.
 */
export function efficientDeliverySources(delivery: ImageDeliveryManifest): Array<{ format: 'avif' | 'webp', srcset: string }> {
  const bytesByFormat = (format: string) => delivery.variants
    .filter(variant => variant.format === format)
    .reduce((total, variant) => total + variant.bytes, 0)
  const fallbackBytes = bytesByFormat(delivery.fallback.format)

  return (['avif', 'webp'] as const)
    .map(format => ({ format, srcset: delivery.sources[format] || '', bytes: bytesByFormat(format) }))
    .filter(candidate => candidate.srcset && candidate.bytes > 0 && candidate.bytes < fallbackBytes)
    .sort((a, b) => a.bytes - b.bytes)
    .map(({ format, srcset }) => ({ format, srcset }))
}

/** What a component needs to render one delivered image. */
export interface DeliveredImage {
  /** The fallback variant's URL, for `<img src>`. */
  src: string
  /** The fallback format at every width, for `<img srcset>`. */
  srcset: string
  /** `<source>` elements to put ahead of the `<img>`, smallest family first. */
  sources: Array<{ type: string, srcset: string }>
  width: number
  height: number
  /** A data URL of the image's own preview, absent for a transparent image. */
  placeholder?: string
}

/**
 * The optimized variants of a public image, ready for markup.
 *
 * `<StxImage>` renders from the catalog directly. A component that draws its
 * own markup (the `<Image>` in @stacksjs/components) reads it through this, so
 * an app gets the same responsive variants whichever `<Image>` resolves.
 * Undefined when the image is not in the catalog: remote, an SVG, or a server
 * that has not prepared delivery.
 */
export function deliveredImage(src: string): DeliveredImage | undefined {
  const delivery = getImageDelivery(src)
  if (!delivery)
    return undefined

  return {
    src: delivery.fallback.url,
    srcset: delivery.sources[delivery.fallback.format] || '',
    sources: efficientDeliverySources(delivery).map(({ format, srcset }) => ({ type: `image/${format}`, srcset })),
    width: delivery.source.width,
    height: delivery.source.height,
    placeholder: isTransparentImage(src) ? undefined : delivery.placeholder?.dataUrl,
  }
}

/** Clear process-global delivery state between builds and tests. */
export function clearImageDeliveryCatalog(): void {
  deliveryCatalog = new Map()
  transparentSources = new Set()
}

/** The catalog as plain data, for a worker to post back to the thread that serves. */
export interface ImageDeliverySnapshot {
  entries: Array<[string, ImageDeliveryManifest]>
  transparent: string[]
}

/** What this thread's catalog holds, in a form `postMessage` can carry. */
export function snapshotImageDelivery(): ImageDeliverySnapshot {
  return { entries: [...deliveryCatalog], transparent: [...transparentSources] }
}

/** Swap in a catalog built elsewhere, whole, as the in-thread pass does. */
export function installImageDelivery(snapshot: ImageDeliverySnapshot): void {
  deliveryCatalog = new Map(snapshot.entries)
  transparentSources = new Set(snapshot.transparent)
}

export interface PrepareImageDeliveryOptions {
  /**
   * Decode and encode on a worker thread, and install the finished catalog
   * here. For a long-lived server, whose event loop has requests to answer
   * while a cold cache re-encodes every raster. Same files, same names, same
   * catalog; falls back to running in-thread where no worker can start.
   */
  offThread?: boolean
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
  options: PrepareImageDeliveryOptions = {},
): Promise<{ count: number, fingerprint: string }> {
  if (!publicDir || !fs.existsSync(publicDir)) {
    clearImageDeliveryCatalog()
    return { count: 0, fingerprint: '' }
  }

  if (options.offThread) {
    const reply = await runImageTask<{ result: { count: number, fingerprint: string }, state: ImageDeliverySnapshot }>(
      'delivery',
      { publicDir, outputDir },
    )
    if (reply !== WORKER_UNAVAILABLE) {
      installImageDelivery(reply.state)
      return reply.result
    }
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

  const alphaStorage = deliveryStorage(path.join(outputDir, '_stx', 'images'), `${ALPHA_NAMESPACE}:${imageEncoderIdentity()}`)
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
