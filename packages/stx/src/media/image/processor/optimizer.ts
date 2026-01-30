/**
 * STX Media - Image Optimizer
 *
 * Wraps ts-images for image optimization and transformation.
 *
 * @module media/image/processor/optimizer
 */

import { resolve, basename, dirname, extname, join } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import type {
  EnhancedImgProps,
  ProcessedImageResult,
  TsImagesConfig,
  ImageFormat,
  ImageOptimizationPreset,
  ImageTransformationConfig,
  FormatQualitySettings,
} from '../../types'
import { hashFile, fileExists } from '../../shared/hash'
import { getCachedImageResult, setCachedImageResult } from './cache'

/**
 * Lazy import ts-images to avoid blocking module initialization
 */
async function getTsImages(): Promise<typeof import('ts-images') | null> {
  try {
    return await import('ts-images')
  } catch {
    return null
  }
}

/**
 * Get quality settings based on preset
 */
function getPresetQuality(preset: ImageOptimizationPreset): FormatQualitySettings {
  switch (preset) {
    case 'quality':
      return {
        jpeg: { quality: 90, mozjpeg: true, progressive: true },
        png: { compressionLevel: 6, palette: false },
        webp: { quality: 90, effort: 6, smartSubsample: true },
        avif: { quality: 85, effort: 6 },
      }
    case 'performance':
      return {
        jpeg: { quality: 70, mozjpeg: true, progressive: true },
        png: { compressionLevel: 9, palette: true },
        webp: { quality: 70, effort: 4, smartSubsample: true },
        avif: { quality: 60, effort: 2 },
      }
    case 'web':
    default:
      return {
        jpeg: { quality: 82, mozjpeg: true, progressive: true },
        png: { compressionLevel: 8, palette: false },
        webp: { quality: 82, effort: 5, smartSubsample: true },
        avif: { quality: 75, effort: 4 },
      }
  }
}

/**
 * Merge quality settings with config defaults
 */
function mergeQualitySettings(
  config: TsImagesConfig,
  preset?: ImageOptimizationPreset,
): FormatQualitySettings {
  const presetQuality = preset ? getPresetQuality(preset) : getPresetQuality('web')
  const configQuality = config.formatQuality || {}

  return {
    jpeg: { ...presetQuality.jpeg, ...configQuality.jpeg },
    png: { ...presetQuality.png, ...configQuality.png },
    webp: { ...presetQuality.webp, ...configQuality.webp },
    avif: { ...presetQuality.avif, ...configQuality.avif },
  }
}

/**
 * Process a single image with ts-images
 */
export async function processImage(
  src: string,
  options: Partial<EnhancedImgProps>,
  config: TsImagesConfig,
): Promise<ProcessedImageResult> {
  const tsImages = await getTsImages()

  // Return unprocessed result if ts-images not available
  if (!tsImages) {
    console.warn('[stx-media] ts-images not installed, skipping optimization')
    return { src, processed: false }
  }

  // Check cache first
  const cached = await getCachedImageResult(src, options, config)
  if (cached) {
    return cached
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return { src, processed: false, errors: [`Source file not found: ${src}`] }
    }

    const qualitySettings = mergeQualitySettings(config, options.preset)
    const outputDir = config.outputDir || 'dist/images'
    const baseUrl = config.baseUrl || '/images'

    // Ensure output directory exists
    await mkdir(outputDir, { recursive: true })

    // Get source hash for cache key
    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))

    // Determine output formats
    const formats: ImageFormat[] = options.outputFormat
      ? [options.outputFormat]
      : config.defaultFormats || ['avif', 'webp', 'jpeg']

    // Process image
    const result: ProcessedImageResult = {
      src,
      processed: true,
      variants: [],
      hash: srcHash,
    }

    // Apply transformations if specified
    let processedBuffer: Buffer | null = null
    if (options.transformations && options.transformations.length > 0) {
      processedBuffer = await applyTransformations(srcPath, options.transformations, tsImages)
    }

    // Optimize for each format
    for (const format of formats) {
      const formatQuality = qualitySettings[format] || {}
      const outputFilename = `${srcBasename}-${srcHash}.${format}`
      const outputPath = join(outputDir, outputFilename)

      try {
        // Use ts-images optimize function
        const optimizeResult = await tsImages.optimizeImage({
          input: processedBuffer || srcPath,
          output: outputPath,
          format: format as 'jpeg' | 'png' | 'webp' | 'avif',
          quality: formatQuality.quality,
          progressive: (formatQuality as any).progressive,
        })

        if (optimizeResult) {
          result.variants!.push({
            path: outputPath,
            url: `${baseUrl}/${outputFilename}`,
            width: optimizeResult.width || 0,
            height: optimizeResult.height || 0,
            format,
            size: optimizeResult.outputSize || 0,
          })

          // Capture original dimensions
          if (!result.originalWidth && optimizeResult.width) {
            result.originalWidth = optimizeResult.width
            result.originalHeight = optimizeResult.height
          }
        }
      } catch (error) {
        result.errors = result.errors || []
        result.errors.push(`Failed to optimize ${format}: ${error}`)
      }
    }

    // Generate placeholder if requested
    if (options.embedThumbhash || options.placeholder === 'thumbhash') {
      try {
        const thumbhash = await tsImages.generateThumbHash(srcPath)
        result.placeholder = thumbhash.dataUrl
      } catch (error) {
        result.errors = result.errors || []
        result.errors.push(`Failed to generate thumbhash: ${error}`)
      }
    }

    // Extract dominant color if requested
    if (options.useDominantColor) {
      try {
        const placeholder = await tsImages.generatePlaceholder(srcPath, {
          strategy: 'dominant-color',
        })
        result.dominantColor = placeholder.dominantColor
      } catch (error) {
        result.errors = result.errors || []
        result.errors.push(`Failed to extract dominant color: ${error}`)
      }
    }

    // Cache the result
    await setCachedImageResult(src, options, result, config)

    return result
  } catch (error) {
    return {
      src,
      processed: false,
      errors: [`Processing failed: ${error}`],
    }
  }
}

/**
 * Optimize a single image without responsive variants
 */
export async function optimizeImage(
  src: string,
  format: ImageFormat,
  quality: number,
  outputPath: string,
): Promise<{ success: boolean; size?: number; error?: string }> {
  const tsImages = await getTsImages()
  if (!tsImages) {
    return { success: false, error: 'ts-images not installed' }
  }

  try {
    const result = await tsImages.optimizeImage({
      input: src,
      output: outputPath,
      format: format as 'jpeg' | 'png' | 'webp' | 'avif',
      quality,
    })

    return { success: true, size: result?.outputSize }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

/**
 * Apply transformations to an image
 */
export async function applyTransformations(
  src: string,
  transformations: ImageTransformationConfig[],
  tsImages?: typeof import('ts-images') | null,
): Promise<Buffer | null> {
  const lib = tsImages || await getTsImages()
  if (!lib) {
    console.warn('[stx-media] ts-images not installed, skipping transformations')
    return null
  }

  try {
    // Read source image
    let imageData = await lib.decode(src)

    for (const transform of transformations) {
      const opts = transform.options || {}

      switch (transform.type) {
        case 'resize':
          if (opts.width || opts.height) {
            imageData = await lib.resize(imageData, {
              width: opts.width,
              height: opts.height,
              fit: opts.fit as 'contain' | 'cover' | 'fill' | 'inside' | 'outside',
            })
          }
          break

        case 'blur':
          if (opts.sigma !== undefined) {
            imageData = await lib.blur(imageData, opts.sigma)
          }
          break

        case 'sharpen':
          if (opts.amount !== undefined) {
            imageData = await lib.sharpen(imageData, opts.amount)
          }
          break

        case 'grayscale':
          imageData = await lib.grayscale(imageData)
          break

        case 'rotate':
          if (opts.angle !== undefined) {
            imageData = await lib.rotate(imageData, opts.angle)
          }
          break

        case 'flip':
          imageData = await lib.flip(imageData)
          break

        case 'flop':
          imageData = await lib.flop(imageData)
          break

        case 'brightness':
          if (opts.value !== undefined) {
            imageData = await lib.brightness(imageData, opts.value)
          }
          break

        case 'contrast':
          if (opts.value !== undefined) {
            imageData = await lib.contrast(imageData, opts.value)
          }
          break

        case 'saturation':
          if (opts.value !== undefined) {
            imageData = await lib.saturation(imageData, opts.value)
          }
          break
      }
    }

    // Encode back to buffer
    return await lib.encode(imageData, 'png')
  } catch (error) {
    console.error(`[stx-media] Transformation failed: ${error}`)
    return null
  }
}
