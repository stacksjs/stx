/**
 * STX Image Optimization Build Plugin
 *
 * Integrates image optimization into the production build pipeline.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { BuildPlugin, BuildResult } from '../production-build'
import {
  type ImageOptions,
  type ImageFormat,
  type ProcessedImage,
  type ImageVariant,
  DEFAULT_FORMATS,
  DEFAULT_QUALITY,
  DEFAULT_WIDTHS,
  processImage,
  isImageFile,
  isSharpAvailable,
  formatSize,
  getTotalSize,
} from './processor'

// ============================================================================
// Types
// ============================================================================

export interface ImageBuildOptions {
  /** Input directories to scan for images */
  inputDirs?: string[]
  /** Output directory for optimized images */
  outputDir?: string
  /** Base URL for image paths */
  baseUrl?: string
  /** Default optimization options */
  defaults?: ImageOptions
  /** Cache processed images */
  cache?: boolean
  /** Cache directory */
  cacheDir?: string
  /** Concurrent processing limit */
  concurrency?: number
  /** Only process images referenced in HTML */
  referencedOnly?: boolean
  /** Image format options */
  formats?: ImageFormat[]
  /** Responsive widths */
  widths?: number[]
  /** Quality setting */
  quality?: number
  /** Generate placeholder images */
  placeholder?: 'blur' | 'dominant-color' | 'none'
  /** Verbose logging */
  verbose?: boolean
}

export interface ImageBuildContext {
  /** Collected image references from HTML */
  imageReferences: Set<string>
  /** Processed images cache */
  processedImages: Map<string, ProcessedImage>
  /** Image stats */
  stats: {
    totalImages: number
    optimizedImages: number
    savedBytes: number
    variants: number
  }
}

// ============================================================================
// Build Plugin
// ============================================================================

/**
 * Create the image optimization build plugin
 */
export function createImagePlugin(options: ImageBuildOptions = {}): BuildPlugin {
  const {
    inputDirs = ['public', 'src/assets', 'assets'],
    outputDir = 'dist/images',
    baseUrl = '/images',
    formats = DEFAULT_FORMATS,
    widths = DEFAULT_WIDTHS,
    quality = DEFAULT_QUALITY,
    placeholder = 'none',
    concurrency = 4,
    cache = true,
    cacheDir = '.stx/image-cache',
    referencedOnly = false,
    verbose = false,
  } = options

  // Build context
  const ctx: ImageBuildContext = {
    imageReferences: new Set(),
    processedImages: new Map(),
    stats: {
      totalImages: 0,
      optimizedImages: 0,
      savedBytes: 0,
      variants: 0,
    },
  }

  return {
    name: 'stx-image-optimization',

    async setup(build) {
      // Check if sharp is available
      const hasSharp = await isSharpAvailable()
      if (!hasSharp) {
        console.warn('[stx-images] sharp not available, image optimization disabled')
        return
      }

      // Ensure cache directory exists
      if (cache) {
        await fs.promises.mkdir(cacheDir, { recursive: true })
      }

      if (verbose) {
        console.log('[stx-images] Plugin initialized')
        console.log(`  Input dirs: ${inputDirs.join(', ')}`)
        console.log(`  Output dir: ${outputDir}`)
        console.log(`  Formats: ${formats.join(', ')}`)
        console.log(`  Widths: ${widths.join(', ')}`)
      }
    },

    async buildStart() {
      ctx.imageReferences.clear()
      ctx.processedImages.clear()
      ctx.stats = {
        totalImages: 0,
        optimizedImages: 0,
        savedBytes: 0,
        variants: 0,
      }
    },

    async transform(code, id) {
      // Extract image references from HTML/templates
      if (id.endsWith('.html') || id.endsWith('.stx')) {
        const refs = extractImageReferences(code)
        for (const ref of refs) {
          ctx.imageReferences.add(ref)
        }
      }

      // Transform <Image> components and @image directives
      if (code.includes('<Image') || code.includes('@image')) {
        return await transformImageReferences(code, {
          formats,
          widths,
          quality,
          placeholder,
          outputDir,
          baseUrl,
          processedImages: ctx.processedImages,
        })
      }

      return code
    },

    async buildEnd(result) {
      const hasSharp = await isSharpAvailable()
      if (!hasSharp) return

      // Ensure output directory exists
      await fs.promises.mkdir(outputDir, { recursive: true })

      // Collect all images to process
      const imagesToProcess: string[] = []

      for (const dir of inputDirs) {
        if (!fs.existsSync(dir)) continue
        const images = await collectImages(dir)
        imagesToProcess.push(...images)
      }

      // Filter to only referenced images if configured
      const finalImages = referencedOnly
        ? imagesToProcess.filter(img => isImageReferenced(img, ctx.imageReferences))
        : imagesToProcess

      ctx.stats.totalImages = finalImages.length

      if (verbose) {
        console.log(`[stx-images] Processing ${finalImages.length} images...`)
      }

      // Process images with concurrency limit
      const chunks = chunkArray(finalImages, concurrency)

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(async (imagePath) => {
            try {
              const processed = await processImage(imagePath, {
                formats,
                widths,
                quality,
                placeholder,
                outputDir,
                baseUrl,
              })

              ctx.processedImages.set(imagePath, processed)
              ctx.stats.optimizedImages++
              ctx.stats.variants += processed.variants.length

              // Calculate savings
              const originalSize = fs.statSync(imagePath).size
              const optimizedSize = getTotalSize(processed.variants)
              ctx.stats.savedBytes += Math.max(0, originalSize - optimizedSize / processed.variants.length)

              if (verbose) {
                console.log(`  ✓ ${path.basename(imagePath)} → ${processed.variants.length} variants`)
              }
            }
            catch (error) {
              console.error(`[stx-images] Error processing ${imagePath}:`, error)
            }
          }),
        )
      }

      // Log summary
      console.log(`[stx-images] Optimization complete:`)
      console.log(`  Images: ${ctx.stats.optimizedImages}/${ctx.stats.totalImages}`)
      console.log(`  Variants: ${ctx.stats.variants}`)
      if (ctx.stats.savedBytes > 0) {
        console.log(`  Saved: ~${formatSize(ctx.stats.savedBytes)}`)
      }
    },
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Extract image references from HTML content
 */
function extractImageReferences(content: string): string[] {
  const refs: string[] = []

  // Match src attributes
  const srcPattern = /src=["']([^"']+\.(jpg|jpeg|png|webp|avif|gif))["']/gi
  let match: RegExpExecArray | null
  while ((match = srcPattern.exec(content)) !== null) {
    refs.push(match[1])
  }

  // Match <Image> components
  const imageCompPattern = /<Image[^>]+src=["']([^"']+)["']/gi
  while ((match = imageCompPattern.exec(content)) !== null) {
    refs.push(match[1])
  }

  // Match @image directives
  const directivePattern = /@image\s*\(\s*['"]([^'"]+)['"]/gi
  while ((match = directivePattern.exec(content)) !== null) {
    refs.push(match[1])
  }

  // Match background-image CSS
  const bgPattern = /background(?:-image)?:\s*url\(["']?([^"')]+\.(jpg|jpeg|png|webp|avif|gif))["']?\)/gi
  while ((match = bgPattern.exec(content)) !== null) {
    refs.push(match[1])
  }

  return refs
}

/**
 * Check if an image path is referenced
 */
function isImageReferenced(imagePath: string, references: Set<string>): boolean {
  const basename = path.basename(imagePath)

  for (const ref of references) {
    if (ref.endsWith(basename) || ref.includes(basename)) {
      return true
    }
  }

  return false
}

/**
 * Transform image references in content
 */
async function transformImageReferences(
  content: string,
  options: {
    formats: ImageFormat[]
    widths: number[]
    quality: number
    placeholder: 'blur' | 'dominant-color' | 'none'
    outputDir: string
    baseUrl: string
    processedImages: Map<string, ProcessedImage>
  },
): Promise<string> {
  // This is a placeholder - actual transformation happens via
  // the Image component and @image directive processing
  return content
}

/**
 * Collect all images from a directory recursively
 */
async function collectImages(dir: string): Promise<string[]> {
  const images: string[] = []

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.promises.readdir(currentDir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name)

      if (entry.isDirectory()) {
        await walk(fullPath)
      }
      else if (entry.isFile() && isImageFile(fullPath)) {
        images.push(fullPath)
      }
    }
  }

  await walk(dir)
  return images
}

/**
 * Split array into chunks
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// ============================================================================
// Standalone Functions
// ============================================================================

/**
 * Optimize a single image
 */
export async function optimizeImage(
  inputPath: string,
  outputDir: string,
  options: ImageOptions = {},
): Promise<ProcessedImage> {
  const hasSharp = await isSharpAvailable()
  if (!hasSharp) {
    throw new Error('sharp is required for image optimization')
  }

  return processImage(inputPath, {
    ...options,
    outputDir,
  })
}

/**
 * Optimize all images in a directory
 */
export async function optimizeDirectory(
  inputDir: string,
  outputDir: string,
  options: ImageBuildOptions = {},
): Promise<{
  processed: ProcessedImage[]
  stats: ImageBuildContext['stats']
}> {
  const {
    formats = DEFAULT_FORMATS,
    widths = DEFAULT_WIDTHS,
    quality = DEFAULT_QUALITY,
    placeholder = 'none',
    concurrency = 4,
    verbose = false,
  } = options

  const hasSharp = await isSharpAvailable()
  if (!hasSharp) {
    throw new Error('sharp is required for image optimization')
  }

  // Ensure output directory
  await fs.promises.mkdir(outputDir, { recursive: true })

  // Collect images
  const images = await collectImages(inputDir)
  const processed: ProcessedImage[] = []
  const stats = {
    totalImages: images.length,
    optimizedImages: 0,
    savedBytes: 0,
    variants: 0,
  }

  // Process in chunks
  const chunks = chunkArray(images, concurrency)

  for (const chunk of chunks) {
    const results = await Promise.all(
      chunk.map(async (imagePath) => {
        try {
          const result = await processImage(imagePath, {
            formats,
            widths,
            quality,
            placeholder,
            outputDir,
            baseUrl: '/',
          })

          stats.optimizedImages++
          stats.variants += result.variants.length

          if (verbose) {
            console.log(`  ✓ ${path.basename(imagePath)}`)
          }

          return result
        }
        catch (error) {
          console.error(`Error processing ${imagePath}:`, error)
          return null
        }
      }),
    )

    processed.push(...results.filter((r): r is ProcessedImage => r !== null))
  }

  return { processed, stats }
}

/**
 * Generate image manifest for build
 */
export function generateImageManifest(
  images: ProcessedImage[],
): Record<string, { variants: ImageVariant[]; placeholder?: string }> {
  const manifest: Record<string, { variants: ImageVariant[]; placeholder?: string }> = {}

  for (const img of images) {
    manifest[img.src] = {
      variants: img.variants,
      placeholder: img.placeholder,
    }
  }

  return manifest
}

/**
 * Write image manifest to file
 */
export async function writeImageManifest(
  images: ProcessedImage[],
  outputPath: string,
): Promise<void> {
  const manifest = generateImageManifest(images)
  await Bun.write(outputPath, JSON.stringify(manifest, null, 2))
}
