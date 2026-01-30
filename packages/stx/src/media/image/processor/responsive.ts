/**
 * STX Media - Responsive Image Generation
 *
 * Generates responsive image variants at multiple widths and formats.
 *
 * @module media/image/processor/responsive
 */

import { resolve, basename, extname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import type {
  EnhancedImgProps,
  ResponsiveVariantSet,
  TsImagesConfig,
  ImageFormat,
  ProcessedImageResult,
  PlaceholderStrategy,
} from '../../types'
import { hashFile, fileExists } from '../../shared/hash'
import { getCachedImageResult, setCachedImageResult } from './cache'

/**
 * Lazy import ts-images
 */
async function getTsImages(): Promise<typeof import('ts-images') | null> {
  try {
    return await import('ts-images')
  } catch {
    return null
  }
}

/**
 * Default responsive breakpoints
 */
export const DEFAULT_RESPONSIVE_WIDTHS = [320, 480, 640, 768, 1024, 1280, 1536, 1920]

/**
 * Generate responsive image variants using ts-images
 */
export async function generateResponsiveVariants(
  src: string,
  options: Partial<EnhancedImgProps>,
  config: TsImagesConfig,
): Promise<ResponsiveVariantSet | null> {
  const tsImages = await getTsImages()
  if (!tsImages) {
    console.warn('[stx-media] ts-images not installed, skipping responsive generation')
    return null
  }

  const srcPath = resolve(src)
  if (!(await fileExists(srcPath))) {
    console.warn(`[stx-media] Source file not found: ${src}`)
    return null
  }

  try {
    const widths = options.responsiveWidths || config.breakpoints || DEFAULT_RESPONSIVE_WIDTHS
    const formats: ImageFormat[] = (options.formats as ImageFormat[]) ||
      config.defaultFormats || ['avif', 'webp', 'jpeg']
    const outputDir = config.outputDir || 'dist/images'
    const baseUrl = config.baseUrl || '/images'

    await mkdir(outputDir, { recursive: true })

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))

    // Get quality settings from config
    const formatQuality = config.formatQuality || {
      jpeg: { quality: 82 },
      png: { quality: 80 },
      webp: { quality: 82 },
      avif: { quality: 75 },
    }

    const result: ResponsiveVariantSet = {
      src,
      byFormat: {} as Record<ImageFormat, ProcessedImageResult['variants']>,
      srcsets: {} as Record<ImageFormat, string>,
    }

    // Generate variants for each format and width
    for (const format of formats) {
      result.byFormat[format] = []
      const srcsetParts: string[] = []

      for (const width of widths) {
        const outputFilename = `${srcBasename}-${width}w-${srcHash}.${format}`
        const outputPath = join(outputDir, outputFilename)
        const outputUrl = `${baseUrl}/${outputFilename}`

        try {
          // Use ts-images responsive generation
          const quality = (formatQuality[format] as any)?.quality || 80

          // Check if variant already exists
          if (await fileExists(outputPath)) {
            // Skip processing, just add to result
            result.byFormat[format]!.push({
              path: outputPath,
              url: outputUrl,
              width,
              height: 0, // Will be calculated
              format,
              size: 0,
            })
            srcsetParts.push(`${outputUrl} ${width}w`)
            continue
          }

          // Process and resize
          const processResult = await tsImages.processImage({
            input: srcPath,
            output: outputPath,
            format: format as 'jpeg' | 'png' | 'webp' | 'avif',
            quality,
            resize: { width },
          })

          if (processResult) {
            result.byFormat[format]!.push({
              path: outputPath,
              url: outputUrl,
              width,
              height: processResult.height || Math.round(width * (processResult.height || 1) / (processResult.width || 1)),
              format,
              size: processResult.outputSize || 0,
            })
            srcsetParts.push(`${outputUrl} ${width}w`)
          }
        } catch (error) {
          console.warn(`[stx-media] Failed to generate ${format} at ${width}w: ${error}`)
        }
      }

      result.srcsets[format] = srcsetParts.join(', ')
    }

    // Generate placeholder if not skipped
    const placeholderStrategy = options.placeholder || config.placeholderStrategy || 'thumbhash'
    if (placeholderStrategy !== 'none') {
      try {
        if (placeholderStrategy === 'thumbhash') {
          const thumbhash = await tsImages.generateThumbHash(srcPath)
          result.placeholder = {
            dataURL: thumbhash.dataUrl,
            width: thumbhash.width || 32,
            height: thumbhash.height || 32,
            strategy: 'thumbhash',
          }
        } else {
          const placeholder = await tsImages.generatePlaceholder(srcPath, {
            strategy: placeholderStrategy as 'blur' | 'pixelate' | 'dominant-color',
            width: 20,
          })
          result.placeholder = {
            dataURL: placeholder.dataURL,
            width: placeholder.width,
            height: placeholder.height,
            strategy: placeholderStrategy as PlaceholderStrategy,
          }
        }
      } catch (error) {
        console.warn(`[stx-media] Failed to generate placeholder: ${error}`)
      }
    }

    // Generate recommended sizes attribute
    result.sizes = options.sizes || generateDefaultSizes(widths)

    return result
  } catch (error) {
    console.error(`[stx-media] Responsive generation failed: ${error}`)
    return null
  }
}

/**
 * Generate default sizes attribute based on widths
 */
function generateDefaultSizes(widths: number[]): string {
  const sorted = [...widths].sort((a, b) => a - b)
  const parts: string[] = []

  // Create media query breakpoints
  for (let i = 0; i < sorted.length - 1; i++) {
    const width = sorted[i]
    parts.push(`(max-width: ${width}px) ${width}px`)
  }

  // Add default (largest width)
  parts.push(`${sorted[sorted.length - 1]}px`)

  return parts.join(', ')
}

/**
 * Generate srcset string from variants
 */
export function generateSrcset(
  variants: ProcessedImageResult['variants'],
  type: 'width' | 'dpr' = 'width',
): string {
  if (!variants || variants.length === 0) {
    return ''
  }

  if (type === 'dpr') {
    return variants
      .filter(v => v.dpr)
      .map(v => `${v.url} ${v.dpr}x`)
      .join(', ')
  }

  return variants
    .map(v => `${v.url} ${v.width}w`)
    .join(', ')
}

/**
 * Generate art direction sources for <picture> element
 */
export async function generateArtDirectionSources(
  src: string,
  artDirection: NonNullable<EnhancedImgProps['artDirection']>,
  config: TsImagesConfig,
): Promise<Array<{ media: string; srcset: string; type: string }>> {
  const sources: Array<{ media: string; srcset: string; type: string }> = []

  for (const art of artDirection) {
    const variants = await generateResponsiveVariants(art.src, {
      responsiveWidths: art.widths,
    }, config)

    if (variants) {
      // Add source for each format
      for (const [format, srcset] of Object.entries(variants.srcsets)) {
        if (srcset) {
          sources.push({
            media: art.media,
            srcset,
            type: getMimeType(format as ImageFormat),
          })
        }
      }
    }
  }

  return sources
}

/**
 * Get MIME type for format
 */
function getMimeType(format: ImageFormat): string {
  switch (format) {
    case 'avif': return 'image/avif'
    case 'webp': return 'image/webp'
    case 'jpeg': return 'image/jpeg'
    case 'png': return 'image/png'
    case 'gif': return 'image/gif'
    default: return 'image/jpeg'
  }
}
