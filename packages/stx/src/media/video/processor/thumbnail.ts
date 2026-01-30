/**
 * STX Media - Video Thumbnail Generation
 *
 * Generate poster images, thumbnails, and sprite sheets from video.
 *
 * @module media/video/processor/thumbnail
 */

import { resolve, basename, extname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import type {
  ThumbnailResult,
  PosterGenerationConfig,
  SpriteSheetConfig,
} from '../../types'
import { hashFile, fileExists } from '../../shared/hash'

/**
 * Lazy import ts-videos
 */
async function getTsVideos(): Promise<typeof import('ts-videos') | null> {
  try {
    return await import('ts-videos')
  } catch {
    return null
  }
}

/**
 * Generate poster/thumbnail from video at specific timestamp
 */
export async function generatePoster(
  src: string,
  options: PosterGenerationConfig,
  outputDir: string,
  baseUrl: string,
): Promise<ThumbnailResult | null> {
  const tsVideos = await getTsVideos()
  if (!tsVideos) {
    console.warn('[stx-media] ts-videos not installed, cannot generate poster')
    return null
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return null
    }

    await mkdir(outputDir, { recursive: true })

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))
    const format = options.format || 'webp'
    const timestamp = options.timestamp || 0

    const outputFilename = `${srcBasename}-poster-${srcHash}.${format}`
    const outputPath = join(outputDir, outputFilename)

    // Use ts-videos thumbnail extraction
    const result = await tsVideos.extractThumbnails(srcPath, {
      timestamps: [timestamp],
      width: options.width || 1280,
      height: options.height,
      format: format as 'jpeg' | 'png' | 'webp',
      quality: options.quality || 85,
      outputDir,
      outputPattern: outputFilename.replace(`.${format}`, ''),
    })

    if (result && result.length > 0) {
      const thumb = result[0]
      return {
        path: outputPath,
        url: `${baseUrl}/${outputFilename}`,
        width: thumb.width || options.width || 1280,
        height: thumb.height || 720,
        timestamp,
        size: thumb.size || 0,
      }
    }

    return null
  } catch (error) {
    console.warn(`[stx-media] Failed to generate poster: ${error}`)
    return null
  }
}

/**
 * Generate multiple thumbnails at intervals
 */
export async function generateThumbnails(
  src: string,
  options: {
    count?: number
    interval?: number
    format?: 'jpeg' | 'png' | 'webp'
    width?: number
    quality?: number
  },
  outputDir: string,
  baseUrl: string,
): Promise<ThumbnailResult[]> {
  const tsVideos = await getTsVideos()
  if (!tsVideos) {
    return []
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return []
    }

    await mkdir(outputDir, { recursive: true })

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))
    const format = options.format || 'webp'

    // Get video duration to calculate timestamps
    const input = new tsVideos.Input(srcPath)
    const info = await input.getInfo()
    const duration = info.duration || 60

    // Calculate timestamps
    const count = options.count || 10
    const interval = options.interval || duration / count
    const timestamps: number[] = []

    for (let i = 0; i < count && i * interval < duration; i++) {
      timestamps.push(i * interval)
    }

    // Generate thumbnails
    const result = await tsVideos.extractThumbnails(srcPath, {
      timestamps,
      width: options.width || 320,
      format: format as 'jpeg' | 'png' | 'webp',
      quality: options.quality || 80,
      outputDir,
      outputPattern: `${srcBasename}-thumb-${srcHash}`,
    })

    if (result && result.length > 0) {
      return result.map((thumb, index) => ({
        path: thumb.path || join(outputDir, `${srcBasename}-thumb-${srcHash}-${index}.${format}`),
        url: `${baseUrl}/${srcBasename}-thumb-${srcHash}-${index}.${format}`,
        width: thumb.width || options.width || 320,
        height: thumb.height || 180,
        timestamp: timestamps[index],
        size: thumb.size || 0,
      }))
    }

    return []
  } catch (error) {
    console.warn(`[stx-media] Failed to generate thumbnails: ${error}`)
    return []
  }
}

/**
 * Generate sprite sheet for video scrubbing preview
 */
export async function generateSpriteSheet(
  src: string,
  options: SpriteSheetConfig,
  outputDir: string,
  baseUrl: string,
): Promise<{
  url: string
  path: string
  columns: number
  rows: number
  thumbnailWidth: number
  thumbnailHeight: number
  interval: number
  totalFrames: number
} | null> {
  const tsVideos = await getTsVideos()
  if (!tsVideos) {
    console.warn('[stx-media] ts-videos not installed, cannot generate sprite sheet')
    return null
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return null
    }

    await mkdir(outputDir, { recursive: true })

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))

    // Get video duration
    const input = new tsVideos.Input(srcPath)
    const info = await input.getInfo()
    const duration = info.duration || 60

    // Calculate sprite sheet parameters
    const columns = options.columns || 10
    const interval = options.interval || 5
    const thumbnailWidth = options.thumbnailWidth || 160
    const thumbnailHeight = options.thumbnailHeight || 90
    const format = options.format || 'jpeg'

    const totalFrames = Math.ceil(duration / interval)
    const rows = Math.ceil(totalFrames / columns)

    const outputFilename = `${srcBasename}-sprite-${srcHash}.${format}`
    const outputPath = join(outputDir, outputFilename)

    // Generate individual thumbnails first
    const timestamps: number[] = []
    for (let i = 0; i < totalFrames; i++) {
      timestamps.push(i * interval)
    }

    const thumbnails = await tsVideos.extractThumbnails(srcPath, {
      timestamps,
      width: thumbnailWidth,
      height: thumbnailHeight,
      format: format as 'jpeg' | 'png' | 'webp',
      quality: options.quality || 70,
      outputDir: join(outputDir, '.temp'),
    })

    if (!thumbnails || thumbnails.length === 0) {
      return null
    }

    // Combine into sprite sheet using ts-images if available
    try {
      const tsImages = await import('ts-images')

      // Create sprite sheet by compositing thumbnails
      const spriteWidth = columns * thumbnailWidth
      const spriteHeight = rows * thumbnailHeight

      const sprite = await tsImages.createSprite({
        images: thumbnails.map(t => t.path),
        columns,
        padding: 0,
        outputPath,
        format: format as 'jpeg' | 'png' | 'webp',
        quality: options.quality || 70,
      })

      return {
        url: `${baseUrl}/${outputFilename}`,
        path: outputPath,
        columns,
        rows,
        thumbnailWidth,
        thumbnailHeight,
        interval,
        totalFrames,
      }
    } catch {
      // ts-images not available, sprite sheet not generated
      console.warn('[stx-media] ts-images not installed, sprite sheet generation skipped')
      return null
    }
  } catch (error) {
    console.warn(`[stx-media] Failed to generate sprite sheet: ${error}`)
    return null
  }
}
