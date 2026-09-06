import type { ImageDeliveryManifest } from 'ts-images/delivery'
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

  const files = await collectRasterImages(publicDir)
  if (files.length === 0) {
    clearImageDeliveryCatalog()
    return { count: 0, fingerprint: '' }
  }

  const catalogOptions = {
    outDir: path.join(outputDir, '_stx', 'images'),
    baseUrl: DELIVERY_URL,
    widths: DEFAULT_WIDTHS,
    formats: ['avif', 'webp'] as const,
    quality: { avif: 70, webp: 78, jpeg: 82, png: 100 },
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
