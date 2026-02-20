/**
 * STX Media - Client-Side Blur-Up Animation
 *
 * Smooth blur-up transition from placeholder to full image.
 * Supports thumbhash, blur LQIP, and color placeholders.
 *
 * @module media/client/blur-up
 */

// =============================================================================
// Types
// =============================================================================

export interface BlurUpOptions {
  /** Transition duration in ms */
  duration?: number
  /** CSS easing function */
  easing?: string
  /** Remove placeholder element after load */
  removePlaceholder?: boolean
  /** Class to add when loaded */
  loadedClass?: string
  /** Class to add when loading */
  loadingClass?: string
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: BlurUpOptions = {
  duration: 300,
  easing: 'ease-out',
  removePlaceholder: false,
  loadedClass: 'stx-img-loaded',
  loadingClass: 'stx-img-loading',
}

// =============================================================================
// Blur-Up Implementation
// =============================================================================

/**
 * Initialize blur-up effect for an image
 *
 * @example
 * ```typescript
 * const img = document.querySelector('img.has-placeholder')
 * initBlurUp(img, { duration: 500 })
 * ```
 */
export function initBlurUp(img: HTMLImageElement, options: BlurUpOptions = {}): void {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const wrapper = img.closest('.stx-img-placeholder') as HTMLElement | null

  if (!wrapper) {
    // No wrapper, just handle the image
    handleImageLoad(img, opts)
    return
  }

  // Set CSS custom properties for transition
  wrapper.style.setProperty('--stx-img-transition-duration', `${opts.duration}ms`)
  wrapper.style.setProperty('--stx-img-transition-easing', opts.easing!)

  // Add loading class
  if (opts.loadingClass) {
    wrapper.classList.add(opts.loadingClass)
  }

  // Handle load event
  if (img.complete && img.naturalWidth > 0) {
    // Image already loaded
    onImageLoaded(img, wrapper, opts)
  } else {
    img.addEventListener('load', () => onImageLoaded(img, wrapper, opts), { once: true })
    img.addEventListener('error', () => onImageError(img, wrapper, opts), { once: true })
  }
}

/**
 * Handle simple image load (no wrapper)
 */
function handleImageLoad(img: HTMLImageElement, options: BlurUpOptions): void {
  const handleLoad = () => {
    img.style.transition = `opacity ${options.duration}ms ${options.easing}`
    img.style.opacity = '1'
    img.classList.remove(options.loadingClass!)
    img.classList.add(options.loadedClass!)
  }

  if (img.complete && img.naturalWidth > 0) {
    handleLoad()
  } else {
    img.style.opacity = '0'
    img.classList.add(options.loadingClass!)
    img.addEventListener('load', handleLoad, { once: true })
  }
}

/**
 * Called when image has loaded
 */
function onImageLoaded(img: HTMLImageElement, wrapper: HTMLElement, options: BlurUpOptions): void {
  // Remove loading class, add loaded class
  if (options.loadingClass) {
    wrapper.classList.remove(options.loadingClass)
  }
  if (options.loadedClass) {
    wrapper.classList.add(options.loadedClass)
  }

  // Fade in the image
  img.style.opacity = '1'

  // Optionally remove placeholder after transition
  if (options.removePlaceholder) {
    setTimeout(() => {
      wrapper.style.backgroundImage = 'none'
    }, options.duration)
  }
}

/**
 * Called when image fails to load
 */
function onImageError(img: HTMLImageElement, wrapper: HTMLElement, options: BlurUpOptions): void {
  if (options.loadingClass) {
    wrapper.classList.remove(options.loadingClass)
  }
  wrapper.classList.add('stx-img-error')
  img.classList.add('stx-img-error')
}

// =============================================================================
// Thumbhash Rendering
// =============================================================================

/**
 * Render a thumbhash to a canvas element
 *
 * Based on https://github.com/evanw/thumbhash
 */
export function renderThumbhashToCanvas(hash: Uint8Array, canvas: HTMLCanvasElement): void {
  const rgba = thumbHashToRGBA(hash)
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = rgba.w
  canvas.height = rgba.h

  const imageData = ctx.createImageData(rgba.w, rgba.h)
  imageData.data.set(rgba.rgba)
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Decode a thumbhash to RGBA pixel data
 *
 * This is a minimal decoder based on the thumbhash spec.
 * Returns a 32x32 RGBA image.
 */
export function thumbHashToRGBA(hash: Uint8Array): { w: number; h: number; rgba: Uint8ClampedArray } {
  // Read header
  const header = hash[0] | (hash[1] << 8) | (hash[2] << 16)
  const l_dc = (header & 63) / 63
  const p_dc = ((header >> 6) & 63) / 31.5 - 1
  const q_dc = ((header >> 12) & 63) / 31.5 - 1
  const l_scale = ((header >> 18) & 31) / 31
  const hasAlpha = (header >> 23) !== 0

  const header2 = hash[3] | (hash[4] << 8)
  const p_scale = ((header2 >> 3) & 63) / 63
  const q_scale = ((header2 >> 9) & 63) / 63
  const isLandscape = (header2 >> 15) !== 0

  const lx = Math.max(3, isLandscape ? (hasAlpha ? 5 : 7) : (hasAlpha ? 5 : 5))
  const ly = Math.max(3, isLandscape ? (hasAlpha ? 5 : 5) : (hasAlpha ? 5 : 7))

  // Simplified: generate a 32x32 gradient image from DC values
  const w = 32
  const h = 32
  const rgba = new Uint8ClampedArray(w * h * 4)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4

      // Simple gradient based on DC values
      const fx = x / (w - 1)
      const fy = y / (h - 1)

      const l = l_dc + (fx - 0.5) * l_scale * 0.5 + (fy - 0.5) * l_scale * 0.5
      const p = p_dc * (1 - fx * 0.3)
      const q = q_dc * (1 - fy * 0.3)

      // Convert L, P, Q to RGB
      const b = l - (2 / 3) * p
      const r = (3 * l - b + q) / 2
      const g = r - q

      rgba[i] = Math.max(0, Math.min(255, Math.round(r * 255)))
      rgba[i + 1] = Math.max(0, Math.min(255, Math.round(g * 255)))
      rgba[i + 2] = Math.max(0, Math.min(255, Math.round(b * 255)))
      rgba[i + 3] = 255
    }
  }

  return { w, h, rgba }
}

/**
 * Convert a thumbhash to a data URL
 */
export function thumbHashToDataURL(hash: Uint8Array): string {
  const rgba = thumbHashToRGBA(hash)

  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = rgba.w
  canvas.height = rgba.h

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  const imageData = ctx.createImageData(rgba.w, rgba.h)
  imageData.data.set(rgba.rgba)
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/png')
}

/**
 * Parse a base64-encoded thumbhash string
 */
export function parseThumbhashString(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// =============================================================================
// Crossfade Transition
// =============================================================================

/**
 * Crossfade transition between two elements
 */
export function crossfadeTransition(
  from: HTMLElement,
  to: HTMLElement,
  duration: number = 300,
): Promise<void> {
  return new Promise((resolve) => {
    // Start state
    from.style.transition = `opacity ${duration}ms ease-out`
    to.style.transition = `opacity ${duration}ms ease-out`
    to.style.opacity = '0'

    // Trigger reflow
    void to.offsetWidth

    // Animate
    from.style.opacity = '0'
    to.style.opacity = '1'

    setTimeout(resolve, duration)
  })
}

// =============================================================================
// Auto-Initialize
// =============================================================================

/**
 * Initialize blur-up for all elements with data-stx-blur-up
 */
export function initAllBlurUp(options: BlurUpOptions = {}): void {
  const elements = document.querySelectorAll<HTMLImageElement>('[data-stx-blur-up], .stx-img-placeholder img')

  elements.forEach((img) => {
    initBlurUp(img, options)
  })
}

/**
 * Generate the client-side blur-up runtime script
 */
export function generateBlurUpRuntime(): string {
  return `
(function() {
  'use strict';

  if (typeof window === 'undefined') return;

  var defaultOptions = {
    duration: 300,
    easing: 'ease-out',
    loadedClass: 'stx-img-loaded'
  };

  function initBlurUp(img, options) {
    options = Object.assign({}, defaultOptions, options);
    var wrapper = img.closest('.stx-img-placeholder');

    if (!wrapper) {
      if (img.complete && img.naturalWidth > 0) {
        img.style.opacity = '1';
      } else {
        img.style.opacity = '0';
        img.style.transition = 'opacity ' + options.duration + 'ms ' + options.easing;
        img.onload = function() { img.style.opacity = '1'; };
      }
      return;
    }

    wrapper.style.setProperty('--stx-img-transition-duration', options.duration + 'ms');
    wrapper.style.setProperty('--stx-img-transition-easing', options.easing);

    var onLoaded = function() {
      wrapper.classList.add(options.loadedClass);
      img.style.opacity = '1';
    };

    if (img.complete && img.naturalWidth > 0) {
      onLoaded();
    } else {
      img.addEventListener('load', onLoaded, { once: true });
    }
  }

  function init() {
    var elements = document.querySelectorAll('.stx-img-placeholder img, [data-stx-blur-up]');
    elements.forEach(function(img) { initBlurUp(img); });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual use
  window.STX = window.STX || {};
  window.STX.initBlurUp = initBlurUp;
  window.STX.initAllBlurUp = init;
})();
`.trim()
}

/**
 * Generate CSS for blur-up effect
 */
export function generateBlurUpCSS(): string {
  return `
.stx-img-placeholder {
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.stx-img-placeholder img {
  display: block;
  width: 100%;
  height: auto;
  opacity: 0;
  transition: opacity var(--stx-img-transition-duration, 300ms) var(--stx-img-transition-easing, ease-out);
}

.stx-img-placeholder.stx-img-loaded img {
  opacity: 1;
}

.stx-img-blur {
  filter: blur(20px);
  transform: scale(1.1);
  transition: filter var(--stx-img-transition-duration, 300ms) var(--stx-img-transition-easing, ease-out),
              transform var(--stx-img-transition-duration, 300ms) var(--stx-img-transition-easing, ease-out);
}

.stx-img-loaded .stx-img-blur,
.stx-img-blur.stx-img-loaded {
  filter: blur(0);
  transform: scale(1);
}

.stx-img-error {
  opacity: 0.5;
}
`.trim()
}
