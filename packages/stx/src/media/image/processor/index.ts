/**
 * STX Media - Image Processor
 *
 * Integration with ts-images for build-time image optimization.
 *
 * @module media/image/processor
 */

export { processImage, optimizeImage, applyTransformations } from './optimizer'
export { generateResponsiveVariants, generateSrcset } from './responsive'
export { getCachedImageResult, setCachedImageResult, clearImageCache, ImageProcessorCache } from './cache'

// Re-export types for convenience
export type {
  EnhancedImgProps,
  ProcessedImageResult,
  ResponsiveVariantSet,
  TsImagesConfig,
  ImageOptimizationPreset,
  ImageTransformationConfig,
  FormatQualitySettings,
} from '../../types'
