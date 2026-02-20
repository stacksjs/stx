/**
 * STX Media - Image Module
 *
 * Complete image optimization with responsive srcset, lazy loading,
 * blur-up placeholders, and imgix-style URL transformations.
 *
 * @module media/image
 */

// =============================================================================
// Component Exports
// =============================================================================

export {
  // Main render function
  renderImgComponent,
  // Template parser
  parseImgComponent,
  processImgComponents,
} from './component'

// Export types separately
export type { ExtendedImageRenderContext } from './component'

// =============================================================================
// Directive Exports
// =============================================================================

export {
  // Directive factory
  createImgDirective,
  // Directive instance
  imgDirective,
} from './directive'

// =============================================================================
// Srcset Exports
// =============================================================================

export {
  // Constants
  DEFAULT_WIDTHS,
  DEFAULT_DPR_VALUES,
  DEFAULT_FORMATS,
  MIME_TYPES,
  FORMAT_EXTENSIONS,
  COMMON_SIZES,

  // Width-based srcset
  generateWidthSrcset,
  generateAutoWidthSrcset,
  calculateOptimalWidths,

  // DPR-based srcset
  generateDprSrcset,
  generateDprSrcsetWithVariableQuality,

  // Sizes attribute
  generateSizesAttribute,
  generateSizesFromBreakpoints,

  // URL building
  buildImageUrl,
  parseImageUrl,

  // Full srcset generation
  generateSrcsetData,
  generateSourceTags,

  // Utilities
  getBestVariant,
  getFallbackVariant,
  groupVariantsByFormat,
  getMimeType,
  getFormatExtension,
  detectFormat,
} from './srcset'

// =============================================================================
// Placeholder Exports
// =============================================================================

export {
  // Constants
  DEFAULT_PLACEHOLDER_OPTIONS,
  BLUR_UP_CSS,

  // Generation
  generatePlaceholder,
  generateThumbhashPlaceholder,
  generateLQIP,
  extractDominantColor,
  generateColorPlaceholder,

  // Thumbhash
  decodeThumbhash,

  // CSS
  generatePlaceholderCSS,
  generatePlaceholderStyle,

  // Cache
  getCachedPlaceholder,
  clearPlaceholderCache,
  getPlaceholderCacheStats,
} from './placeholder'

// =============================================================================
// Editing API Exports
// =============================================================================

export {
  // URL building
  buildImageUrl as buildUrl,
  parseImageUrl as parseUrl,
  mergeParams,

  // Convenience functions
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

  // Watermark
  watermark,

  // Presets
  PRESETS,
  applyPreset,

  // Responsive helpers
  srcsetUrls,
  dprUrls,

  // Validation
  validateParams,
  sanitizeParams,
} from './editing'
