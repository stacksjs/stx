import type { ImageDeliveryManifest } from 'ts-images/delivery'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
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

  const catalog = await createImageDeliveryCatalog({
    entries: files.map(file => ({
      key: publicUrl(file.relativePath),
      input: file.absolutePath,
      name: catalogName(file.relativePath),
    })),
    outDir: path.join(outputDir, '_stx', 'images'),
    baseUrl: DELIVERY_URL,
    widths: DEFAULT_WIDTHS,
    formats: ['avif', 'webp'],
    quality: { avif: 70, webp: 78, jpeg: 82, png: 100 },
    placeholder: true,
    batchConcurrency: 4,
    concurrency: 4,
  })

  // Swap the complete catalog in atomically. The production server may refresh
  // this after a watched public image changes; clearing it before codecs finish
  // creates a window where concurrent renders silently fall back to originals.
  deliveryCatalog = new Map(Object.entries(catalog.entries))
  return { count: files.length, fingerprint: catalog.fingerprint }
}
