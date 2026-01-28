/**
 * STX Loading Indicator
 *
 * A Nuxt-inspired loading indicator for STX applications.
 * Provides both automatic page navigation loading and programmatic control.
 *
 * Usage in templates:
 *   <stx-loading-indicator />
 *   <stx-loading-indicator color="#6366f1" height="3px" />
 *
 * Programmatic usage:
 *   const loading = useLoadingIndicator()
 *   loading.start()
 *   await fetchData()
 *   loading.finish()
 */

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

export interface LoadingIndicatorOptions {
  /** Color of the loading bar */
  color?: string
  /** Initial color (gradient start) */
  initialColor?: string
  /** Height of the loading bar */
  height?: string
  /** Duration of the loading animation in ms */
  duration?: number
  /** Throttle time between updates in ms */
  throttle?: number
  /** Whether to auto-finish on page load */
  autoFinish?: boolean
  /** Z-index of the loading bar */
  zIndex?: number
}

export interface LoadingIndicatorState {
  isLoading: boolean
  progress: number
  error: boolean
}

export interface LoadingIndicatorInstance {
  /** Start the loading indicator */
  start: () => void
  /** Set progress (0-100) */
  set: (value: number) => void
  /** Finish loading (complete the bar) */
  finish: () => void
  /** Clear/reset the indicator */
  clear: () => void
  /** Current state */
  state: LoadingIndicatorState
}

// Default options
const defaultOptions: Required<LoadingIndicatorOptions> = {
  color: '#6366f1',
  initialColor: '',
  height: '3px',
  duration: 2000,
  throttle: 200,
  autoFinish: true,
  zIndex: 999999,
}

// Global state
let indicatorElement: HTMLElement | null = null
let currentProgress = 0
let isLoading = false
let rafId: number | null = null
let finishTimeout: ReturnType<typeof setTimeout> | null = null
let incrementInterval: ReturnType<typeof setInterval> | null = null

/**
 * Create the loading indicator DOM element
 */
function createIndicatorElement(options: Required<LoadingIndicatorOptions>): HTMLElement {
  if (!isBrowser) return null as any

  // Remove existing element if any
  const existing = document.getElementById('stx-loading-indicator')
  if (existing) existing.remove()

  const el = document.createElement('div')
  el.id = 'stx-loading-indicator'

  const gradient = options.initialColor
    ? `linear-gradient(to right, ${options.initialColor}, ${options.color})`
    : options.color

  el.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: ${options.height};
    background: ${gradient};
    z-index: ${options.zIndex};
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.1s ease-out, opacity 0.3s ease;
    opacity: 0;
    pointer-events: none;
  `

  // Add shimmer effect
  const shimmer = document.createElement('div')
  shimmer.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.4) 50%,
      transparent 100%
    );
    animation: stx-shimmer 1.5s infinite;
  `
  el.appendChild(shimmer)

  // Add keyframes for shimmer animation
  if (!document.getElementById('stx-loading-styles')) {
    const style = document.createElement('style')
    style.id = 'stx-loading-styles'
    style.textContent = `
      @keyframes stx-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(el)
  return el
}

/**
 * Update the indicator progress
 */
function updateProgress(progress: number, options: Required<LoadingIndicatorOptions>): void {
  if (!isBrowser || !indicatorElement) return

  currentProgress = Math.min(Math.max(progress, 0), 100)

  if (rafId) cancelAnimationFrame(rafId)

  rafId = requestAnimationFrame(() => {
    if (!indicatorElement) return

    indicatorElement.style.opacity = currentProgress > 0 ? '1' : '0'
    indicatorElement.style.transform = `scaleX(${currentProgress / 100})`
  })
}

/**
 * Start loading with auto-increment
 */
function startLoading(options: Required<LoadingIndicatorOptions>): void {
  if (!isBrowser) return

  isLoading = true
  currentProgress = 0

  // Create element if needed
  if (!indicatorElement) {
    indicatorElement = createIndicatorElement(options)
  }

  // Clear any existing timers
  if (finishTimeout) clearTimeout(finishTimeout)
  if (incrementInterval) clearInterval(incrementInterval)

  // Start progress
  updateProgress(10, options)

  // Auto-increment progress (slows down as it approaches 90%)
  incrementInterval = setInterval(() => {
    if (!isLoading) return

    // Slow down as we approach 90%
    const remaining = 90 - currentProgress
    const increment = Math.max(0.5, remaining * 0.1)

    if (currentProgress < 90) {
      updateProgress(currentProgress + increment, options)
    }
  }, options.throttle)
}

/**
 * Finish loading (complete to 100% and fade out)
 */
function finishLoading(options: Required<LoadingIndicatorOptions>): void {
  if (!isBrowser) return

  isLoading = false

  if (incrementInterval) {
    clearInterval(incrementInterval)
    incrementInterval = null
  }

  // Complete to 100%
  updateProgress(100, options)

  // Fade out after completion
  finishTimeout = setTimeout(() => {
    if (indicatorElement) {
      indicatorElement.style.opacity = '0'
    }

    // Reset after fade
    setTimeout(() => {
      currentProgress = 0
      if (indicatorElement) {
        indicatorElement.style.transform = 'scaleX(0)'
      }
    }, 300)
  }, 200)
}

/**
 * Clear/reset the indicator
 */
function clearLoading(): void {
  if (!isBrowser) return

  isLoading = false
  currentProgress = 0

  if (incrementInterval) {
    clearInterval(incrementInterval)
    incrementInterval = null
  }

  if (finishTimeout) {
    clearTimeout(finishTimeout)
    finishTimeout = null
  }

  if (indicatorElement) {
    indicatorElement.style.opacity = '0'
    indicatorElement.style.transform = 'scaleX(0)'
  }
}

/**
 * Create a loading indicator instance (composable-style)
 */
export function useLoadingIndicator(userOptions?: LoadingIndicatorOptions): LoadingIndicatorInstance {
  const options = { ...defaultOptions, ...userOptions }

  return {
    start: () => startLoading(options),
    set: (value: number) => updateProgress(value, options),
    finish: () => finishLoading(options),
    clear: () => clearLoading(),
    get state() {
      return {
        isLoading,
        progress: currentProgress,
        error: false,
      }
    },
  }
}

/**
 * Initialize automatic loading indicator for page navigation
 * Call this once in your app to enable automatic loading on route changes
 */
export function initLoadingIndicator(userOptions?: LoadingIndicatorOptions): void {
  if (!isBrowser) return

  const options = { ...defaultOptions, ...userOptions }
  const loading = useLoadingIndicator(options)

  // Create the element immediately
  indicatorElement = createIndicatorElement(options)

  // Hook into browser navigation events
  let navigating = false

  // Handle link clicks for SPA navigation
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    const link = target.closest('a')

    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    // Skip external links, anchors, and special links
    if (
      href.startsWith('http')
      || href.startsWith('#')
      || href.startsWith('mailto:')
      || href.startsWith('tel:')
      || link.target === '_blank'
      || link.hasAttribute('download')
    ) {
      return
    }

    // Start loading for internal navigation
    navigating = true
    loading.start()
  })

  // Handle popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    if (!navigating) {
      loading.start()
      navigating = true
    }
  })

  // Finish loading when page loads
  window.addEventListener('load', () => {
    if (navigating || options.autoFinish) {
      loading.finish()
      navigating = false
    }
  })

  // Handle fetch requests (optional - for API calls)
  const originalFetch = window.fetch
  let activeRequests = 0

  window.fetch = async function (...args) {
    // Only track same-origin API requests
    const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url
    const isApi = url.includes('/api/') || url.startsWith('/api')

    if (isApi) {
      activeRequests++
      if (activeRequests === 1 && !navigating) {
        loading.start()
      }
    }

    try {
      return await originalFetch.apply(this, args)
    }
    finally {
      if (isApi) {
        activeRequests--
        if (activeRequests === 0 && !navigating) {
          loading.finish()
        }
      }
    }
  }
}

/**
 * Generate the HTML for the loading indicator component
 * This is used by the STX compiler for <stx-loading-indicator />
 */
export function generateLoadingIndicatorHtml(options?: LoadingIndicatorOptions): string {
  const opts = { ...defaultOptions, ...options }

  const gradient = opts.initialColor
    ? `linear-gradient(to right, ${opts.initialColor}, ${opts.color})`
    : opts.color

  return `
<div id="stx-loading-indicator" style="
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: ${opts.height};
  background: ${gradient};
  z-index: ${opts.zIndex};
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.1s ease-out, opacity 0.3s ease;
  opacity: 0;
  pointer-events: none;
">
  <div style="
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
    animation: stx-shimmer 1.5s infinite;
  "></div>
</div>
<style>
  @keyframes stx-shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
</style>
<script>
(function() {
  var opts = ${JSON.stringify(opts)};
  var el = document.getElementById('stx-loading-indicator');
  var progress = 0;
  var loading = false;
  var interval = null;

  function update(p) {
    progress = Math.min(Math.max(p, 0), 100);
    if (el) {
      el.style.opacity = progress > 0 ? '1' : '0';
      el.style.transform = 'scaleX(' + (progress / 100) + ')';
    }
  }

  window.stxLoading = {
    start: function() {
      loading = true;
      progress = 0;
      update(10);
      if (interval) clearInterval(interval);
      interval = setInterval(function() {
        if (!loading) return;
        var remaining = 90 - progress;
        var inc = Math.max(0.5, remaining * 0.1);
        if (progress < 90) update(progress + inc);
      }, opts.throttle);
    },
    finish: function() {
      loading = false;
      if (interval) { clearInterval(interval); interval = null; }
      update(100);
      setTimeout(function() {
        if (el) el.style.opacity = '0';
        setTimeout(function() {
          progress = 0;
          if (el) el.style.transform = 'scaleX(0)';
        }, 300);
      }, 200);
    },
    set: function(v) { update(v); },
    clear: function() {
      loading = false;
      progress = 0;
      if (interval) { clearInterval(interval); interval = null; }
      if (el) { el.style.opacity = '0'; el.style.transform = 'scaleX(0)'; }
    }
  };

  // Auto-hook navigation
  document.addEventListener('click', function(e) {
    var link = e.target.closest && e.target.closest('a');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || link.target === '_blank') return;
    window.stxLoading.start();
  });

  window.addEventListener('popstate', function() { window.stxLoading.start(); });
  window.addEventListener('load', function() { window.stxLoading.finish(); });
})();
</script>
`
}

// Export for use in STX templates
export default {
  useLoadingIndicator,
  initLoadingIndicator,
  generateLoadingIndicatorHtml,
}
