/**
 * STX Media Module
 *
 * Comprehensive media handling for responsive images, video playback,
 * content protection, file uploads, and media management.
 *
 * Features:
 * - Responsive images with srcset and lazy loading
 * - Blur-up placeholder effects (thumbhash, LQIP)
 * - imgix-style URL transformations
 * - Video playback with HTML5 and embeds
 * - Content protection via signed URLs
 * - File upload with progress tracking
 * - Media manager integration
 *
 * @module media
 *
 * @example
 * ```html
 * <!-- Responsive image with blur-up -->
 * <Img
 *   src="/images/hero.jpg"
 *   alt="Hero"
 *   sizes="(max-width: 768px) 100vw, 50vw"
 *   placeholder="thumbhash"
 *   lazy
 * />
 *
 * <!-- Video with lazy loading -->
 * <Video
 *   src="/videos/intro.mp4"
 *   poster="/images/poster.jpg"
 *   controls
 *   lazy
 * />
 *
 * <!-- Protected content -->
 * <ProtectedImg
 *   src="/api/media/secure.jpg"
 *   signatureEndpoint="/api/sign"
 *   auth="{{ { role: 'premium' } }}"
 * />
 *
 * <!-- File upload -->
 * <MediaUpload
 *   endpoint="/api/upload"
 *   accept="image/*"
 *   preview
 * />
 * ```
 */

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Placeholder types
  PlaceholderStrategy,
  PlaceholderOptions,
  PlaceholderResult,

  // Image types (prefixed to avoid conflicts with image-optimization)
  ImageFormat as MediaImageFormat,
  ImageFit,
  ImageCrop,
  ImageParams,
  ImageVariant,
  ProcessedImage,
  ImgProps,
  ImgDirectiveOptions,
  ImageRenderContext as MediaImageRenderContext,
  ImageRenderResult,

  // Enhanced image types (ts-images integration)
  EnhancedImgProps,
  ProcessedImageResult,
  ResponsiveVariantSet,
  TsImagesConfig,
  ImageOptimizationPreset,
  ImageTransformation,
  ImageTransformationConfig,
  FormatQualitySettings,
  WatermarkConfig,
  WatermarkPosition,
  ArtDirectionConfig,

  // Video types
  VideoSource,
  VideoEmbedType,
  PlyrControl,
  PlyrOptions,
  VideoProps,
  VideoDirectiveOptions,
  VideoRenderResult,

  // Enhanced video types (ts-videos integration)
  EnhancedVideoProps,
  ProcessedVideoResult,
  TsVideosConfig,
  VideoQualityPreset,
  VideoPlatformPreset,
  VideoCodec,
  AudioCodec,
  TranscodeConfig,
  TranscodeResult,
  ThumbnailResult,
  PosterGenerationConfig,
  SpriteSheetConfig,
  StreamingConfig,
  StreamingQualityLevel,
  HLSResult,
  DASHResult,
  WaveformConfig,

  // Upload types
  UploadConfig,
  UploadProgress,
  UploadResult,
  FileValidationResult,
  MediaUploadProps,
  UploadDirectiveOptions,

  // Protected media types
  SignedUrl,
  SignatureConfig,
  BatchSignatureRequest,
  BatchSignatureResult,
  ProtectedAuthContext,
  ProtectedMediaProps,
  ProtectedDirectiveOptions,

  // Media manager types
  MediaManagerConfig,
  MediaItem,

  // Configuration types
  MediaConfig,
  MediaImageConfig,
  MediaVideoConfig,
  MediaUploadConfig,
  MediaProtectedConfig,
  MediaCacheConfig,

  // Client types
  LazyLoadOptions,
  BlurUpOptions,

  // Utility types
  Breakpoint,
  SrcsetOptions,
  SrcsetData,
} from './types'

// =============================================================================
// Image Module
// =============================================================================

export {
  // Component
  renderImgComponent,
  parseImgComponent,
  processImgComponents,

  // Directive
  createImgDirective,
  imgDirective,

  // Srcset generation (prefixed to avoid conflicts with image-optimization)
  DEFAULT_WIDTHS as MEDIA_DEFAULT_WIDTHS,
  DEFAULT_DPR_VALUES,
  DEFAULT_FORMATS as MEDIA_DEFAULT_FORMATS,
  MIME_TYPES,
  COMMON_SIZES,
  generateWidthSrcset,
  generateAutoWidthSrcset,
  calculateOptimalWidths,
  generateDprSrcset,
  generateDprSrcsetWithVariableQuality,
  generateSizesAttribute,
  generateSizesFromBreakpoints,
  buildImageUrl,
  parseImageUrl,
  generateSrcsetData,
  generateSourceTags,
  getBestVariant,
  getFallbackVariant,
  groupVariantsByFormat,
  getMimeType,
  getFormatExtension,
  detectFormat,

  // Placeholder generation
  DEFAULT_PLACEHOLDER_OPTIONS,
  BLUR_UP_CSS,
  generatePlaceholder,
  generateThumbhashPlaceholder,
  generateLQIP,
  extractDominantColor,
  generateColorPlaceholder,
  decodeThumbhash,
  generatePlaceholderCSS,
  generatePlaceholderStyle,
  getCachedPlaceholder,
  clearPlaceholderCache,
  getPlaceholderCacheStats,

  // Editing API
  buildUrl,
  parseUrl,
  mergeParams,
  resize,
  crop,
  thumbnail,
  contain,
  cover,
  blur,
  sharpen,
  grayscale,
  sepia,
  invert,
  brightness,
  contrast,
  saturation,
  rotate,
  flipHorizontal,
  flipVertical,
  format,
  quality,
  auto,
  watermark,
  PRESETS,
  applyPreset,
  srcsetUrls,
  dprUrls,
  validateParams,
  sanitizeParams,
} from './image'

// =============================================================================
// Image Processor Module (ts-images integration)
// =============================================================================

export {
  processImage,
  optimizeImage,
  applyTransformations,
  generateResponsiveVariants,
  generateSrcset,
  getCachedImageResult,
  setCachedImageResult,
  clearImageCache,
  ImageProcessorCache,
} from './image/processor'

// =============================================================================
// Video Module
// =============================================================================

export {
  renderVideoComponent,
  parseVideoDirectiveOptions,
  // Directive
  createVideoDirective,
  videoDirective,
} from './video'

// Export types separately
export type { ExtendedVideoRenderContext } from './video'

// =============================================================================
// Video Processor Module (ts-videos integration)
// =============================================================================

export {
  processVideo,
  analyzeVideo,
  generatePoster,
  generateThumbnails,
  generateSpriteSheet,
  generateHLSManifest,
  generateDASHManifest,
  getCachedVideoResult,
  setCachedVideoResult,
  clearVideoCache,
  VideoProcessorCache,
} from './video/processor'

// =============================================================================
// Upload Module
// =============================================================================

export { renderMediaUpload } from './upload'

// =============================================================================
// Protected Media Module
// =============================================================================

export {
  // URL signing
  signUrl,
  batchSignUrls,
  smartBatchSign,

  // Validation
  isSignatureValid,
  getTimeUntilExpiry,
  shouldRefreshSignature,

  // Auth helpers
  checkAuthAccess,
  buildAuthParams,

  // Cache
  getCachedSignature,
  clearSignatureCache,
  pruneSignatureCache,

  // Component
  renderProtectedImg,
  renderProtectedVideo,
  processProtectedMedia,
  parseProtectedArgs,

  // Runtime
  generateSignatureRuntime,
} from './protected'

// =============================================================================
// Media Manager Module
// =============================================================================

export { generateMediaManagerEmbed, generateSimpleMediaPicker } from './manager/embed'

// =============================================================================
// Client Runtime Module
// =============================================================================

export {
  // Lazy loading
  isNativeLazySupported,
  isIntersectionObserverSupported,
  initLazyLoading,
  loadElement,
  lazyLoad,
  lazyLoadAll,
  createLazyObserver,
  observeElement,
  disconnectObserver,
  generateLazyLoadRuntime,

  // Blur-up
  initBlurUp,
  initAllBlurUp,
  renderThumbhashToCanvas,
  thumbHashToRGBA,
  thumbHashToDataURL,
  parseThumbhashString,
  crossfadeTransition,
  generateBlurUpRuntime,
  generateBlurUpCSS,

  // Upload handler
  validateFile,
  uploadFile,
  uploadFiles,
  generateImagePreview,
  generateVideoPreview,
  generateUploadRuntime,

  // Combined runtime
  generateMediaRuntime,
  generateMinifiedMediaRuntime,
} from './client'

// =============================================================================
// Shared Utilities
// =============================================================================

export {
  hashFile,
  hashBuffer,
  hashString,
  generateCacheKey,
  getFileMtime,
  fileExists,
  getCached,
  setCached,
  clearCache,
  getCacheStats,
  pruneCache,
} from './shared'

export type { CacheConfig, CacheEntry } from './shared'

// =============================================================================
// Default Configuration
// =============================================================================

import type { MediaConfig } from './types'

/**
 * Default media configuration
 */
export const defaultMediaConfig: MediaConfig = {
  enabled: true,
  image: {
    enabled: true,
    defaultWidths: [320, 480, 640, 768, 1024, 1280, 1536, 1920],
    defaultFormats: ['avif', 'webp', 'jpeg'],
    defaultQuality: 80,
    placeholderStrategy: 'thumbhash',
    lazyByDefault: true,
    enableDpr: true,
    defaultDpr: [1, 2, 3],
  },
  video: {
    enabled: true,
    lazyByDefault: true,
    defaultControls: true,
  },
  upload: {
    enabled: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'video/*', 'audio/*', 'application/pdf'],
    maxConcurrent: 3,
  },
  protected: {
    enabled: true,
    expirationSeconds: 3600,
    batchSize: 10,
  },
  cache: {
    enabled: true,
    directory: '.stx/media-cache',
    maxAge: 30,
    maxSize: 500,
  },
}
