/**
 * STX Image Optimization
 *
 * Comprehensive image optimization for improved Core Web Vitals (LCP).
 *
 * Features:
 * - Responsive images with srcset/sizes
 * - Modern format conversion (WebP, AVIF)
 * - Lazy loading with blur placeholders
 * - Build-time optimization
 * - <Image> component and @image directive
 *
 * @module image-optimization
 *
 * @example
 * ```html
 * <!-- Image Component -->
 * <Image
 *   src="/images/hero.jpg"
 *   alt="Hero image"
 *   width="1200"
 *   height="600"
 *   sizes="(max-width: 768px) 100vw, 50vw"
 *   priority
 * />
 *
 * <!-- @image Directive -->
 * @image('/images/photo.jpg', 'A photo', { width: 800, lazy: true })
 * ```
 *
 * @example
 * ```typescript
 * // Build plugin
 * import { createImagePlugin } from 'stx/image-optimization'
 *
 * const plugin = createImagePlugin({
 *   formats: ['webp', 'avif', 'jpeg'],
 *   widths: [320, 640, 1024, 1920],
 *   quality: 80,
 * })
 * ```
 */

// ============================================================================
// Processor Exports
// ============================================================================

export {
  // Core processing
  processImage,
  getImageMetadata,
  isSharpAvailable,

  // HTML helpers
  generateSrcSet,
  generateSizes,
  getFallbackVariant,
  groupVariantsByFormat,

  // Utilities
  isImageFile,
  getMimeType,
  getTotalSize,
  formatSize,

  // Error class
  ImageProcessingError,

  // Constants
  DEFAULT_WIDTHS,
  DEFAULT_FORMATS,
  DEFAULT_QUALITY,

  // Types
  type ImageOptions,
  type ImageFormat,
  type ProcessedImage,
  type ImageVariant,
  type ImageMetadata,
} from './processor'

// ============================================================================
// Component Exports
// ============================================================================

export {
  // Rendering
  renderImageComponent,
  parseImageComponent,
  processImageComponents,

  // Types
  type ImageComponentProps,
  type ImageRenderContext,
  type ImageRenderResult,
} from './component'

// ============================================================================
// Directive Exports
// ============================================================================

export {
  // Directive
  imageDirective,
  createImageDirective,
  clearImageCache,

  // Types
  type ImageDirectiveOptions,
} from './directive'

// ============================================================================
// Build Plugin Exports
// ============================================================================

export {
  // Plugin
  createImagePlugin,

  // Standalone functions
  optimizeImage,
  optimizeDirectory,
  generateImageManifest,
  writeImageManifest,

  // Types
  type ImageBuildOptions,
  type ImageBuildContext,
} from './build-plugin'

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Image optimization configuration for stx.config.ts
 */
export interface ImageConfig {
  /** Enable image optimization */
  enabled?: boolean
  /** Default widths for responsive images */
  widths?: number[]
  /** Default output formats */
  formats?: ('webp' | 'avif' | 'jpeg' | 'png')[]
  /** Default quality (1-100) */
  quality?: number
  /** Enable during development */
  devOptimize?: boolean
  /** Cache directory */
  cacheDir?: string
  /** Placeholder generation */
  placeholder?: 'blur' | 'dominant-color' | 'none'
  /** Input directories to scan */
  inputDirs?: string[]
  /** Output directory */
  outputDir?: string
  /** Base URL for generated images */
  baseUrl?: string
}

/**
 * Default image configuration
 */
export const defaultImageConfig: ImageConfig = {
  enabled: true,
  widths: [320, 640, 768, 1024, 1280, 1536, 1920],
  formats: ['webp', 'jpeg'],
  quality: 80,
  devOptimize: false,
  cacheDir: '.stx/image-cache',
  placeholder: 'none',
  inputDirs: ['public', 'src/assets', 'assets'],
  outputDir: 'dist/images',
  baseUrl: '/images',
}
