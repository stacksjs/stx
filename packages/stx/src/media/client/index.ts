/**
 * STX Media - Client-Side Runtime
 *
 * Client-side utilities for lazy loading, blur-up effects, and file uploads.
 *
 * @module media/client
 */

// =============================================================================
// Lazy Loading
// =============================================================================

export {
  // Types
  type LazyLoadOptions,

  // Feature detection
  isNativeLazySupported,
  isIntersectionObserverSupported,

  // Initialization
  initLazyLoading,
  loadElement,

  // Manual loading
  lazyLoad,
  lazyLoadAll,

  // Observer utilities
  createLazyObserver,
  observeElement,
  disconnectObserver,

  // Runtime generation
  generateLazyLoadRuntime,
} from './lazy-load'

// =============================================================================
// Blur-Up Effects
// =============================================================================

export {
  // Types
  type BlurUpOptions,

  // Initialization
  initBlurUp,
  initAllBlurUp,

  // Thumbhash utilities
  renderThumbhashToCanvas,
  thumbHashToRGBA,
  thumbHashToDataURL,
  parseThumbhashString,

  // Transitions
  crossfadeTransition,

  // Runtime generation
  generateBlurUpRuntime,
  generateBlurUpCSS,
} from './blur-up'

// =============================================================================
// Upload Handler
// =============================================================================

export {
  // Types
  type UploadHandlerOptions,
  type UploadProgress,
  type UploadResult,
  type FileValidationResult,

  // Validation
  validateFile,

  // Upload functions
  uploadFile,
  uploadFiles,

  // Preview generation
  generateImagePreview,
  generateVideoPreview,

  // Runtime generation
  generateUploadRuntime,
} from './upload-handler'

// =============================================================================
// Combined Runtime
// =============================================================================

import { generateLazyLoadRuntime } from './lazy-load'
import { generateBlurUpRuntime, generateBlurUpCSS } from './blur-up'
import { generateUploadRuntime } from './upload-handler'

/**
 * Generate the complete media client runtime
 */
export function generateMediaRuntime(): { script: string; css: string } {
  const scripts = [
    generateLazyLoadRuntime(),
    generateBlurUpRuntime(),
    generateUploadRuntime(),
  ]

  return {
    script: scripts.join('\n\n'),
    css: generateBlurUpCSS(),
  }
}

/**
 * Generate minified media runtime for production
 */
export function generateMinifiedMediaRuntime(): { script: string; css: string } {
  const { script, css } = generateMediaRuntime()

  // Basic minification (remove comments, extra whitespace)
  const minScript = script
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .trim()

  const minCss = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,:])\s*/g, '$1')
    .trim()

  return {
    script: minScript,
    css: minCss,
  }
}
