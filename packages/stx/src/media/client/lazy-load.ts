/**
 * STX Media - Client-Side Lazy Loading
 *
 * IntersectionObserver-based lazy loading for images and media.
 * Supports native loading="lazy" with intelligent fallback.
 *
 * @module media/client/lazy-load
 */

// =============================================================================
// Types
// =============================================================================

export interface LazyLoadOptions {
  /** Root element for intersection observer */
  root?: Element | null
  /** Root margin (e.g., '50px' to load earlier) */
  rootMargin?: string
  /** Intersection threshold(s) */
  threshold?: number | number[]
  /** Use native loading="lazy" when supported */
  useNative?: boolean
  /** Selector for lazy elements */
  selector?: string
  /** Callback when an element starts loading */
  onLoad?: (element: HTMLElement) => void
  /** Callback when an element finishes loading */
  onLoaded?: (element: HTMLElement) => void
  /** Callback on load error */
  onError?: (element: HTMLElement, error: Error) => void
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: LazyLoadOptions = {
  root: null,
  rootMargin: '50px 0px',
  threshold: 0,
  useNative: true,
  selector: '[data-stx-lazy]',
}

// =============================================================================
// Feature Detection
// =============================================================================

/**
 * Check if native lazy loading is supported
 */
export function isNativeLazySupported(): boolean {
  return 'loading' in HTMLImageElement.prototype
}

/**
 * Check if IntersectionObserver is supported
 */
export function isIntersectionObserverSupported(): boolean {
  return 'IntersectionObserver' in window
}

// =============================================================================
// Lazy Load Implementation
// =============================================================================

/**
 * Initialize lazy loading for all matching elements
 *
 * @example
 * ```typescript
 * // Initialize with default options
 * initLazyLoading()
 *
 * // Initialize with custom options
 * initLazyLoading({
 *   rootMargin: '100px',
 *   onLoaded: (el) => console.log('Loaded:', el)
 * })
 * ```
 */
export function initLazyLoading(options: LazyLoadOptions = {}): () => void {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const elements = document.querySelectorAll<HTMLElement>(opts.selector!)

  if (elements.length === 0) {
    return () => {}
  }

  // Use native lazy loading if available and enabled
  if (opts.useNative && isNativeLazySupported()) {
    elements.forEach((el) => {
      if (el.tagName === 'IMG' || el.tagName === 'IFRAME') {
        loadElement(el, opts)
      }
    })
    return () => {}
  }

  // Fall back to IntersectionObserver
  if (!isIntersectionObserverSupported()) {
    // Ultimate fallback: load everything immediately
    elements.forEach((el) => loadElement(el, opts))
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement
          loadElement(el, opts)
          observer.unobserve(el)
        }
      })
    },
    {
      root: opts.root,
      rootMargin: opts.rootMargin,
      threshold: opts.threshold,
    },
  )

  elements.forEach((el) => observer.observe(el))

  // Return cleanup function
  return () => {
    observer.disconnect()
  }
}

/**
 * Load a single lazy element
 */
export function loadElement(element: HTMLElement, options: LazyLoadOptions = {}): void {
  const { onLoad, onLoaded, onError } = options

  if (onLoad) {
    onLoad(element)
  }

  const isImg = element.tagName === 'IMG'
  const isVideo = element.tagName === 'VIDEO'
  const isIframe = element.tagName === 'IFRAME'

  if (isImg) {
    loadImage(element as HTMLImageElement, onLoaded, onError)
  } else if (isVideo) {
    loadVideo(element as HTMLVideoElement, onLoaded, onError)
  } else if (isIframe) {
    loadIframe(element as HTMLIFrameElement, onLoaded, onError)
  } else {
    // For wrapper elements, find nested img/video
    const img = element.querySelector('img[data-src], img[data-srcset]') as HTMLImageElement
    const video = element.querySelector('video[data-src]') as HTMLVideoElement

    if (img) {
      loadImage(img, () => {
        if (onLoaded) onLoaded(element)
      }, (error) => {
        if (onError) onError(element, error)
      })
    } else if (video) {
      loadVideo(video, () => {
        if (onLoaded) onLoaded(element)
      }, (error) => {
        if (onError) onError(element, error)
      })
    }

    // Load sources within picture elements
    const sources = element.querySelectorAll('source[data-srcset]')
    sources.forEach((source) => {
      const sourceEl = source as HTMLSourceElement
      if (sourceEl.dataset.srcset) {
        sourceEl.srcset = sourceEl.dataset.srcset
        delete sourceEl.dataset.srcset
      }
      if (sourceEl.dataset.sizes) {
        sourceEl.sizes = sourceEl.dataset.sizes
        delete sourceEl.dataset.sizes
      }
    })
  }
}

/**
 * Load an image element
 */
function loadImage(
  img: HTMLImageElement,
  onLoaded?: (el: HTMLElement) => void,
  onError?: (el: HTMLElement, error: Error) => void,
): void {
  const handleLoad = () => {
    img.classList.add('stx-img-loaded')
    img.style.opacity = '1'

    // Trigger loaded state on parent wrapper
    const wrapper = img.closest('.stx-img-placeholder')
    if (wrapper) {
      wrapper.classList.add('stx-img-loaded')
    }

    if (onLoaded) onLoaded(img)
  }

  const handleError = () => {
    img.classList.add('stx-img-error')
    if (onError) onError(img, new Error(`Failed to load image: ${img.src}`))
  }

  img.addEventListener('load', handleLoad, { once: true })
  img.addEventListener('error', handleError, { once: true })

  // Set actual sources
  if (img.dataset.srcset) {
    img.srcset = img.dataset.srcset
    delete img.dataset.srcset
  }
  if (img.dataset.src) {
    img.src = img.dataset.src
    delete img.dataset.src
  }
  if (img.dataset.sizes) {
    img.sizes = img.dataset.sizes
    delete img.dataset.sizes
  }
}

/**
 * Load a video element
 */
function loadVideo(
  video: HTMLVideoElement,
  onLoaded?: (el: HTMLElement) => void,
  onError?: (el: HTMLElement, error: Error) => void,
): void {
  const handleLoaded = () => {
    video.classList.add('stx-video-loaded')
    if (onLoaded) onLoaded(video)
  }

  const handleError = () => {
    video.classList.add('stx-video-error')
    if (onError) onError(video, new Error(`Failed to load video: ${video.src}`))
  }

  video.addEventListener('loadeddata', handleLoaded, { once: true })
  video.addEventListener('error', handleError, { once: true })

  // Load sources
  const sources = video.querySelectorAll('source[data-src]')
  sources.forEach((source) => {
    const sourceEl = source as HTMLSourceElement
    if (sourceEl.dataset.src) {
      sourceEl.src = sourceEl.dataset.src
      delete sourceEl.dataset.src
    }
  })

  // Set video src
  if (video.dataset.src) {
    video.src = video.dataset.src
    delete video.dataset.src
  }
  if (video.dataset.poster) {
    video.poster = video.dataset.poster
    delete video.dataset.poster
  }

  video.load()
}

/**
 * Load an iframe element
 */
function loadIframe(
  iframe: HTMLIFrameElement,
  onLoaded?: (el: HTMLElement) => void,
  onError?: (el: HTMLElement, error: Error) => void,
): void {
  const handleLoad = () => {
    iframe.classList.add('stx-iframe-loaded')
    if (onLoaded) onLoaded(iframe)
  }

  const handleError = () => {
    iframe.classList.add('stx-iframe-error')
    if (onError) onError(iframe, new Error(`Failed to load iframe: ${iframe.src}`))
  }

  iframe.addEventListener('load', handleLoad, { once: true })
  iframe.addEventListener('error', handleError, { once: true })

  if (iframe.dataset.src) {
    iframe.src = iframe.dataset.src
    delete iframe.dataset.src
  }
}

// =============================================================================
// Manual Loading
// =============================================================================

/**
 * Manually trigger loading for a specific element
 */
export function lazyLoad(element: HTMLElement): void {
  loadElement(element, {})
}

/**
 * Manually trigger loading for all matching elements
 */
export function lazyLoadAll(selector: string = '[data-stx-lazy]'): void {
  const elements = document.querySelectorAll<HTMLElement>(selector)
  elements.forEach((el) => loadElement(el, {}))
}

// =============================================================================
// Observer Utilities
// =============================================================================

/**
 * Create a reusable intersection observer
 */
export function createLazyObserver(options: LazyLoadOptions = {}): IntersectionObserver {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  return new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadElement(entry.target as HTMLElement, opts)
          observer.unobserve(entry.target)
        }
      })
    },
    {
      root: opts.root,
      rootMargin: opts.rootMargin,
      threshold: opts.threshold,
    },
  )
}

/**
 * Observe a new element with an existing observer
 */
export function observeElement(observer: IntersectionObserver, element: HTMLElement): void {
  observer.observe(element)
}

/**
 * Unobserve all elements and disconnect
 */
export function disconnectObserver(observer: IntersectionObserver): void {
  observer.disconnect()
}

// =============================================================================
// Auto-Initialize
// =============================================================================

/**
 * Generate the client-side lazy loading runtime script
 */
export function generateLazyLoadRuntime(): string {
  return `
(function() {
  'use strict';

  if (typeof window === 'undefined') return;

  var defaultOptions = {
    root: null,
    rootMargin: '50px 0px',
    threshold: 0
  };

  function isNativeLazySupported() {
    return 'loading' in HTMLImageElement.prototype;
  }

  function loadElement(el) {
    var img = el.tagName === 'IMG' ? el : el.querySelector('img[data-src], img[data-srcset]');
    var video = el.tagName === 'VIDEO' ? el : el.querySelector('video[data-src]');

    // Load sources in picture elements
    var sources = el.querySelectorAll('source[data-srcset]');
    sources.forEach(function(source) {
      if (source.dataset.srcset) {
        source.srcset = source.dataset.srcset;
        delete source.dataset.srcset;
      }
      if (source.dataset.sizes) {
        source.sizes = source.dataset.sizes;
        delete source.dataset.sizes;
      }
    });

    if (img) {
      img.onload = function() {
        img.style.opacity = '1';
        img.classList.add('stx-img-loaded');
        var wrapper = img.closest('.stx-img-placeholder');
        if (wrapper) wrapper.classList.add('stx-img-loaded');
      };
      if (img.dataset.srcset) { img.srcset = img.dataset.srcset; delete img.dataset.srcset; }
      if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
      if (img.dataset.sizes) { img.sizes = img.dataset.sizes; delete img.dataset.sizes; }
    }

    if (video) {
      var videoSources = video.querySelectorAll('source[data-src]');
      videoSources.forEach(function(source) {
        if (source.dataset.src) { source.src = source.dataset.src; delete source.dataset.src; }
      });
      if (video.dataset.src) { video.src = video.dataset.src; delete video.dataset.src; }
      if (video.dataset.poster) { video.poster = video.dataset.poster; delete video.dataset.poster; }
      video.load();
    }
  }

  function init() {
    var elements = document.querySelectorAll('[data-stx-lazy]');
    if (!elements.length) return;

    if (!('IntersectionObserver' in window)) {
      elements.forEach(loadElement);
      return;
    }

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadElement(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    elements.forEach(function(el) { observer.observe(el); });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for manual use
  window.STX = window.STX || {};
  window.STX.lazyLoad = loadElement;
  window.STX.initLazyLoading = init;
})();
`.trim()
}
