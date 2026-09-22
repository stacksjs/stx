import type { ImageDeliveryManifest, ImageDeliveryStorage } from 'ts-images/delivery'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { generateThumbHash } from 'ts-images'
import { createImageDeliveryCatalog } from 'ts-images/delivery'

const RASTER_EXTENSIONS = new Set(['.avif', '.jpeg', '.jpg', '.png', '.webp'])
const DEFAULT_WIDTHS = [320, 640, 960, 1280, 1920] as const
const DELIVERY_URL = '/_stx/images'

let deliveryCatalog = new Map<string, ImageDeliveryManifest>()

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
function deliveryStorage(outDir: string): ImageDeliveryStorage {
  const url = (key: string) => `${DELIVERY_URL}/${key.split('/').map(encodeURIComponent).join('/')}`

  return {
    cacheNamespace: `stx:${DELIVERY_URL}`,
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

function deliveryEntries(files: RasterFile[]) {
  return files.map(file => ({
    key: publicUrl(file.relativePath),
    input: file.absolutePath,
    name: catalogName(file.relativePath),
  }))
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

/** Clear process-global delivery state between builds and tests. */
export function clearImageDeliveryCatalog(): void {
  deliveryCatalog = new Map()
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
      entries: deliveryEntries(files),
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
      entries: deliveryEntries(optimizedFiles),
    })
  }

  // Swap the complete catalog in atomically. The production server may refresh
  // this after a watched public image changes; clearing it before codecs finish
  // creates a window where concurrent renders silently fall back to originals.
  deliveryCatalog = new Map(Object.entries(catalog.entries))
  return { count: optimizedFiles.length, fingerprint: catalog.fingerprint }
}
